/**
 * Shared Quaternius mesh aliases — interim until unique AI3DGen/RPM meshes land.
 *
 * Multiple story NPCs were staged from the same Quaternius preset (byte-identical
 * GLBs under different filenames). Pointing aliases at one canonical fileBase
 * removes ~20MB of dead weight from public/ and dist/ without changing visuals
 * (they were already identical — immersion still needs unique art later).
 *
 * Alias npcId → canonical file base under /models/npcs/{base}.glb (+ lod/variants).
 */
export const NPC_MESH_FILE_SHARE: Readonly<Record<string, string>> = {
  // male_07.glb
  office_colleague: 'chk_based',
  viktor: 'chk_based',
  // male_10.glb
  boris: 'zeka',
  // female_07.glb
  tamara: 'anya',
  // male_05.glb
  grisha: 'office_alexander',
  // female_06.glb
  kira: 'chk_ritka',
};

/** Resolve on-disk file base for an NPC (own name or shared canonical). */
export function resolveNpcMeshFileBase(npcId: string): string {
  return NPC_MESH_FILE_SHARE[npcId] ?? npcId;
}

/** Public URL for the shared/canonical CC0 mesh. */
export function resolveNpcMeshPublicUrl(npcId: string): string {
  return `/models/npcs/${resolveNpcMeshFileBase(npcId)}.glb`;
}

/** NPC ids that do not own a unique GLB file (load another NPC's mesh). */
export function listSharedMeshAliasNpcIds(): string[] {
  return Object.keys(NPC_MESH_FILE_SHARE);
}
