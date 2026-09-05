import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mergeDialogueNodesIntoCacheForTests,
  mergeStoryNodesIntoCacheForTests,
  resetNarrativePackRegistryForTests,
} from '@/data/narrative/narrativePackRegistry';
import {
  guessNarrativeKind,
  resolveNarrativeKindByLoading,
} from './narrativeKindResolution';

/**
 * Cross-registry kind resolution — регрессионный тест на видимый баг раунда 8:
 * хуки-выборы в приветствиях NPC ведут прямо в story-узлы (next:
 * 'sl_courier_start', 'aaa_*_start'), но оверлей открывался с kind='dialogue',
 * DialogueRenderer искал story-узел только в диалоговых паках и показывал
 * игроку ошибку загрузки вместо вступления квеста.
 */
describe('narrativeKindResolution', () => {
  beforeEach(() => {
    resetNarrativePackRegistryForTests();
  });

  it('guessNarrativeKind: story-only узел определяется как story', () => {
    mergeStoryNodesIntoCacheForTests(
      { hook_target: { id: 'hook_target', text: 'story', sceneId: 'street_night', choices: [] } },
      'act-test',
    );
    expect(guessNarrativeKind('hook_target')).toBe('story');
  });

  it('guessNarrativeKind: dialogue-only узел определяется как dialogue', () => {
    mergeDialogueNodesIntoCacheForTests(
      { npc_greeting: { id: 'npc_greeting', speaker: 'НПС', text: 'привет', choices: [] } },
      'part-test',
    );
    expect(guessNarrativeKind('npc_greeting')).toBe('dialogue');
  });

  it('guessNarrativeKind: неизвестный и дублирующийся узел дают null', () => {
    expect(guessNarrativeKind('missing_node')).toBeNull();

    mergeStoryNodesIntoCacheForTests(
      { dual_node: { id: 'dual_node', text: 's', sceneId: 'street_night', choices: [] } },
      'act-test',
    );
    mergeDialogueNodesIntoCacheForTests(
      { dual_node: { id: 'dual_node', speaker: 'НПС', text: 'd', choices: [] } },
      'part-test',
    );
    expect(guessNarrativeKind('dual_node')).toBeNull();
  });

  it('resolveNarrativeKindByLoading находит story-узел через ensureStoryNode', async () => {
    mergeStoryNodesIntoCacheForTests(
      { late_story_node: { id: 'late_story_node', text: 'позже', sceneId: 'street_night', choices: [] } },
      'act-test',
    );
    const kind = await resolveNarrativeKindByLoading('late_story_node', { preferredKind: 'dialogue' });
    expect(kind).toBe('story');
  });

  it('resolveNarrativeKindByLoading находит dialogue-узел и уважает preferredKind', async () => {
    mergeDialogueNodesIntoCacheForTests(
      { late_dialogue_node: { id: 'late_dialogue_node', speaker: 'НПС', text: 'позже', choices: [] } },
      'part-test',
    );
    const kind = await resolveNarrativeKindByLoading('late_dialogue_node', { preferredKind: 'story' });
    expect(kind).toBe('dialogue');
  });

  it('resolveNarrativeKindByLoading возвращает null для узла из ниоткуда', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const kind = await resolveNarrativeKindByLoading('totally_unknown_node');
    expect(kind).toBeNull();
    warn.mockRestore();
  });

  it('реестр содержит тестовый merge для обоих реестров (паритет хуков)', () => {
    mergeStoryNodesIntoCacheForTests(
      { parity_story: { id: 'parity_story', text: 's', sceneId: 'street_night', choices: [] } },
      'act-test',
    );
    mergeDialogueNodesIntoCacheForTests(
      { parity_dialogue: { id: 'parity_dialogue', speaker: 'НПС', text: 'd', choices: [] } },
      'part-test',
    );
    expect(guessNarrativeKind('parity_story')).toBe('story');
    expect(guessNarrativeKind('parity_dialogue')).toBe('dialogue');
  });
});
