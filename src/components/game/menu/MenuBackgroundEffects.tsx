import { memo } from 'react';
import { FilmGrain, CinematicBars } from '@/components/game/cinematic';
import { MenuParticles } from '@/components/game/menu/MenuParticles';
import { CanvasMatrixRain } from '@/components/game/shared/CanvasMatrixRain';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { MenuScreenFx } from '@/engine/menu/menuFxTier';
import { getMenuParticleCounts } from '@/engine/menu/menuFxTier';
import type { DeviceTier } from '@/hooks/useDeviceTier';
import { POLYHAVEN_MENU_PLATE } from '@/config/polyhavenAssets';

type MenuBackgroundEffectsProps = {
  fx: MenuScreenFx;
  tier: DeviceTier;
  matrixRainEnabled: boolean;
  contentMotion: boolean;
};

function MatrixRainFallback() {
  return null;
}

/**
 * v4.43.0 — редизайн меню: «один визуальный язык» (filmic).
 *
 * Осталось ровно четыре слоя:
 *   1. Фотоплашка (Poly Haven, CC0) + ноир-грейдинг — душа сцены.
 *   2. Плёночное зерно (FilmGrain) — фактура.
 *   3. Единый леттербокс (CinematicBars) — титульная рамка.
 *   4. Одна статичная виньетка + лёгкие частицы.
 *
 * Убрано (см. коммит-лог): жёсткий двойной letterbox z-[60] (конфликтовал
 * с CinematicBars и наезжал на чипы), circuit grid, безусловные scanlines,
 * CRT-sweep, туманные слои, ember/sparkle неон-частицы, dust field,
 * пульсирующая виньетка, ASCII-арт, DataStream, SystemStatus, уголки —
 * «терминальный» язык, конфликтовавший с filmic-серифами титула.
 * Matrix rain сохранён как игровой переключатель (поэтическая тема мира).
 */
export const MenuBackgroundEffects = memo(function MenuBackgroundEffects({
  fx,
  tier,
  matrixRainEnabled,
  contentMotion: _contentMotion,
}: MenuBackgroundEffectsProps) {
  const particleCounts = getMenuParticleCounts(tier);

  return (
    <>
      {fx.atmosphericPan ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Photographic night plate (Poly Haven CC0) + noir grade overlays */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.06]"
            style={{
              backgroundImage: `url(${POLYHAVEN_MENU_PLATE})`,
              filter: 'saturate(0.7) brightness(0.5) contrast(1.18)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 90% 55% at 50% 38%, rgba(20,40,70,0.38) 0%, transparent 70%), linear-gradient(180deg, rgba(2,2,8,0.6) 0%, rgba(10,16,32,0.28) 42%, rgba(18,16,26,0.48) 70%, rgba(5,5,8,0.9) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 115%, rgba(8,12,28,0.92) 0%, transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.7) 100%)',
            }}
          />
        </div>
      ) : null}

      {fx.matrixRain && matrixRainEnabled ? (
        <ErrorBoundary name="menu-matrix-rain" fallback={<MatrixRainFallback />}>
          <CanvasMatrixRain opacity={0.22} charOpacity={0.75} chars="アイウエオカキクケコ0123456789ABCDEF" />
        </ErrorBoundary>
      ) : null}

      {fx.menuParticles ? <MenuParticles counts={{ drift: particleCounts.drift, stream: particleCounts.stream }} /> : null}
      {fx.filmGrain ? <FilmGrain opacity={0.035} zIndex={49} /> : null}

      {/* Единая статичная виньетка */}
      <div
        className="absolute inset-0 pointer-events-none z-[30]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 24%, rgba(0, 0, 0, 0.78) 100%)' }}
        aria-hidden="true"
      />

      {/* Единая система леттербокса — CinematicBars (6vh / min 24px) */}
      {fx.cinematicBars ? <CinematicBars /> : null}
    </>
  );
});
