/**
 * Former Quaternius twin aliases — now load unique modular `_rigs/` hero meshes
 * (not reused story NPC GLBs). Disk-dedupe of byte-identical exports is retired
 * in favor of distinct silhouette geometry per hub character.
 */

import type { QuaterniusRigRef } from '@/config/npcComposer/types';
import { resolveQuaterniusStagedRigUrl } from '@/config/quaterniusRigCatalog';

/** Alias npcId → exclusive staged modular rig (unique GLB under /models/npcs/_rigs/). */
export const NPC_UNIQUE_STAGED_RIG: Readonly<Record<string, QuaterniusRigRef>> = {
  office_colleague: 'male_01',
  viktor: 'male_02',
  boris: 'male_04',
  grisha: 'male_06',
  kira: 'female_01',
  tamara: 'female_02',
};

/** @deprecated Empty — twin file-share retired; use NPC_UNIQUE_STAGED_RIG. */
export const NPC_MESH_FILE_SHARE: Readonly<Record<string, string>> = {};

export function resolveNpcUniqueStagedRigUrl(npcId: string): string | undefined {
  const rig = NPC_UNIQUE_STAGED_RIG[npcId];
  if (!rig) return undefined;
  return resolveQuaterniusStagedRigUrl(rig);
}

/** Resolve on-disk file base for an NPC (own name — no shared aliases). */
export function resolveNpcMeshFileBase(npcId: string): string {
  const rig = NPC_UNIQUE_STAGED_RIG[npcId];
  if (rig) return `_rigs/${rig}`;
  return npcId;
}

/** Public URL for unique staged rig or canonical CC0 mesh. */
export function resolveNpcMeshPublicUrl(npcId: string): string {
  return resolveNpcUniqueStagedRigUrl(npcId) ?? `/models/npcs/${npcId}.glb`;
}

/** NPC ids that use exclusive staged modular hero meshes. */
export function listSharedMeshAliasNpcIds(): string[] {
  return Object.keys(NPC_UNIQUE_STAGED_RIG);
}
