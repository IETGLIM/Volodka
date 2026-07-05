/**
 * Emit NPC Composer manifest JSON to stdout (recipe → rigRef → Quaternius GLB).
 * Invoked by scripts/npc-composer.mjs
 */
import { NPC_COMPOSE_RECIPES, listNpcComposeRecipeIds } from '../src/config/npcComposer/recipes';
import { composeRecipeFingerprint } from '../src/config/npcComposer/resolveComposeRecipe';

const entries = listNpcComposeRecipeIds().map((npcId) => {
  const recipe = NPC_COMPOSE_RECIPES[npcId];
  const rigGlb = `${recipe.rigRef}.glb`;
  return {
    npcId,
    title: recipe.title,
    rigRef: recipe.rigRef,
    fingerprint: composeRecipeFingerprint(recipe),
    slots: recipe.slots,
    quaterniusPreset: recipe.quaterniusPreset ?? null,
    sourceGlb: rigGlb,
    sourceGlbPath: `assets-source/ai3dgen/npcs/${rigGlb}`,
    publicRigPath: `models/npcs/_rigs/${recipe.rigRef}.glb`,
  };
});

process.stdout.write(JSON.stringify(entries, null, 2));
