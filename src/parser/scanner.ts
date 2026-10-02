export interface BalancedResult {
  inner: string;
  start: number;
  end: number;
}

const PAIRS: Record<string, string> = {
  '[': ']',
  '(': ')',
  '{': '}',
};

function isIdentifierChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_-]/.test(ch);
}

export function skipTrivia(source: string, offset: number): number {
  let i = offset;
  while (i < source.length) {
    if (/\s/.test(source[i] ?? '')) {
      i += 1;
      continue;
    }
    if (source.startsWith('//', i)) {
      const nl = source.indexOf('\n', i + 2);
      return nl < 0 ? source.length : skipTrivia(source, nl + 1);
    }
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      return end < 0 ? source.length : skipTrivia(source, end + 2);
    }
    break;
  }
  return i;
}

export function readBalanced(source: string, start: number): BalancedResult {
  const opener = source[start];
  const closer = opener ? PAIRS[opener] : undefined;
  if (!opener || !closer) {
    throw new Error(`Expected balanced opener at ${start}`);
  }

  const stack: string[] = [closer];
  let inString: '"' | "'" | null = null;
  let escaped = false;
  let inMath = false;
  let i = start + 1;

  while (i < source.length) {
    const ch = source[i] ?? '';
    const next = source[i + 1] ?? '';

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      i += 1;
      continue;
    }

    if (source.startsWith('//', i)) {
      const nl = source.indexOf('\n', i + 2);
      if (nl < 0) break;
      i = nl + 1;
      continue;
    }

    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) break;
      i = end + 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      i += 1;
      continue;
    }

    if (ch === '$') {
      inMath = !inMath;
      i += 1;
      continue;
    }

    if (!inMath && PAIRS[ch]) {
      stack.push(PAIRS[ch]!);
      i += 1;
      continue;
    }

    if (!inMath && ch === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) {
        return {
          inner: source.slice(start + 1, i),
          start,
          end: i + 1,
        };
      }
      i += 1;
      continue;
    }

    void next;
    i += 1;
  }

  throw new Error(`Unclosed ${opener} starting at ${start}`);
}

export function splitTopLevel(source: string, delimiter = ','): string[] {
  const out: string[] = [];
  let start = 0;
  const stack: string[] = [];
  let inString: '"' | "'" | null = null;
  let escaped = false;
  let inMath = false;
  let i = 0;

  while (i < source.length) {
    const ch = source[i] ?? '';

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inString) inString = null;
      i += 1;
      continue;
    }

    if (source.startsWith('//', i)) {
      const nl = source.indexOf('\n', i + 2);
      i = nl < 0 ? source.length : nl + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      i += 1;
      continue;
    }
    if (ch === '$') {
      inMath = !inMath;
      i += 1;
      continue;
    }
    if (!inMath && PAIRS[ch]) {
      stack.push(PAIRS[ch]!);
      i += 1;
      continue;
    }
    if (!inMath && stack.length && ch === stack[stack.length - 1]) {
      stack.pop();
      i += 1;
      continue;
    }
    if (!inMath && stack.length === 0 && ch === delimiter) {
      out.push(source.slice(start, i).trim());
      start = i + 1;
    }
    i += 1;
  }

  const tail = source.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

export interface MacroOccurrence {
  name: string;
  hashStart: number;
  nameEnd: number;
}

export function findMacros(source: string, wanted?: Set<string>): MacroOccurrence[] {
  const out: MacroOccurrence[] = [];
  let i = 0;
  let inString: '"' | "'" | null = null;
  let escaped = false;
  let inMath = false;

  while (i < source.length) {
    const ch = source[i] ?? '';

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inString) inString = null;
      i += 1;
      continue;
    }
    if (source.startsWith('//', i)) {
      const nl = source.indexOf('\n', i + 2);
      i = nl < 0 ? source.length : nl + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      i += 1;
      continue;
    }
    if (ch === '$') {
      inMath = !inMath;
      i += 1;
      continue;
    }
    if (!inMath && ch === '#') {
      let j = i + 1;
      while (isIdentifierChar(source[j])) j += 1;
      const name = source.slice(i + 1, j);
      if (name && (!wanted || wanted.has(name))) {
        out.push({ name, hashStart: i, nameEnd: j });
      }
      i = Math.max(j, i + 1);
      continue;
    }
    i += 1;
  }

  return out;
}

export function unwrapContent(raw: string): string {
  const text = raw.trim();
  if (text.startsWith('T[')) {
    const block = readBalanced(text, 1);
    return block.inner.trim();
  }
  if (text.startsWith('[')) {
    return readBalanced(text, 0).inner.trim();
  }
  return text;
}

export function isCorrectWrapper(raw: string): boolean {
  const text = raw.trim();
  return text.startsWith('T[');
}
