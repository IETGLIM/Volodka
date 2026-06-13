/* ─── NPC definitions ─── */

export type NPCHeadAccessory = 'none' | 'glasses' | 'hat' | 'scarf' | 'earring';
export type NPCSilhouette = 'slim' | 'average' | 'heavy';

export interface NPCAppearance {
  readonly bodyColor: string;
  readonly accentColor: string;
  readonly headAccessory: NPCHeadAccessory;
  readonly height: number;
  readonly glowColor: string;
  readonly silhouette: NPCSilhouette;
}

export interface NPCDefinition {
  readonly id: string;
  readonly name: string;
  readonly modelPath?: string;
  readonly scale?: number;
  readonly animations?: { readonly idle?: string; readonly walk?: string; readonly talk?: string };
  readonly defaultPosition: [number, number, number];
  readonly defaultRotation?: number;
  readonly patrolRadius?: number;
  readonly patrolWaypoints?: [number, number, number][];
  readonly dialogueNodeId?: string;
  readonly scheduleId?: string;
  readonly description?: string;
  readonly barkTexts?: { readonly hostile: string; readonly neutral: string; readonly friendly: string };
  readonly appearance?: NPCAppearance;
}
