/** Макс. размер тела POST /api/ai-dialogue (UTF-8), защита от чрезмерных JSON. */
export const MAX_AI_DIALOGUE_BODY_BYTES = 450_000;

/**
 * Макс. размер загрузки в /api/models/upload (байты), если передан `Content-Length`.
 * Без заголовка полный контроль размера остаётся на лимитах платформы / прокси.
 */
export const MAX_MODEL_UPLOAD_BYTES = 95 * 1024 * 1024;

export function isFeatureFlagEnabled(value: string | undefined): boolean {
  return value?.trim() === '1';
}

export function extractBearerToken(header: string | null): string {
  if (!header) return '';
  return header.length > 7 && header.slice(0, 7).toLowerCase() === 'bearer '
    ? header.slice(7).trim()
    : '';
}

export function isSafeBlobFilename(filename: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(filename);
}
