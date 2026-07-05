/**
 * Mixamo clip ids confirmed on disk — updated by `npm run assets:mixamo-import` / bootstrap.
 * @generated — do not edit manually.
 *
 * [roadmap:DOC-07] Updated stale docstring. Previously claimed "Empty until
 * clips are imported from Adobe Mixamo" but lists 6 CC0 fallback clips.
 * Real Mixamo clips require Adobe sign-in (assets-source/mixamo/README.md:6).
 * Current 6 clips are CC0 fallbacks: 3 Quaternius (idle/walking/talking) +
 * 2 UAL (sitting/working) + 1 KayKit (sleeping). Functionally work at runtime
 * via bone retargeting, but are not real Mixamo imports.
 */

import type { MixamoClipId } from './mixamoAnimationCatalog';

/** Clip ids staged under public/models/animations/ */
export const MIXAMO_CLIP_IDS_ON_DISK: readonly MixamoClipId[] = [
  'idle',
  'sitting',
  'sleeping',
  'talking',
  'walking',
  'working',
];
