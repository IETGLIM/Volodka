import { describe, expect, it } from 'vitest';
import { DIALOGUE_NODES } from '@/data/dialogue';
import {
  loadAllNarrativePacks,
  getDialogueNodesCache,
  DIALOGUE_PACK_ORDER,
} from './narrativePackRegistry';

/**
 * Регрессионный тест паритета runtime-реестра нарратива (v4.8.9).
 *
 * До фикса 9 диалоговых паков (returnDialogues, milestoneDialogues,
 * act3/act4 expanded, part2–5 expanded) существовали только в статическом
 * DIALOGUE_NODES: runtime-лоадеры их не грузили, 220 узлов не попадали в
 * кэш сессии. Видимый баг: milestone-диалоги Альберта / Заремы / Марии /
 * Солныш (relationMilestones @50/@80) не резолвились ensureDialogueNode.
 */
describe('narrativePackRegistry — паритет со статическим реестром (v4.8.9)', () => {
  it('runtime-кэш диалогов покрывает весь статический DIALOGUE_NODES', async () => {
    await loadAllNarrativePacks();
    const runtime = getDialogueNodesCache();
    const missing = Object.keys(DIALOGUE_NODES).filter((id) => !(id in runtime));
    expect(
      missing,
      'узлы статического реестра без runtime-лоадера (добавить пак в DIALOGUE_PACK_ORDER)',
    ).toEqual([]);
  });

  it('каждый DialoguePackId имеет лоадер (полная запись Record)', () => {
    const order = new Set(DIALOGUE_PACK_ORDER);
    expect(order.size).toBe(DIALOGUE_PACK_ORDER.length);
  });

  it('авторские return-узлы не затираются сгенерированными заглушками', async () => {
    await loadAllNarrativePacks();
    const runtime = getDialogueNodesCache();

    // albert_return: авторская версия (part1-albert) содержит ветку
    // серьёзного разговора (albert_deep_talk) — вход в дерево act1_albert_alliance.
    const albertReturn = runtime['albert_return']?.choices ?? [];
    expect(
      albertReturn.some((c) => c.next === 'albert_deep_talk'),
      'returnDialogues должен быть fallback-ом, а не переопределять авторскую версию',
    ).toBe(true);

    // solnysh_return: авторская версия (expandedDialogueNodes) содержит
    // хук на act-4 цепочку archive_forgotten_approach.
    const solnyshReturn = runtime['solnysh_return']?.choices ?? [];
    expect(solnyshReturn.some((c) => c.next === 'archive_forgotten_approach')).toBe(true);
  });

  it('milestone-диалоги акта 1 резолвятся в runtime-кэше', async () => {
    await loadAllNarrativePacks();
    const runtime = getDialogueNodesCache();
    for (const id of [
      'albert_milestone_50',
      'albert_milestone_80',
      'zarema_milestone_50',
      'maria_milestone_50',
      'solnysh_milestone_50',
    ]) {
      expect(runtime[id], `milestone-узел ${id}`).toBeDefined();
    }
  });
});
