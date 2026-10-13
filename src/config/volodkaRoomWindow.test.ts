import { describe, expect, it } from 'vitest';
import {
  VOLKODA_ROOM_BACK_WALL_FALLBACK_INTERIOR_Z,
  VOLKODA_ROOM_BACK_WALL_INTERIOR_Z,
  VOLKODA_ROOM_WINDOW_CITY_BACKDROP,
  VOLKODA_ROOM_WINDOW_FORBIDDEN,
  VOLKODA_ROOM_WINDOW_FRAME,
  VOLKODA_ROOM_WINDOW_PANE,
  VOLKODA_ROOM_WINDOW_SHELL_OPENING,
} from '@/config/volodkaRoomWindow';

/**
 * FIX v4.48.15 — контракт окна комнаты Володьки.
 *
 * Репорт игрока: «яркие квадраты на стенах, окно не пойми какое, камера
 * работает странно». Причины, зафиксированные этим контрактом:
 *  - панель окна y=1.15 vs проём шелла y=0.9..2.1 (светилась по стене);
 *  - «city view» — плоскость 5×3 м на x=2.10 ВНУТРИ комнаты;
 *  - рама rollershutter scale 0.42 (0.88×0.78) меньше панели 1.2×1.0;
 *  - штора/картины/второе окно на z=-3.35..-3.48 — ПОГРЕБЕНЫ в стене шелла
 *    (интерьерная грань после z-фита 0.952 = -3.218).
 */

/** Нативные габариты Poly Haven rollershutter_window_01 (замер GLB accessors). */
const ROLLERSHUTTER_NATIVE = { w: 2.1, h: 1.85, d: 0.3 };

