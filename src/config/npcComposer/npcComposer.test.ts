import { describe, expect, it } from 'vitest';
import { listProceduralNpcAvatarIds } from '@/config/proceduralNpcAvatarCatalog';
import {
  NPC_COMPOSE_RECIPES,
  composeRecipeFingerprint,
  hasNpcComposeRecipe,
  listNpcComposeRecipeIds,
  resolveNpcComposeRecipe,
  resolveNpcComposeRecipeForNpc,
  resolveNpcComposeRigRef,
} from '@/config/npcComposer';

describe('npcComposer recipes', () => {
  it('assigns a unique slot fingerprint per NPC', () => {
    const ids = listNpcComposeRecipeIds();
    const fingerprints = ids.map((id) => composeRecipeFingerprint(NPC_COMPOSE_RECIPES[id]));
    expect(new Set(fingerprints).size).toBe(ids.length);
  });

  it('distinguishes albert from kira and zarema from tamara', () => {
    const albert = composeRecipeFingerprint(resolveNpcComposeRecipe('albert')!);
    const kira = composeRecipeFingerprint(resolveNpcComposeRecipe('kira')!);
    const zarema = composeRecipeFingerprint(resolveNpcComposeRecipe('zarema')!);
    const tamara = composeRecipeFingerprint(resolveNpcComposeRecipe('tamara')!);

    expect(albert).not.toBe(kira);
    expect(zarema).not.toBe(tamara);
  });

  it('covers all catalog story NPCs except the player', () => {
    const catalogIds = listProceduralNpcAvatarIds().filter((id) => id !== 'player_volodka');
    const missing = catalogIds.filter((id) => !hasNpcComposeRecipe(id));
    expect(missing).toEqual([]);
  });

  it('binds each recipe to a Quaternius rig ref', () => {
    for (const id of listNpcComposeRecipeIds()) {
      const recipe = NPC_COMPOSE_RECIPES[id];
      expect(recipe.rigRef).toMatch(/^(male|female)_\d{2}$/);
      expect(recipe.npcId).toBe(id);
      expect(resolveNpcComposeRigRef(id)).toBe(recipe.rigRef);
    }
  });

  it('maps albert and zarema to distinct rig refs when needed', () => {
    expect(resolveNpcComposeRigRef('albert')).toBe('male_02');
    expect(resolveNpcComposeRigRef('zarema')).toBe('female_01');
  });

  it('falls back to generic recipe for unknown npc ids', () => {
    const recipe = resolveNpcComposeRecipeForNpc('chk_guest_devops');
    expect(recipe.npcId).toBe('chk_guest_devops');
    expect(recipe.slots.body).toBe('average_male');
    expect(resolveNpcComposeRecipe('chk_guest_devops')).toBeUndefined();
  });
});
