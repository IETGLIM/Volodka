/* ─── Volodka RPG – HUD-индикатор активной hazard-зоны ───
 *
 * Пока игрок стоит в опасной зоне (электропанель, токсичная лужа, край
 * крыши, глубокая вода, костёр, белый шум) — компактный индикатор низа
 * экрана: иконка типа опасности + название зоны + тикающий таймер урона
 * (полоска заполняется к следующему тику стресса).
 *
 * Данные приходят напрямую из hazardStatusChannel ( EnvironmentalHazard-
 * System публикует вход/выход/тик ). Паттерн обновлений — как у StaminaBar:
 * подписка только на вход/выход (React-ре-рендер), а тикающий таймер
 * опрашивает канал каждые 100 мс и пишет в DOM через refs — ни одного
 * ре-рендера на кадр.
 *
 * Стилизация (v4.20): у каждого типа опасности своя иконка (Flame/Zap/
 * Biohazard/TriangleAlert/Waves/AudioLines) и акцентный цвет из единой
 * палитры HAZARD_KIND_COLOR — цвет дублирует 3D-маркер зоны в мире.
 * Иконка пульсирует (кроме reduced-motion), полоска тика светится
 * акцентом, рамка — тонкий градиент в цвет опасности.
 *
 * Индикатор исчезает вне exploration-фазы и уважает prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AudioLines,
  Biohazard,
  Flame,
  TriangleAlert,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGamePhase } from '@/store/selectors/uiSelectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { HAZARD_KIND_COLOR, type HazardKind } from '@/data/environmentalHazards';
import {
  getHazardStatus,
  subscribeToHazardStatus,
  type HazardStatusSnapshot,
} from '@/engine/hazard/hazardStatusChannel';

/** Опрос тикающего таймера (DOM-обновления без ре-рендеров). */
const POLL_MS = 100;

/** Иконка типа опасности — единый источник палитры и образов. */
const HAZARD_KIND_ICON: Readonly<Record<HazardKind, LucideIcon>> = {
  fire: Flame,
  electric: Zap,
  toxic: Biohazard,
  fall: TriangleAlert,
  drown: Waves,
  static: AudioLines,
};

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function HazardStatusIndicator() {
  const [status, setStatus] = useState<HazardStatusSnapshot | null>(() => getHazardStatus());
  const gamePhase = useGamePhase();
  const reducedMotion = useEffectiveReducedMotion();
  const fillRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);

  // Подписка на вход/выход из зоны: ре-рендер только при смене зоны.
  // Тики урона канал не рассылает — их читает опрос ниже.
  useEffect(() => subscribeToHazardStatus(() => setStatus(getHazardStatus())), []);

  // Тикающий таймер: полоска заполняется к моменту следующего тика стресса.
  useEffect(() => {
    if (!status) return;
    const apply = () => {
      const snap = getHazardStatus();
      if (!snap) return;
      const elapsedMs = nowMs() - snap.lastTickAt;
      const progress = Math.min(1, Math.max(0, elapsedMs / (snap.tickInterval * 1000)));
      if (fillRef.current) {
        fillRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
      }
      if (timerRef.current) {
        const remainSec = Math.max(0, snap.tickInterval - elapsedMs / 1000);
        timerRef.current.textContent = `−${snap.stressPerTick} стресс · ${remainSec.toFixed(1)} с`;
      }
    };
    apply();
    const timer = setInterval(apply, POLL_MS);
    return () => clearInterval(timer);
  }, [status]);

  const visible = status !== null && gamePhase === 'exploration';
  const accent = status ? HAZARD_KIND_COLOR[status.kind] : '#ff5a5a';
  const KindIcon = status ? HAZARD_KIND_ICON[status.kind] : TriangleAlert;

  return (
    // Живой регион живёт на постоянном элементе (AnimatePresence внутри),
    // чтобы скринридер анонсировал вход в зону один раз, а не каждый тик.
    <div role="status" aria-live="polite" className="absolute inset-0 pointer-events-none">
      <span className="sr-only">
        {visible && status
          ? `Опасная зона: ${status.label}. −${status.stressPerTick} стресс каждые ${status.tickInterval.toFixed(1)} секунды`
          : ''}
      </span>
      <AnimatePresence>
        {visible && status && (
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10, scale: reducedMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 6, scale: reducedMotion ? 1 : 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ bottom: 'clamp(184px, 24vh, 248px)', zIndex: UI_LAYERS.HUD + 1 }}
          >
            <div
              aria-hidden="true"
              className="hud-filmic-caption px-3.5 py-2 rounded-md flex items-center gap-3
                         backdrop-blur-md"
              style={{
                background: 'rgba(8, 12, 18, 0.72)',
                // Акцентная рамка в цвет опасности + мягкая внешняя тень.
                boxShadow: `inset 0 0 0 1px ${accent}55, inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 14px rgba(0, 0, 0, 0.5)`,
              }}
            >
              {/* Иконка типа — в акцентном «стеке», пульсирует в такт опасности. */}
              <span
                className="relative flex items-center justify-center size-7 rounded-sm shrink-0"
                style={{ background: `${accent}1a`, boxShadow: `inset 0 0 0 1px ${accent}40` }}
              >
                <motion.span
                  className="absolute inset-0 rounded-sm"
                  style={{ boxShadow: `inset 0 0 0 1px ${accent}30` }}
                  animate={reducedMotion ? undefined : { opacity: [0.9, 0.2, 0.9], scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <KindIcon className="size-4 shrink-0 relative" style={{ color: accent }} strokeWidth={2.2} />
              </span>

              <span className="flex flex-col gap-0.5">
                <span
                  className="hud-filmic-body text-[12px] font-semibold tracking-wider uppercase leading-none"
                  style={{ color: accent }}
                >
                  {status.label}
                </span>
                <span
                  ref={timerRef}
                  className="hud-filmic-body text-[11px] tabular-nums text-stone-400 whitespace-nowrap leading-none"
                >
                  {`−${status.stressPerTick} стресс · ${status.tickInterval.toFixed(1)} с`}
                </span>
              </span>
            </div>
            {/* Полоска до следующего тика урона — заполняется за интервал зоны. */}
            <div
              aria-hidden="true"
              style={{
                width: '100%',
                height: 3,
                borderRadius: 2,
                background: 'rgba(8, 12, 18, 0.6)',
                boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.12)',
                overflow: 'hidden',
                marginTop: 5,
              }}
            >
              <div
                ref={fillRef}
                style={{
                  width: '0%',
                  height: '100%',
                  background: `linear-gradient(90deg, ${accent}cc, ${accent})`,
                  borderRadius: 2,
                  transition: 'width 100ms linear',
                  boxShadow: `0 0 8px ${accent}66`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
