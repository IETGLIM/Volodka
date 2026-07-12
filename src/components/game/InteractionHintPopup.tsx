
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
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useDiegeticNarrativeState } from '@/store/selectors';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, DoorOpen, Sparkles, Hand } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
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
      return <User size={iconSize} color={color} />;
    case 'object':
      return <Package size={iconSize} color={color} />;
    case 'exit':
      return <DoorOpen size={iconSize} color={color} />;
    case 'item':
      return <Sparkles size={iconSize} color={color} />;
  }
}

/* ── Corner bracket decorations ── */
function CornerBrackets({ accentColor }: { accentColor: string }) {
  const bracketStyle = (position: string): React.CSSProperties => ({
    position: 'absolute',
    width: '10px',
    height: '10px',
    pointerEvents: 'none',
    ...(position === 'tl' && { top: 0, left: 0, borderTop: `1px solid ${accentColor}`, borderLeft: `1px solid ${accentColor}` }),
    ...(position === 'tr' && { top: 0, right: 0, borderTop: `1px solid ${accentColor}`, borderRight: `1px solid ${accentColor}` }),
    ...(position === 'bl' && { bottom: 0, left: 0, borderBottom: `1px solid ${accentColor}`, borderLeft: `1px solid ${accentColor}` }),
    ...(position === 'br' && { bottom: 0, right: 0, borderBottom: `1px solid ${accentColor}`, borderRight: `1px solid ${accentColor}` }),
  });

  return (
    <>
      <div style={bracketStyle('tl')} />
      <div style={bracketStyle('tr')} />
      <div style={bracketStyle('bl')} />
      <div style={bracketStyle('br')} />
    </>
  );
}

/* ── Main component ── */
export function InteractionHintPopup() {
  const profile = useGameplayPresentationProfile();
  const explorationHudActive = isExplorationHudProfile(profile);
  const reducedMotion = useEffectiveReducedMotion();
  const isTouchDevice = useTouchDevice();
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

  const shouldRender = explorationHudActive && hint !== null && diegeticNarrative == null;

  /* ── Get accent style for current hint type ── */
  const accent = hint ? getInteractionHintVisual(hint.type) : getInteractionHintVisual('npc');
  const hintInputOptions = { gamepadConnected, touchDevice: isTouchDevice };
  const hintKey = hint
    ? formatInteractionHintKey(hint.key, hintInputOptions)
    : 'E';
  const showTouchHint = hintKey === 'touch';

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
          style={{ zIndex: UI_LAYERS.HUD + 1, bottom: bottomInteractPromptPx(isTouchDevice) }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              background: 'rgba(0, 8, 16, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${accent.border}`,
              borderRadius: '6px',
              boxShadow: `${accent.glow}, inset 0 0 12px rgba(0,0,0,0.3)`,
              minWidth: '160px',
            }}
          >
            {/* Scan-line sweep overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}
            />

            {!reducedMotion ? (
              <div
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
              >
                <div
                  className="absolute left-0 right-0 h-4"
                  style={{
                    top: '-20%',
                    background: `linear-gradient(180deg, transparent, ${accent.bg}, transparent)`,
                    animation: 'hint-scan-sweep 3s ease-in-out infinite',
                  }}
                />
              </div>
            ) : null}

            {/* Corner bracket decorations */}
            <CornerBrackets accentColor={`${accent.color}55`} />

            {/* Content */}
            <div className="relative z-30 flex items-center gap-3 px-4 py-2.5">
              {/* Type icon */}
              <div
                className="flex-shrink-0"
                style={{
                  filter: `drop-shadow(0 0 4px ${accent.color}66)`,
                }}
              >
                <HintIcon type={hint.type} color={accent.color} />
              </div>

              {/* Key binding badge — shows touch icon on mobile, [E] on desktop */}
              <div
                className="hint-key-badge flex-shrink-0 font-mono text-base font-bold px-2 py-0.5 rounded"
                style={{
                  background: accent.bg,
                  border: `1px solid ${accent.border}`,
                  color: accent.color,
                  boxShadow: accent.glow,
                  animation: reducedMotion ? undefined : 'hint-key-pulse 2s ease-in-out infinite',
                }}
              >
                {showTouchHint ? <Hand size={16} /> : `[${hintKey}]`}
              </div>

              {/* Text content */}
              <div className="flex flex-col min-w-0">
                {/* Action label */}
                <span
                  className="font-mono text-sm font-semibold tracking-wide truncate"
                  style={{
                    color: accent.color,
                    textShadow: `0 0 6px ${accent.color}44`,
                  }}
                >
                  {hint.label}
                </span>

                {/* Optional description */}
                {hint.description && (
                  <span
                    className="font-mono text-[10px] tracking-wider truncate"
                    style={{
                      color: `${accent.color}88`,
                    }}
                  >
                    {hint.description}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-2 right-2 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent.color}44, transparent)`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
