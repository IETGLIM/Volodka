import { memo } from 'react';
import { motion } from 'framer-motion';
import { audioEngine } from '@/engine/AudioEngine';
import {
  getAccentBarColor,
  getAccentColors,
  safePlayMenuSfx,
  type MenuItemDef,
  type MenuSavePreview,
} from '@/engine/menu/menuPresentation';

type MenuNavigationListProps = {
  items: MenuItemDef[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onSelect: (id: string) => void;
  savePreview: MenuSavePreview | null;
  contentMotion: boolean;
};

export const MenuNavigationList = memo(function MenuNavigationList({
  items,
  selectedIndex,
  setSelectedIndex,
  onSelect,
  savePreview,
  contentMotion,
}: MenuNavigationListProps) {
  return (
    <div
      role="menu"
      aria-label="Главное меню"
      className="flex flex-col gap-1.5 p-3"
    >
      {items.map((item, index) => {
        const colors = getAccentColors(item.accent, selectedIndex === index);
        const isDisabled = Boolean(item.disabled);
        const isSelected = selectedIndex === index && !isDisabled;

        return (
          <motion.button
            key={item.id}
            type="button"
            role="menuitem"
            data-testid={item.id === 'new' ? 'menu-new-game' : undefined}
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            aria-label={isDisabled && item.id === 'continue' ? `${item.label}: нет сохранения` : item.label}
            disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) onSelect(item.id);
            }}
            onMouseEnter={() => {
              if (!isDisabled) {
                setSelectedIndex(index);
                safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
              }
            }}
            whileHover={!isDisabled && contentMotion ? { scale: 1.02, x: 4 } : undefined}
            whileTap={!isDisabled && contentMotion ? { scale: 0.97 } : undefined}
            initial={contentMotion ? { opacity: 0, x: -20 } : false}
            animate={contentMotion ? { opacity: 1, x: 0 } : undefined}
            transition={contentMotion ? { delay: 2.0 + index * 0.12, duration: 0.4 } : undefined}
            className={`group relative w-full px-5 py-3.5 font-mono text-base uppercase tracking-wider border rounded transition-all duration-300 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/80 focus-visible:outline-offset-2 ${colors.border} ${!isDisabled ? colors.borderHover : ''} ${colors.bg} ${!isDisabled ? colors.bgHover : ''} ${colors.text} ${!isDisabled ? colors.textHover : ''} ${!isDisabled ? 'menu-btn-enhanced menu-btn-signal-line cursor-pointer' : 'opacity-30 cursor-not-allowed menu-btn-disabled'}`}
          >
            {isSelected ? (
              <motion.div
                layoutId="menu-selection-indicator"
                className="absolute left-0 top-0 bottom-0 rounded-l"
                style={{ width: '3px', background: getAccentBarColor(item.accent) }}
                aria-hidden="true"
              />
            ) : null}

            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className={isSelected ? 'opacity-100' : 'opacity-60'} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isDisabled ? (
                <span className="ml-2 text-[9px] text-slate-500/50 normal-case tracking-normal menu-continue-dots">
                  нет сохранения
                </span>
              ) : null}
            </span>

            {item.id === 'continue' && savePreview ? (
              <span className="relative z-10 flex items-center justify-center gap-1.5 mt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80 continue-emerald-indicator" aria-hidden="true" />
                <span className="text-[11px] text-emerald-400/70 font-mono tracking-wide">
                  Ур.{savePreview.level} • {savePreview.sceneName} • 📖 {savePreview.poemsCollected}/{savePreview.poemsTotal}
                </span>
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
});
