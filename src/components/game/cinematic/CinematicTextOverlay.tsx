/* ─── Volodka RPG – Cinematic Text Overlay (Enhanced) ───
   Advanced text overlay for cutscenes with:
   - Typewriter effect with variable speed (fast for action, slow for emotion)
   - Subtle text shadow/glow matching scene mood
   - Character name with colored underline
   - "Echo" text (fading repeated words for emphasis)
   - Pause indicators (ellipsis animation) between paragraphs
*/

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

/** Speed profile for the typewriter */
export type TextSpeedProfile = 'action' | 'emotion' | 'narration' | 'whisper';

/** Mood determines text shadow/glow style */
export type TextMood = 'neutral' | 'tense' | 'warm' | 'cold' | 'mysterious' | 'epic';

export interface CinematicTextOverlayProps {
  /** Full text content — supports \n for paragraph breaks */
  text: string;
  /** Character / speaker name (optional) */
  speakerName?: string;
  /** Accent color for speaker underline and glow */
  accentColor?: string;
  /** Typewriter speed profile */
  speedProfile?: TextSpeedProfile;
  /** Mood determines text shadow/glow styling */
  mood?: TextMood;
  /** Show "echo" effect on the last word of each paragraph */
  showEcho?: boolean;
  /** Show pause indicator between paragraphs */
  showPauseIndicator?: boolean;
  /** Whether the overlay is visible */
  visible?: boolean;
  /** Callback when typewriter completes */
  onComplete?: () => void;
  /** Allow click/tap to skip typewriter */
  skippable?: boolean;
}

/* ══════════════════════════════════════════════════════════════
   SPEED CONFIG — ms per character
   ══════════════════════════════════════════════════════════════ */

const SPEED_MS: Record<TextSpeedProfile, number> = {
  action: 15,
  emotion: 45,
  narration: 30,
  whisper: 55,
};

/* ══════════════════════════════════════════════════════════════
   MOOD TEXT STYLES
   ══════════════════════════════════════════════════════════════ */

function getMoodShadow(mood: TextMood, accent: string): string {
  switch (mood) {
    case 'tense':
      return '0 0 20px rgba(255, 50, 50, 0.3), 0 2px 8px rgba(0, 0, 0, 0.8)';
    case 'warm':
      return '0 0 20px rgba(255, 180, 50, 0.2), 0 2px 8px rgba(0, 0, 0, 0.75)';
    case 'cold':
      return `0 0 20px ${accent}30, 0 0 40px ${accent}15, 0 2px 8px rgba(0, 0, 0, 0.8)`;
    case 'mysterious':
      return `0 0 30px ${accent}25, 0 0 60px ${accent}10, 0 2px 12px rgba(0, 0, 0, 0.85)`;
    case 'epic':
      return `0 0 40px ${accent}40, 0 0 80px ${accent}20, 0 2px 10px rgba(0, 0, 0, 0.85)`;
    case 'neutral':
    default:
      return `0 0 15px ${accent}15, 0 2px 8px rgba(0, 0, 0, 0.75)`;
  }
}

function getMoodGlow(mood: TextMood, accent: string): string {
  switch (mood) {
    case 'tense': return 'rgba(255, 50, 50, 0.15)';
    case 'warm': return 'rgba(255, 180, 50, 0.1)';
    case 'cold': return `${accent}15`;
    case 'mysterious': return `${accent}12`;
    case 'epic': return `${accent}20`;
    default: return `${accent}10`;
  }
}

/* ══════════════════════════════════════════════════════════════
   ECHO TEXT — Fading repeated words
   ══════════════════════════════════════════════════════════════ */

