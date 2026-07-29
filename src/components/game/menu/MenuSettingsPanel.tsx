import { motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { audioEngine } from '@/engine/AudioEngine';
import { safePlayMenuSfx } from '@/engine/menu/menuPresentation';
import { useMenuVisualToggles } from '@/store/selectors';
import { SettingsToggle } from '@/components/game/menu/SettingsToggle';

type MenuSettingsPanelProps = {
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onClose: () => void;
};

function NoirModeToggle() {
  const { noirMode, toggleNoirMode } = useMenuVisualToggles();
  return (
    <SettingsToggle
      label="Нуар-режим"
      enabled={noirMode}
      enabledClassName="border-stone-400/30 bg-stone-950/40 text-stone-200"
      onToggle={() => {
        toggleNoirMode();
        safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
      }}
      ariaLabel={noirMode ? 'Выключить нуар-режим' : 'Включить нуар-режим'}
    />
  );
}

export function MenuSettingsPanel({ musicEnabled, onToggleMusic, onClose }: MenuSettingsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center cinematic-menu-shell"
      style={{ zIndex: UI_LAYERS.MENU }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
    >
      <div className="absolute inset-0 bg-black/78" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="relative z-10 w-80 cinematic-menu-panel px-5 py-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-stone-400/55 mb-2 text-center">
          Параметры
        </p>
        <h2 className="font-serif text-2xl tracking-[0.16em] text-stone-100/90 text-center mb-5">
          Настройки
        </h2>

        <div className="flex flex-col gap-3">
          <SettingsToggle
            label="Музыка"
            enabled={musicEnabled}
            onToggle={() => {
              onToggleMusic();
              safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
            }}
            ariaLabel={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
          />

          <NoirModeToggle />

          <div className="pt-3 border-t border-stone-500/15 space-y-1.5">
            <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-stone-500/60 mb-2 text-center">
              Управление
            </p>
            <p className="text-[11px] font-serif text-stone-400/65 leading-relaxed mb-2 text-center">
              Полные настройки (графика, доступность, сложность боя) — в паузе во время игры.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-serif">
              <span className="text-stone-300/55">WASD</span>
              <span className="text-stone-400/50">Движение</span>
              <span className="text-stone-300/55">E</span>
              <span className="text-stone-400/50">Взаимодействие</span>
              <span className="text-stone-300/55">ESC</span>
              <span className="text-stone-400/50">Пауза</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки"
            className="cinematic-menu-item cinematic-menu-item--muted"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
