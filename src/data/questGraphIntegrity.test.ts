import { describe, expect, it } from 'vitest';
import { EVENT_OBJECTIVE_MAP } from '@/game/core/questEvents';
import { QUEST_DEFINITIONS } from '@/data/quests';
import {
  HEARTH_EXPLORATION_QUEST_GRAPH,
  RACK_FORCE_EXPLORATION_QUEST_GRAPH,
  DISTRICT_CHRONICLE_EXPLORATION_QUEST_GRAPH,
  MVD_BUREAU_EXPLORATION_QUEST_GRAPH,
  ZAREMA_TV_EXPLORATION_QUEST_GRAPH,
} from '@/game/quests/explorationQuestGraphs';
import { tryApplyVolodkaRackAuditInspect } from '@/lib/volodkaRackQuestBranch';
import { startObjectInteractionService } from '@/game/core/objectInteractionService';

/**
 * Фаза E: согласованность `QUEST_DEFINITIONS` ↔ `EVENT_OBJECTIVE_MAP` ↔ обход (`exploration_*`).
 * Старт/операции из `STORY_NODES` — `contentValidator.test.ts` (`questOperations`, `questObjective`).
 */
describe('quest graph integrity (phase E)', () => {
  it('EVENT_OBJECTIVE_MAP: every questId/objectiveId exists in QUEST_DEFINITIONS', () => {
    for (const [eventType, rows] of Object.entries(EVENT_OBJECTIVE_MAP)) {
      if (!rows?.length) continue;
      for (const { questId, objectiveId } of rows) {
        const q = QUEST_DEFINITIONS[questId];
        expect(q, `EVENT_OBJECTIVE_MAP[${eventType}]: missing quest ${questId}`).toBeDefined();
        const ok = q!.objectives.some((o) => o.id === objectiveId);
        expect(
          ok,
          `EVENT_OBJECTIVE_MAP[${eventType}]: quest "${questId}" has no objective "${objectiveId}"`,
        ).toBe(true);
      }
    }
  });

  it('exploration side quests: objectives wired (graph E / inspect / minigame)', () => {
    const hearth = QUEST_DEFINITIONS.exploration_zarema_hearth;
    expect(hearth?.objectives.map((o) => o.id)).toEqual(['hearth_moment']);
    expect(HEARTH_EXPLORATION_QUEST_GRAPH.questId).toBe('exploration_zarema_hearth');

    const rack = QUEST_DEFINITIONS.exploration_volodka_rack;
    const rackIds = rack?.objectives.map((o) => o.id).sort() ?? [];
    expect(rackIds).toEqual(['rack_audit_panels', 'rack_force_nodes'].sort());

    expect(RACK_FORCE_EXPLORATION_QUEST_GRAPH.questId).toBe('exploration_volodka_rack');
    const audit = rack?.objectives.find((o) => o.id === 'rack_audit_panels');
    expect(audit?.targetValue).toBe(3);

    expect(typeof tryApplyVolodkaRackAuditInspect).toBe('function');
    expect(typeof startObjectInteractionService).toBe('function');

    const dist = QUEST_DEFINITIONS.exploration_district_chronicle;
    expect(dist?.objectives.map((o) => o.id)).toEqual(['chronicle_whisper']);
    expect(DISTRICT_CHRONICLE_EXPLORATION_QUEST_GRAPH.questId).toBe('exploration_district_chronicle');

    const mvd = QUEST_DEFINITIONS.exploration_mvd_bureau;
    expect(mvd?.objectives.map((o) => o.id)).toEqual(['bureau_stamp']);
    expect(MVD_BUREAU_EXPLORATION_QUEST_GRAPH.questId).toBe('exploration_mvd_bureau');

    const ztv = QUEST_DEFINITIONS.exploration_zarema_tv_feed;
    expect(ztv?.objectives.map((o) => o.id)).toEqual(['tv_log_ack']);
    expect(ZAREMA_TV_EXPLORATION_QUEST_GRAPH.questId).toBe('exploration_zarema_tv_feed');
  });
});
