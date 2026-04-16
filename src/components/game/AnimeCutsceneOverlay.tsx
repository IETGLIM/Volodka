'use client';

import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIME_CUTSCENES, getCutsceneById, type AnimeCutsceneData } from '@/data/animeCutscenes';

// ============================================
// THEME CONFIGS — COLOR PALETTES PER MOOD
// ============================================

const THEME_CONFIGS: Record<string, {
  primary: string;
  secondary: string;
  glow: string;
  bgGradient: string;
  particleColor: string;
  textColor: string;
  titleGradient: string;
}> = {
  childhood: {
    primary: '#fbbf24',
    secondary: '#92400e',
    glow: 'rgba(251, 191, 36, 0.3)',
    bgGradient: 'linear-gradient(135deg, #1a1005 0%, #2d1b06 30%, #1a0f04 70%, #0a0502 100%)',
    particleColor: 'rgba(251, 191, 36, 0.5)',
    textColor: 'text-amber-200',
    titleGradient: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
  },
  love: {
    primary: '#ec4899',
    secondary: '#831843',
    glow: 'rgba(236, 72, 153, 0.3)',
    bgGradient: 'linear-gradient(135deg, #1a0515 0%, #2d0a20 30%, #1a0510 70%, #0a0208 100%)',
    particleColor: 'rgba(236, 72, 153, 0.5)',
    textColor: 'text-pink-200',
    titleGradient: 'linear-gradient(90deg, #ec4899, #f472b6, #ec4899)',
  },
  betrayal: {
    primary: '#ef4444',
    secondary: '#7f1d1d',
    glow: 'rgba(239, 68, 68, 0.3)',
    bgGradient: 'linear-gradient(135deg, #1a0505 0%, #2d0808 30%, #1a0303 70%, #0a0101 100%)',
    particleColor: 'rgba(239, 68, 68, 0.5)',
    textColor: 'text-red-200',
    titleGradient: 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)',
  },
  loneliness: {
    primary: '#64748b',
    secondary: '#1e293b',
    glow: 'rgba(100, 116, 139, 0.25)',
    bgGradient: 'linear-gradient(135deg, #0c0e14 0%, #151922 30%, #0d1018 70%, #060810 100%)',
    particleColor: 'rgba(148, 163, 184, 0.4)',
    textColor: 'text-slate-300',
    titleGradient: 'linear-gradient(90deg, #94a3b8, #64748b, #94a3b8)',
  },
  hope: {
    primary: '#06b6d4',
    secondary: '#164e63',
    glow: 'rgba(6, 182, 212, 0.3)',
    bgGradient: 'linear-gradient(135deg, #021519 0%, #052a30 30%, #021a1f 70%, #010d10 100%)',
    particleColor: 'rgba(6, 182, 212, 0.5)',
    textColor: 'text-cyan-200',
    titleGradient: 'linear-gradient(90deg, #06b6d4, #22d3ee, #06b6d4)',
  },
  finale: {
    primary: '#a855f7',
    secondary: '#581c87',
    glow: 'rgba(168, 85, 247, 0.3)',
    bgGradient: 'linear-gradient(135deg, #0f051a 0%, #1a0830 30%, #10061a 70%, #08030f 100%)',
    particleColor: 'rgba(168, 85, 247, 0.5)',
    textColor: 'text-purple-200',
    titleGradient: 'linear-gradient(90deg, #a855f7, #c084fc, #a855f7)',
  },
};

const DEFAULT_THEME = THEME_CONFIGS.loneliness;

function getThemeConfig(theme: string) {
  return THEME_CONFIGS[theme] || DEFAULT_THEME;
}

// ============================================
// PARTICLE SYSTEM
// ============================================

function CutsceneParticles({ theme, count = 30 }: { theme: string; count?: number }) {
  const config = getThemeConfig(theme);
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.4,
    })),
  [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: config.particleColor,
            boxShadow: `0 0 ${p.size * 3}px ${config.particleColor}`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.sin(p.id) * 15, 0],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN CUTSCENE OVERLAY
// ============================================

interface AnimeCutsceneOverlayProps {
  cutsceneId: string;
  onComplete: () => void;
}

