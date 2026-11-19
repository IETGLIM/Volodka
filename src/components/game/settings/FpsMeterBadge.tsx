/* ─── Volodka RPG — FPS-счётчик для панели настроек (v4.59.0) ───
 *
 * Живой замер кадров через requestAnimationFrame: скользящее среднее
 * за ~0.5 с (8+ кадров), обновление цифры дважды в секунду — без
 * дёрганья. Паттерн подписки — как у StaminaBar: монтируется только
 * когда вкладка «Графика» открыта, при уходе rAF-цикл снимается.
 *
 * Назначение: игрок видит цену каждого пресета качества прямо в
 * настройках (арт-план E2 — FPS-бюджет виден без консоли разработчика).
 */

'use client';

import { useEffect, useRef, useState } from 'react';

const UPDATE_INTERVAL_MS = 500;
const MIN_SAMPLES = 8;

export function FpsMeterBadge() {
  const [fps, setFps] = useState<number | null>(null);
  const framesRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      if (lastRef.current !== null) {
        framesRef.current += 1;
        if (now - lastEmitRef.current >= UPDATE_INTERVAL_MS
          && framesRef.current >= MIN_SAMPLES) {
          const seconds = (now - lastEmitRef.current) / 1000;
          // Скользящее среднее за окно между эмитами — устойчиво к
          // одиночным выбросам ( GC-пауза не роняет цифру ).
          setFps(Math.round(framesRef.current / seconds));
          framesRef.current = 0;
          lastEmitRef.current = now;
        }
      } else {
        lastEmitRef.current = now;
      }
      lastRef.current = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const color = fps === null
    ? 'text-stone-400/60'
    : fps >= 50
      ? 'text-emerald-300/85'
      : fps >= 30
        ? 'text-amber-300/90'
        : 'text-red-400/90';

  return (
    <div
      className="flex items-center justify-center gap-2 font-serif text-[12px] tracking-wider"
      aria-live="off"
    >
      <span className="text-stone-400/70">Кадры/с:</span>
      <span className={`tabular-nums ${color}`}>
        {fps === null ? '…' : fps}
      </span>
    </div>
  );
}
