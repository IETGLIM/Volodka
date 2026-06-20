import type { NPCAppearance } from '@/shared/types/game';
import type { NpcComposePalette, NpcComposeRecipe } from '@/config/npcComposer/types';
import { NPC_COMPOSE_RECIPES } from '@/config/npcComposer/recipes';

const SKIN_BY_HEAD: Record<string, { skin: string; shadow: string }> = {
  young_female: { skin: '#d0b090', shadow: '#c0a080' },
  mature_female: { skin: '#c9a67a', shadow: '#b89468' },
  elder_female: { skin: '#c8b8a0', shadow: '#b0a088' },
  young_male: { skin: '#c4a882', shadow: '#b89a72' },
  mature_male: { skin: '#b09070', shadow: '#9a7a60' },
  bearded_male: { skin: '#b09070', shadow: '#9a7a60' },
  elder_male: { skin: '#a08870', shadow: '#907860' },
};

function silhouetteWidth(silhouette: NPCAppearance['silhouette']): number {
  switch (silhouette) {
    case 'slim':
      return 0.9;
    case 'heavy':
      return 1.15;
    default:
      return 1;
  }
}

function defaultHairColor(recipe: NpcComposeRecipe): string {
  switch (recipe.slots.hair) {
    case 'gray_receding':
    case 'bun_gray':
      return '#888890';
    case 'scarf_wrap':
      return recipe.quaterniusPreset === 'Medieval' ? '#1a8a7a' : '#4a3020';
    case 'bald':
      return '#2a2018';
    case 'beanie':
    case 'hood':
    case 'cap':
      return '#2a3040';
    default:
      return '#3a2820';
  }
}

/** Resolve runtime palette from NPCDefinition.appearance + compose recipe. */
export function resolveComposePalette(
  appearance: NPCAppearance,
  recipe: NpcComposeRecipe,
): NpcComposePalette {
  const headSkin = SKIN_BY_HEAD[recipe.slots.head] ?? SKIN_BY_HEAD.mature_male;
  const silhouette = appearance.silhouette ?? recipe.defaultSilhouette ?? 'average';

  return {
    body: appearance.bodyColor,
    accent: appearance.accentColor,
    glow: appearance.glowColor,
    skin: headSkin.skin,
    skinShadow: headSkin.shadow,
    hair: defaultHairColor(recipe),
    widthScale: silhouetteWidth(silhouette),
    heightScale: appearance.height,
  };
}

/** Fallback compose recipe for NPC ids without an explicit entry. */
export const GENERIC_NPC_COMPOSE_RECIPE: NpcComposeRecipe = {
  npcId: '_generic',
  title: 'NPC',
  slots: {
    body: 'average_male',
    head: 'young_male',
    hair: 'short_crop',
    top: 'jacket_casual',
    bottom: 'jeans',
    accessory: 'none',
    prop: 'none',
  },
  rigRef: 'male_03',
  quaterniusPreset: 'Casual_2',
  bodyLean: 0.04,
};

export function resolveNpcComposeRecipe(npcId: string): NpcComposeRecipe | undefined {
  return NPC_COMPOSE_RECIPES[npcId];
}

/** Always returns a compose recipe — explicit or generic fallback. */
export function resolveNpcComposeRecipeForNpc(npcId: string): NpcComposeRecipe {
  const recipe = NPC_COMPOSE_RECIPES[npcId];
  if (recipe) return recipe;
  return { ...GENERIC_NPC_COMPOSE_RECIPE, npcId, title: npcId };
}

export function hasNpcComposeRecipe(npcId: string): boolean {
  return npcId in NPC_COMPOSE_RECIPES;
}

/** Fingerprint for uniqueness tests — slot tuple per NPC. */
export function composeRecipeFingerprint(recipe: NpcComposeRecipe): string {
  const s = recipe.slots;
  return [s.body, s.head, s.hair, s.top, s.bottom, s.accessory, s.prop].join('|');
}

/** Quaternius rig for Mixamo/embedded clip retarget (see npc-composer-manifest.json). */
export function resolveNpcComposeRigRef(npcId: string): NpcComposeRecipe['rigRef'] | undefined {
  return resolveNpcComposeRecipe(npcId)?.rigRef;
}
