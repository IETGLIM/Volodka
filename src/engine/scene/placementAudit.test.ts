/* ─── Placement audit — vitest gate: no model may be embedded/off-floor ─── */
/* Раунд 14: владелец зафиксировал «модели не на местах» (NPC в мебели,
 * спавны внутри коллайдеров, наследованные расписания вне полов вариантов).
 * Этот гейт фиксирует инвариант: 0 HIGH-нарушений по всем 29 сценам.
 * CLI-эквивалент: npx tsx scripts/analyze-model-placement.ts */

import { describe, it, expect } from 'vitest';
import { runPlacementAudit } from './placementAudit';
import {
  resolveNpcPlacementForScene,
  NPC_VARIANT_PLACEMENT_OVERRIDES,
} from '@/config/npcVariantPlacementOverrides';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { NPC_SCHEDULES } from '@/data/npcSchedules';
import type { SceneId } from '@/config/sceneIds';

describe('placementAudit — модели стоят на местах', () => {
  it('нет HIGH-нарушений (вне пола/габаритов/встроены в геометрию)', () => {
    const { checked, problems } = runPlacementAudit();
    const high = problems.filter((p) => p.severity === 'HIGH');
    expect(checked).toBeGreaterThan(700); // v4.14.0: 635 NPC/spawn/trigger + dressing/manifest
    expect(high).toEqual([]);
  });

  it('dressing/manifest-слой входит в аудит (v4.14.0 — слой был слепой зоной)', async () => {
    const { collectPlacements } = await import('./placementAudit');
    const placements = collectPlacements();
    expect(placements.some((p) => p.kind === 'dressing' && p.label.startsWith('dressing '))).toBe(true);
    expect(placements.some((p) => p.kind === 'dressing' && p.label.startsWith('manifest '))).toBe(true);
    // Терминалы больше не парят: каждый сидит на мебели (y > 0) с валидной точкой.
    const terminals = placements.filter((p) => p.label.includes('kenney_terminal'));
    expect(terminals.length).toBeGreaterThan(0);
    for (const t of terminals) {
      expect(t.position[1], `${t.label} должен стоять на поверхности`).toBeGreaterThan(0.1);
    }
  });

  it('вариант-оверрайды ссылаются только на существующие сцены и NPC', () => {
    for (const [sceneId, byNpc] of Object.entries(NPC_VARIANT_PLACEMENT_OVERRIDES)) {
      expect(SCENE_DEFINITIONS[sceneId as SceneId], `сцена ${sceneId}`).toBeDefined();
      for (const npcId of Object.keys(byNpc)) {
        expect(
          ALL_NPC_DEFINITIONS.some((n) => n.id === npcId),
          `NPC ${npcId} в ${sceneId}`,
        ).toBe(true);
      }
    }
  });

  it('override-позиция применяется только в сцене-варианте, не в родителе', () => {
    // barista в cafe_evening — позиция расписания; в albert_backroom — оверрайд.
    const inCafe = resolveNpcPlacementForScene('cafe_evening', 'cafe_barista', [0, 0, -4]);
    const inBackroom = resolveNpcPlacementForScene('albert_backroom', 'cafe_barista', [0, 0, -4]);
    expect(inCafe).toEqual([0, 0, -4]);
    expect(inBackroom).not.toEqual([0, 0, -4]);
    // Неизвестный NPC — fallback без изменений.
    expect(resolveNpcPlacementForScene('albert_backroom', 'umka', [9, 9, 9])).toEqual([9, 9, 9]);
  });

  it('каждое расписание-вхождение имеет валидный npcId', () => {
    for (const schedule of NPC_SCHEDULES) {
      expect(
        ALL_NPC_DEFINITIONS.some((n) => n.id === schedule.npcId),
        `расписание ${schedule.id} → NPC ${schedule.npcId}`,
      ).toBe(true);
    }
  });
});
