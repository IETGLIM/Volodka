
/* ─── Volodka RPG – Interaction Hint Popup ───
   Shows contextual action hints when the player is near
   interactive objects/NPCs. Cyberpunk glass-morphism styling.
*/

import { useState, useEffect } from 'react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import {
  isExplorationHudProfile,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';
import { useHudProximityFxActive } from '@/hooks/useHudProximityFxActive';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useMobileDetection } from '@/components/game/orchestrator/useMobileDetection';
import { useDiegeticNarrativeState } from '@/store/selectors';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, DoorOpen, Hand, MessageCircle, Eye } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { playSfx } from '@/engine/audio/interactionSfx';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomInteractPromptPx } from '@/shared/constants/hudLayout';
import {
  formatInteractionHintAria,
  formatInteractionHintKey,
  getInteractionHintVisual,
  type InteractionHintType,
} from '@/engine/exploration/explorationUxPresentation';

/* ── Interaction hint data shape ── */
interface InteractionHint {
  label: string;
  key: string;
  description?: string;
  type: InteractionHintType;
}

/* ── Type-based icons ── */
function HintIcon({ type, color }: { type: InteractionHintType; color: string }) {
  const iconSize = 16;
  switch (type) {
    case 'npc':
      return <MessageCircle size={iconSize} color={color} />;
    case 'object':
      return <Package size={iconSize} color={color} />;
    case 'exit':
      return <DoorOpen size={iconSize} color={color} />;
    case 'item':
      return <Eye size={iconSize} color={color} />;
  }
}

/* ── Main component ── */
export function InteractionHintPopup() {
  const profile = useGameplayPresentationProfile();
  const explorationHudActive = isExplorationHudProfile(profile);
  const reducedMotion = useEffectiveReducedMotion();
  const isTouchDevice = useTouchDevice();
  const isMobileViewport = useMobileDetection();
  const crosshairPromptActive = useHudProximityFxActive();
  const gamepadConnected = useGamepadConnected();
  const diegeticNarrative = useDiegeticNarrativeState();
  const [hint, setHint] = useState<InteractionHint | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  /* ── Listen for interaction:hint event ── */
  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', (payload) => {
      setHint(payload);
      setIsVisible(true);
    });

    const unsubEnd = eventBus.on('interaction:end', () => {
      setIsVisible(false);
    });

    const unsubStart = eventBus.on('interaction:start', () => {
      // When interaction starts, hide the hint (player is now interacting)
      setIsVisible(false);
      playSfx('ui_click');
    });

    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
    };
  }, []);

  useEffect(() => {
    if (!explorationHudActive) {
      setIsVisible(false);
    }
  }, [explorationHudActive]);

  const shouldRender =
    explorationHudActive
    && hint !== null
    && diegeticNarrative == null
    && !crosshairPromptActive;

  /* ── Get accent style for current hint type ── */
  const accent = hint ? getInteractionHintVisual(hint.type) : getInteractionHintVisual('npc');
  const hintInputOptions = { gamepadConnected, touchDevice: isTouchDevice };
  const hintKey = hint
    ? formatInteractionHintKey(hint.key, hintInputOptions)
    : 'E';
  const showTouchHint = hintKey === 'touch';
  const reserveMobileControls = isTouchDevice || isMobileViewport;

  return (
    <AnimatePresence>
      {shouldRender && hint && (
        <motion.div
          key="interaction-hint-popup"
          initial={reducedMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: isVisible ? 0 : 10, opacity: isVisible ? 1 : 0 }}
          exit={reducedMotion ? undefined : { y: 10, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
          className="interaction-hint-popup fixed left-1/2 -translate-x-1/2 pointer-events-none select-none"
          data-exploration-ui
          data-testid="interaction-hint"
          role="status"
          aria-live="polite"
          aria-label={hint ? formatInteractionHintAria(hint.label, hint.key, hint.description, hintInputOptions) : undefined}
          style={{
            zIndex: UI_LAYERS.HUD + 1,
            bottom: `calc(${bottomInteractPromptPx(reserveMobileControls)}px + env(safe-area-inset-bottom, 0px))`,
            width: 'max-content',
            maxWidth: 'calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
          }}
        >
          <div
            className="interaction-hint-card interaction-hint-glow"
            style={{
              borderColor: accent.border,
              animation: reducedMotion ? 'none' : 'hint-border-pulse 2.5s ease-in-out infinite',
            }}
          >
            {/* Scan-line overlay */}
            <div className="hint-scanlines" />

            {/* Scan-sweep overlay */}
            {!reducedMotion ? (
              <div className="hint-sweep">
                <div
                  className="hint-sweep-inner"
                  style={{
                    background: `linear-gradient(180deg, transparent, ${accent.bg}, transparent)`,
                  }}
                />
              </div>
            ) : null}

            {/* Corner bracket decorations */}
            <div className="hint-bracket hint-bracket-tl" style={{ borderColor: `${accent.color}55` }} />
            <div className="hint-bracket hint-bracket-tr" style={{ borderColor: `${accent.color}55` }} />
            <div className="hint-bracket hint-bracket-bl" style={{ borderColor: `${accent.color}55` }} />
            <div className="hint-bracket hint-bracket-br" style={{ borderColor: `${accent.color}55` }} />

            {/* Content */}
            <div className="hint-content">
              {/* Type icon */}
              <div className="hint-icon-wrap" style={{ filter: `drop-shadow(0 0 6px ${accent.color}66)` }}>
                <HintIcon type={hint.type} color={accent.color} />
              </div>

              {/* Key binding badge — shows touch icon on mobile, [E] on desktop */}
              <div
                className="hint-key-badge"
                style={{
                  background: accent.bg,
                  borderColor: accent.border,
                  color: accent.color,
                  boxShadow: accent.glow,
                  animation: reducedMotion ? 'none' : 'hint-key-pulse 2s ease-in-out infinite',
                }}
              >
                {showTouchHint ? <Hand size={16} /> : `[${hintKey}]`}
              </div>

              {/* Text content */}
              <div className="hint-text-area">
                {/* Action label */}
                <span
                  className="hint-label"
                  style={{
                    color: accent.color,
                    textShadow: `0 0 8px ${accent.color}44`,
                  }}
                >
                  {hint.label}
                </span>

                {/* Optional description */}
                {hint.description && (
                  <span
                    className="hint-description"
                    style={{ color: `${accent.color}88` }}
                  >
                    {hint.description}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className="hint-bottom-line"
              style={{ background: `linear-gradient(90deg, transparent, ${accent.color}44, transparent)` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
