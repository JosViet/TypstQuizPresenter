import { findMacros, readBalanced, skipTrivia } from '../parser/scanner.ts';

interface Replacement {
  start: number;
  end: number;
  text: string;
}

interface ImminiFigureRange {
  start: number;
  end: number;
  inner: string;
}

export function resolveFigureScale(fontSize: number, override?: number | null): number {
  if (override !== null && override !== undefined && Number.isFinite(override)) {
    return Math.max(0.5, Math.min(2, Math.round(override * 100) / 100));
  }

  const safeFont = Number.isFinite(fontSize) ? fontSize : 30;
  return Math.max(0.7, Math.min(2, Math.round((safeFont / 30) * 100) / 100));
}

function toPercent(scale: number): number {
  return Math.round(scale * 100);
}

function findImminiFigureRanges(source: string): ImminiFigureRange[] {
  const ranges: ImminiFigureRange[] = [];

  for (const macro of findMacros(source, new Set(['immini']))) {
    try {
      let i = skipTrivia(source, macro.nameEnd);
      if (source[i] === '(') {
        const args = readBalanced(source, i);
        i = skipTrivia(source, args.end);
      }

      if (source[i] !== '[') continue;
      const body = readBalanced(source, i);
      i = skipTrivia(source, body.end);
      if (source[i] !== '[') continue;

      const figure = readBalanced(source, i);
      ranges.push({
        start: figure.start,
        end: figure.end,
        inner: figure.inner,
      });
    } catch {
      // Ignore malformed immini blocks; the original Typst source will surface its own error.
    }
  }

  return ranges;
}

function isInsideFigureRange(offset: number, ranges: ImminiFigureRange[]): boolean {
  return ranges.some(range => offset > range.start && offset < range.end);
}

function figureMacroEnd(source: string, nameEnd: number): number | undefined {
  let i = skipTrivia(source, nameEnd);
  if (source[i] === '(') {
    const args = readBalanced(source, i);
    i = args.end;
  } else if (source[i] === '[') {
    const body = readBalanced(source, i);
    i = body.end;
  } else {
    return undefined;
  }

  i = skipTrivia(source, i);
  if (source[i] === '[') {
    const body = readBalanced(source, i);
    i = body.end;
  }
  return i;
}

export function instrumentFigures(raw: string | undefined, scale: number): string {
  if (!raw) return raw ?? '';

  const percent = toPercent(scale);
  const imminiRanges = findImminiFigureRanges(raw);
  const replacements: Replacement[] = imminiRanges.map(range => ({
    start: range.start,
    end: range.end,
    text: `[#quiz-figure(scale-factor: ${percent}%)[${range.inner}]]`,
  }));

  for (const macro of findMacros(raw, new Set(['canvas', 'image']))) {
    if (isInsideFigureRange(macro.hashStart, imminiRanges)) continue;

    try {
      const end = figureMacroEnd(raw, macro.nameEnd);
      if (end === undefined) continue;
      const original = raw.slice(macro.hashStart, end);
      replacements.push({
        start: macro.hashStart,
        end,
        text: `#quiz-figure(scale-factor: ${percent}%)[${original}]`,
      });
    } catch {
      // Keep malformed figure source unchanged.
    }
  }

  if (!replacements.length) return raw;

  replacements.sort((a, b) => b.start - a.start);
  let output = raw;
  for (const replacement of replacements) {
    output = output.slice(0, replacement.start) + replacement.text + output.slice(replacement.end);
  }
  return output;
}
