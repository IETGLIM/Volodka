import type { NPCHeadAccessory, NPCSilhouette } from '@/shared/types/game';

/** Quaternius CC0 rig reference — Mixamo/UAL clips retarget to this skeleton. */
export type QuaterniusRigRef =
  | 'male_01'
  | 'male_02'
  | 'male_03'
  | 'male_04'
  | 'male_05'
  | 'male_06'
  | 'male_07'
  | 'male_08'
  | 'male_09'
  | 'male_10'
  | 'male_11'
  | 'female_01'
  | 'female_02'
  | 'female_03'
  | 'female_04'
  | 'female_05'
  | 'female_06'
  | 'female_07'
  | 'female_08'
  | 'female_09';

export type ComposerBodyId =
  | 'slim_female'
  | 'average_female'
  | 'elder_female_stooped'
  | 'slim_male'
  | 'average_male'
  | 'heavy_male'
  | 'elder_male';

export type ComposerHeadId =
  | 'young_female'
  | 'mature_female'
  | 'elder_female'
  | 'young_male'
  | 'mature_male'
  | 'bearded_male'
  | 'elder_male';

export type ComposerHairId =
  | 'scarf_wrap'
  | 'bun_gray'
  | 'bun_dark'
  | 'ponytail'
  | 'shoulder_length'
  | 'short_crop'
  | 'gray_receding'
  | 'beanie'
  | 'hood'
  | 'cap'
  | 'bald';

export type ComposerTopId =
  | 'dress_long'
  | 'tweed_jacket'
  | 'hoodie'
  | 'suit'
  | 'cardigan'
  | 'work_coat'
  | 'apron'
  | 'barista_uniform'
  | 'jacket_casual'
  | 'windbreaker'
  | 'blouse';

export type ComposerBottomId =
  | 'hidden_dress'
  | 'slacks'
  | 'pants_dark'
  | 'skirt_a_line'
  | 'jeans'
  | 'work_pants';

export type ComposerAccessoryId =
  | 'none'
  | 'glasses_scholarly'
  | 'glasses_round'
  | 'earring'
  | 'cyber_arm'
  | 'badge';

export type ComposerPropId =
  | 'none'
  | 'book'
  | 'ladle'
  | 'guitar'
  | 'soldering_iron'
  | 'phone'
  | 'fishing_rod'
  | 'wrench'
  | 'coffee_cup';

export interface NpcComposeSlots {
  body: ComposerBodyId;
  head: ComposerHeadId;
  hair: ComposerHairId;
  top: ComposerTopId;
  bottom: ComposerBottomId;
  accessory: ComposerAccessoryId;
  prop: ComposerPropId;
}

export interface NpcComposeRecipe {
  npcId: string;
  title: string;
  slots: NpcComposeSlots;
  /** Quaternius source rig for animation retarget (see mixamoAnimationCatalog). */
  rigRef: QuaterniusRigRef;
  /** CC0 pack preset the silhouette is based on (documentation / bake script). */
  quaterniusPreset?: string;
  bodyLean?: number;
  /** Optional silhouette override when appearance is missing. */
  defaultSilhouette?: NPCSilhouette;
  /** Maps NPCDefinition.appearance.headAccessory when accessory slot is generic. */
  headAccessoryFallback?: NPCHeadAccessory;
}

export interface NpcComposePalette {
  body: string;
  accent: string;
  glow: string;
  skin: string;
  skinShadow: string;
  hair: string;
  widthScale: number;
  heightScale: number;
}
