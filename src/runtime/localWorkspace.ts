import { resolveDependency, scanDependencies } from './dependencyScanner.ts';
import type { RuntimeBundle, RuntimeFile } from './upstreamClient.ts';

type WorkspacePermission = 'granted' | 'denied' | 'prompt';

type PermissionCapableDirectoryHandle = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<WorkspacePermission>;
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<WorkspacePermission>;
};

const SKIP_DIRECTORIES = new Set([
  '.git',
  '.github',
  'node_modules',
  'dist',
  'fonts',
  'prompts',
]);

const ROOT_INFRA_FILES = new Set([
  'de-thi.typ',
  'vietdoc.typ',
  'primary.typ',
  'template-de-thi.typ',
  'template-hoc-lieu.typ',
  'template-main.typ',
]);

export interface WorkspaceValidation {
  ok: boolean;
  missing: string[];
}

export function isQuizSourcePath(path: string): boolean {
  const clean = path.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!clean.toLowerCase().endsWith('.typ')) return false;
  const parts = clean.split('/');
  if (parts.some(part => SKIP_DIRECTORIES.has(part))) return false;
  if (parts.includes('assets')) return false;
  if (parts.length === 1 && ROOT_INFRA_FILES.has(parts[0] ?? '')) return false;
  return true;
}

function randomKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class LocalWorkspace {
  readonly handle: FileSystemDirectoryHandle;
  readonly name: string;
  readonly cacheKey: string;

  constructor(handle: FileSystemDirectoryHandle) {
    this.handle = handle;
    this.name = handle.name;
    this.cacheKey = `local:${handle.name}:${randomKey()}`;
  }

  async permission(request = false): Promise<WorkspacePermission> {
    const capable = this.handle as PermissionCapableDirectoryHandle;
    if (!capable.queryPermission) return 'granted';

    let state = await capable.queryPermission({ mode: 'read' });
    if (state === 'prompt' && request && capable.requestPermission) {
      state = await capable.requestPermission({ mode: 'read' });
    }
    return state;
  }

  async validate(): Promise<WorkspaceValidation> {
    const required = ['de-thi.typ', 'vietdoc.typ'];
    const missing: string[] = [];
    for (const path of required) {
      try {
        await this.getFileHandle(path);
      } catch {
        missing.push(path);
      }
    }
    return { ok: missing.length === 0, missing };
  }

  async readTextSource(path: string): Promise<string> {
    const file = await (await this.getFileHandle(path)).getFile();
    return file.text();
  }

  async readBytes(path: string): Promise<Uint8Array> {
    const file = await (await this.getFileHandle(path)).getFile();
    return new Uint8Array(await file.arrayBuffer());
  }

  async listTypstFiles(limit = 4000): Promise<string[]> {
    const paths: string[] = [];
    await this.walkDirectory(this.handle, '', paths, limit);
    return paths.filter(isQuizSourcePath).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  }

  async loadRuntimeFor(sourcePath?: string): Promise<RuntimeBundle> {
    const queue: Array<{ path: string; kind: 'source' | 'asset' }> = [
      { path: '/de-thi.typ', kind: 'source' },
      { path: '/vietdoc.typ', kind: 'source' },
    ];

    if (sourcePath) {
      queue.push({ path: `/${sourcePath.replace(/^\/+/, '')}`, kind: 'source' });
    }

    const seen = new Set<string>();
    const files: RuntimeFile[] = [];

    while (queue.length) {
      const current = queue.shift()!;
      const path = current.path.startsWith('/') ? current.path : `/${current.path}`;
      if (seen.has(path)) continue;
      seen.add(path);

      const workspacePath = path.replace(/^\/+/, '');
      try {
        if (current.kind === 'source') {
          const text = await this.readTextSource(workspacePath);
          files.push({ path, kind: 'source', text });
          for (const dependency of scanDependencies(text)) {
            const resolved = resolveDependency(path, dependency.path);
            if (!seen.has(resolved)) queue.push({ path: resolved, kind: dependency.kind });
          }
        } else {
          files.push({ path, kind: 'asset', bytes: await this.readBytes(workspacePath) });
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Không đọc được dependency local "${workspacePath}": ${reason}`);
      }
    }

    return {
      repository: `local://${this.name}`,
      commit: this.cacheKey,
      files,
    };
  }

  private async getFileHandle(path: string): Promise<FileSystemFileHandle> {
    const parts = path.replaceAll('\\', '/').replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('Đường dẫn file rỗng.');

    let directory = this.handle;
    for (const part of parts.slice(0, -1)) {
      directory = await directory.getDirectoryHandle(part);
    }
    return directory.getFileHandle(parts[parts.length - 1]!);
  }

  private async walkDirectory(
    directory: FileSystemDirectoryHandle,
    prefix: string,
    output: string[],
    limit: number,
  ): Promise<void> {
    if (output.length >= limit) return;

    const iterable = directory as FileSystemDirectoryHandle & {
      entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    };

    for await (const [name, entry] of iterable.entries()) {
      if (output.length >= limit) return;
      const path = prefix ? `${prefix}/${name}` : name;

      if (entry.kind === 'directory') {
        if (SKIP_DIRECTORIES.has(name) || name === 'assets') continue;
        await this.walkDirectory(entry as FileSystemDirectoryHandle, path, output, limit);
      } else if (name.toLowerCase().endsWith('.typ')) {
        output.push(path);
      }
    }
  }
}
