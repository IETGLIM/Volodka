import { getDominantEmotion, hasMemory } from '@/core/memory/memoryQueries';
import { getRelationshipScore } from '@/core/memory/relationshipAccess';
import type { DialogueNode } from '@/data/rpgTypes';
import { DIALOGUE_NODES } from '@/data/npcDefinitions';

/**
 * Подбор корня диалога по памяти и раппорту без правок `DialogueEngine`.
 * Сейчас: ветка для `zarema_home` с корнем `zarema_room_home`.
 */
export function resolveDialogueVariant(npcId: string, root: DialogueNode): DialogueNode {
  if (npcId !== 'zarema_home' || root.id !== 'zarema_room_home') {
    return root;
  }

  const rel = getRelationshipScore('zarema_home');
  const warm = hasMemory('met_npc') && rel >= 56;
  const cold = getDominantEmotion() === 'sad' && rel < 58;

  const warmNode = DIALOGUE_NODES.zarema_room_home_warm as DialogueNode | undefined;
  const coldNode = DIALOGUE_NODES.zarema_room_home_cold as DialogueNode | undefined;

  if (warm && warmNode) return warmNode;
  if (cold && coldNode && !warm) return coldNode;
  return root;
}
