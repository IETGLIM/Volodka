import { describe, expect, it } from 'vitest';
import type { StoryEffect, StoryNode, StoryChoice, RandomEvent } from '@/data/types';
import { STORY_NODES } from '@/data/storyNodes';

/**
 * Ключи `StoryEffect`, которые сюжет может задать в данных.
 * Должны обрабатываться в `useStoryChoiceHandler.applyStoryEffect` (или намеренно игнорироваться с документированием).
 */
const STORY_EFFECT_KEYS_HANDLED = new Set<string>([
  'mood',
  'creativity',
  'stability',
  'energy',
  'karma',
  'selfEsteem',
  'stress',
  'skillGains',
  'perception',
  'introspection',
  'logic',
  'coding',
  'empathy',
  'writing',
  'imagination',
  'persuasion',
  'intuition',
  'resilience',
  'itemReward',
  'itemRemove',
  'poemId',
  'memoryId',
  'secretId',
  'npcId',
  'npcChange',
  'questStart',
  'questComplete',
  'questObjective',
  'questOperations',
  'setFlag',
  'unsetFlag',
  'pathShift',
  /** В данных пока не встречается; зарезервировано типом */
  'ending',
]);

function collectEffectKeys(effect: StoryEffect | undefined): string[] {
  if (!effect) return [];
  return Object.keys(effect).filter((k) => {
    const v = effect[k as keyof StoryEffect];
    return v !== undefined && v !== null;
  });
}

function walkChoice(choice: StoryChoice, out: Set<string>) {
  collectEffectKeys(choice.effect).forEach((k) => out.add(k));
  if (choice.skillCheck) {
    collectEffectKeys(choice.skillCheck.successEffect).forEach((k) => out.add(k));
    collectEffectKeys(choice.skillCheck.failEffect).forEach((k) => out.add(k));
  }
}

function walkRandomEvent(ev: RandomEvent, out: Set<string>) {
  collectEffectKeys(ev.effect).forEach((k) => out.add(k));
}

function walkNode(node: StoryNode, out: Set<string>) {
  collectEffectKeys(node.onEnter).forEach((k) => out.add(k));
  collectEffectKeys(node.effect).forEach((k) => out.add(k));
  node.choices?.forEach((c) => walkChoice(c, out));
  node.randomEvents?.forEach((e) => walkRandomEvent(e, out));
}

describe('story data vs StoryEffect handler (фаза 2)', () => {
  it('все ключи эффектов из STORY_NODES покрыты STORY_EFFECT_KEYS_HANDLED', () => {
    const used = new Set<string>();
    for (const node of Object.values(STORY_NODES)) {
      walkNode(node, used);
    }
    const unknown: string[] = [];
    for (const k of used) {
      if (!STORY_EFFECT_KEYS_HANDLED.has(k)) unknown.push(k);
    }
    expect(unknown, `Необработанные ключи в сюжетных эффектах: ${unknown.join(', ')}`).toEqual([]);
  });
});
