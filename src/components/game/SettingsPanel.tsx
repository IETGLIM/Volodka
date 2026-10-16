/* ─── Volodka RPG – Settings Panel («Ночная тетрадь», полный режим) ───
 *
 * Панель настроек паузы — режим «full» единой системы настроек
 * (приоритет №2 аудита v4.48). v4.48.3: кибер-cyan хром заменён общими
 * примитивами «Тетради» (src/components/game/settings/NotebookSettings.tsx) —
 * тот же визуальный язык, что у компактной панели в главном меню.
 * Логика и контракт доступности не изменились: role="switch", нативные
 * range-инпуты, FocusTrap, Escape, data-testid="settings-panel".
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  QUALITY_PRESETS,
  QUALITY_PRESET_ORDER,
  formatQualityPresetDetailRu,
  type QualityPresetId,
} from '@/engine/graphics/qualityPresets';
import {
  DIFFICULTY_META,
  GAME_DIFFICULTY_ORDER,
  type GameDifficulty,
} from '@/store/slices/difficultySlice';
import { useGameStore } from '@/store/gameStore';
import {
  readSkipArrivalCinematics,
  writeSkipArrivalCinematics,
} from '@/engine/cinematic/arrivalCinematicsSetting';
import {
  readHapticsEnabled,
  writeHapticsEnabled,
  HAPTICS_DEFAULT,
} from '@/shared/utils/hapticsSetting';
import { applyAudioSettings } from '@/engine/audio/AudioSettings';
import {
  readVoiceOverEnabled,
  writeVoiceOverEnabled,
  VOICE_OVER_DEFAULT,
} from '@/engine/audio/voiceOverSettings';
import { stopVoiceLinePlayback } from '@/engine/audio/voiceLinePlayer';
import { applyVisualSettings } from '@/engine/visualSettings';
import {
  accessibilitySliderBounds,
  accessibilitySliderPercent,
  parseColorBlindMode,
  resetAccessibilitySettings,
  createLocomotionSpeed,
  createSubtitleScale,
  createTextSpeed,
  createUiTextScale,
  setColorBlindMode,
  setReducedMotionOverride,
  setLoadingFxDisabled,
  setSkipPoemCutscenes,
  setSubtitleScale,
  setTextSpeed,
  setLocomotionSpeed,
  setHighContrast,
  setUiTextScale,
  setPinchZoomEnabled,
} from '@/engine/accessibility/accessibilitySettings';
import type { AccessibilitySettingsSnapshot } from '@/engine/accessibility/accessibilitySettings';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import {
  SettingsSection,
  SettingsSwitchRow,
  SettingsSliderRow,
  SettingsChipsRow,
  SettingsSelectRow,
  SettingsHint,
} from '@/components/game/settings/NotebookSettings';

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
  volodka_voice_over_enabled: VOICE_OVER_DEFAULT,
  volodka_postfx: true,
  volodka_scanlines: true,
  volodka_particles: true,
  volodka_cam_shake: true,
  volodka_brightness: 100,
  volodka_mouse_sens: 5,
  volodka_invert_y: false,
  volodka_pointer_lock: false,
  volodka_agx: true,
  volodka_vignette: true,
  volodka_chromatic: true,
  volodka_film_grain: true,
};

const QUALITY_OPTIONS: { id: QualityPresetId; label: string }[] = [
  { id: 'auto', label: 'Авто' },
  ...QUALITY_PRESET_ORDER.map((id) => ({
    id,
    label: QUALITY_PRESETS[id].labelRu,
  })),
];

const SUBTITLE_SLIDER = accessibilitySliderBounds('subtitleScale');
const TEXT_SPEED_SLIDER = accessibilitySliderBounds('textSpeed');
const LOCOMOTION_SLIDER = accessibilitySliderBounds('locomotionSpeed');
const UI_TEXT_SCALE_SLIDER = accessibilitySliderBounds('uiTextScale');

function VisualSettingsTab({
  postfx,
  setPostfx,
  scanlines,
  setScanlines,
  particles,
  setParticles,
  camShake,
  setCamShake,
  agx,
  setAgx,
  vignette,
  setVignette,
  chromatic,
  setChromatic,
  filmGrain,
  setFilmGrain,
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
  agx: boolean;
  setAgx: (v: boolean) => void;
  vignette: boolean;
  setVignette: (v: boolean) => void;
  chromatic: boolean;
  setChromatic: (v: boolean) => void;
  filmGrain: boolean;
  setFilmGrain: (v: boolean) => void;
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
      <SettingsSection title="Графика" flush>
        <SettingsChipsRow
          ariaLabel="Качество графики"
          options={QUALITY_OPTIONS}
          value={selectedPreset}
          onChange={setPreset}
        />
        <SettingsHint>{formatQualityPresetDetailRu(selectedPreset, preset)}</SettingsHint>
      </SettingsSection>

      <SettingsSection title="Эффекты">
        <SettingsSwitchRow
          label="Пост-обработка"
          checked={postfx}
          onChange={(v) => { setPostfx(v); persist('volodka_postfx', v); applyVisualSettings(); }}
        />
        <SettingsSwitchRow
          label="Сканлайны"
          checked={scanlines}
          onChange={(v) => { setScanlines(v); persist('volodka_scanlines', v); applyVisualSettings(); }}
        />
        <SettingsSwitchRow
          label="Частицы"
          checked={particles}
          onChange={(v) => { setParticles(v); persist('volodka_particles', v); applyVisualSettings(); }}
        />
        <SettingsSwitchRow
          label="Тряска камеры"
          checked={camShake}
          onChange={(v) => { setCamShake(v); persist('volodka_cam_shake', v); applyVisualSettings(); }}
        />
      </SettingsSection>

      <SettingsSection title="Кинематографичность">
        <SettingsSwitchRow
          label="AgX тонмаппинг (ultra)"
          checked={agx}
          onChange={(v) => { setAgx(v); persist('volodka_agx', v); applyVisualSettings(); }}
        />
        <SettingsHint>
          Современный кинематографичный тонмаппинг на пресете «Ультра». AgX темнее ACES — экспозиция автокомпенсируется (+0.15).
        </SettingsHint>
        <SettingsSwitchRow
          label="Виньетка"
          checked={vignette}
          onChange={(v) => { setVignette(v); persist('volodka_vignette', v); applyVisualSettings(); }}
        />
        <SettingsSwitchRow
          label="Хроматическая аберрация"
          checked={chromatic}
          onChange={(v) => { setChromatic(v); persist('volodka_chromatic', v); applyVisualSettings(); }}
        />
        <SettingsSwitchRow
          label="Зернистость плёнки"
          checked={filmGrain}
          onChange={(v) => { setFilmGrain(v); persist('volodka_film_grain', v); applyVisualSettings(); }}
        />
        <SettingsSliderRow
          label="Яркость"
          value={brightness}
          min={50}
          max={150}
          onChange={(v) => { setBrightness(v); persist('volodka_brightness', v); applyVisualSettings(); }}
          unit="%"
        />
      </SettingsSection>

      <SettingsSection title="Доступность">
        <SettingsSelectRow
          label="Режим для дальтоников"
          value={a11y.colorBlindMode}
          options={[
            { id: 'none', label: 'Выключен' },
            { id: 'protanopia', label: 'Протанопия' },
            { id: 'deuteranopia', label: 'Дейтеранопия' },
            { id: 'tritanopia', label: 'Тританопия' },
          ]}
          onChange={(mode) => {
            setColorBlindMode(parseColorBlindMode(mode));
          }}
        />
        <SettingsSwitchRow
          label="Уменьшить анимации"
          checked={a11y.reducedMotionOverride}
          onChange={(v) => {
            setReducedMotionOverride(v);
          }}
        />
        <SettingsSwitchRow
          label="Отключить анимации загрузки"
          checked={a11y.loadingFxDisabled}
          onChange={(v) => {
            setLoadingFxDisabled(v);
          }}
        />
        <SettingsSwitchRow
          label="Пропускать ритуал чтения стихов"
          checked={a11y.skipPoemCutscenes}
          onChange={(v) => {
            setSkipPoemCutscenes(v);
          }}
        />
        <SettingsHint>
          Без кинематографического чтения — сила стиха применяется сразу.
        </SettingsHint>
        <SettingsSwitchRow
          label="Высокий контраст"
          checked={a11y.highContrast}
          onChange={(v) => {
            setHighContrast(v);
          }}
        />
        <SettingsHint>
          Увеличивает контраст текста, добавляет белые контуры к кнопкам и панелям.
        </SettingsHint>
        <SettingsSliderRow
          label="Размер субтитров"
          value={accessibilitySliderPercent(a11y.subtitleScale)}
          min={SUBTITLE_SLIDER.min}
          max={SUBTITLE_SLIDER.max}
          onChange={(v) => {
            setSubtitleScale(createSubtitleScale(v / 100));
          }}
          unit="%"
        />
        <SettingsSliderRow
          label="Скорость текста"
          value={accessibilitySliderPercent(a11y.textSpeed)}
          min={TEXT_SPEED_SLIDER.min}
          max={TEXT_SPEED_SLIDER.max}
          onChange={(v) => {
            setTextSpeed(createTextSpeed(v / 100));
          }}
          unit="%"
        />
        <SettingsHint>
          Скорость печати в диалогах и сюжете. Размер субтитров на скорость не влияет.
        </SettingsHint>
        <SettingsSliderRow
          label="Скорость ходьбы"
          value={accessibilitySliderPercent(a11y.locomotionSpeed)}
          min={LOCOMOTION_SLIDER.min}
          max={LOCOMOTION_SLIDER.max}
          onChange={(v) => {
            setLocomotionSpeed(createLocomotionSpeed(v / 100));
          }}
          unit="%"
        />
        <SettingsHint>
          Множитель скорости бега и ходьбы персонажа в исследовании.
        </SettingsHint>
        <SettingsSliderRow
          label="Масштаб интерфейса"
          value={accessibilitySliderPercent(a11y.uiTextScale)}
          min={UI_TEXT_SCALE_SLIDER.min}
          max={UI_TEXT_SCALE_SLIDER.max}
          onChange={(v) => {
            setUiTextScale(createUiTextScale(v / 100));
          }}
          unit="%"
        />
        <SettingsHint>
          Глобальный масштаб текста интерфейса (WCAG 1.4.4). Влияет на HUD, меню и панели.
        </SettingsHint>
        <SettingsSwitchRow
          label="Масштабирование жестом (пинч)"
          checked={a11y.pinchZoomEnabled}
          onChange={(v) => {
            setPinchZoomEnabled(v);
          }}
        />
        <SettingsHint>
          Разрешает приближение интерфейса жестом (WCAG 1.4.10). По умолчанию выключено,
          чтобы случайный пинч не сбивал управление в бою. Для увеличения текста
          удобнее «Масштаб интерфейса» — он не ломает разметку HUD.
        </SettingsHint>
      </SettingsSection>
    </motion.div>
  );
}

// ─── Tab definitions ───

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'audio', label: 'Аудио' },
  { id: 'visual', label: 'Визуал' },
  { id: 'controls', label: 'Управление' },
];

// ─── Keyboard shortcuts reference ───

const KEYBOARD_ROWS: [string, string][] = [
  ['W A S D', 'Движение'],
  ['Shift', 'Бег'],
  ['Space', 'Прыжок'],
  ['Q', 'Кувырок'],
  ['E', 'Взаимодействие'],
  ['I', 'Инвентарь'],
  ['J', 'Журнал'],
  ['L', 'Задания'],
  ['U', 'История диалогов'],
  ['P', 'Стихи'],
  ['Tab / M', 'Карта мира'],
  ['Esc', 'Пауза'],
  ['F1', 'Справка'],
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
  const [voiceOver, setVoiceOver] = useState(() => readVoiceOverEnabled());

  // ── Visual state ──
  const [postfx, setPostfx] = useState(() => lsGetBool('volodka_postfx', true));
  const [scanlines, setScanlines] = useState(() => lsGetBool('volodka_scanlines', true));
  const [particles, setParticles] = useState(() => lsGetBool('volodka_particles', true));
  const [camShake, setCamShake] = useState(() => lsGetBool('volodka_cam_shake', true));
  const [agx, setAgx] = useState(() => lsGetBool('volodka_agx', true));
  const [vignette, setVignette] = useState(() => lsGetBool('volodka_vignette', true));
  const [chromatic, setChromatic] = useState(() => lsGetBool('volodka_chromatic', true));
  const [filmGrain, setFilmGrain] = useState(() => lsGetBool('volodka_film_grain', true));
  const [brightness, setBrightness] = useState(() => lsGetNumber('volodka_brightness', 100));

  // ── Controls state ──
  const [mouseSens, setMouseSens] = useState(() => lsGetNumber('volodka_mouse_sens', 5));
  const [skipArrival, setSkipArrival] = useState(() => readSkipArrivalCinematics());
  const [haptics, setHaptics] = useState(() => readHapticsEnabled());
  const [invertY, setInvertY] = useState(() => lsGetBool('volodka_invert_y', false));
  const [pointerLock, setPointerLock] = useState(() => lsGetBool('volodka_pointer_lock', false));
  const [difficulty, setDifficulty] = useState<GameDifficulty>(() => {
    try {
      return useGameStore.getState().difficultySettings.difficulty;
    } catch {
      return 'normal';
    }
  });

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
    setVoiceOver(VOICE_OVER_DEFAULT);
    stopVoiceLinePlayback();
    setPostfx(DEFAULTS.volodka_postfx as boolean);
    setScanlines(DEFAULTS.volodka_scanlines as boolean);
    setParticles(DEFAULTS.volodka_particles as boolean);
    setCamShake(DEFAULTS.volodka_cam_shake as boolean);
    setAgx(DEFAULTS.volodka_agx as boolean);
    setVignette(DEFAULTS.volodka_vignette as boolean);
    setChromatic(DEFAULTS.volodka_chromatic as boolean);
    setFilmGrain(DEFAULTS.volodka_film_grain as boolean);
    setBrightness(DEFAULTS.volodka_brightness as number);
    setMouseSens(DEFAULTS.volodka_mouse_sens as number);
    setInvertY(DEFAULTS.volodka_invert_y as boolean);
    setPointerLock(DEFAULTS.volodka_pointer_lock as boolean);
    setHaptics(HAPTICS_DEFAULT);
    writeHapticsEnabled(HAPTICS_DEFAULT);
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
            <SettingsSection title="Микшер" flush>
              <SettingsSliderRow
                label="Музыка"
                value={musicVol}
                min={0}
                max={100}
                onChange={(v) => { setMusicVol(v); persist('volodka_music_volume', v); applyAudioSettings(); }}
                unit="%"
              />
              <SettingsSliderRow
                label="Звуковые эффекты"
                value={sfxVol}
                min={0}
                max={100}
                onChange={(v) => { setSfxVol(v); persist('volodka_sfx_volume', v); applyAudioSettings(); }}
                unit="%"
              />
              <SettingsSliderRow
                label="Окружение"
                value={ambientVol}
                min={0}
                max={100}
                onChange={(v) => { setAmbientVol(v); persist('volodka_ambient_volume', v); applyAudioSettings(); }}
                unit="%"
              />
            </SettingsSection>
            <SettingsSection title="Тишина и озвучка">
              <SettingsSwitchRow
                label="Без звука"
                checked={muted}
                onChange={(v) => { setMuted(v); persist('volodka_muted', v); applyAudioSettings(); }}
              />
              <SettingsSwitchRow
                label="Озвучка реплик (синтез речи)"
                checked={voiceOver}
                onChange={(v) => {
                  setVoiceOver(v);
                  persist('volodka_voice_over_enabled', v);
                  writeVoiceOverEnabled(v);
                  if (!v) stopVoiceLinePlayback();
                }}
              />
              <SettingsHint>
                Реплики диалогов проговариваются системным синтезатором речи.
                Понадобится русский голос в ОС; субтитры реплик показываются
                внизу экрана. Голосовые файлы (VO) озвучиваются независимо
                от этой настройки.
              </SettingsHint>
            </SettingsSection>
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
            agx={agx}
            setAgx={setAgx}
            vignette={vignette}
            setVignette={setVignette}
            chromatic={chromatic}
            setChromatic={setChromatic}
            filmGrain={filmGrain}
            setFilmGrain={setFilmGrain}
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
            <SettingsSection title="Мышь" flush>
              <SettingsSliderRow
                label="Чувствительность мыши"
                value={mouseSens}
                min={1}
                max={10}
                onChange={(v) => { setMouseSens(v); persist('volodka_mouse_sens', v); applyVisualSettings(); }}
              />
              <SettingsSwitchRow
                label="Инвертировать Y-ось"
                checked={invertY}
                onChange={(v) => { setInvertY(v); persist('volodka_invert_y', v); applyVisualSettings(); }}
              />
              <SettingsSwitchRow
                label="Захват курсора (FPS)"
                checked={pointerLock}
                onChange={(v) => { setPointerLock(v); persist('volodka_pointer_lock', v); applyVisualSettings(); }}
              />
            </SettingsSection>

            <SettingsSection title="Кат-сцены и тактильность">
              <SettingsSwitchRow
                label="Пропускать кат-сцены входа в локации"
                checked={skipArrival}
                onChange={(v) => {
                  setSkipArrival(v);
                  writeSkipArrivalCinematics(v);
                }}
              />
              <SettingsHint>
                Пропускает короткие вступительные проходы камеры при входе в локацию.
                Сюжетные сцены и встречи не затрагиваются.
              </SettingsHint>
              <SettingsSwitchRow
                label="Виброотклик (вибрация)"
                checked={haptics}
                onChange={(v) => {
                  setHaptics(v);
                  writeHapticsEnabled(v);
                }}
              />
              <SettingsHint>
                Тактильная отдача на мобильных: касания кнопок, урон, повышение
                уровня, завершение квеста. Действует сразу, без перезагрузки.
              </SettingsHint>
            </SettingsSection>

            <SettingsSection title="Сложность игры">
              <div className="grid grid-cols-5 gap-2">
                {(GAME_DIFFICULTY_ORDER as readonly GameDifficulty[]).map((id) => {
                  const meta = DIFFICULTY_META[id];
                  const isActive = difficulty === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setDifficulty(id);
                        useGameStore.getState().setGameDifficulty(id);
                      }}
                      className={`px-1.5 py-2 font-serif text-[11px] uppercase tracking-wide border rounded-md transition-all text-center ${
                        isActive ? 'scale-105' : 'hover:scale-[1.02]'
                      }`}
                      style={{
                        color: isActive ? meta.color : 'rgba(168, 162, 158, 0.7)',
                        backgroundColor: isActive ? meta.glowColor : 'rgba(28, 25, 23, 0.5)',
                        borderColor: isActive ? meta.color + '80' : 'rgba(120, 113, 108, 0.3)',
                        boxShadow: isActive ? `0 0 12px ${meta.glowColor}` : 'none',
                      }}
                    >
                      <div className="text-base mb-1">{meta.icon}</div>
                      <div className="leading-tight">{meta.name}</div>
                    </button>
                  );
                })}
              </div>
              <SettingsHint>{DIFFICULTY_META[difficulty].description}</SettingsHint>
            </SettingsSection>

            <SettingsSection title="Горячие клавиши">
              <div className="rounded-md border border-stone-500/15 p-3" style={{ backgroundColor: 'rgba(28, 25, 23, 0.5)' }}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {KEYBOARD_ROWS.map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-2">
                      <kbd
                        className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 rounded border font-mono text-[10px]"
                        style={{
                          backgroundColor: 'rgba(28, 25, 23, 0.7)',
                          borderColor: 'rgba(120, 113, 108, 0.25)',
                          color: 'rgba(214, 211, 209, 0.7)',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        {key}
                      </kbd>
                      <span className="font-serif text-[11px] text-stone-400/60">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SettingsSection>
          </motion.div>
        );
    }
  };

  return (
    <FocusTrap initialFocusRef={closeButtonRef}>
    <motion.div
      className="relative z-10 my-auto w-full max-w-lg mx-4"
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 30 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      {...dialogProps}
    >
      <div className="cinematic-menu-panel">
        {/* ── Header «Тетради» ── */}
        <header className="relative px-5 pb-2 pt-4">
          <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-stone-400/55 mb-1 text-center">
            Параметры
          </p>
          <h2 {...titleProps} className="font-serif text-2xl tracking-[0.16em] text-stone-100/90 text-center">
            Настройки
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            /* Тач-таргет ≥44px (контракт v4.17.1) */
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-md font-serif text-base text-stone-400/70 transition-colors hover:bg-white/5 hover:text-stone-100"
            aria-label="Закрыть настройки"
          >
            ✕
          </button>
        </header>

        {/* ── Tabs ── */}
        <div
          className="flex justify-center gap-1 border-b px-4 pt-1"
          style={{ borderColor: 'rgba(120, 113, 108, 0.2)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-3 py-2 font-serif text-[13px] uppercase tracking-[0.18em] transition-colors rounded-t-md"
                style={{
                  color: isActive ? 'rgba(240, 214, 158, 0.9)' : 'rgba(168, 162, 158, 0.55)',
                  backgroundColor: isActive ? 'rgba(226, 168, 75, 0.07)' : 'transparent',
                }}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(226, 168, 75, 0.6), transparent)',
                      boxShadow: '0 0 8px rgba(226, 168, 75, 0.3)',
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
        <div className="px-5 py-4 min-h-[260px] max-h-[55vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div
          className="border-t flex items-center justify-between px-5 py-3"
          style={{ borderColor: 'rgba(120, 113, 108, 0.2)' }}
        >
          <motion.button
            onClick={resetSettings}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-md border px-3 py-1.5 font-serif text-[11px] uppercase tracking-[0.2em] text-[rgba(240,214,158,0.85)] bg-[rgba(226,168,75,0.06)] border-[rgba(226,168,75,0.25)] transition-colors hover:border-[rgba(226,168,75,0.5)] hover:bg-[rgba(226,168,75,0.12)] hover:text-[rgba(240,214,158,1)]"
          >
            Сбросить настройки
          </motion.button>

          <div className="flex items-center gap-1.5">
            <kbd
              className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
              style={{
                backgroundColor: 'rgba(28, 25, 23, 0.6)',
                borderColor: 'rgba(120, 113, 108, 0.25)',
                color: 'rgba(168, 162, 158, 0.5)',
              }}
            >
              Esc
            </kbd>
            <span className="font-serif text-[10px] text-stone-500/40 tracking-wide">
              назад
            </span>
          </div>
        </div>
      </div>
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
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center overflow-y-auto"
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

          {/* Panel content — remounts on each open for fresh localStorage reads */}
          <SettingsPanelContent onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
