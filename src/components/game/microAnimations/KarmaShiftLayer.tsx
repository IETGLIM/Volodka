/* ─── Volodka RPG – Karma Shift Layer ───
 * Subscribes to player karma changes via usePlayerKarma() and pushes a
 * KarmaShiftIndicator popup to the karmaShiftPool for each discrete delta.
 *
 * Mounted alongside the MoralCompassHUD (which already has its own pulse
 * animation). The layer adds a discrete "☯ +N Свет / Тень / Тьма" floating
 * label that auto-dismisses after KARMA_SHIFT_TTL_MS — Disco Elysium-style
 * relationship feedback.
 */

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KarmaShiftIndicator } from '@/components/game/microAnimations/KarmaShiftIndicator';
import { karmaShiftPool } from '@/components/game/microAnimations/karmaShiftPool';
import { useNotificationPool } from '@/components/game/microAnimations/useNotificationPoolSubscription';
import { KARMA_SHIFT_TTL_MS } from '@/engine/microAnimations/microAnimationsConstants';
import { usePlayerKarma } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomMoralCompassPx, bottomRightInsetPx } from '@/shared/constants/hudLayout';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

/* Position the floating karma pip directly above the MoralCompassHUD ring
 * (which sits at bottom-right). Each stacked entry offsets upward so multiple
 * rapid karma shifts don't overlap. */
const STACK_OFFSET_PX = 28;
const BASE_OFFSET_PX = 70; // ring height + gap

function KarmaShiftLayerPanel() {
  const karma = usePlayerKarma();
  const prevKarmaRef = useRef(karma);
  const quietStyle = useHudQuietStyle();

  useEffect(() => {
    if (prevKarmaRef.current === karma) return;
    const delta = karma - prevKarmaRef.current;
    prevKarmaRef.current = karma;
    if (delta === 0) return;

    /* Inline import avoids circular dependency at module load time. The pool
     * is a stable singleton, so importing inside the effect is fine. */
    void import('@/components/game/microAnimations/karmaShiftPool').then((mod) => {
      mod.showKarmaShift(delta, karma);
    });
  }, [karma]);

  const entries = useNotificationPool(karmaShiftPool);
  const now = Date.now();

  return (
    <div
      className="fixed pointer-events-none"
      data-exploration-ui
      data-testid="karma-shift-layer"
      style={{
        zIndex: UI_LAYERS.HUD + 4,
        bottom: `calc(${bottomMoralCompassPx()}px + ${BASE_OFFSET_PX}px)`,
        right: bottomRightInsetPx(),
        ...quietStyle,
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {entries.map((entry, index) => {
          if (now - entry.createdAt > KARMA_SHIFT_TTL_MS) return null;
          return (
            <div
              key={entry.id}
              style={{
                position: 'absolute',
                right: 0,
                bottom: index * STACK_OFFSET_PX,
              }}
            >
              <KarmaShiftIndicator delta={entry.delta} currentKarma={entry.currentKarma} />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function KarmaShiftLayer() {
  return (
    <ErrorBoundary name="karma-shift-layer" fallback={null}>
      <KarmaShiftLayerPanel />
    </ErrorBoundary>
  );
}
