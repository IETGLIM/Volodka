const TEXT_PREVIEW_KEYS = [
  'text',
  'objectiveText',
  'title',
  'subtitle',
  'message',
  'chapterTitle',
] as const;

/** Truncate at Unicode code-point boundaries (safe for Cyrillic and emoji). */
export function truncateUnicodeText(text: string, maxLen: number): string {
  if (maxLen <= 0) return '';
  const codePoints = [...text];
  if (codePoints.length <= maxLen) return text;
  if (maxLen === 1) return '…';
  return `${codePoints.slice(0, maxLen - 1).join('')}…`;
}

/**
 * Human-readable one-line preview for DevPanel / debug event logs.
 * Prefers narrative text fields over raw JSON so Cyrillic is never sliced
 * inside JSON.stringify escape sequences or UTF-16 surrogate pairs.
 */
export function formatEventPayloadPreview(payload: unknown, maxLen = 80): string {
  if (payload === undefined) return '';
  if (payload === null) return 'null';
  if (typeof payload === 'string') return truncateUnicodeText(payload, maxLen);
  if (typeof payload !== 'object') return truncateUnicodeText(String(payload), maxLen);

  const record = payload as Record<string, unknown>;
  for (const key of TEXT_PREVIEW_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return truncateUnicodeText(`${key}: ${value}`, maxLen);
    }
  }

  const compact = Object.entries(record)
    .filter(([, value]) => value !== undefined && typeof value !== 'object')
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
  if (compact) return truncateUnicodeText(compact, maxLen);

  try {
    return truncateUnicodeText(JSON.stringify(payload), maxLen);
  } catch {
    return '{…}';
  }
}
