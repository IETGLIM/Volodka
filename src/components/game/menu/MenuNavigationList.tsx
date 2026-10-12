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
        // v4.43.0: каскад ускорен (было 1.6 + index*0.1 — пункты доползали
        // почти три секунды). Меню должно быть готово к взаимодействию
        // за полсекунды; «вау» делает титр, а не очередь кнопок.
        const animDelay = contentMotion
          ? fastAnimation
            ? 0.1 + index * 0.03
            : 0.3 + index * 0.06
          : 0;
        const style: CSSProperties | undefined = contentMotion
          ? {
              animation: 'menu-item-in 0.35s ease-out both',
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
            /* v4.48: «Новая игра» — главное действие, единственный пункт
             * с собственным голосом (янтарь); остальные строки — серебро. */
            className={`${getFilmicMenuItemClass(isSelected, isDisabled)}${item.id === 'new' ? ' cinematic-menu-item--primary' : ''}`}
          >
            <span className="relative z-10 flex flex-col items-start gap-1 text-left">
              <span className="tracking-[0.3em] uppercase">{item.label}</span>
              {isDisabled ? (
                <span className="text-[10px] font-serif italic tracking-normal normal-case" style={{ color: 'rgba(130,128,118,0.6)' }}>
                  нет сохранения
                </span>
              ) : null}
              {item.id === 'continue' && savePreview ? (
                <span className="text-[11px] font-serif tracking-wide normal-case italic" style={{ color: 'rgba(169,166,152,0.65)' }}>
                  {savePreview.sceneName} · Ур.{savePreview.level} · {savePreview.poemsCollected}/{savePreview.poemsTotal} стихов
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
});
