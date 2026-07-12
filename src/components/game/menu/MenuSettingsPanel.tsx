import { motion } from 'framer-motion';
import { audioEngine } from '@/engine/AudioEngine';
import { safePlayMenuSfx } from '@/engine/menu/menuPresentation';
import { useMenuVisualToggles } from '@/store/selectors';
import { SettingsToggle } from '@/components/game/menu/SettingsToggle';

type MenuSettingsPanelProps = {
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onClose: () => void;
};

function MatrixRainToggle() {
  const { matrixRainEnabled, toggleMatrixRain } = useMenuVisualToggles();
  return (
    <SettingsToggle
      label="Матричный дождь"
      enabled={matrixRainEnabled}
      onToggle={() => {
        toggleMatrixRain();
        safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
      }}
      ariaLabel={matrixRainEnabled ? 'Выключить матричный дождь' : 'Включить матричный дождь'}
    />
  );
}

function NoirModeToggle() {
  const { noirMode, toggleNoirMode } = useMenuVisualToggles();
  return (
    <SettingsToggle
      label="Нуар-режим"
      enabled={noirMode}
      enabledClassName="border-amber-500/40 bg-amber-950/30 text-amber-300"
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
      className="fixed inset-0 flex items-center justify-center z-[60]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="relative z-10 w-80 bg-slate-950/95 border border-cyan-500/20 backdrop-blur-md overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://settings</span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-100 font-mono tracking-wide">НАСТРОЙКИ</h2>

          <SettingsToggle
            label="Музыка"
            enabled={musicEnabled}
            onToggle={() => {
              onToggleMusic();
              safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
            }}
            ariaLabel={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
          />

          <MatrixRainToggle />
          <NoirModeToggle />

          <div className="pt-3 border-t border-slate-800/50 space-y-1.5">
            <p className="text-[10px] font-mono text-slate-500 tracking-wide uppercase mb-2">Управление</p>
            <p className="text-[10px] font-mono text-slate-500/90 leading-relaxed mb-2">
              Полные настройки (графика, доступность, сложность боя) — в паузе во время игры.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
              <span className="text-cyan-500/50">WASD</span>
              <span className="text-slate-400/50">Движение</span>
              <span className="text-cyan-500/50">E</span>
              <span className="text-slate-400/50">Взаимодействие</span>
              <span className="text-cyan-500/50">ESC</span>
              <span className="text-slate-400/50">Пауза</span>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-500/10 px-4 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки"
            className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider border border-cyan-500/25 text-cyan-300/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70"
          >
            Закрыть [ESC]
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
