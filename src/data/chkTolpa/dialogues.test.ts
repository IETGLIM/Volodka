import { describe, expect, it } from 'vitest';
import { CHK_DIALOGUE_NODES } from './dialogues';
import { ALL_UNIFIED_POEM_IDS, TOTAL_UNIFIED_POEMS } from '@/data/poemCollectionMeta';
import { checkStoryCondition } from '@/shared/storyConditions';
import { resolveDialogueText } from '@/engine/dialogue/resolveDialoguePresentation';

describe('CHK_DIALOGUE_NODES', () => {
  it('exposes karma variants on Ru greeting', () => {
    const node = CHK_DIALOGUE_NODES.chk_ru_greeting;
    expect(resolveDialogueText(node, 70)).toContain('Володька');
    expect(resolveDialogueText(node, 40)).toContain('распределённая');
    expect(resolveDialogueText(node, 10)).toContain('Стой');
  });

  it('gates persuasion oath bypass', () => {
    const choice = CHK_DIALOGUE_NODES.chk_based_oath.choices.find(
      (c) => c.next === 'chk_based_respect',
    );
    expect(choice?.condition).toEqual({ minSkill: { persuasion: 20 } });
    expect(CHK_DIALOGUE_NODES.chk_based_respect).toBeDefined();
  });

  it('gates easter egg on full poem collection', () => {
    const choice = CHK_DIALOGUE_NODES.chk_ru_greeting.choices.find(
      (c) => c.next === 'chk_ru_easter_egg_all_poems',
    );
    expect(choice?.condition?.minCollectedPoems).toBe(TOTAL_UNIFIED_POEMS);

    const poems = [...ALL_UNIFIED_POEM_IDS];
    const pass = checkStoryCondition(choice?.condition, {
      karma: 50,
      skills: {
        logic: 5,
        coding: 5,
        empathy: 5,
        persuasion: 5,
        intuition: 5,
        writing: 5,
        rhythm: 5,
      },
      flags: {},
      collectedPoems: poems,
      currentAct: 1,
    });
    expect(pass.pass).toBe(true);
  });

  it('gates wine gift on inventory item', () => {
    const node = CHK_DIALOGUE_NODES.chk_based_gift_wine;
    expect(node.condition).toEqual({ hasItem: 'port_wine_777' });

    const fail = checkStoryCondition(node.condition, {
      karma: 50,
      skills: {
        logic: 5,
        coding: 5,
        empathy: 5,
        persuasion: 5,
        intuition: 5,
        writing: 5,
        rhythm: 5,
      },
      flags: {},
      collectedPoems: [],
      currentAct: 1,
      ownedItemIdsKey: '',
    });
    expect(fail.pass).toBe(false);

    const pass = checkStoryCondition(node.condition, {
      karma: 50,
      skills: {
        logic: 5,
        coding: 5,
        empathy: 5,
        persuasion: 5,
        intuition: 5,
        writing: 5,
        rhythm: 5,
      },
      flags: {},
      collectedPoems: [],
      currentAct: 1,
      ownedItemIdsKey: 'port_wine_777',
    });
    expect(pass.pass).toBe(true);
  });

  it('includes silence node with stress relief', () => {
    const silence = CHK_DIALOGUE_NODES.chk_silence;
    expect(silence.contextNote).toBeTruthy();
    const rest = silence.choices.find((c) => c.text.includes('тишине'));
    expect(rest?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -5 });

    const night = CHK_DIALOGUE_NODES.chk_silence_night;
    expect(night.contextNote).toContain('Ночь');
    const nightRest = night.choices.find((c) => c.text.includes('тишине'));
    expect(nightRest?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -8 });
  });

  it('gates honorary chekist farewell on tolpa_honorary_chekist', () => {
    const choice = CHK_DIALOGUE_NODES.chk_ru_return.choices.find(
      (c) => c.next === 'chk_ru_honorary_farewell',
    );
    expect(choice?.condition).toEqual({ flag: 'tolpa_honorary_chekist' });
    expect(CHK_DIALOGUE_NODES.chk_ru_honorary_farewell.speakerId).toBe('chk_ru');
  });

  it('routes silence by time of day', () => {
    const greeting = CHK_DIALOGUE_NODES.chk_ru_greeting;
    const night = greeting.choices.filter((c) => c.next === 'chk_silence_night');
    expect(night).toHaveLength(2);
    expect(night.some((c) => c.condition?.minTimeOfDay === 21)).toBe(true);
    expect(night.some((c) => c.condition?.maxTimeOfDay === 5)).toBe(true);
    const day = greeting.choices.find((c) => c.next === 'chk_silence');
    expect(day?.condition).toEqual({ minTimeOfDay: 6, maxTimeOfDay: 20 });
  });
});
