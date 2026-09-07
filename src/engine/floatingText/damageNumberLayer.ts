/* ─── Volodka RPG – pooled DOM damage numbers (transform-only WAAPI) ────
 *                                                              (v4.15.3)
 *
 * Закрывает аудит-этап 28 (⚠ «Damage numbers: DOM vs canvas»): до этого
 * КАЖДЫЙ хит в пошаговом бою рендерился сразу тремя параллельными слоями
 * (DamageNumber из CombatUI + CombatDamageNumbers на framer-motion +
 * FloatingTextLayer через floatingTextService) — тройное дублирование
 * чисел и JS-анимации на главном потоке. На босс-файтах (частые криты,
 * статусы, спец-атаки) это выедало бюджет кадра.
 *
 * Архитектура («пул + transform-only» — формула бэклога):
 *   • модуль-одиночка БЕЗ React и framer-motion: собственный контейнер
 *     и пул из 24 заранее созданных <div> — ноль аллокаций DOM в бою;
 *   • анимация element.animate() (Web Animations API) с ключевыми
 *     кадрами ТОЛЬКО по transform/opacity → композитор GPU, без
 *     layout/paint и без re-render React-дерева;
 *   • коалесценция бёрстов: окно COALESCE_WINDOW_MS на пару
 *     (якорь × тип) — быстрый мульти-хит суммируется в одно число с
 *     множителем ×N (АоЕ и комбо-серии боссов больше не сыплют
 *     «простыню» чисел);
 *   • приоритетное вытеснение при исчерпании пула: добивание > крит >
 *     лечение > урон > статус > метка: входящее событие с приоритетом
 *     не выше самого дешёвого активного — отбрасывается;
 *   • якорные полосы вместо рандома по всему экрану: удары по врагу —
 *     верхняя центральная (у панели врага), по игроку — левая нижняя
 *     (у карточки игрока), реал-тайм замахи — центр экрана;
 *   • prefers-reduced-motion → статичная позиция, короткий fade;
 *   • font-size через uiTextScaledPx (аудит-этап 79): числа подчиняются
 *     слайдеру «Масштаб интерфейса», как и весь HUD;
 *   • dispose/revive: resetEngineModuleRuntimeState + HMR (паттерн
 *     floatingTextService).
 *
 * Потребители событий:
 *   • combat:hit (CombatSystem.notifyCombatDamage) — числа урона/лечения;
 *   • combat:melee_strike / combat:melee_miss / combat:creep_finished
 *     (реал-тайм слой meleeStrike.ts) — метки УДАР / В СПИНУ! /
 *     ПОВЕРЖЕН / ПРОМАХ в exploration-фазе.
 */

import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { uiTextScaledPx } from '@/engine/accessibility/uiTextScaleCss';

/* ── Типы ─────────────────────────────────────────────────────────────────── */

export type DamageNumberKind =
  | 'damage'
  | 'critical'
  | 'heal'
  | 'status'
  | 'miss'
  | 'strike'
  | 'backstab'
  | 'killshot';

/** Приоритет вытеснения: чем больше — тем «дороже» событие. */
type EvictionPriority = 0 | 1 | 2 | 3 | 4;

const KIND_PRIORITY: Record<DamageNumberKind, EvictionPriority> = {
  killshot: 4,
  critical: 3,
  heal: 2,
  damage: 2,
  status: 1,
  strike: 1,
  backstab: 2,
  miss: 0,
};

/** Якорная полоса экрана (доли 0..1, пересчитываются в px на каждый спавн). */
export type DamageNumberAnchor = 'enemy' | 'player' | 'center';

const ANCHOR_BOX: Record<DamageNumberAnchor, { x: [number, number]; y: [number, number] }> = {
  // Верхняя центральная полоса — над панелью врага (босс-бар не перекрываем).
  enemy: { x: [0.36, 0.6], y: [0.24, 0.36] },
  // Левая нижняя полоса — у карточки игрока (CombatPlayerCard).
  player: { x: [0.1, 0.3], y: [0.62, 0.76] },
  // Центр — реал-тайм замахи в exploration (рядом с прицелом взгляда).
  center: { x: [0.44, 0.56], y: [0.42, 0.52] },
};

