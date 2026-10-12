/* ─── Volodka RPG — Общие примитивы настроек «Ночная тетрадь» ───
 *
 * Один визуальный язык для компактной панели настроек в главном меню
 * и полной панели в паузе (приоритет №2 из аудита v4.48: «один компонент,
 * два режима» — шаг 2: общие примитивы секций).
 *
 * Талисманы скина: камень (stone) + янтарь (#e2a84b), serif-типографика.
 * Контракт доступности сохранён от кибер-примитивов: role="switch",
 * aria-checked, aria-pressed, нативный range под визуальным слоем,
 * aria-label = статичное имя настройки (состояние читает aria-checked).
 */

import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';

// ─── Палитра «Тетради» (соответствует --vk-amber из volodka-skin.css) ───

const AMBER = '226, 168, 75';
const AMBER_STRONG = 'rgba(240, 214, 158, 0.95)'; // тёплый текст активного чипа
const STONE_MUTED = 'rgba(168, 162, 158, 0.7)';   // неактивные чипы (stone-400/70)
const STONE_TRACK = 'rgba(28, 25, 23, 0.6)';      // треки выключенных переключателей
const STONE_BORDER = 'rgba(120, 113, 108, 0.3)';  // hairline-границы

// ─── Section ───

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  /** Без верхней hairline-линии (для первой секции под заголовком панели). */
  flush?: boolean;
}

export function SettingsSection({ title, children, flush = false }: SettingsSectionProps) {
  return (
    <section
      className={`flex flex-col gap-2.5 ${flush ? '' : 'border-t border-stone-500/15 pt-3'}`}
    >
      <h3 className="font-serif text-[10px] tracking-[0.25em] uppercase text-amber-200/45 text-center">
        {title}
      </h3>
      {children}
    </section>
  );
}

// ─── Switch row (role="switch" — тот же контракт, что у CyberToggle) ───

interface SettingsSwitchRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function SettingsSwitchRow({ label, checked, onChange }: SettingsSwitchRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-3 py-0.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300/60 focus-visible:outline-offset-2"
    >
      <span className="font-serif text-[13px] leading-snug text-stone-200/85 transition-colors group-hover:text-stone-100">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="relative inline-block h-[18px] w-[34px] shrink-0 rounded-full border transition-colors duration-300"
        style={{
          background: checked ? `rgba(${AMBER}, 0.22)` : STONE_TRACK,
          borderColor: checked ? `rgba(${AMBER}, 0.55)` : STONE_BORDER,
        }}
      >
        <motion.span
          className="absolute top-[2px] h-[12px] w-[12px] rounded-full"
          animate={{
            left: checked ? 18 : 3,
            backgroundColor: checked ? `rgba(${AMBER}, 0.95)` : 'rgba(168, 162, 158, 0.7)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

// ─── Slider row (нативный range под визуальным слоем — как у CyberSlider) ───

interface SettingsSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

export function SettingsSliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: SettingsSliderRowProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-serif text-[13px] text-stone-200/85">{label}</span>
        <span className="font-serif text-[12px] tabular-nums text-amber-200/75">
          {value}
          {unit}
        </span>
      </div>
      <div className="group relative flex h-5 items-center">
        <div
          className="absolute inset-x-0 h-[3px] rounded-full border"
          style={{ background: STONE_TRACK, borderColor: 'rgba(120, 113, 108, 0.2)' }}
        />
        <div
          className="absolute left-0 h-[3px] rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, rgba(${AMBER}, 0.35), rgba(${AMBER}, 0.75))`,
          }}
        />
        <div
          className="pointer-events-none absolute h-3 w-3 rounded-full border"
          style={{
            left: `calc(${pct}% - 6px)`,
            background: `rgba(${AMBER}, 0.9)`,
            borderColor: `rgba(${AMBER}, 0.5)`,
            boxShadow: `0 0 8px rgba(${AMBER}, 0.25)`,
          }}
        />
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

// ─── Chips row (пресеты качества и подобные выборы) ───

interface SettingsChipsRowProps<T extends string> {
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

export function SettingsChipsRow<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SettingsChipsRowProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className="rounded-md border px-2.5 py-1 font-serif text-[12px] tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300/60 focus-visible:outline-offset-2"
            style={{
              color: active ? AMBER_STRONG : STONE_MUTED,
              backgroundColor: active ? `rgba(${AMBER}, 0.14)` : 'rgba(28, 25, 23, 0.5)',
              borderColor: active ? `rgba(${AMBER}, 0.5)` : STONE_BORDER,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Select row (режим для дальтоников и подобные выборы) ───

interface SettingsSelectRowProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (id: T) => void;
}

export function SettingsSelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: SettingsSelectRowProps<T>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-serif text-[13px] text-stone-200/85">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border px-2 py-1.5 font-serif text-[12px] text-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300/60"
        style={{ background: 'rgba(28, 25, 23, 0.7)', borderColor: STONE_BORDER }}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Hint ───

export function SettingsHint({ children }: { children: ReactNode }) {
  return <p className="font-serif text-[11px] leading-relaxed text-stone-400/60">{children}</p>;
}
