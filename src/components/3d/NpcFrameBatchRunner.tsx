/* ─── Volodka RPG – single npc-system useFrameTick for batched NPC updates ─── */

import { useFrameTick } from '@/engine/frame/useFrameTick';
import { runNpcFrameBatch } from '@/engine/npc/npcFrameBatch';

/** Mount once alongside NPCSystem — drives all registerNpcFrameCallback entries. */
export function NpcFrameBatchRunner() {
  useFrameTick(
    'npc',
    (ctx) => {
      runNpcFrameBatch(ctx);
    },
    { label: 'NpcFrameBatch' },
  );
  return null;
}
