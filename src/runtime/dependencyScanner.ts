export interface DependencyRef {
  kind: 'source' | 'asset';
  path: string;
}

const TEXT_EXTENSIONS = new Set(['.typ', '.json', '.csv', '.yaml', '.yml', '.xml', '.txt']);

function extension(path: string): string {
  const clean = path.split(/[?#]/, 1)[0] ?? path;
  const slash = clean.lastIndexOf('/');
  const dot = clean.lastIndexOf('.');
  return dot > slash ? clean.slice(dot).toLowerCase() : '';
}

export function isTextDependency(path: string): boolean {
  return TEXT_EXTENSIONS.has(extension(path));
}

export function scanDependencies(source: string): DependencyRef[] {
  const found = new Map<string, DependencyRef>();

  const add = (path: string, forcedKind?: 'source' | 'asset') => {
    const trimmed = path.trim();
    if (!trimmed || trimmed.startsWith('@')) return;
    const kind = forcedKind ?? (isTextDependency(trimmed) ? 'source' : 'asset');
    found.set(`${kind}:${trimmed}`, { kind, path: trimmed });
  };

  for (const match of source.matchAll(/#\s*(?:import|include)\s+["']([^"']+)["']/g)) {
    if (match[1]) add(match[1], 'source');
  }

  for (const match of source.matchAll(/\b(?:image|read|json|csv|yaml|xml|bibliography)\s*\(\s*["']([^"']+)["']/g)) {
    if (match[1]) add(match[1]);
  }

  return [...found.values()];
}

export function normalizePosixPath(path: string): string {
  const absolute = path.startsWith('/');
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}`;
}

export function dirname(path: string): string {
  const normalized = normalizePosixPath(path);
  const idx = normalized.lastIndexOf('/');
  if (idx <= 0) return '/';
  return normalized.slice(0, idx);
}

export function resolveDependency(fromPath: string, dependency: string): string {
  if (dependency.startsWith('/')) return normalizePosixPath(dependency);
  const base = dirname(fromPath);
  return normalizePosixPath(`${base}/${dependency}`);
}
