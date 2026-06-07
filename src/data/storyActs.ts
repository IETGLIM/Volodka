import { STORY_PACK_ORDER } from '@/data/narrative/narrativePackRegistry';

/** Story act count (act1…actN narrative packs, excluding epilogue packs like `chk`). */
export const MAX_STORY_ACT = STORY_PACK_ORDER.filter((id) => id !== 'chk').length;
