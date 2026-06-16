/**
 * Humanoid retarget profile — Quaternius CC0 rigs + Mixamo clips.
 * When Mixamo GLBs land via `npm run assets:mixamo-import`, clips retarget onto
 * Quaternius/RPM skeletons in Blender (same Mixamo bone naming) or via Mixamo
 * auto-rig upload against the NPC mesh.
 */

export const HUMANOID_RETARGET_PROFILE = {
  /** Bone root used by Quaternius glTF exports and Mixamo downloads. */
  armatureName: 'mixamorigHips',
  /** Clip states that override embedded Quaternius clips when shipped. */
  mixamoOverrides: ['idle', 'walking', 'talking', 'sitting'] as const,
  /** Quaternius embedded fallbacks until Mixamo clips are on disk. */
  quaterniusEmbedded: {
    idle: 'Idle',
    walk: 'Walk',
    talk: 'Wave',
    sit: 'Idle_Neutral',
  },
  blenderNotes:
    'Import NPC GLB + Mixamo FBX → NLA strip Mixamo action → export GLB or stage via mixamo-import CLI.',
} as const;
