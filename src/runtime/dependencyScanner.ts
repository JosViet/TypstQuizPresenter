export interface DependencyRef {
  kind: 'source' | 'asset';
  path: string;
}

const TEXT_EXTENSIONS = new Set(['.typ', '.json', '.csv', '.yaml', '.yml', '.xml', '.txt']);
const ASSET_CALLS = new Set(['image', 'read', 'json', 'csv', 'yaml', 'xml', 'bibliography']);
const SOURCE_DIRECTIVES = new Set(['import', 'include']);

function extension(path: string): string {
  const clean = path.split(/[?#]/, 1)[0] ?? path;
  const slash = clean.lastIndexOf('/');
  const dot = clean.lastIndexOf('.');
  return dot > slash ? clean.slice(dot).toLowerCase() : '';
}

export function isTextDependency(path: string): boolean {
  return TEXT_EXTENSIONS.has(extension(path));
}

function isIdentifierStart(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z_]/.test(ch);
}

function isIdentifierChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_-]/.test(ch);
}

function skipWhitespace(source: string, offset: number): number {
  let i = offset;
  while (i < source.length && /\s/.test(source[i] ?? '')) i += 1;
  return i;
}

function readIdentifier(source: string, offset: number): { name: string; end: number } | undefined {
  if (!isIdentifierStart(source[offset])) return undefined;
  let i = offset + 1;
  while (i < source.length && isIdentifierChar(source[i])) i += 1;
  return { name: source.slice(offset, i), end: i };
}

function readQuotedString(source: string, offset: number): { value: string; end: number } | undefined {
  const quote = source[offset];
  if (quote !== '"' && quote !== "'") return undefined;

  let i = offset + 1;
  let value = '';

  while (i < source.length) {
    const ch = source[i] ?? '';
    if (ch === '\\') {
      const next = source[i + 1];
      if (next === undefined) break;
      value += next;
      i += 2;
      continue;
    }
    if (ch === quote) return { value, end: i + 1 };
    value += ch;
    i += 1;
  }

  return undefined;
}

function skipLineComment(source: string, offset: number): number {
  const newline = source.indexOf('\n', offset + 2);
  return newline < 0 ? source.length : newline + 1;
}

function skipBlockComment(source: string, offset: number): number {
  const end = source.indexOf('*/', offset + 2);
  return end < 0 ? source.length : end + 2;
}

function skipString(source: string, offset: number): number {
  return readQuotedString(source, offset)?.end ?? source.length;
}

export function scanDependencies(source: string): DependencyRef[] {
  const found = new Map<string, DependencyRef>();

  const add = (path: string, forcedKind?: 'source' | 'asset') => {
    const trimmed = path.trim();
    if (!trimmed || trimmed.startsWith('@')) return;
    const kind = forcedKind ?? (isTextDependency(trimmed) ? 'source' : 'asset');
    found.set(`${kind}:${trimmed}`, { kind, path: trimmed });
  };

  const tryAssetCall = (name: string, nameEnd: number): number | undefined => {
    if (!ASSET_CALLS.has(name)) return undefined;
    let i = skipWhitespace(source, nameEnd);
    if (source[i] !== '(') return undefined;
    i = skipWhitespace(source, i + 1);
    const literal = readQuotedString(source, i);
    if (!literal) return undefined;
    add(literal.value);
    return literal.end;
  };

  let i = 0;
  while (i < source.length) {
    if (source.startsWith('//', i)) {
      i = skipLineComment(source, i);
      continue;
    }
    if (source.startsWith('/*', i)) {
      i = skipBlockComment(source, i);
      continue;
    }

    const ch = source[i] ?? '';
    if (ch === '"' || ch === "'") {
      i = skipString(source, i);
      continue;
    }

    if (ch === '#') {
      let j = skipWhitespace(source, i + 1);
      const identifier = readIdentifier(source, j);
      if (!identifier) {
        i += 1;
        continue;
      }

      if (SOURCE_DIRECTIVES.has(identifier.name)) {
        j = skipWhitespace(source, identifier.end);
        const literal = readQuotedString(source, j);
        if (literal) {
          add(literal.value, 'source');
          i = literal.end;
          continue;
        }
      }

      const assetEnd = tryAssetCall(identifier.name, identifier.end);
      if (assetEnd !== undefined) {
        i = assetEnd;
        continue;
      }

      i = identifier.end;
      continue;
    }

    if (isIdentifierStart(ch)) {
      const identifier = readIdentifier(source, i)!;
      const assetEnd = tryAssetCall(identifier.name, identifier.end);
      if (assetEnd !== undefined) {
        i = assetEnd;
        continue;
      }
      i = identifier.end;
      continue;
    }

    i += 1;
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