const EchoText = memo(function EchoText({
  word,
  accentColor,
}: {
  word: string;
  accentColor: string;
}) {
  return (
    <span className="inline-flex items-center ml-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="italic"
          style={{
            color: accentColor,
            opacity: 0.4 - i * 0.12,
            transform: `translateX(${i * 4}px) translateY(${i * 2}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 - i * 0.12 }}
          transition={{ duration: 0.6, delay: 0.1 * i }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
});

/* ══════════════════════════════════════════════════════════════
   PAUSE INDICATOR — Ellipsis animation between paragraphs
   ══════════════════════════════════════════════════════════════ */

const PauseIndicator = memo(function PauseIndicator({
  accentColor,
  active,
}: {
  accentColor: string;
  active: boolean;
}) {
  if (!active) return null;
  return (
    <motion.div
      className="flex justify-center gap-1.5 my-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{
            background: accentColor,
            boxShadow: `0 0 6px ${accentColor}`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

function CinematicTextOverlayInner({
  text,
  speakerName,
  accentColor = 'var(--cyber-cyan)',
  speedProfile = 'narration',
  mood = 'neutral',
  showEcho = false,
  showPauseIndicator: _showPauseIndicator = false,
  visible = true,
  onComplete,
  skippable = true,
}: CinematicTextOverlayProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeFiredRef = useRef(false);

  const speedMs = SPEED_MS[speedProfile];
  const paragraphs = useMemo(() => text.split('\n').filter(Boolean), [text]);
  const fullText = paragraphs.join('\n');

  // Typewriter engine
  useEffect(() => {
    if (!visible) {
      setDisplayed('');
      setDone(false);
      setShowPause(false);
      charIndexRef.current = 0;
      completeFiredRef.current = false;
      return;
    }

    // Instant display for reduced motion
    if (reducedMotion) {
      setDisplayed(fullText);
      setDone(true);
      if (!completeFiredRef.current) {
        completeFiredRef.current = true;
        onComplete?.();
      }
      return;
    }

    charIndexRef.current = 0;
    setDisplayed('');
    setDone(false);
    setShowPause(false);
    completeFiredRef.current = false;

    const tick = () => {
      charIndexRef.current++;
      const current = fullText.slice(0, charIndexRef.current);
      setDisplayed(current);

      // Show pause indicator at paragraph breaks
      const lastChar = fullText[charIndexRef.current - 1];
      const nextChar = fullText[charIndexRef.current];
      if (lastChar === '\n' && nextChar && nextChar !== '\n') {
        setShowPause(true);
        timerRef.current = setTimeout(() => {
          setShowPause(false);
          timerRef.current = setTimeout(tick, 400);
        }, 800);
        return;
      }

      if (charIndexRef.current >= fullText.length) {
        setDone(true);
        setShowPause(false);
        if (!completeFiredRef.current) {
          completeFiredRef.current = true;
          onComplete?.();
        }
        return;
      }

      // Variable delay: pause longer at punctuation
      const ch = fullText[charIndexRef.current - 1];
      let delay = speedMs;
      if (ch === '.' || ch === '!' || ch === '?') delay = speedMs * 4;
      else if (ch === ',') delay = speedMs * 2;
      else if (ch === '—' || ch === '–') delay = speedMs * 3;
      else if (ch === ':') delay = speedMs * 2.5;

      timerRef.current = setTimeout(tick, delay);
    };

    // Start after a brief delay
    timerRef.current = setTimeout(tick, 200);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, fullText, speedMs, reducedMotion, onComplete]);

  // Skip handler
  const handleSkip = useCallback(() => {
    if (!skippable || done || reducedMotion) return;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDisplayed(fullText);
    setDone(true);
    setShowPause(false);
    if (!completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete?.();
    }
  }, [skippable, done, reducedMotion, fullText, onComplete]);

  // Extract last word of the last displayed paragraph for echo
  const lastParagraph = useMemo(() => {
    const parts = displayed.split('\n').filter(Boolean);
    return parts[parts.length - 1] ?? '';
  }, [displayed]);

  const lastWord = useMemo(() => {
    const words = lastParagraph.trim().split(/\s+/);
    return words[words.length - 1] ?? '';
  }, [lastParagraph]);

  const textShadow = getMoodShadow(mood, accentColor);
  const glowColor = getMoodGlow(mood, accentColor);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 20 }}
      onClick={handleSkip}
      role="region"
      aria-label={speakerName ? `${speakerName}: ${text}` : text}
    >
      {/* Ambient glow behind text */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: reducedMotion ? 0 : 1.6, ease: 'easeOut' }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-3 max-w-3xl px-8">
        {/* Speaker name with colored underline */}
        <AnimatePresence>
          {speakerName && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <h2
                className="text-xl sm:text-2xl tracking-[0.08em] text-center"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: `0 0 30px ${accentColor}40, 0 2px 8px rgba(0,0,0,0.8)`,
                }}
              >
                {speakerName}
              </h2>
              {/* Colored underline accent */}
              <motion.div
                className="h-px mt-1"
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.3, ease: 'easeOut' }}
                style={{
                  width: '120px',
                  transformOrigin: 'center',
                  background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
                }}
                aria-hidden="true"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main text with typewriter */}
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-lg sm:text-xl text-center leading-relaxed whitespace-pre-line"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(230, 225, 215, 0.9)',
            textShadow,
          }}
        >
          {displayed}
          {/* Typewriter cursor */}
          {!done && (
            <span
              className="inline-block w-0.5 h-[1.1em] ml-1 align-middle"
              style={{
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
                animation: 'cursor-blink 0.8s step-end infinite',
              }}
              aria-hidden="true"
            />
          )}
        </motion.p>

        {/* Echo text on the last word when done */}
        {done && showEcho && lastWord ? (
          <EchoText word={lastWord} accentColor={accentColor} />
        ) : null}

        {/* Pause indicator between paragraphs */}
        <AnimatePresence>
          <PauseIndicator accentColor={accentColor} active={showPause} />
        </AnimatePresence>
      </div>
    </div>
  );
}

export const CinematicTextOverlay = memo(CinematicTextOverlayInner);
