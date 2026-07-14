import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePoemWorldEffectController } from '@/components/game/poemWorldEffect/usePoemWorldEffectController';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const FLOATING_GLYPHS = '✦☆⟡◆◇⬡⬢◈❋✧❈⋆⍟⎔⏣⬠';

function LetterboxPulse({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  if (!visible || reducedMotion) return null;
  return (
    <>
      <motion.div
        className="fixed left-0 right-0 pointer-events-none"
        style={{ top: 0, height: '6vh', zIndex: UI_LAYERS.POEM_WORLD_EFFECT + 1, background: 'rgba(0,0,0,0.85)' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      <motion.div
        className="fixed left-0 right-0 pointer-events-none"
        style={{ bottom: 0, height: '6vh', zIndex: UI_LAYERS.POEM_WORLD_EFFECT + 1, background: 'rgba(0,0,0,0.85)' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
    </>
  );
}

/** Shimmering pulsing aura border around the screen */
function ShimmeringAura({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  if (reducedMotion) return null;
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0.3, 0.5, 0.2] }}
      transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, transparent 60%, ${color}44 80%, transparent 100%),
          radial-gradient(ellipse at 20% 30%, ${color}22 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, ${color}22 0%, transparent 50%)
        `,
        mixBlendMode: 'screen',
      }}
    />
  );
}

/** Floating glyph particles that drift upward near the effect */
function FloatingGlyphs({
  eventId,
  color,
  reducedMotion,
}: {
  eventId: string;
  color: string;
  reducedMotion: boolean;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const glyphs = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      char: FLOATING_GLYPHS[Math.floor(Math.random() * FLOATING_GLYPHS.length)]!,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
      size: 12 + Math.floor(Math.random() * 10),
    }));
  }, [eventId]);

  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {glyphs.map((g) => (
        <motion.span
          key={g.id}
          className="absolute"
          style={{
            left: `${g.x}%`,
            bottom: '-5%',
            color,
            fontSize: g.size,
            fontFamily: '"Courier New", monospace',
            textShadow: `0 0 12px ${color}`,
            opacity: 0.5,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-110vh', opacity: [0, 0.6, 0.4, 0] }}
          transition={{
            duration: g.duration,
            delay: g.delay,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          {g.char}
        </motion.span>
      ))}
    </div>
  );
}

/** Subtle color tint overlay matching the poem's element */
function SceneColorTint({ tint, reducedMotion }: { tint: string; reducedMotion: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: reducedMotion ? 0.15 : 0.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${tint} 0%, transparent 70%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
}

function PoemWorldEffectInner() {
  const { activeEvent, reducedMotion, isExpiring } = usePoemWorldEffectController();
  const profile = activeEvent?.profile;
  const showLetterbox = profile?.visualPreset === 'letterbox_truth';
  const tint = profile?.worldTint ?? 'rgba(0,255,200,0.08)';
  const epigraph = profile?.narrationLine;

  // Derive an accent color from the tint for shimmer/glyph effects
  const accentColor = useMemo(() => {
    // Parse rgba to get a base color for glow effects
    const match = tint.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 1)`;
    }
    return '#00ffc8';
  }, [tint]);

  return (
    <AnimatePresence>
      {activeEvent ? (
        <motion.div
          key={activeEvent.id}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.POEM_WORLD_EFFECT }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpiring ? 0.3 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: isExpiring ? 1.2 : (reducedMotion ? 0 : 0.25), ease: 'easeOut' },
          }}
          aria-hidden
        >
          {/* Scene color tint — always shown */}
          <SceneColorTint tint={tint} reducedMotion={reducedMotion} />

          {/* Shimmering aura */}
          <ShimmeringAura color={accentColor} reducedMotion={reducedMotion} />

          {/* God rays preset */}
          {profile?.visualPreset === 'god_rays_gold' && !reducedMotion ? (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.2] }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{
                background:
                  'conic-gradient(from 180deg at 50% -10%, rgba(255,220,100,0.25), transparent 40%, rgba(255,220,100,0.15), transparent 80%)',
                mixBlendMode: 'screen',
              }}
            />
          ) : null}

          {/* Floating glyph particles */}
          <FloatingGlyphs
            eventId={activeEvent.id}
            color={accentColor}
            reducedMotion={reducedMotion}
          />

          <LetterboxPulse visible={showLetterbox} reducedMotion={reducedMotion} />
          {epigraph ? (
            <motion.p
              className="absolute left-1/2 -translate-x-1/2 text-center px-6 max-w-2xl"
              style={{
                bottom: showLetterbox && !reducedMotion ? '10vh' : '12%',
                zIndex: UI_LAYERS.POEM_WORLD_EFFECT + 2,
                color: 'rgba(230,245,255,0.92)',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
                fontStyle: 'italic',
                textShadow: `0 0 24px ${accentColor}58`,
                letterSpacing: '0.02em',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.15 }}
            >
              {epigraph}
            </motion.p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PoemWorldEffect() {
  return (
    <ErrorBoundary name="PoemWorldEffect" fallback={null}>
      <PoemWorldEffectInner />
    </ErrorBoundary>
  );
}