/* ── Визуальные токены (цвет/глоу/кегль по типу) ─────────────────────────── */

interface KindStyle {
  color: string;
  glow: string;
  fontSizePx: number;
  weight: number;
  letterSpacing: string;
}

const KIND_STYLE: Record<DamageNumberKind, KindStyle> = {
  damage: {
    color: '#f87171',
    glow: '0 0 10px rgba(248,113,113,0.55), 0 2px 3px rgba(0,0,0,0.8)',
    fontSizePx: 26,
    weight: 800,
    letterSpacing: '0.02em',
  },
  critical: {
    color: '#fde047',
    glow: '0 0 14px rgba(253,224,71,0.9), 0 0 28px rgba(250,204,21,0.45), 0 2px 3px rgba(0,0,0,0.85)',
    fontSizePx: 38,
    weight: 900,
    letterSpacing: '0.04em',
  },
  heal: {
    color: '#34d399',
    glow: '0 0 10px rgba(52,211,153,0.55), 0 2px 3px rgba(0,0,0,0.8)',
    fontSizePx: 24,
    weight: 800,
    letterSpacing: '0.02em',
  },
  status: {
    color: '#fb923c',
    glow: '0 0 10px rgba(251,146,60,0.55), 0 2px 3px rgba(0,0,0,0.8)',
    fontSizePx: 20,
    weight: 700,
    letterSpacing: '0.08em',
  },
  miss: {
    color: '#94a3b8',
    glow: '0 1px 2px rgba(0,0,0,0.7)',
    fontSizePx: 17,
    weight: 700,
    letterSpacing: '0.14em',
  },
  strike: {
    color: '#e2e8f0',
    glow: '0 0 8px rgba(226,232,240,0.4), 0 2px 3px rgba(0,0,0,0.8)',
    fontSizePx: 19,
    weight: 800,
    letterSpacing: '0.12em',
  },
  backstab: {
    color: '#c084fc',
    glow: '0 0 12px rgba(192,132,252,0.8), 0 0 24px rgba(192,132,252,0.4), 0 2px 3px rgba(0,0,0,0.85)',
    fontSizePx: 24,
    weight: 900,
    letterSpacing: '0.1em',
  },
  killshot: {
    color: '#ef4444',
    glow: '0 0 16px rgba(239,68,68,0.95), 0 0 32px rgba(239,68,68,0.5), 0 2px 4px rgba(0,0,0,0.9)',
    fontSizePx: 30,
    weight: 900,
    letterSpacing: '0.08em',
  },
};

/* ── Константы пула и таймингов ──────────────────────────────────────────── */

/** Фиксированный размер пула DOM-узлов (ноль аллокаций в бою). */
const POOL_SIZE = 24;
/** Длительность анимации одного числа (мс). */
const NUMBER_LIFETIME_MS = 1100;
/** Крит — читается дольше. */
const CRITICAL_LIFETIME_MS = 1500;
/** Окно коалесценции бёрстов (мс) — мульти-хит в одно число с ×N. */
const COALESCE_WINDOW_MS = 130;
/** Подъём числа за жизнь (px, вниз-координаты — отрицательный сдвиг). */
const FLOAT_DRIFT_PX = -58;

/* ── Внутреннее состояние (ленивая инициализация, как floatingTextService) ─ */

interface LiveNumber {
  el: HTMLDivElement;
  anim: Animation | null;
  kind: DamageNumberKind;
  anchor: DamageNumberAnchor;
  priority: EvictionPriority;
  /** Сумма значений для коалесценции (только числовые типы). */
  sum: number;
  count: number;
  /** До какого момента можно доливать сумму (performance.now()). */
  coalesceUntil: number;
}

