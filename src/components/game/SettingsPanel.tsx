
/* ─── Volodka RPG – Settings Panel (Cyberpunk Terminal Aesthetic) ─── */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  QUALITY_PRESET_ORDER,
  formatQualityPresetDetailRu,
  type QualityPresetId,
} from '@/engine/graphics/qualityPresets';
import {
  CyberSlider,
  CyberToggle,
  SectionDivider,
} from '@/components/game/design-system';
import {
  COMBAT_DIFFICULTY_PROFILES,
  readCombatDifficulty,
  writeCombatDifficulty,
  type CombatDifficultyId,
} from '@/engine/combat/combatDifficulty';
import { applyAudioSettings } from '@/engine/audio/AudioSettings';
import { applyVisualSettings } from '@/engine/visualSettings';
import {
  accessibilitySliderBounds,
  accessibilitySliderPercent,
  parseColorBlindMode,
  resetAccessibilitySettings,
  createLocomotionSpeed,
  createSubtitleScale,
  createTextSpeed,
  setColorBlindMode,
  setReducedMotionOverride,
  setLoadingFxDisabled,
  setSubtitleScale,
  setTextSpeed,
  setLocomotionSpeed,
} from '@/engine/accessibility/accessibilitySettings';
import type { AccessibilitySettingsSnapshot } from '@/engine/accessibility/accessibilitySettings';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

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
  volodka_pointer_lock: false,
};

const QUALITY_OPTIONS: { id: QualityPresetId; label: string }[] = [
  { id: 'auto', label: 'Авто' },
  ...QUALITY_PRESET_ORDER.map((id) => ({
    id,
    label: id === 'low' ? 'Низкое' : id === 'medium' ? 'Среднее' : id === 'high' ? 'Высокое' : 'Ультра',
  })),
];

const SUBTITLE_SLIDER = accessibilitySliderBounds('subtitleScale');
const TEXT_SPEED_SLIDER = accessibilitySliderBounds('textSpeed');
const LOCOMOTION_SLIDER = accessibilitySliderBounds('locomotionSpeed');

