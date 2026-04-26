import { describe, expect, it } from 'vitest';
import { STORY_TRIGGERS } from '@/data/triggerZones';
import type { ExplorationQuestGraph } from '@/game/core/explorationQuestGraph';
import {
  HEARTH_EXPLORATION_QUEST_GRAPH,
  RACK_FORCE_EXPLORATION_QUEST_GRAPH,
} from '@/game/quests/explorationQuestGraphs';
import { explorationInteractionRegistry, registerBaseInteractions } from '@/game/interactions/registerBaseInteractions';

function collectInteractionIdsFromQuestGraph(g: ExplorationQuestGraph): string[] {
  const out: string[] = [];
  for (const edge of g.edges) {
    if (edge.trigger.kind === 'interaction') {
      out.push(edge.trigger.interactionId);
    }
  }
  return out;
}

/**
 * Зарегистрировано в `registerBaseInteractions`, но пока без `interactionId` в `STORY_TRIGGERS`.
 * Либо добавить зону триггера, либо вызывать `tryExecute` из другого кода; иначе игрок не увидит взаимодействие.
 */
const REGISTRY_IDS_WITHOUT_TRIGGER_ZONE = new Set<string>(['zarema_resonance_ping']);

describe('exploration InteractionRegistry coverage (фаза 1)', () => {
  it('регистрирует базовые взаимодействия один раз при вызове', () => {
    registerBaseInteractions();
    const ids = explorationInteractionRegistry.getRegisteredInteractions().map((i) => i.id);
    expect(ids.sort()).toEqual(
      ['npc_intro', 'quest_zarema_hearth', 'volodka_rack_hack', 'zarema_resonance_ping'].sort(),
    );
  });

  it('каждый interactionId из STORY_TRIGGERS есть в реестре', () => {
    registerBaseInteractions();
    const fromTriggers = [
      ...new Set(
        STORY_TRIGGERS.flatMap((t) => (t.interactionId != null && t.interactionId !== '' ? [t.interactionId] : [])),
      ),
    ];
    expect(fromTriggers.sort()).toEqual(['npc_intro', 'quest_zarema_hearth', 'volodka_rack_hack'].sort());
    for (const id of fromTriggers) {
      expect(explorationInteractionRegistry.get(id), `триггер ссылается на неизвестный registry id: ${id}`).toBeDefined();
    }
  });

  it('каждый interactionId из графов обходных квестов есть в реестре', () => {
    registerBaseInteractions();
    const fromGraphs = [
      ...new Set([
        ...collectInteractionIdsFromQuestGraph(HEARTH_EXPLORATION_QUEST_GRAPH),
        ...collectInteractionIdsFromQuestGraph(RACK_FORCE_EXPLORATION_QUEST_GRAPH),
      ]),
    ];
    expect(fromGraphs).toEqual(['quest_zarema_hearth']);
    for (const id of fromGraphs) {
      expect(explorationInteractionRegistry.get(id), `квестовый граф ссылается на неизвестный registry id: ${id}`).toBeDefined();
    }
  });

  it('каждый id реестра либо имеет триггер, либо явно в allowlist', () => {
    registerBaseInteractions();
    const triggerIds = new Set(
      STORY_TRIGGERS.flatMap((t) => (t.interactionId != null && t.interactionId !== '' ? [t.interactionId] : [])),
    );
    for (const interaction of explorationInteractionRegistry.getRegisteredInteractions()) {
      const ok = triggerIds.has(interaction.id) || REGISTRY_IDS_WITHOUT_TRIGGER_ZONE.has(interaction.id);
      expect(
        ok,
        `registry id "${interaction.id}" не привязан к зоне в triggerZones.ts и не в REGISTRY_IDS_WITHOUT_TRIGGER_ZONE`,
      ).toBe(true);
    }
  });
});
