/* ─── Юнит-тесты данных кат-сцен ───
 *
 * Инварианты реестра CUTSCENES (14 сюжетных кат-сцен):
 *  - уникальные id и triggerStoryNode (getCutsceneForNode ищет find'ом —
 *    дубликат триггера молча затенял бы кат-сцену);
 *  - у КАЖДОЙ кат-сцены явно указан type (v4.20: до этого 5 из 14 жили
 *    без type, а runner хардкодил 'character_intro' — стили актов и
 *    откровений никогда не срабатывали);
 *  - textDurationMs ≥ суммы длительностей waypoints (аудит Task 3: у 14/14
 *    текст гас на 0.5–3 с раньше конца пролёта камеры; рантайм-показ уже
 *    управляется таймлайном, данные выровнены в v4.20);
 *  - первый waypoint — стартовая поза с duration 0, у всех ≥ 0;
 *  - минимум 2 waypoints (иначе не из чего строить фазы полёта).
 */

import { describe, expect, it } from 'vitest';
import { CUTSCENES, getCutsceneForNode, getAllCutsceneIds } from '@/data/cutscenes';
import { estimateCutsceneDisplayDurationMs } from '@/engine/cinematic/cutsceneToTimeline';

const CUTSCENE_LIST = Object.values(CUTSCENES);

function waypointSumMs(cutscene: (typeof CUTSCENE_LIST)[number]): number {
  return cutscene.waypoints.reduce((sum, w) => sum + Math.max(0, w.duration) * 1000, 0);
}

describe('CUTSCENES registry', () => {
  it('содержит 14 кат-сцен с уникальными id', () => {
    const ids = getAllCutsceneIds();
    expect(ids).toHaveLength(14);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('triggerStoryNode уникален — дубликат затенял бы getCutsceneForNode', () => {
    const triggers = CUTSCENE_LIST.map((c) => c.triggerStoryNode);
    expect(new Set(triggers).size).toBe(triggers.length);
    // Прямая проверка резолва: каждая кат-сцена находится по своему триггеру.
    for (const cutscene of CUTSCENE_LIST) {
      expect(getCutsceneForNode(cutscene.triggerStoryNode)?.id).toBe(cutscene.id);
    }
  });

  it('FIX (v4.20): у каждой кат-сцены явно указан type', () => {
    const allowed = ['act_transition', 'character_intro', 'story_moment', 'revelation'] as const;
    for (const cutscene of CUTSCENE_LIST) {
      expect(cutscene.type, `cutscene ${cutscene.id}`).toBeDefined();
      expect(allowed).toContain(cutscene.type);
    }
    // Ключевые типы на месте после выравнивания данных.
    expect(CUTSCENES.act2_to_act3?.type).toBe('act_transition');
    expect(CUTSCENES.act3_to_act4?.type).toBe('act_transition');
    expect(CUTSCENES.act4_to_act5?.type).toBe('act_transition');
    expect(CUTSCENES.poem_virus_revelation?.type).toBe('revelation');
    expect(CUTSCENES.resistance_awakening?.type).toBe('story_moment');
  });

  it('FIX (v4.20): textDurationMs ≥ суммы waypoints — текст не гаснет раньше камеры', () => {
    for (const cutscene of CUTSCENE_LIST) {
      const sumMs = waypointSumMs(cutscene);
      expect(
        cutscene.textDurationMs,
        `cutscene ${cutscene.id}: textDurationMs ${cutscene.textDurationMs} < Σ waypoints ${sumMs}`,
      ).toBeGreaterThanOrEqual(sumMs);
    }
  });

  it('waypoints: ≥ 2 точек, первая — стартовая поза (duration 0), все длительности ≥ 0', () => {
    for (const cutscene of CUTSCENE_LIST) {
      expect(cutscene.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(cutscene.waypoints[0]?.duration).toBe(0);
      for (const w of cutscene.waypoints) {
        expect(w.duration).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('estimateCutsceneDisplayDurationMs ≥ Σ waypoints + 800 (grace fallback-оценки)', () => {
    for (const cutscene of CUTSCENE_LIST) {
      const sumMs = waypointSumMs(cutscene);
      expect(estimateCutsceneDisplayDurationMs(cutscene)).toBeGreaterThanOrEqual(sumMs + 800);
    }
  });

  it('текст и подзаголовок непусты и на русском', () => {
    const hasCyrillic = (s: string) => /[а-яёА-ЯЁ]/.test(s);
    for (const cutscene of CUTSCENE_LIST) {
      expect(cutscene.textOverlay.length).toBeGreaterThan(0);
      expect(hasCyrillic(cutscene.textOverlay)).toBe(true);
      if (cutscene.subtitle) {
        expect(hasCyrillic(cutscene.subtitle)).toBe(true);
      }
    }
  });
});
