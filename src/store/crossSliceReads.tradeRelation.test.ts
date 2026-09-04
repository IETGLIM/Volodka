/* ─── v4.8.8: тесты readNpcTradeRelationValue (crossSliceReads.ts) ───
 * Торговое отношение = 80% личное + 20% средняя репутация фракции среди
 * знакомых членов. «Знакомство» — met_<id>-флаг ИЛИ строка отношения
 * (конвенция npcDiscoveryTracker). Проверяются на реальном сторе: смесь с
 * одним знакомым членом, пересчёт при появлении второго, учёт личного
 * отношения второго члена, NPC без фракции и канонизация id. */

import { beforeEach, describe, expect, it } from 'vitest';
// Порядок важен: gameStore первым связывает slice-сторы (bindSliceStores)
// и задаёт порядок оценки модулей, как в проде.
import './gameStore';
import { useWorldStore } from './stores/worldStore';
import { usePlayerStore } from './stores/playerStore';
import { readNpcTradeRelationValue } from './crossSliceReads';
import { resolveTradeRelationValue } from '@/data/tradingData';

/** Ставит отношение NPC напрямую (мимо scaleNpcRelationDelta). */
function setRelation(npcId: string, value: number): void {
  useWorldStore.setState((state) => {
    const others = state.npcRelations.filter(
      (r) => r.npcId !== npcId,
    );
    return { npcRelations: [...others, { npcId, value }] };
  });
}

function setMetFlag(npcId: string, met: boolean): void {
  usePlayerStore.setState((state) => ({
    playerState: {
      ...state.playerState,
      flags: { ...state.playerState.flags, [`met_${npcId}`]: met },
    },
  }));
}

describe('readNpcTradeRelationValue (v4.8.8)', () => {
  beforeEach(() => {
    setRelation('albert', 90);
    setMetFlag('albert', true);
    // Бариста, Мария и прочие «Сети» НЕ знакомы (без флага и без строки).
    setMetFlag('cafe_barista', false);
    setMetFlag('maria', false);
    setMetFlag('viktor', false);
    setMetFlag('tamara', false);
    // Убираем строку отношения баристы, если её добавил другой тест.
    useWorldStore.setState((state) => ({
      npcRelations: state.npcRelations.filter((r) => r.npcId !== 'cafe_barista'),
    }));
  });

  it('blends personal with the faction average of met members', () => {
    // Знаком только Альберт («Сеть», 90): avg = 90, личное 90 → смесь = 90.
    expect(readNpcTradeRelationValue('albert')).toBe(90);
  });

  it('recomputes when a second faction member becomes known', () => {
    // Знакомство баристы (флаг + строка отношения 40):
    // avg = round((90 + 40) / 2) = 65 → смесь для Альберта: 90*0.8 + 65*0.2.
    setMetFlag('cafe_barista', true);
    setRelation('cafe_barista', 40);
    expect(readNpcTradeRelationValue('albert')).toBe(
      resolveTradeRelationValue(90, 65),
    );
    expect(readNpcTradeRelationValue('albert')).toBe(85);
    // У баристы своё личное отношение (40) при той же фракции.
    expect(readNpcTradeRelationValue('cafe_barista')).toBe(
      resolveTradeRelationValue(40, 65),
    );
  });

  it('a met member without a relation row counts as neutral 50', () => {
    // Конвенция npcDiscoveryTracker: флаг met без строки отношения даёт
    // нейтральную базу 50 в среднем — avg = round((90 + 50) / 2) = 70.
    setMetFlag('cafe_barista', true);
    expect(readNpcTradeRelationValue('albert')).toBe(
      resolveTradeRelationValue(90, 70),
    );
  });

  it('an unmet faction member does not drag the average down', () => {
    // Мария тоже в «Сети», но не знакома и без строки отношения — в среднее
    // не попадает: avg остаётся 90 (только Альберт).
    expect(readNpcTradeRelationValue('albert')).toBe(90);
  });

  it('falls back to personal relation for an unknown npc', () => {
    // Нет определения → нет фракции → чисто личное отношение (база 50).
    expect(readNpcTradeRelationValue('nonexistent_npc')).toBe(50);
  });

  it('canonical ids resolve the same as raw ids', () => {
    expect(readNpcTradeRelationValue('npc_albert')).toBe(
      readNpcTradeRelationValue('albert'),
    );
  });
});
