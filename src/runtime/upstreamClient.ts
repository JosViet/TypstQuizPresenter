import upstream from '../../runtime.upstream.json';
import { resolveDependency, scanDependencies } from './dependencyScanner.ts';

export interface RuntimeFile {
  path: string;
  kind: 'source' | 'asset';
  text?: string;
  bytes?: Uint8Array;
}

export interface RuntimeBundle {
  repository: string;
  commit: string;
  files: RuntimeFile[];
}

export class UpstreamClient {
  readonly repository = upstream.repository;
  readonly commit = upstream.commit;
  readonly rootFiles = upstream.rootFiles;

  private rawUrl(path: string): string {
    const clean = path.replace(/^\/+/, '');
    return `https://raw.githubusercontent.com/${this.repository}/${this.commit}/${clean}`;
  }

  async fetchText(path: string): Promise<string> {
    const response = await fetch(this.rawUrl(path));
    if (!response.ok) throw new Error(`Không tải được ${path} (${response.status})`);
    return response.text();
  }

  async fetchBytes(path: string): Promise<Uint8Array> {
    const response = await fetch(this.rawUrl(path));
    if (!response.ok) throw new Error(`Không tải được ${path} (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async loadTextSource(path: string): Promise<string> {
    return this.fetchText(path.replace(/^\/+/, ''));
  }

  async loadRuntimeFor(sourcePath?: string): Promise<RuntimeBundle> {
    const queue: Array<{ path: string; kind: 'source' | 'asset' }> = this.rootFiles.map(path => ({
      path: `/${path.replace(/^\/+/, '')}`,
      kind: 'source',
    }));

    if (sourcePath) queue.push({ path: `/${sourcePath.replace(/^\/+/, '')}`, kind: 'source' });

    const seen = new Set<string>();
    const files: RuntimeFile[] = [];

    while (queue.length) {
      const current = queue.shift()!;
      const path = current.path.startsWith('/') ? current.path : `/${current.path}`;
      if (seen.has(path)) continue;
      seen.add(path);

      const upstreamPath = path.replace(/^\/+/, '');
      if (current.kind === 'source') {
        const text = await this.fetchText(upstreamPath);
        files.push({ path, kind: 'source', text });
        for (const dep of scanDependencies(text)) {
          const resolved = resolveDependency(path, dep.path);
          if (!seen.has(resolved)) queue.push({ path: resolved, kind: dep.kind });
        }
      } else {
        files.push({ path, kind: 'asset', bytes: await this.fetchBytes(upstreamPath) });
      }
    }

    return { repository: this.repository, commit: this.commit, files };
  }
}
