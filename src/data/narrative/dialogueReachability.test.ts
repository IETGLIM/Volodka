import { describe, it, expect } from 'vitest';
import { DIALOGUE_NODES } from '@/data/dialogue';
import { STORY_NODES } from '@/data/storyNodes';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';

/**
 * CI guard (аудит, этап 84): достижимость диалоговых узлов.
 *
 * До v4.15.6 — 202 из 607 узлов (33%) были «сателлитами»: авторский контент
 * глубоких веток (part2–5 expanded, WS-спринты ws17b/ws22b/ws23b/ws26,
 * act3/act4 expansion) существовал в данных, но ни один внешний вход
 * (NPC-вход, story-выбор, триггер-зона) на него не вёл — игрок физически
 * не мог увидеть треть диалогового контента игры.
 *
 * Тест строит граф достижимости от ВСЕХ внешних входов движка:
 *   1) NPC: dialogueNodeId / returnDialogueNodeId / relationMilestones[];
 *   2) триггер-зоны: linkedDialogueNodeId;
 *   3) story-узлы: choices[].next, указывающие на диалоги;
 * и проходом BFS по choices[].next замыкает транзитивное замыкание.
 * Любой новый «осиротевший» узел — красный тест с точным списком id.
 */

interface MinimalNode {
  readonly choices?: readonly { readonly next?: string | null }[];
}

describe('dialogue reachability from engine entry points (audit stage 84)', () => {
  it('каждый узел DIALOGUE_NODES достижим из NPC-/story-/trigger-входов', () => {
    const dialogueIds = new Set(Object.keys(DIALOGUE_NODES));
    const reached = new Set<string>();
    const queue: string[] = [];

    const enqueue = (id: string): void => {
      if (dialogueIds.has(id) && !reached.has(id)) {
        reached.add(id);
        queue.push(id);
      }
    };

    /* 1. NPC-входы: основной диалог, возвратный, milestone-пороги. */
    for (const npc of ALL_NPC_DEFINITIONS) {
      if (npc.dialogueNodeId) enqueue(npc.dialogueNodeId);
      if (npc.returnDialogueNodeId) enqueue(npc.returnDialogueNodeId);
      for (const ms of npc.relationMilestones ?? []) {
        if (ms.dialogueNodeId) enqueue(ms.dialogueNodeId);
      }
    }

    /* 2. Триггер-зоны сцен. */
    for (const zone of TRIGGER_ZONES) {
      if (zone.linkedDialogueNodeId) enqueue(zone.linkedDialogueNodeId);
    }

    /* 3. Story-узлы: любой выбор, ведущий в диалог. */
    for (const node of Object.values(STORY_NODES as Record<string, MinimalNode>)) {
      for (const choice of node.choices ?? []) {
        if (choice.next) enqueue(choice.next);
      }
    }

    /* BFS по графу диалогов. */
    while (queue.length > 0) {
      const current = queue.shift() as string;
      const node = DIALOGUE_NODES[current] as MinimalNode | undefined;
      for (const choice of node?.choices ?? []) {
        if (choice.next) enqueue(choice.next);
      }
    }

    const orphaned = Object.keys(DIALOGUE_NODES).filter((id) => !reached.has(id));
    expect(
      orphaned,
      `недостижимые диалоги (${orphaned.length}): добавьте вход — NPC return-выбор, ` +
        `триггер-зону или story-ссылку; см. satelliteBridges.ts (этап 84)`,
    ).toEqual([]);
  });

  it('хабы-темы ссылаются только на существующие узлы (мосты без битых next)', () => {
    const bridges = Object.values(DIALOGUE_NODES).filter((n) => n.id.endsWith('_topics') || n.id === 'volodka_reflections');
    expect(bridges.length).toBeGreaterThan(0);
    for (const hub of bridges) {
      for (const choice of hub.choices) {
        if (choice.next) {
          expect(
            DIALOGUE_NODES[choice.next],
            `хаб «${hub.id}» ссылается на несуществующий узел «${choice.next}»`,
          ).toBeDefined();
        }
      }
    }
  });
});
