import { memo } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export type CinematicBarsVariant = 'menu' | 'intro';

export interface CinematicBarsProps {
  variant?: CinematicBarsVariant;
}

/** Letterbox bars — menu (styled) and intro (solid black) variants. */
export const CinematicBars = memo(function CinematicBars({ variant = 'menu' }: CinematicBarsProps) {
  if (variant === 'intro') {
    return (
      <>
        <div className="absolute top-0 left-0 right-0 h-[7dvh] min-h-[28px] bg-black pointer-events-none" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} />
        <div className="absolute bottom-0 left-0 right-0 h-[7dvh] min-h-[28px] bg-black pointer-events-none" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} />
      </>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-[6vh] min-h-[24px] menu-cinematic-bar menu-cinematic-bar-top pointer-events-none" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} />
      <div className="absolute bottom-0 left-0 right-0 h-[6vh] min-h-[24px] menu-cinematic-bar menu-cinematic-bar-bottom pointer-events-none" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} />
    </>
  );
});