interface LayerState {
  container: HTMLDivElement | null;
  pool: LiveNumber[];
  unsubs: Array<() => void>;
  reducedMotionQuery: MediaQueryList | null;
  reducedMotionUnsub: (() => void) | null;
  initialized: boolean;
}

const state: LayerState = {
  container: null,
  pool: [],
  unsubs: [],
  reducedMotionQuery: null,
  reducedMotionUnsub: null,
  initialized: false,
};

const rng = Math.random;

function isReducedMotion(): boolean {
  return state.reducedMotionQuery?.matches ?? false;
}

/* ── DOM-гигиена ─────────────────────────────────────────────────────────── */

function ensureContainer(): HTMLDivElement | null {
  if (typeof document === 'undefined') return null;
  if (state.container?.isConnected) return state.container;

  const container = document.createElement('div');
  container.id = 'volodka-damage-layer';
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    'overflow:hidden',
    `z-index:${UI_LAYERS.DAMAGE_FLASH}`,
    'contain:strict',
  ].join(';');
  for (let i = 0; i < POOL_SIZE; i += 1) {
    const el = document.createElement('div');
    // Базовый стиль узла: анимируем ТОЛЬКО transform/opacity (композитор).
    el.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'opacity:0',
      'visibility:hidden',
      'white-space:nowrap',
      'font-family:ui-monospace,"Courier New",monospace',
      'will-change:transform,opacity',
      'transform:translate3d(-200px,-200px,0)',
    ].join(';');
    container.appendChild(el);
    state.pool.push({
      el,
      anim: null,
      kind: 'damage',
      anchor: 'center',
      priority: 0,
      sum: 0,
      count: 0,
      coalesceUntil: 0,
    });
  }
  document.body.appendChild(container);
  state.container = container;
  return container;
}

function releaseNumber(live: LiveNumber): void {
  live.anim?.cancel();
  live.anim = null;
  live.el.style.visibility = 'hidden';
  live.el.style.opacity = '0';
  live.sum = 0;
  live.count = 0;
  live.coalesceUntil = 0;
}

/* ── Спавн ───────────────────────────────────────────────────────────────── */

export interface DamageNumberSpec {
  kind: DamageNumberKind;
  anchor: DamageNumberAnchor;
  /** Числовое значение (урон/лечение); для меток — 0. */
  value?: number;
  /** Готовый текст (метки: ПРОМАХ / УДАР / ПОВЕРЖЕН…). */
  text?: string;
}

function formatNumber(live: LiveNumber): string {
  if (live.count > 1) {
    return `${live.sum}×${live.count}`;
  }
  return String(live.sum);
}

function applyTextStyle(live: LiveNumber, kind: DamageNumberKind): void {
  const s = KIND_STYLE[kind];
  const style = live.el.style;
  style.color = s.color;
  style.textShadow = s.glow;
  style.fontSize = uiTextScaledPx(s.fontSizePx);
  style.fontWeight = String(s.weight);
  style.letterSpacing = s.letterSpacing;
}

