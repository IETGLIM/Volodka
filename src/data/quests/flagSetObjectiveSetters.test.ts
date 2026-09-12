import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { DIALOGUE_NODES } from '@/data/dialogue';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { MINIGAME_COMPLETION_FLAGS } from '@/shared/constants/minigames';
import type { StoryNode } from '@/shared/types/game';

/**
 * Ракет-тест «мёртвых флагов» (v4.17.0).
 *
 * Объектив типа flag_set завершается ТОЛЬКО когда state.playerState.flags[target]
 * установлен (QuestTracker.checkNewFlags). Флаг ставится эффектом setFlag в
 * story-нодах, диалогах, trigger-зонах, наградах квестов — или движком
 * (минигеймы, терминалы). Объектив без сеттера = незавершаемый квест
 * (soft-lock прогресса): именно так жил whisper_of_walls (bunker_recordings_heard)
 * до v4.17.0.
 *
 * Инвариант: НОВЫЕ flag_set-объективы обязаны приносить сеттер с собой.
 * Известный долг зафиксирован в KNOWN_DEAD_FLAG_OBJECTIVES — список может
 * только сокращаться (фикс = удаление строки + сеттер в контенте).
 */

/** Флаги, выставляемые движком вне контент-реестров (см. комментарии). */
const ENGINE_SET_FLAGS: ReadonlySet<string> = new Set([
  // MINIGAME_COMPLETION_FLAGS — ставятся бриджем минигеймов при победе.
  ...Object.values(MINIGAME_COMPLETION_FLAGS),
  // Терминальные награды движка (src/engine/minigame/openstack/openstackTerminalRewards.ts).
  'openstack_terminal_solved',
]);

/**
 * Задолженность контента: объективы, чьи флаги пока никто не ставит.
 * FIX (v4.17.1): долг закрыт полностью — 12 мёртвых флагов получили
 * сеттеры (диалоги milestoneDialogues + 10 триггер-зон «DEAD-FLAG REPAIR»
 * в triggerZones.ts). Список оставлен ПУСТЫМ как инвариант: новые
 * flag_set-объективы обязаны приносить сеттер с собой.
 */
const KNOWN_DEAD_FLAG_OBJECTIVES: ReadonlySet<string> = new Set([]);

interface EffectLike {
  readonly type?: string;
  readonly flag?: string;
}
interface ChoiceLike {
  readonly effects?: readonly EffectLike[];
}
interface NodeLike {
  readonly effects?: readonly EffectLike[];
  readonly choices?: readonly ChoiceLike[];
}

function collectFlagSetters(nodes: Iterable<NodeLike>): Set<string> {
  const flags = new Set<string>();
  for (const node of nodes) {
    for (const fx of node.effects ?? []) {
      if (fx.type === 'setFlag' && fx.flag) flags.add(fx.flag);
    }
    for (const choice of node.choices ?? []) {
      for (const fx of choice.effects ?? []) {
        if (fx.type === 'setFlag' && fx.flag) flags.add(fx.flag);
      }
    }
  }
  return flags;
}

function buildSetterRegistry(): Set<string> {
  const setters = collectFlagSetters(Object.values(STORY_NODES) as unknown as StoryNode[]);
  for (const flag of collectFlagSetters(Object.values(DIALOGUE_NODES) as unknown as NodeLike[])) {
    setters.add(flag);
  }
  for (const zone of TRIGGER_ZONES) {
    for (const fx of (zone.effects ?? []) as readonly EffectLike[]) {
      if (fx.type === 'setFlag' && fx.flag) setters.add(fx.flag);
    }
  }
  for (const quest of QUEST_DEFINITIONS) {
    for (const fx of quest.rewards as readonly EffectLike[]) {
      if (fx.type === 'setFlag' && fx.flag) setters.add(fx.flag);
    }
  }
  return setters;
}

function findDeadFlagObjectives(): Array<{ key: string; entry: string }> {
  const setters = buildSetterRegistry();
  const dead: Array<{ key: string; entry: string }> = [];
  for (const quest of QUEST_DEFINITIONS) {
    for (const objective of quest.objectives) {
      if (objective.type !== 'flag_set' || !objective.target) continue;
      if (setters.has(objective.target)) continue;
      if (ENGINE_SET_FLAGS.has(objective.target)) continue;
      const key = `${quest.id}:${objective.id}`;
      dead.push({ key, entry: `${key} → ${objective.target}` });
    }
  }
  return dead;
}

describe('flagSetObjectiveSetters — у каждого flag_set-объектива есть сеттер (v4.17.0)', () => {
  it('новые мёртвые флаги запрещены; известный долг не растёт', () => {
    const dead = findDeadFlagObjectives();
    const unexplained = dead.filter((d) => !KNOWN_DEAD_FLAG_OBJECTIVES.has(d.key));
    expect(
      unexplained.map((d) => d.entry),
      'flag_set-объективы без сеттера и вне списка долга (добавь сеттер контента или обнови список осознанно):\n' +
        unexplained.map((d) => d.entry).join('\n'),
    ).toEqual([]);
  });

  it('известный долг не расширяется — сеттеры покрывают список до конца', () => {
    const dead = new Set(findDeadFlagObjectives().map((d) => d.key));
    for (const entry of KNOWN_DEAD_FLAG_OBJECTIVES) {
      // Каждая запись долга всё ещё мертва: после фикса строка должна быть
      // УДАЛЕНА из списка (иначе тест начнёт занижать покрытие).
      expect(dead.has(entry), `«${entry}» уже не мёртв — удали из KNOWN_DEAD_FLAG_OBJECTIVES`).toBe(true);
    }
  });

  it('кейс-фиксы v4.17.0: мёртвые флаги Acts 3–4 закрыты сеттерами', () => {
    const setters = buildSetterRegistry();
    for (const flag of [
      // whisper_of_walls: плёнки бункера.
      'bunker_recordings_heard',
      // watchers_shadow: узел Смотрящего.
      'surveillance_node_hacked',
      // night_shift: фантомы и источник.
      'phantom_1_destroyed',
      'phantom_2_destroyed',
      'phantom_3_destroyed',
      'phantom_source_destroyed',
      // catacombs_shadows: тёмный маг.
      'dark_mage_killed',
      // Многобитовые кейсы v4.17.0 (Acts 3–4 density).
      'vault_war_council_held',
      'vault_defenders_roles_assigned',
      'vault_firewall_pattern_woven',
      'vault_breach_repelled',
      'vault_last_wave_held',
      'maria_barista_details',
      'maria_records_crossed',
      'maria_memory_echo',
      'maria_evidence_prepared',
      'roof_stairwell_observed',
      'roof_guard_waved_off',
      'roof_position_taken',
      'roof_first_words_exchanged',
      'roof_alexander_past_heard',
      'thread_fyodor_told',
      'thread_memorial_read',
      'thread_code_decoded',
      'thread_hum_source_found',
      'thread_woven',
    ]) {
      expect(setters.has(flag), `флаг «${flag}» обязан иметь сеттер`).toBe(true);
    }
  });
});
