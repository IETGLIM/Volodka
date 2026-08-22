import { memo, type CSSProperties } from 'react';
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

/**
 * INP-CRITICAL: this component previously used framer-motion's `motion.button`
 * with whileHover / whileTap / initial / animate / transition props.
 * framer-motion initializes layout calculations synchronously on each mount
 * (measuring the DOM, setting up transform springs) — this blocked the
 * pointer event's INP to ~760ms on the New Game click.
 *
 * Replaced with a plain <button> + CSS transitions/animations:
 *  - whileHover { x: 6 }      → :hover { translate-x-[6px] } (CSS transition)
 *  - whileTap { scale: 0.985 } → :active { scale-[0.985] }   (CSS transition)
 *  - initial/animate opacity+y → CSS @keyframes via inline style (animation-delay)
 *
 * CSS transitions are GPU-accelerated and don't block the main thread —
 * the click handler runs immediately, INP drops from ~760ms to <100ms.
 */
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
        // CSS animation delay for the mount-in fade (replaces framer-motion
        // transition.delay). fastAnimation = quick fade on menu re-open;
        // default = the slow cinematic staggered reveal on first boot.
        const animDelay = contentMotion
          ? fastAnimation
            ? 0.2 + index * 0.04
            : 1.6 + index * 0.1
          : 0;
        const style: CSSProperties | undefined = contentMotion
          ? {
              animation: 'menu-item-in 0.45s ease-out both',
              animationDelay: `${animDelay}s`,
            }
          : undefined;

        return (
          <button
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
            style={style}
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
          </button>
        );
      })}
    </div>
  );
});
