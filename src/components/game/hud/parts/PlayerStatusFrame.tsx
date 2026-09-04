'use client';

/* ─── Volodka RPG – Player Status Frame (WoW-style) ───
   Левый верхний угол: портрет игрока с уровнем + три анимированных бара:
     • Энергия  — зелёный (аналог HP в этом сюжете)
     • Стресс   — розово-красный (риск срыва)
     • Карма    — синяя (моральный градиент, диапазон −100…+100 → 0…100%)
   Числовые значения справа от баров. Плавная анимация ширины (300мс),
   flash-эффект при изменении кармы. Скрыт на мобильных (тач-HUD компактнее),
   скрыт в бою/кат-сценах через quiet-style родительского топ-бара.

   FIX (orphan): KarmaHudMeter был написан, но нигде не смонтирован — его
   логика флешей/тира встроена сюда; сам KarmaHudMeter остаётся для переиспользования. */

import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerKarma, usePlayerEnergy, usePlayerStress, usePlayerLevel } from '@/store/selectors/playerSelectors';
import { getKarmaTierLabel } from '@/shared/utils/karmaTier';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const KARMA_MIN = -100;
const KARMA_MAX = 100;

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  /** CSS gradient of the filled part of the bar */
  fill: string;
  glow: string;
  /** Force red flash (karma drop / low resource) */
  flash?: boolean;
  ariaValue: string;
  reducedMotion: boolean;
}

const BarRow = memo(function BarRow({
  label, value, max, fill, glow, flash = false, ariaValue, reducedMotion,
}: BarRowProps) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div
      className="flex items-center gap-1.5"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={ariaValue}
    >
      <span className="w-[38px] shrink-0 text-right font-mono text-[9px] uppercase tracking-wider text-slate-400/80">
        {label}
      </span>
      <div className="relative h-[7px] w-[104px] overflow-hidden rounded-full border border-white/10 bg-slate-950/70">
        <motion.div
          className="h-full rounded-full"
          style={{ background: fill, boxShadow: flash ? '0 0 10px rgba(239,68,68,0.85)' : glow }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* Глянцевый блик поверх заливки — читается как «стекло» панели */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/5" />
      </div>
      <span className="w-[30px] shrink-0 font-mono text-[9px] tabular-nums text-slate-200/90">
        {Math.round(value)}
      </span>
    </div>
  );
});

export const PlayerStatusFrame = memo(function PlayerStatusFrame() {
  const karma = usePlayerKarma();
  const energy = usePlayerEnergy();
  const stress = usePlayerStress();
  const level = usePlayerLevel();
  const reducedMotion = useEffectiveReducedMotion();

  const prevKarmaRef = useRef(karma);
  const [karmaDrop, setKarmaDrop] = useState(false);

  // Flash-эффект при падении кармы (наследие KarmaHudMeter)
  useEffect(() => {
    if (prevKarmaRef.current === karma) return;
    const delta = karma - prevKarmaRef.current;
    prevKarmaRef.current = karma;
    if (delta >= 0 || reducedMotion) return;
    setKarmaDrop(true);
    const t = setTimeout(() => setKarmaDrop(false), 450);
    return () => clearTimeout(t);
  }, [karma, reducedMotion]);

  const karmaPct = ((karma - KARMA_MIN) / (KARMA_MAX - KARMA_MIN)) * 100;
  const tierLabel = getKarmaTierLabel(karma);
  const karmaColor = karma >= 60 ? '#22d3ee' : karma <= 40 ? '#fb7185' : '#fbbf24';

  return (
    <div
      data-exploration-ui
      data-testid="player-status-frame"
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/55 px-2 py-1.5 backdrop-blur-sm"
      style={{ boxShadow: '0 0 14px rgba(0, 210, 255, 0.12)' }}
      role="group"
      aria-label="Состояние героя: энергия, стресс, карма"
    >
      {/* Портрет: монограмма героя в кольце уровня */}
      <div className="relative shrink-0" aria-hidden="true">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full border-2"
          style={{
            borderColor: 'rgba(0, 229, 255, 0.55)',
            background: 'radial-gradient(circle at 35% 30%, rgba(0,229,255,0.28), rgba(10,18,32,0.95) 70%)',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.35), inset 0 0 8px rgba(0, 210, 255, 0.2)',
          }}
        >
          <span
            className="font-serif text-lg font-bold text-cyan-100"
            style={{ textShadow: '0 0 6px rgba(0,229,255,0.7)' }}
          >
            В
          </span>
        </div>
        {/* Уровень — бейдж в углу портрета, как в WoW */}
        <div
          className="absolute -bottom-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-md border border-amber-300/60 bg-slate-950/90 px-0.5 font-mono text-[9px] font-bold text-amber-300"
        >
          {level}
        </div>
      </div>

      {/* Бары: Энергия / Стресс / Карма */}
      <div className="flex flex-col gap-[3px]">
        <BarRow
          label="ЭН"
          value={energy}
          max={Math.max(100, energy)}
          fill="linear-gradient(90deg, #16a34a, #4ade80)"
          glow="0 0 6px rgba(74, 222, 128, 0.45)"
          flash={energy <= 25}
          ariaValue={`Энергия: ${Math.round(energy)} из 100`}
          reducedMotion={reducedMotion}
        />
        <BarRow
          label="СТР"
          value={stress}
          max={100}
          fill="linear-gradient(90deg, #be123c, #fb7185)"
          glow="0 0 6px rgba(251, 113, 133, 0.4)"
          flash={stress >= 85}
          ariaValue={`Стресс: ${Math.round(stress)} из 100`}
          reducedMotion={reducedMotion}
        />
        <BarRow
          label="КАР"
          value={karmaPct}
          max={100}
          fill="linear-gradient(90deg, #3b82f6, #6366f1)"
          glow="0 0 6px rgba(99, 102, 241, 0.4)"
          flash={karmaDrop}
          ariaValue={`Карма: ${karma}, ${tierLabel}`}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Тир кармы — цветная метка справа */}
      <span
        className="ml-0.5 hidden self-center font-mono text-[9px] uppercase tracking-wide md:block"
        style={{ color: `${karmaColor}aa` }}
        aria-hidden="true"
      >
        {tierLabel}
      </span>
    </div>
  );
});
