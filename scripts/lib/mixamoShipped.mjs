import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function readShippedMixamoIds(shippedModulePath) {
  const text = readFileSync(shippedModulePath, 'utf8');
  const match = text.match(/SHIPPED_MIXAMO_CLIP_IDS[^=]*=\s*\[([^\]]*)\]/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);
}

export function writeShippedMixamoIds(shippedModulePath, ids) {
  const unique = [...new Set(ids)].sort();
  const body = `/**
 * Mixamo clips present on disk — updated by \`npm run assets:mixamo-import\` / bootstrap.
 * @generated — do not edit manually.
 */

import type { MixamoClipId } from './mixamoAnimationCatalog';

/** Clip ids staged under public/models/animations/ */
export const SHIPPED_MIXAMO_CLIP_IDS: readonly MixamoClipId[] = [
${unique.map((id) => `  '${id}',`).join('\n')}
];
`;
  writeFileSync(shippedModulePath, body, 'utf8');
}
