'use client';

/**
 * Шаг 5 (анти-мерцание LOD): в проекте нет `<LOD distances={…}>` из drei — дистанционный уровень
 * для NPC задаётся в **`src/components/game/NPC.tsx`** (`useFullModel` / импостор).
 *
 * Логика и пороги с **гистерезисом** — **`resolveNpcModelLodUseFull`** и константы в
 * **`lib/npcLodConstants.ts`** (дальше отключаем полный GLB, ближе включаем — разные пороги).
 */

export {
  NPC_LOD_FULL_TO_IMPOSTOR_M,
  NPC_LOD_IMPOSTOR_TO_FULL_M,
  resolveNpcModelLodUseFull,
} from '@/lib/npcLodConstants';
