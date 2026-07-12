export type {
  ComposerAccessoryId,
  ComposerBodyId,
  ComposerBottomId,
  ComposerHairId,
  ComposerHeadId,
  ComposerPropId,
  ComposerTopId,
  NpcComposePalette,
  NpcComposeRecipe,
  NpcComposeSlots,
  QuaterniusRigRef,
} from '@/config/npcComposer/types';

export {
  COMPOSER_ACCESSORY_PARTS,
  COMPOSER_BODY_PARTS,
  COMPOSER_BOTTOM_PARTS,
  COMPOSER_HAIR_PARTS,
  COMPOSER_HEAD_PARTS,
  COMPOSER_PROP_PARTS,
  COMPOSER_TOP_PARTS,
  defaultRigForBody,
} from '@/config/npcComposer/partCatalog';

export {
  NPC_COMPOSE_RECIPES,
  listNpcComposeRecipeIds,
} from '@/config/npcComposer/recipes';

export {
  composeRecipeFingerprint,
  hasNpcComposeRecipe,
  resolveComposePalette,
  resolveNpcComposeRecipe,
  resolveNpcComposeRecipeForNpc,
  resolveNpcComposeRigRef,
  GENERIC_NPC_COMPOSE_RECIPE,
} from '@/config/npcComposer/resolveComposeRecipe';
