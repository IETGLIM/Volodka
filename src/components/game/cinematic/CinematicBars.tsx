import { memo } from 'react';

export type CinematicBarsVariant = 'menu' | 'intro';

export interface CinematicBarsProps {
  variant?: CinematicBarsVariant;
}

/** Letterbox bars — menu (styled) and intro (solid black) variants. */
export const CinematicBars = memo(function CinematicBars({ variant = 'menu' }: CinematicBarsProps) {
  if (variant === 'intro') {
    return (
      <>
        <div className="absolute top-0 left-0 right-0 z-[65] h-[7dvh] min-h-[28px] bg-black pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 z-[65] h-[7dvh] min-h-[28px] bg-black pointer-events-none" />
      </>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-40 h-[6vh] min-h-[24px] menu-cinematic-bar menu-cinematic-bar-top pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 z-40 h-[6vh] min-h-[24px] menu-cinematic-bar menu-cinematic-bar-bottom pointer-events-none" />
    </>
  );
});
