export function normalizeShortAnswer(value: string | undefined): string {
  if (!value) return '';

  let normalized = value.trim();

  if (
    normalized.length >= 2
    && ((normalized.startsWith('"') && normalized.endsWith('"'))
      || (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1);
  }

  normalized = normalized
    .replace(/^\[(.*)\]$/s, '$1')
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/[−–—]/g, '-')
    .toLocaleLowerCase('vi');

  return normalized;
}

export function shortAnswerMatches(input: string, canonical: string | undefined): boolean | undefined {
  const left = normalizeShortAnswer(input);
  const right = normalizeShortAnswer(canonical);
  if (!left || !right) return undefined;
  return left === right;
}
