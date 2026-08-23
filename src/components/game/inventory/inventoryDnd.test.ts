// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  DRAG_MOUSE_THRESHOLD_PX,
  DRAG_TOUCH_DELAY_MS,
  DRAG_TOUCH_SLOP_PX,
  getDndMirrorSnapshot,
  isHotbarDropCompatible,
  isSlotDropCompatible,
  resolveDropTargetFromElement,
  setDndMirror,
  shouldStartMouseDrag,
  shouldStartTouchDrag,
  subscribeDndMirror,
} from './inventoryDndLogic';

/* Минимальный DOM-мок: элемент с data-атрибутами и цепочкой родителей. */
function el(attrs: Record<string, string | null> = {}, parent?: Element | null): Element {
  const node = document.createElement('div');
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}

describe('resolveDropTargetFromElement', () => {
  it('находит data-dnd-slot на самом элементе', () => {
    const node = el({ 'data-dnd-slot': 'weapon' });
    expect(resolveDropTargetFromElement(node)).toEqual({ kind: 'slot', slot: 'weapon' });
  });

  it('поднимается по родителям до слота (карточка внутри слота)', () => {
    const slot = el({ 'data-dnd-slot': 'head' });
    const inner = el({}, slot);
    const deepest = el({}, inner);
    expect(resolveDropTargetFromElement(deepest)).toEqual({ kind: 'slot', slot: 'head' });
  });

  it('находит зону инвентаря data-dnd-inventory', () => {
    const zone = el({ 'data-dnd-inventory': 'true' });
    const card = el({}, zone);
    expect(resolveDropTargetFromElement(card)).toEqual({ kind: 'inventory' });
  });

  it('слот ближе к элементу выигрывает у зоны (порядок обхода)', () => {
    // Слот, вложенный в зону инвентаря: слот найдётся первым при подъёме.
    const zone = el({ 'data-dnd-inventory': 'true' });
    const slot = el({ 'data-dnd-slot': 'body' }, zone);
    const inner = el({}, slot);
    expect(resolveDropTargetFromElement(inner)).toEqual({ kind: 'slot', slot: 'body' });
  });

  it('вне зон — null (дроп отменяется)', () => {
    expect(resolveDropTargetFromElement(el())).toBeNull();
    expect(resolveDropTargetFromElement(null)).toBeNull();
  });

  it('глубина ограничена maxDepth — застревание в глубоком DOM не бесконечно', () => {
    const zone = el({ 'data-dnd-inventory': 'true' });
    let node: Element = zone;
    for (let i = 0; i < 12; i++) node = el({}, node);
    expect(resolveDropTargetFromElement(node, 8)).toBeNull();
  });
});

describe('isSlotDropCompatible', () => {
  it('предмет надевается только в свой слот', () => {
    expect(isSlotDropCompatible('weapon', 'weapon')).toBe(true);
    expect(isSlotDropCompatible('head', 'head')).toBe(true);
    expect(isSlotDropCompatible('weapon', 'head')).toBe(false);
    expect(isSlotDropCompatible('accessory', 'weapon')).toBe(false);
  });

  it('предмет без слота никуда не надевается', () => {
    expect(isSlotDropCompatible(undefined, 'weapon')).toBe(false);
  });
});

describe('пороги старта драга', () => {
  it(`мышь: старт после ${DRAG_MOUSE_THRESHOLD_PX}px`, () => {
    expect(shouldStartMouseDrag(0)).toBe(false);
    expect(shouldStartMouseDrag(DRAG_MOUSE_THRESHOLD_PX - 1)).toBe(false);
    expect(shouldStartMouseDrag(DRAG_MOUSE_THRESHOLD_PX)).toBe(true);
  });

  it(`тач: лонг-пресс ${DRAG_TOUCH_DELAY_MS}мс без большого сдвига`, () => {
    // Мало держали — не тянем (пусть скроллит).
    expect(shouldStartTouchDrag(DRAG_TOUCH_DELAY_MS - 50, 2)).toBe(false);
    // Держали достаточно, палец на месте — тянем.
    expect(shouldStartTouchDrag(DRAG_TOUCH_DELAY_MS, 3)).toBe(true);
    // Держали долго, но утащили палец — это скролл, не драг.
    expect(shouldStartTouchDrag(DRAG_TOUCH_DELAY_MS + 200, DRAG_TOUCH_SLOP_PX + 1)).toBe(false);
  });

});

describe('хотбар как цель дропа (v4.7.5)', () => {
  it('находит data-dnd-hotbar с индексом', () => {
    const slot = el({ 'data-dnd-hotbar': '2' });
    const inner = el({}, slot);
    expect(resolveDropTargetFromElement(inner)).toEqual({ kind: 'hotbar', slot: 2 });
  });

  it('невалидный индекс хотбара игнорируется', () => {
    expect(resolveDropTargetFromElement(el({ 'data-dnd-hotbar': 'x' }))).toBeNull();
    expect(resolveDropTargetFromElement(el({ 'data-dnd-hotbar': '-1' }))).toBeNull();
  });

  it('в хотбар можно только расходуемые', () => {
    expect(isHotbarDropCompatible('consumable')).toBe(true);
    expect(isHotbarDropCompatible('equipment')).toBe(false);
    expect(isHotbarDropCompatible(undefined)).toBe(false);
  });
});

describe('DnD-зеркало (cross-tree подсветка хотбара)', () => {
  it('публикует состояние и уведомляет подписчиков', () => {
    const events: string[] = [];
    const unsub = subscribeDndMirror(() => events.push('notify'));
    try {
      setDndMirror({ payload: null, target: { kind: 'hotbar', slot: 1 } });
      expect(getDndMirrorSnapshot().target).toEqual({ kind: 'hotbar', slot: 1 });
      expect(events).toEqual(['notify']);

      setDndMirror({ payload: null, target: null });
      expect(getDndMirrorSnapshot().target).toBeNull();
      expect(events).toEqual(['notify', 'notify']);
    } finally {
      unsub();
    }
  });

  it('после отписки уведомления не приходят', () => {
    const events: string[] = [];
    const unsub = subscribeDndMirror(() => events.push('n'));
    unsub();
    setDndMirror({ payload: null, target: { kind: 'inventory' } });
    expect(events).toEqual([]);
    setDndMirror({ payload: null, target: null });
  });
});
