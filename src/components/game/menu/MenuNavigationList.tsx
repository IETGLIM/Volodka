import { memo } from 'react';
import { motion } from 'framer-motion';
import { audioEngine } from '@/engine/AudioEngine';
import {
  getFilmicMenuItemClass,
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
  fastAnimation?: boolean;
};

export const MenuNavigationList = memo(function MenuNavigationList({
  items,
  selectedIndex,
  setSelectedIndex,
  onSelect,
  savePreview,
  contentMotion,
  fastAnimation = false,
}: MenuNavigationListProps) {
  return (
    <div
      role="menu"
      aria-label="Главное меню"
      className="flex flex-col gap-1 py-2"
    >
      {items.map((item, index) => {
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
            whileHover={!isDisabled && contentMotion ? { x: 6 } : undefined}
            whileTap={!isDisabled && contentMotion ? { scale: 0.985 } : undefined}
            initial={contentMotion ? { opacity: 0, y: 8 } : false}
            animate={contentMotion ? { opacity: 1, y: 0 } : undefined}
            transition={contentMotion ? { delay: fastAnimation ? 0.2 + index * 0.04 : 1.6 + index * 0.1, duration: 0.45 } : undefined}
            className={getFilmicMenuItemClass(isSelected, isDisabled)}
          >
            <span className="relative z-10 flex flex-col items-center gap-1">
              <span className="tracking-[0.22em] uppercase">{item.label}</span>
              {isDisabled ? (
                <span className="text-[10px] font-serif italic tracking-normal normal-case text-stone-500/55">
                  нет сохранения
                </span>
              ) : null}
              {item.id === 'continue' && savePreview ? (
                <span className="text-[11px] font-serif tracking-wide text-stone-400/65 normal-case">
                  Ур.{savePreview.level} · {savePreview.sceneName} · {savePreview.poemsCollected}/{savePreview.poemsTotal}
                </span>
              ) : null}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});
