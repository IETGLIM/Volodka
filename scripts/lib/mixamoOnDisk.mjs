import { readFileSync, writeFileSync } from 'node:fs';

export function readMixamoClipIdsOnDisk(shippedModulePath) {
  const text = readFileSync(shippedModulePath, 'utf8');
  const match = text.match(/MIXAMO_CLIP_IDS_ON_DISK[^=]*=\s*\[([^\]]*)\]/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);
}

export function writeMixamoClipIdsOnDisk(shippedModulePath, ids) {
  const unique = [...new Set(ids)].sort();
  const body = `/**
 * Mixamo clip ids confirmed on disk — updated by \`npm run assets:mixamo-import\` / bootstrap.
 * @generated — do not edit manually.
 * Empty until clips are imported from Adobe Mixamo (Sprint 2 pipeline).
 */

import type { MixamoClipId } from './mixamoAnimationCatalog';

/** Clip ids staged under public/models/animations/ */
export const MIXAMO_CLIP_IDS_ON_DISK: readonly MixamoClipId[] = [
${unique.map((id) => `  '${id}',`).join('\n')}
];
`;
  writeFileSync(shippedModulePath, body, 'utf8');
}
