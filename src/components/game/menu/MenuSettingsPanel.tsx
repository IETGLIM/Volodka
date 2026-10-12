/* ─── Volodka RPG — Компактная панель настроек главного меню ───
 *
 * Режим «compact» единой системы настроек (приоритет №2 аудита v4.48):
 * те же примитивы «Ночной тетради», что и у полной панели в паузе.
 * Новое с v4.48.3: секция «Графика» с пресетами качества — теперь
 * качество можно выбрать ДО начала игры (важно для слабых устройств).
 */

import { motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { audioEngine } from '@/engine/AudioEngine';
import { safePlayMenuSfx } from '@/engine/menu/menuPresentation';
import { useMenuVisualToggles } from '@/store/selectors';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  QUALITY_PRESETS,
  QUALITY_PRESET_ORDER,
  formatQualityPresetDetailRu,
  type QualityPresetId,
} from '@/engine/graphics/qualityPresets';
import {
  SettingsSection,
  SettingsSwitchRow,
  SettingsChipsRow,
  SettingsHint,
} from '@/components/game/settings/NotebookSettings';

type MenuSettingsPanelProps = {
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onClose: () => void;
};

function playMenuClick(): void {
  safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
}

const QUALITY_OPTIONS: { id: QualityPresetId; label: string }[] = [
  { id: 'auto', label: 'Авто' },
  ...QUALITY_PRESET_ORDER.map((id) => ({ id, label: QUALITY_PRESETS[id].labelRu })),
];

function GraphicsQualitySection() {
  const { selectedPreset, preset, setPreset } = useGraphicsQuality();
  return (
    <SettingsSection title="Графика" flush>
      <SettingsChipsRow
        ariaLabel="Качество графики"
        options={QUALITY_OPTIONS}
        value={selectedPreset}
        onChange={(id) => {
          setPreset(id);
          playMenuClick();
        }}
      />
      <SettingsHint>{formatQualityPresetDetailRu(selectedPreset, preset)}</SettingsHint>
    </SettingsSection>
  );
}

function NoirModeToggle() {
  const { noirMode, toggleNoirMode } = useMenuVisualToggles();
  return (
    <SettingsSwitchRow
      label="Нуар-режим"
      checked={noirMode}
      onChange={() => {
        toggleNoirMode();
        playMenuClick();
      }}
    />
  );
}

function MatrixRainToggle() {
  const { matrixRainEnabled, toggleMatrixRain } = useMenuVisualToggles();
  return (
    <SettingsSwitchRow
      label="Матричный дождь"
      checked={matrixRainEnabled}
      onChange={() => {
        toggleMatrixRain();
        playMenuClick();
      }}
    />
  );
}

export function MenuSettingsPanel({ musicEnabled, onToggleMusic, onClose }: MenuSettingsPanelProps) {
  // Единый a11y-контракт с панелью паузы: role=dialog + aria-labelledby + FocusTrap
  const settingsDialog = usePanelDialog();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center cinematic-menu-shell"
      style={{ zIndex: UI_LAYERS.MENU }}
      onClick={onClose}
      {...settingsDialog.dialogProps}
    >
      <div className="absolute inset-0 bg-black/78" aria-hidden="true" />
      {/* my-auto: центрирование, которое не режет панель при переполнении */}
      <div className="my-auto">
      <FocusTrap initialFocusRef={settingsDialog.closeButtonRef}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="relative z-10 mx-auto w-[21rem] max-w-full cinematic-menu-panel px-5 py-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-stone-400/55 mb-2 text-center">
          Параметры
        </p>
        <h2 id={settingsDialog.titleId} className="font-serif text-2xl tracking-[0.16em] text-stone-100/90 text-center mb-4">
          Настройки
        </h2>

        <div className="flex flex-col gap-3">
          <GraphicsQualitySection />

          <SettingsSection title="Персонализация">
            <SettingsSwitchRow
              label="Музыка"
              checked={musicEnabled}
              onChange={() => {
                onToggleMusic();
                playMenuClick();
              }}
            />
            <NoirModeToggle />
            <MatrixRainToggle />
          </SettingsSection>

          <SettingsSection title="Управление">
            <SettingsHint>
              Доступность, сложность боя и аудио-микшер — в паузе во время игры.
            </SettingsHint>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-serif">
              <span className="text-stone-300/55">WASD</span>
              <span className="text-stone-400/50">Движение</span>
              <span className="text-stone-300/55">E</span>
              <span className="text-stone-400/50">Взаимодействие</span>
              <span className="text-stone-300/55">ESC</span>
              <span className="text-stone-400/50">Пауза</span>
            </div>
          </SettingsSection>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            ref={settingsDialog.closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки"
            className="cinematic-menu-item cinematic-menu-item--muted"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
      </FocusTrap>
      </div>
    </motion.div>
  );
}