function startAnimation(
  live: LiveNumber,
  startX: number,
  startY: number,
  reduced: boolean,
): void {
  live.anim?.cancel();

  const lifetime =
    live.kind === 'critical' || live.kind === 'killshot'
      ? CRITICAL_LIFETIME_MS
      : NUMBER_LIFETIME_MS;

  const driftY = reduced ? 0 : FLOAT_DRIFT_PX - rng() * 26;
  const driftX = reduced ? 0 : (rng() - 0.5) * 26;
  const endX = Math.max(8, Math.min(window.innerWidth - 8, startX + driftX));
  const endY = Math.max(8, startY + driftY);

  if (typeof live.el.animate !== 'function') {
    // Древний WebView без WAAPI: деградация до мгновенного показа-скрытия.
    live.el.style.visibility = 'visible';
    live.el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
    live.el.style.opacity = '1';
    window.setTimeout(() => releaseNumber(live), lifetime);
    return;
  }

  const anim = live.el.animate(
    [
      {
        transform: `translate3d(${startX}px, ${startY}px, 0) scale(0.55)`,
        opacity: 0,
      },
      {
        transform: `translate3d(${startX}px, ${startY - 10}px, 0) scale(1.14)`,
        opacity: 1,
        offset: 0.16,
      },
      {
        transform: `translate3d(${startX}px, ${startY - 26}px, 0) scale(1)`,
        opacity: 1,
        offset: 0.42,
      },
      {
        transform: `translate3d(${endX}px, ${endY}px, 0) scale(0.92)`,
        opacity: 0,
      },
    ],
    {
      duration: reduced ? 650 : lifetime,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  );
  anim.onfinish = () => releaseNumber(live);
  live.anim = anim;
  live.el.style.visibility = 'visible';
}

/** Коалесценция: мульти-хит в окне доливается в уже летящее число.
 *  Траектория не перезапускается (перезапуск в середине читается рывком) —
 *  обновляется только текст и продлевается окно долива. */
function tryCoalesce(spec: DamageNumberSpec, now: number, numeric: boolean): boolean {
  if (!numeric) return false;
  for (const live of state.pool) {
    if (live.anim && live.kind === spec.kind && live.anchor === spec.anchor && now < live.coalesceUntil) {
      live.sum += spec.value ?? 0;
      live.count += 1;
      live.coalesceUntil = now + COALESCE_WINDOW_MS;
      live.el.textContent = formatNumber(live);
      return true;
    }
  }
  return false;
}

function acquireSlot(priority: EvictionPriority): LiveNumber | null {
  // 1) Свободный узел.
  for (const live of state.pool) {
    if (!live.anim) return live;
  }
  // 2) Вытеснение самого дешёвого активного.
  let cheapest: LiveNumber | null = null;
  for (const live of state.pool) {
    if (!cheapest || live.priority < cheapest.priority) cheapest = live;
  }
  if (!cheapest) return null;
  if (priority <= cheapest.priority) {
    // Входящее событие дешевле всего активного — отбрасываем (босс-спам).
    return null;
  }
  releaseNumber(cheapest);
  return cheapest;
}

function resolveAnchorPosition(anchor: DamageNumberAnchor): { x: number; y: number } {
  const box = ANCHOR_BOX[anchor];
  const x = (box.x[0] + (box.x[1] - box.x[0]) * rng()) * window.innerWidth;
  const y = (box.y[0] + (box.y[1] - box.y[0]) * rng()) * window.innerHeight;
  // Центрирование по горизонтали: якорные полосы задают ЦЕНТР числа.
  return { x, y };
}

export function spawnDamageNumber(spec: DamageNumberSpec): void {
  if (typeof window === 'undefined') return;
  if (!state.initialized) init();

  const container = ensureContainer();
  if (!container) return;

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const numeric = (spec.value ?? 0) > 0 && !spec.text;
  if (numeric && tryCoalesce(spec, now, numeric)) return;

  const priority = KIND_PRIORITY[spec.kind];
  const live = acquireSlot(priority);
  if (!live) return;

  live.kind = spec.kind;
  live.anchor = spec.anchor;
  live.priority = priority;
  live.sum = spec.value ?? 0;
  live.count = 1;
  live.coalesceUntil = now + COALESCE_WINDOW_MS;

  applyTextStyle(live, spec.kind);
  live.el.textContent = spec.text ?? (live.sum > 0 ? formatNumber(live) : spec.text ?? '');

  const { x, y } = resolveAnchorPosition(spec.anchor);
  startAnimation(live, x, y, isReducedMotion());
}

/* ── Подписки на события боя ─────────────────────────────────────────────── */

function bindCombatListeners(): void {
  // Пошаговый слой: CombatSystem.notifyCombatDamage → combat:hit.
  state.unsubs.push(
    eventBus.on('combat:hit', (payload) => {
      if (payload.isCritical) {
        spawnDamageNumber({
          kind: 'critical',
          anchor: payload.isPlayerHit ? 'player' : 'enemy',
          value: payload.damage,
        });
        return;
      }
      if (payload.isPlayerHit) {
        // Статусные тики (ЯД/ГОРЕНИЕ…) читаются как статус, не как урон.
        const kind: DamageNumberKind = payload.source === 'status_effect' ? 'status' : 'damage';
        spawnDamageNumber({ kind, anchor: 'player', value: payload.damage });
        return;
      }
      if (payload.source === 'player_power') {
        // Сила стиха, наносящая «урон» игроку = самолечение/щит (маппинг
        // useCombatUiController v4.12: player_power + damage>0 → heal).
        spawnDamageNumber({ kind: 'heal', anchor: 'player', value: payload.damage });
        return;
      }
      spawnDamageNumber({ kind: 'damage', anchor: 'enemy', value: payload.damage });
    }, EventBusPriority.FX),
  );

  // Реал-тайм слой: опережающий удар (meleeStrike.ts).
  state.unsubs.push(
    eventBus.on('combat:melee_strike', (payload) => {
      if (payload.finished) {
        // Добивание: награды уже в combat:creep_finished (ниже) — метка тут.
        spawnDamageNumber({ kind: 'killshot', anchor: 'center', text: 'ПОВЕРЖЕН' });
        return;
      }
      if (payload.backstab) {
        spawnDamageNumber({ kind: 'backstab', anchor: 'center', text: 'В СПИНУ!' });
        return;
      }
      spawnDamageNumber({ kind: 'strike', anchor: 'center', text: 'УДАР' });
    }, EventBusPriority.FX),
  );

  // Реал-тайм слой: честный промах (meleeMiss.ts, v4.12.0).
  state.unsubs.push(
    eventBus.on('combat:melee_miss', () => {
      spawnDamageNumber({ kind: 'miss', anchor: 'center', text: 'ПРОМАХ' });
    }, EventBusPriority.FX),
  );

  // Реал-тайм слой: добивание крипа ДО пошаговой фазы (v4.8.8) — XP-подпись.
  state.unsubs.push(
    eventBus.on('combat:creep_finished', (payload) => {
      if (payload.xpGained > 0) {
        spawnDamageNumber({
          kind: 'heal',
          anchor: 'center',
          text: `+${payload.xpGained} ОП`,
        });
      }
    }, EventBusPriority.FX),
  );
}

/* ── Жизненный цикл: init / dispose / reset ──────────────────────────────── */

function init(): void {
  state.initialized = true;
  if (typeof window === 'undefined') return;

  if (typeof matchMedia === 'function') {
    state.reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    state.reducedMotionUnsub = () => {
      state.reducedMotionQuery?.removeEventListener?.('change', onReducedMotionChange);
    };
    state.reducedMotionQuery.addEventListener?.('change', onReducedMotionChange);
  }

  bindCombatListeners();
}

function onReducedMotionChange(): void {
  // Меняется только последующие спавны; летящие числа доигрывают свою
  // траекторию (осознанно — перезапуск на середине читается рывком).
}

/** Полный teardown: снять подписки, погасить анимации, убрать контейнер. */
export function disposeDamageNumberLayer(): void {
  for (const live of state.pool) {
    live.anim?.cancel();
    live.anim = null;
  }
  state.pool = [];
  state.unsubs.forEach((unsub) => unsub());
  state.unsubs = [];
  state.reducedMotionUnsub?.();
  state.reducedMotionUnsub = null;
  state.reducedMotionQuery = null;
  if (state.container?.isConnected) {
    state.container.remove();
  }
  state.container = null;
  state.initialized = false;
}

/**
 * Мягкий сброс сессии (engineRuntimeReset): числа гасятся, подписки
 * живут дальше — eventBus пересоздаётся ПОСЛЕ сброса, а init ленивый,
 * поэтому достаточно погасить пул и позволить повторную инициализацию.
 */
export function resetDamageNumberLayer(): void {
  for (const live of state.pool) {
    releaseNumber(live);
  }
}

registerHmrDispose(disposeDamageNumberLayer);