describe('volodkaRoomWindow contract — FIX v4.48.15', () => {
  it('панель окна накрывает реальный проём шелла по Z и Y', () => {
    const openingZSpan = VOLKODA_ROOM_WINDOW_SHELL_OPENING.zMax - VOLKODA_ROOM_WINDOW_SHELL_OPENING.zMin;
    expect(VOLKODA_ROOM_WINDOW_PANE.widthZ).toBeGreaterThanOrEqual(openingZSpan - 0.01);
    expect(VOLKODA_ROOM_WINDOW_PANE.heightY).toBeCloseTo(
      VOLKODA_ROOM_WINDOW_SHELL_OPENING.yMax - VOLKODA_ROOM_WINDOW_SHELL_OPENING.yMin,
      5,
    );
  });

  it('центр панели/рамы совпадает с центром проёма (y=1.5, z=-1.904)', () => {
    expect(VOLKODA_ROOM_WINDOW_SHELL_OPENING.yCenter).toBeCloseTo(1.5, 5);
    // z-фит шелла: 7 / 7.35 = 0.952381; -2.0 × 0.952381 = -1.904762
    expect(VOLKODA_ROOM_WINDOW_SHELL_OPENING.zCenter).toBeCloseTo(-2.0 * (7 / 7.35), 3);
  });

  it('панель X внутри канала проёма стены [2.38, 2.50]', () => {
    expect(VOLKODA_ROOM_WINDOW_PANE.x).toBeGreaterThan(VOLKODA_ROOM_WINDOW_SHELL_OPENING.wallXInner);
    expect(VOLKODA_ROOM_WINDOW_PANE.x).toBeLessThan(VOLKODA_ROOM_WINDOW_SHELL_OPENING.wallXOuter);
  });

  it('рама GLB после скейла накрывает панель со всех сторон', () => {
    const frameW = ROLLERSHUTTER_NATIVE.w * VOLKODA_ROOM_WINDOW_FRAME.scale;
    const frameH = ROLLERSHUTTER_NATIVE.h * VOLKODA_ROOM_WINDOW_FRAME.scale;
    expect(frameW).toBeGreaterThanOrEqual(VOLKODA_ROOM_WINDOW_PANE.widthZ);
    expect(frameH).toBeGreaterThanOrEqual(VOLKODA_ROOM_WINDOW_PANE.heightY);
    // Рама стоит в плоскости стены (X в канале проёма), а не на y=1.15/z=-2.0.
    expect(VOLKODA_ROOM_WINDOW_FRAME.position[1]).toBeCloseTo(VOLKODA_ROOM_WINDOW_SHELL_OPENING.yCenter, 5);
    expect(VOLKODA_ROOM_WINDOW_FRAME.position[2]).toBeCloseTo(VOLKODA_ROOM_WINDOW_SHELL_OPENING.zCenter, 3);
    // Рама утоплена в канал стены, но не выпадает наружу за экстерьер.
    expect(VOLKODA_ROOM_WINDOW_FRAME.position[0]).toBeGreaterThan(VOLKODA_ROOM_WINDOW_SHELL_OPENING.wallXInner);
  });

  it('city-бэкдроп стоит СНАРУЖИ стены (x > 2.5) — виден только сквозь проём', () => {
    expect(VOLKODA_ROOM_WINDOW_CITY_BACKDROP.x).toBeGreaterThan(VOLKODA_ROOM_WINDOW_SHELL_OPENING.wallXOuter);
    // Бэкдроп больше проёма — покрывает весь вид сквозь него с запасом.
    expect(VOLKODA_ROOM_WINDOW_CITY_BACKDROP.widthZ).toBeGreaterThan(
      VOLKODA_ROOM_WINDOW_SHELL_OPENING.zMax - VOLKODA_ROOM_WINDOW_SHELL_OPENING.zMin,
    );
    expect(VOLKODA_ROOM_WINDOW_CITY_BACKDROP.heightY).toBeGreaterThan(
      VOLKODA_ROOM_WINDOW_SHELL_OPENING.yMax - VOLKODA_ROOM_WINDOW_SHELL_OPENING.yMin,
    );
  });

  it('заднестенная декорация (штора/картины) висит ПЕРЕД реальной гранью стены', () => {
    // backDressingZ в компоненте = грань + 0.02 — перед стеной, не внутри.
    const dressingZ = VOLKODA_ROOM_BACK_WALL_INTERIOR_Z + 0.02;
    expect(dressingZ).toBeGreaterThan(VOLKODA_ROOM_BACK_WALL_INTERIOR_Z);
    // Грань шелла ближе к центру комнаты, чем старая процедурная -3.49.
    expect(VOLKODA_ROOM_BACK_WALL_INTERIOR_Z).toBeGreaterThan(-3.35);
    // Fallback (Low) остаётся у процедурной стены.
    expect(VOLKODA_ROOM_BACK_WALL_FALLBACK_INTERIOR_Z).toBeCloseTo(-3.49, 5);
  });

  it('старые сломанные значения запрещены (регресс-сторожа)', () => {
    expect(VOLKODA_ROOM_WINDOW_FORBIDDEN.paneCenterY).toBe(1.15);
    expect(VOLKODA_ROOM_WINDOW_FORBIDDEN.frameScale).toBe(0.42);
    expect(VOLKODA_ROOM_WINDOW_FORBIDDEN.cityPlaneX).toBe(2.1);
    // Ни один действующий параметр не равен запрещённым.
    expect(VOLKODA_ROOM_WINDOW_SHELL_OPENING.yCenter).not.toBe(VOLKODA_ROOM_WINDOW_FORBIDDEN.paneCenterY);
    expect(VOLKODA_ROOM_WINDOW_FRAME.scale).not.toBe(VOLKODA_ROOM_WINDOW_FORBIDDEN.frameScale);
    expect(VOLKODA_ROOM_WINDOW_CITY_BACKDROP.x).not.toBe(VOLKODA_ROOM_WINDOW_FORBIDDEN.cityPlaneX);
    for (const buriedZ of VOLKODA_ROOM_WINDOW_FORBIDDEN.backWallBuriedZ) {
      expect(dressingZNotEqual(buriedZ)).toBe(true);
    }
  });
});

function dressingZNotEqual(buriedZ: number): boolean {
  const dressingZ = VOLKODA_ROOM_BACK_WALL_INTERIOR_Z + 0.02;
  return Math.abs(dressingZ - buriedZ) > 0.01;
}
