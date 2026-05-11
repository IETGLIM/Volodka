'use client';

/* ─── Volodka RPG – Settings Panel (Cyberpunk Terminal Aesthetic) ─── */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

// ─── Types ───

type SettingsTab = 'audio' | 'visual' | 'controls';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

// ─── LocalStorage helpers ───

function lsGetNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function lsGetBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

function lsSet(key: string, value: number | boolean | string): void {
  localStorage.setItem(key, String(value));
}

// ─── Default settings (for reset) ───

const DEFAULTS: Record<string, number | boolean> = {
  volodka_music_volume: 70,
  volodka_sfx_volume: 80,
  volodka_ambient_volume: 60,
  volodka_muted: false,
  volodka_postfx: true,
  volodka_scanlines: true,
  volodka_particles: true,
  volodka_cam_shake: true,
  volodka_brightness: 100,
  volodka_mouse_sens: 5,
  volodka_invert_y: false,
};

// ─── Custom Slider Component ───

function CyberSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-300/80 tracking-wide">{label}</span>
        <span className="font-mono text-xs text-cyan-400/70 tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-5 flex items-center group">
        {/* Track background */}
        <div
          className="absolute left-0 right-0 h-1.5 rounded-full"
          style={{ background: 'rgba(30, 41, 59, 0.8)' }}
        />
        {/* Filled portion */}
        <motion.div
          className="absolute left-0 h-1.5 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.4), rgba(0, 229, 255, 0.8))',
            boxShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
          }}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        {/* Thumb */}
        <motion.div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-cyan-400/80 cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${pct}% - 7px)`,
            background: 'rgba(0, 229, 255, 0.9)',
            boxShadow: '0 0 10px rgba(0, 229, 255, 0.5), 0 0 20px rgba(0, 229, 255, 0.2)',
          }}
          whileHover={{
            scale: 1.3,
            boxShadow: '0 0 14px rgba(0, 229, 255, 0.7), 0 0 28px rgba(0, 229, 255, 0.3)',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
        {/* Native range input (invisible, for interaction) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
      </div>
    </div>
  );
}

// ─── Custom Toggle Switch Component ───

function CyberToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 py-1 group"
    >
      <span className="font-mono text-xs text-slate-300/80 tracking-wide group-hover:text-slate-200 transition-colors">
        {label}
      </span>
      <div
        className="relative w-10 h-5 rounded-full transition-all duration-300"
        style={{
          background: checked
            ? 'rgba(0, 229, 255, 0.25)'
            : 'rgba(30, 41, 59, 0.8)',
          border: checked
            ? '1px solid rgba(0, 229, 255, 0.5)'
            : '1px solid rgba(71, 85, 105, 0.4)',
          boxShadow: checked
            ? '0 0 12px rgba(0, 229, 255, 0.3), inset 0 0 6px rgba(0, 229, 255, 0.15)'
            : 'none',
        }}
      >
        <motion.div
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
          animate={{
            left: checked ? '22px' : '2px',
            background: checked
              ? 'rgba(0, 229, 255, 0.95)'
              : 'rgba(100, 116, 139, 0.6)',
            boxShadow: checked
              ? '0 0 8px rgba(0, 229, 255, 0.6)'
              : 'none',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

// ─── Section divider ───

function SectionDivider() {
  return (
    <div
      className="w-full h-px my-3"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.15), transparent)',
      }}
    />
  );
}

// ─── Tab definitions ───

const TABS: { id: SettingsTab; icon: string; label: string }[] = [
  { id: 'audio', icon: '🔊', label: 'Аудио' },
  { id: 'visual', icon: '👁', label: 'Визуал' },
  { id: 'controls', icon: '🎮', label: 'Управление' },
];

// ─── Inner content component (remounts on each open, uses lazy init) ───

function SettingsPanelContent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');

  // ── Audio state (lazy init from localStorage) ──
  const [musicVol, setMusicVol] = useState(() => lsGetNumber('volodka_music_volume', 70));
  const [sfxVol, setSfxVol] = useState(() => lsGetNumber('volodka_sfx_volume', 80));
  const [ambientVol, setAmbientVol] = useState(() => lsGetNumber('volodka_ambient_volume', 60));
  const [muted, setMuted] = useState(() => lsGetBool('volodka_muted', false));

  // ── Visual state ──
  const [postfx, setPostfx] = useState(() => lsGetBool('volodka_postfx', true));
  const [scanlines, setScanlines] = useState(() => lsGetBool('volodka_scanlines', true));
  const [particles, setParticles] = useState(() => lsGetBool('volodka_particles', true));
  const [camShake, setCamShake] = useState(() => lsGetBool('volodka_cam_shake', true));
  const [brightness, setBrightness] = useState(() => lsGetNumber('volodka_brightness', 100));

  // ── Controls state ──
  const [mouseSens, setMouseSens] = useState(() => lsGetNumber('volodka_mouse_sens', 5));
  const [invertY, setInvertY] = useState(() => lsGetBool('volodka_invert_y', false));

  // ── Persist helper (write to localStorage immediately) ──
  const persist = useCallback((key: string, value: number | boolean) => {
    lsSet(key, value);
  }, []);

  // ── Reset all settings ──
  const resetSettings = useCallback(() => {
    Object.entries(DEFAULTS).forEach(([key, val]) => {
      lsSet(key, val);
    });
    setMusicVol(DEFAULTS.volodka_music_volume as number);
    setSfxVol(DEFAULTS.volodka_sfx_volume as number);
    setAmbientVol(DEFAULTS.volodka_ambient_volume as number);
    setMuted(DEFAULTS.volodka_muted as boolean);
    setPostfx(DEFAULTS.volodka_postfx as boolean);
    setScanlines(DEFAULTS.volodka_scanlines as boolean);
    setParticles(DEFAULTS.volodka_particles as boolean);
    setCamShake(DEFAULTS.volodka_cam_shake as boolean);
    setBrightness(DEFAULTS.volodka_brightness as number);
    setMouseSens(DEFAULTS.volodka_mouse_sens as number);
    setInvertY(DEFAULTS.volodka_invert_y as boolean);
  }, []);

  // ── Render tab content ──
  const renderContent = () => {
    switch (activeTab) {
      case 'audio':
        return (
          <motion.div
            key="audio"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <CyberSlider
              label="Музыка"
              value={musicVol}
              min={0}
              max={100}
              onChange={(v) => { setMusicVol(v); persist('volodka_music_volume', v); }}
              unit="%"
            />
            <CyberSlider
              label="Звуковые эффекты"
              value={sfxVol}
              min={0}
              max={100}
              onChange={(v) => { setSfxVol(v); persist('volodka_sfx_volume', v); }}
              unit="%"
            />
            <CyberSlider
              label="Окружение"
              value={ambientVol}
              min={0}
              max={100}
              onChange={(v) => { setAmbientVol(v); persist('volodka_ambient_volume', v); }}
              unit="%"
            />
            <SectionDivider />
            <CyberToggle
              label="Без звука"
              checked={muted}
              onChange={(v) => { setMuted(v); persist('volodka_muted', v); }}
            />
          </motion.div>
        );

      case 'visual':
        return (
          <motion.div
            key="visual"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <CyberToggle
              label="Пост-обработка"
              checked={postfx}
              onChange={(v) => { setPostfx(v); persist('volodka_postfx', v); }}
            />
            <CyberToggle
              label="Сканлайны"
              checked={scanlines}
              onChange={(v) => { setScanlines(v); persist('volodka_scanlines', v); }}
            />
            <CyberToggle
              label="Частицы"
              checked={particles}
              onChange={(v) => { setParticles(v); persist('volodka_particles', v); }}
            />
            <CyberToggle
              label="Тряска камеры"
              checked={camShake}
              onChange={(v) => { setCamShake(v); persist('volodka_cam_shake', v); }}
            />
            <SectionDivider />
            <CyberSlider
              label="Яркость"
              value={brightness}
              min={50}
              max={150}
              onChange={(v) => { setBrightness(v); persist('volodka_brightness', v); }}
              unit="%"
            />
          </motion.div>
        );

      case 'controls':
        return (
          <motion.div
            key="controls"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <CyberSlider
              label="Чувствительность мыши"
              value={mouseSens}
              min={1}
              max={10}
              onChange={(v) => { setMouseSens(v); persist('volodka_mouse_sens', v); }}
            />
            <CyberToggle
              label="Инвертировать Y-ось"
              checked={invertY}
              onChange={(v) => { setInvertY(v); persist('volodka_invert_y', v); }}
            />
            <SectionDivider />
            {/* Keyboard shortcuts hint */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs text-cyan-400/50 uppercase tracking-[0.15em]">
                Горячие клавиши
              </span>
              <div
                className="rounded-md border border-slate-700/30 p-3"
                style={{ background: 'rgba(15, 23, 42, 0.5)' }}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ['W A S D', 'Движение'],
                    ['Shift', 'Бег'],
                    ['Space', 'Прыжок'],
                    ['E', 'Взаимодействие'],
                    ['I / Tab', 'Инвентарь'],
                    ['J', 'Журнал'],
                    ['Q', 'Задания'],
                    ['P', 'Стихи'],
                    ['Esc', 'Пауза'],
                    ['F1', 'Справка'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-2">
                      <kbd
                        className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 rounded border font-mono text-[10px]"
                        style={{
                          background: 'rgba(15, 23, 42, 0.7)',
                          borderColor: 'rgba(100, 116, 139, 0.25)',
                          color: 'rgba(203, 213, 225, 0.7)',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        {key}
                      </kbd>
                      <span className="font-mono text-[11px] text-slate-400/60">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      className="relative z-10 w-full max-w-lg mx-4"
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 30 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
          borderColor: 'rgba(0, 229, 255, 0.2)',
          boxShadow:
            '0 0 60px rgba(0, 229, 255, 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(0, 229, 255, 0.05)',
          clipPath:
            'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        {/* ── Terminal Header ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgba(0, 229, 255, 0.15)',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Colored dots */}
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-red-500/80" />
            <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/35">
              volodka://settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
            aria-label="Закрыть настройки"
          >
            ✕
          </button>
        </div>

        {/* ── Tab Buttons ── */}
        <div
          className="flex border-b px-4 pt-3 gap-1"
          style={{ borderColor: 'rgba(0, 229, 255, 0.1)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-3 py-2 font-mono text-xs tracking-wide transition-colors rounded-t-md"
                style={{
                  color: isActive
                    ? 'rgba(0, 229, 255, 0.9)'
                    : 'rgba(148, 163, 184, 0.5)',
                  background: isActive
                    ? 'rgba(0, 229, 255, 0.08)'
                    : 'transparent',
                }}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.6), transparent)',
                      boxShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
                    }}
                    layoutId="settings-tab-indicator"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="px-5 py-5 min-h-[260px] max-h-[55vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(0, 229, 255, 0.1)' }}
        >
          {/* Reset button */}
          <motion.button
            onClick={resetSettings}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="font-mono text-[11px] tracking-wider uppercase px-3 py-1.5 rounded border transition-colors"
            style={{
              color: 'rgba(251, 191, 36, 0.7)',
              borderColor: 'rgba(251, 191, 36, 0.2)',
              background: 'rgba(251, 191, 36, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
              e.currentTarget.style.color = 'rgba(251, 191, 36, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.2)';
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.05)';
              e.currentTarget.style.color = 'rgba(251, 191, 36, 0.7)';
            }}
          >
            Сбросить настройки
          </motion.button>

          {/* ESC hint */}
          <div className="flex items-center gap-1.5">
            <kbd
              className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(100, 116, 139, 0.25)',
                color: 'rgba(148, 163, 184, 0.5)',
              }}
            >
              Esc
            </kbd>
            <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
              назад
            </span>
          </div>
        </div>
      </div>

      {/* Corner glow decorations */}
      <div
        className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgba(0, 229, 255, 0.3)',
          borderLeft: '2px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '-2px -2px 10px rgba(0, 229, 255, 0.1)',
        }}
      />
      <div
        className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgba(0, 229, 255, 0.3)',
          borderRight: '2px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '2px -2px 10px rgba(0, 229, 255, 0.1)',
        }}
      />
      <div
        className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
        style={{
          borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
          borderLeft: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '-2px 2px 10px rgba(251, 191, 36, 0.05)',
        }}
      />
      <div
        className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
          borderRight: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '2px 2px 10px rgba(251, 191, 36, 0.05)',
        }}
      />
    </motion.div>
  );
}

// ─── Main Component ───

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  // ── ESC to close ──
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.MENU }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Scanlines overlay on backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
            }}
          />

          {/* Panel content — remounts on each open for fresh localStorage reads */}
          <SettingsPanelContent onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