export const AnimeCutsceneOverlay = memo(function AnimeCutsceneOverlay({
  cutsceneId,
  onComplete,
}: AnimeCutsceneOverlayProps) {
  const cutscene = useMemo(() => getCutsceneById(cutsceneId), [cutsceneId]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [charIndex, setCharIndex] = useState(0);
  const [currentLineText, setCurrentLineText] = useState('');
  const [phase, setPhase] = useState<'title' | 'content' | 'complete'>('title');
  const [isSkipped, setIsSkipped] = useState(false);

  const theme = cutscene ? getThemeConfig(cutscene.theme) : DEFAULT_THEME;

  // Title phase — show for 2 seconds
  useEffect(() => {
    if (!cutscene) { onComplete(); return; }
    const timer = setTimeout(() => setPhase('content'), 2000);
    return () => clearTimeout(timer);
  }, [cutscene, onComplete]);

  // Typewriter effect for each line
  useEffect(() => {
    if (phase !== 'content' || !cutscene) return;
    if (currentLineIndex >= cutscene.text.length) {
      const timer = setTimeout(() => setPhase('complete'), 0);
      return () => clearTimeout(timer);
    }

    const currentLine = cutscene.text[currentLineIndex];

    // Empty line — brief pause
    if (currentLine.trim() === '') {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [...prev, '']);
        setCurrentLineIndex(currentLineIndex + 1);
        setCharIndex(0);
        setCurrentLineText('');
      }, 400);
      return () => clearTimeout(timer);
    }

    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setCurrentLineText(currentLine.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 35);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [...prev, currentLine]);
        setCurrentLineText('');
        setCharIndex(0);
        setCurrentLineIndex(currentLineIndex + 1);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, currentLineIndex, charIndex, cutscene]);

  // Auto-complete after all lines shown
  useEffect(() => {
    if (phase !== 'complete') return;
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => {
    if (isSkipped) return;
    setIsSkipped(true);
    onComplete();
  }, [isSkipped, onComplete]);

  if (!cutscene) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ background: theme.bgGradient }}
      onClick={handleSkip}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${theme.glow} 0%, transparent 60%)`,
        }}
      />

      {/* Particles */}
      <CutsceneParticles theme={cutscene.theme} />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 bg-black z-40" style={{ height: '8vh' }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black z-40" style={{ height: '8vh' }} />

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={handleSkip}
        className="absolute top-[10vh] right-6 z-50 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border border-white/20 text-white/40 hover:text-white/80 hover:border-white/50 transition-all bg-black/50 backdrop-blur-sm"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
        }}
      >
        Пропустить ▶▶
      </motion.button>

      {/* Content area */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-8" style={{ marginTop: '-2vh' }}>
        <AnimatePresence mode="wait">
          {/* Phase 1: Title card */}
          {phase === 'title' && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="w-32 h-px mx-auto mb-6"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}
              />

              <h2
                className="text-4xl md:text-5xl font-bold tracking-wide mb-3"
                style={{
                  background: theme.titleGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                }}
              >
                {cutscene.title}
              </h2>

              <p className="text-lg tracking-[0.3em] uppercase font-mono" style={{ color: theme.primary, opacity: 0.6 }}>
                {cutscene.subtitle}
              </p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-32 h-px mx-auto mt-6"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}
              />
            </motion.div>
          )}

          {/* Phase 2: Content lines */}
          {phase === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Small title reminder */}
              <div className="text-center mb-6">
                <span className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: theme.primary, opacity: 0.4 }}>
                  {cutscene.title}
                </span>
              </div>

              {/* Text lines */}
              <div className="space-y-3 font-serif max-h-[60vh] overflow-y-auto">
                {displayedLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`text-xl md:text-2xl leading-relaxed tracking-wide ${
                      line.trim() === '' ? 'h-4' : ''
                    } ${theme.textColor}`}
                    style={{
                      textShadow: `0 0 15px ${theme.glow}`,
                    }}
                  >
                    {line || '\u00A0'}
                  </motion.p>
                ))}

                {/* Current typing line */}
                {currentLineIndex < cutscene.text.length && currentLineText && (
                  <p
                    className={`text-xl md:text-2xl leading-relaxed tracking-wide ${theme.textColor}`}
                    style={{
                      textShadow: `0 0 15px ${theme.glow}`,
                    }}
                  >
                    {currentLineText}
                    <span
                      className="inline-block ml-1 animate-pulse"
                      style={{ color: theme.primary }}
                    >|</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Phase 3: Complete */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block px-6 py-3 border"
                style={{
                  borderColor: `${theme.primary}40`,
                  background: `${theme.primary}10`,
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                }}
              >
                <span className="font-mono text-sm" style={{ color: theme.primary }}>
                  Нажмите для продолжения...
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-[9vh] left-6 w-10 h-10 border-l-2 border-t-2 z-30" style={{ borderColor: `${theme.primary}30` }} />
      <div className="absolute top-[9vh] right-6 w-10 h-10 border-r-2 border-t-2 z-30" style={{ borderColor: `${theme.primary}30` }} />
      <div className="absolute bottom-[9vh] left-6 w-10 h-10 border-l-2 border-b-2 z-30" style={{ borderColor: `${theme.primary}30` }} />
      <div className="absolute bottom-[9vh] right-6 w-10 h-10 border-r-2 border-b-2 z-30" style={{ borderColor: `${theme.primary}30` }} />
    </motion.div>
  );
});

export default AnimeCutsceneOverlay;