function VisualSettingsTab({
  postfx,
  setPostfx,
  scanlines,
  setScanlines,
  particles,
  setParticles,
  camShake,
  setCamShake,
  brightness,
  setBrightness,
  a11y,
  persist,
}: {
  postfx: boolean;
  setPostfx: (v: boolean) => void;
  scanlines: boolean;
  setScanlines: (v: boolean) => void;
  particles: boolean;
  setParticles: (v: boolean) => void;
  camShake: boolean;
  setCamShake: (v: boolean) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  a11y: AccessibilitySettingsSnapshot;
  persist: (key: string, value: number | boolean) => void;
}) {
  const { selectedPreset, preset, setPreset } = useGraphicsQuality();

  return (
    <motion.div
      key="visual"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-cyan-400/50 uppercase tracking-[0.15em]">
          Качество графики
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUALITY_OPTIONS.map((opt) => {
            const active = selectedPreset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className="px-2.5 py-1 rounded-md font-mono text-[11px] tracking-wide transition-colors border"
                style={{
                  color: active ? 'rgb(var(--cyber-cyan-rgb) / 0.95)' : 'rgba(148, 163, 184, 0.65)',
                  background: active ? 'rgb(var(--cyber-cyan-rgb) / 0.12)' : 'rgba(15, 23, 42, 0.5)',
                  borderColor: active ? 'rgb(var(--cyber-cyan-rgb) / 0.45)' : 'rgba(71, 85, 105, 0.35)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[10px] text-slate-500/80 leading-relaxed">
          {formatQualityPresetDetailRu(selectedPreset, preset)}
        </p>
      </div>
      <SectionDivider />
      <CyberToggle
        label="Пост-обработка"
        checked={postfx}
        onChange={(v) => { setPostfx(v); persist('volodka_postfx', v); applyVisualSettings(); }}
      />
      <CyberToggle
        label="Сканлайны"
        checked={scanlines}
        onChange={(v) => { setScanlines(v); persist('volodka_scanlines', v); applyVisualSettings(); }}
      />
      <CyberToggle
        label="Частицы"
        checked={particles}
        onChange={(v) => { setParticles(v); persist('volodka_particles', v); applyVisualSettings(); }}
      />
      <CyberToggle
        label="Тряска камеры"
        checked={camShake}
        onChange={(v) => { setCamShake(v); persist('volodka_cam_shake', v); applyVisualSettings(); }}
      />
      <SectionDivider />
      <CyberSlider
        label="Яркость"
        value={brightness}
        min={50}
        max={150}
        onChange={(v) => { setBrightness(v); persist('volodka_brightness', v); applyVisualSettings(); }}
        unit="%"
      />
      <SectionDivider />
      <span className="font-mono text-xs text-cyan-400/50 uppercase tracking-[0.15em]">
        Доступность
      </span>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-slate-400">Режим для дальтоников</label>
        <select
          className="bg-slate-900/80 border border-cyan-900/40 rounded px-2 py-1.5 font-mono text-xs text-cyan-200"
          value={a11y.colorBlindMode}
          onChange={(e) => {
            setColorBlindMode(parseColorBlindMode(e.target.value));
          }}
        >
          <option value="none">Выключен</option>
          <option value="protanopia">Протанопия</option>
          <option value="deuteranopia">Дейтеранопия</option>
          <option value="tritanopia">Тританопия</option>
        </select>
      </div>
      <CyberToggle
        label="Уменьшить анимации"
        checked={a11y.reducedMotionOverride}
        onChange={(v) => {
          setReducedMotionOverride(v);
        }}
      />
      <CyberToggle
        label="Отключить анимации загрузки"
        checked={a11y.loadingFxDisabled}
        onChange={(v) => {
          setLoadingFxDisabled(v);
        }}
      />
      <CyberSlider
        label="Размер субтитров"
        value={accessibilitySliderPercent(a11y.subtitleScale)}
        min={SUBTITLE_SLIDER.min}
        max={SUBTITLE_SLIDER.max}
        onChange={(v) => {
          setSubtitleScale(createSubtitleScale(v / 100));
        }}
        unit="%"
      />
      <CyberSlider
        label="Скорость текста"
        value={accessibilitySliderPercent(a11y.textSpeed)}
        min={TEXT_SPEED_SLIDER.min}
        max={TEXT_SPEED_SLIDER.max}
        onChange={(v) => {
          setTextSpeed(createTextSpeed(v / 100));
        }}
        unit="%"
      />
      <p className="font-mono text-[10px] text-slate-500/80 leading-relaxed -mt-2">
        Скорость печати в диалогах и сюжете. Размер субтитров на скорость не влияет.
      </p>
      <CyberSlider
        label="Скорость ходьбы"
        value={accessibilitySliderPercent(a11y.locomotionSpeed)}
        min={LOCOMOTION_SLIDER.min}
        max={LOCOMOTION_SLIDER.max}
        onChange={(v) => {
          setLocomotionSpeed(createLocomotionSpeed(v / 100));
        }}
        unit="%"
      />
      <p className="font-mono text-[10px] text-slate-500/80 leading-relaxed -mt-2">
        Множитель скорости бега и ходьбы персонажа в исследовании.
      </p>
    </motion.div>
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
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  const a11y = useAccessibilitySettings();

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
  const [pointerLock, setPointerLock] = useState(() => lsGetBool('volodka_pointer_lock', false));
  const [combatDifficulty, setCombatDifficulty] = useState<CombatDifficultyId>(() => readCombatDifficulty());

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
    setPointerLock(DEFAULTS.volodka_pointer_lock as boolean);
    applyAudioSettings();
    applyVisualSettings();
    resetAccessibilitySettings();
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
              onChange={(v) => { setMusicVol(v); persist('volodka_music_volume', v); applyAudioSettings(); }}
              unit="%"
            />
            <CyberSlider
              label="Звуковые эффекты"
              value={sfxVol}
              min={0}
              max={100}
              onChange={(v) => { setSfxVol(v); persist('volodka_sfx_volume', v); applyAudioSettings(); }}
              unit="%"
            />
            <CyberSlider
              label="Окружение"
              value={ambientVol}
              min={0}
              max={100}
              onChange={(v) => { setAmbientVol(v); persist('volodka_ambient_volume', v); applyAudioSettings(); }}
              unit="%"
            />
            <SectionDivider />
            <CyberToggle
              label="Без звука"
              checked={muted}
              onChange={(v) => { setMuted(v); persist('volodka_muted', v); applyAudioSettings(); }}
            />
          </motion.div>
        );

      case 'visual':
        return (
          <VisualSettingsTab
            postfx={postfx}
            setPostfx={setPostfx}
            scanlines={scanlines}
            setScanlines={setScanlines}
            particles={particles}
            setParticles={setParticles}
            camShake={camShake}
            setCamShake={setCamShake}
            brightness={brightness}
            setBrightness={setBrightness}
            a11y={a11y}
            persist={persist}
          />
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
              onChange={(v) => { setMouseSens(v); persist('volodka_mouse_sens', v); applyVisualSettings(); }}
            />
            <CyberToggle
              label="Инвертировать Y-ось"
              checked={invertY}
              onChange={(v) => { setInvertY(v); persist('volodka_invert_y', v); applyVisualSettings(); }}
            />
            <CyberToggle
              label="Захват курсора (FPS)"
              checked={pointerLock}
              onChange={(v) => { setPointerLock(v); persist('volodka_pointer_lock', v); applyVisualSettings(); }}
            />
            <SectionDivider />
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs text-cyan-400/50 uppercase tracking-[0.15em]">
                Сложность боя
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(COMBAT_DIFFICULTY_PROFILES) as CombatDifficultyId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCombatDifficulty(id);
                      writeCombatDifficulty(id);
                    }}
                    className={`px-2 py-2 font-mono text-[10px] uppercase tracking-wide border rounded ${
                      combatDifficulty === id
                        ? 'border-cyan-400/60 text-cyan-200 bg-cyan-950/40'
                        : 'border-slate-700/40 text-slate-400'
                    }`}
                  >
                    {COMBAT_DIFFICULTY_PROFILES[id].label}
                  </button>
                ))}
              </div>
            </div>
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
    <FocusTrap initialFocusRef={closeButtonRef}>
    <motion.div
      className="relative z-10 w-full max-w-lg mx-4"
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 30 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      {...dialogProps}
    >
      <h2 {...titleProps} className="sr-only">Настройки</h2>
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
          borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
          boxShadow:
            '0 0 60px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.05)',
          clipPath:
            'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        {/* ── Terminal Header ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
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
            ref={closeButtonRef}
            type="button"
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
          style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.1)' }}
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
                    ? 'rgb(var(--cyber-cyan-rgb) / 0.9)'
                    : 'rgba(148, 163, 184, 0.5)',
                  background: isActive
                    ? 'rgb(var(--cyber-cyan-rgb) / 0.08)'
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
                        'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.6), transparent)',
                      boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
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
          style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.1)' }}
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
          borderTop: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          borderLeft: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          boxShadow: '-2px -2px 10px rgb(var(--cyber-cyan-rgb) / 0.1)',
        }}
      />
      <div
        className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          borderRight: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          boxShadow: '2px -2px 10px rgb(var(--cyber-cyan-rgb) / 0.1)',
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
    </FocusTrap>
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
          data-testid="settings-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
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
