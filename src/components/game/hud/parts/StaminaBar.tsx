/* ─── Volodka RPG – Stamina Bar ───
 * Тонкая полоска выносливости над нижним HUD-стеком (тулбар / быстрые слоты /
 * панель стихов). Видна ТОЛЬКО когда стамина не полная — плавно появляется и
 * исчезает. Зелёно-жёлтая деградация цвета по мере истощения.
 *
 * Обновления — напрямую в DOM через refs (паттерн FootstepPedometer):
 * опрос состояния каждые 100 мс, ни одного React-ре-рендера на кадр.
 */

import { useEffect, useRef } from 'react';
import { getPlayerStamina } from '@/engine/player/playerStamina';
import { bottomStaminaBarPx } from '@/shared/constants/hudLayout';

const POLL_MS = 100;
/** Ниже этого отношения стамина считается «полной» (плавный fade-out у 100%). */
const FULL_RATIO_EPSILON = 0.999;

/** Зелёный → жёлтый → янтарный по мере истощения. */
function resolveBarColor(ratio: number): string {
  if (ratio >= 0.55) return 'rgba(74, 222, 128, 0.88)';
  if (ratio >= 0.25) return 'rgba(250, 204, 21, 0.9)';
  return 'rgba(251, 146, 60, 0.95)';
}

export function StaminaBar() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const apply = () => {
      const root = rootRef.current;
      if (!root) return;
      const { ratio, exhausted } = getPlayerStamina();
      const clamped = Math.max(0, Math.min(1, ratio));
      const visible = clamped < FULL_RATIO_EPSILON;

      // Плавный fade in/out — полоска исчезает на полной стамине.
      root.style.opacity = visible ? '1' : '0';

      const fill = fillRef.current;
      if (fill) {
        fill.style.width = `${(clamped * 100).toFixed(1)}%`;
        fill.style.backgroundColor = resolveBarColor(clamped);
      }

      const pct = Math.round(clamped * 100);
      root.setAttribute('aria-valuenow', String(pct));
      const label = labelRef.current;
      if (label) {
        label.textContent = exhausted
          ? `Выносливость: ${pct}% — дыхание сбито, бег временно недоступен`
          : `Выносливость: ${pct}%`;
      }
    };

    apply();
    const timer = setInterval(apply, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      ref={rootRef}
      className="stamina-bar-root absolute left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-500 ease-out"
      style={{ bottom: bottomStaminaBarPx(), opacity: 0 }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={100}
      aria-orientation="horizontal"
      aria-label="Выносливость"
    >
      {/* Русская a11y-подпись для скринридеров (только sr-only). */}
      <span ref={labelRef} className="sr-only" aria-live="polite">
        Выносливость: 100%
      </span>
      <div
        aria-hidden="true"
        style={{
          width: 'clamp(160px, 26vw, 300px)',
          height: 3,
          borderRadius: 2,
          background: 'rgba(8, 12, 18, 0.55)',
          boxShadow:
            'inset 0 0 0 1px rgba(148, 163, 184, 0.18), 0 1px 6px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          ref={fillRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(74, 222, 128, 0.88)',
            borderRadius: 2,
            transition: 'width 120ms linear, background-color 300ms linear',
          }}
        />
      </div>
    </div>
  );
}
