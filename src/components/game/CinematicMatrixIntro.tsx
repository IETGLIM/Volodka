
/* ─── Volodka RPG – Cinematic Matrix Intro ─── */
/* A dramatic 3D-style intro with Matrix Rain that plays when the game starts.
   Phase-based state machine controls the flow:
   Phase 1: Pure Matrix Rain on black (0-3s)
   Phase 2: Rain + center text "В ГОРОДЕ, ГДЕ СЛОВА ЗАПРЕЩЕНЫ..." (3-6s)
   Phase 3: Rain intensifies + "ГДЕ КОД — ЭТО ЗАКОН... ГДЕ ПОЭЗИЯ — ЭТО ПРЕСТУПЛЕНИЕ..." (6-10s)
   Phase 4: Rain slows, title "ВОЛОДЬКА" reveals (10-14s)
   Phase 5: Subtitle + dedication (14-18s)
   Phase 6: Fade to game (18-20s) */

import { memo, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UI_LAYERS } from '@/shared/constants/uiLayers'

/* ─── Phase definitions ─── */

type MatrixIntroPhase =
  | 'rain'         // 0-3s: Pure matrix rain
  | 'text1'        // 3-6s: First text line
  | 'text2'        // 6-10s: More text lines
  | 'title'        // 10-14s: Title reveal
  | 'subtitle'     // 14-18s: Subtitle + dedication
  | 'fadeout'      // 18-20s: Fade to game
  | 'done'         // Complete

const PHASE_TIMING: Record<MatrixIntroPhase, number> = {
  rain: 3000,
  text1: 3000,
  text2: 4000,
  title: 4000,
  subtitle: 4000,
  fadeout: 2000,
  done: 0,
}

/* ─── Matrix Rain Column (CSS-based, no canvas) ─── */

const CHARS = '0123456789ABCDEF{}[]<>/\\|#$@!αβγδεζηθклмнопрстуфхцчшщъыьэюя'
const MATRIX_GREEN = '#00ff41'
const HEAD_GREEN = '#aaffcc'
const COLUMN_WIDTH = 14

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

interface RainColumnData {
  id: number
  x: number
  chars: string[]
  duration: number
  delay: number
}

function buildColumns(width: number, count: number): RainColumnData[] {
  const numCols = Math.min(Math.ceil(width / COLUMN_WIDTH), count)
  return Array.from({ length: numCols }, (_, i) => ({
    id: i,
    x: i * COLUMN_WIDTH,
    chars: Array.from({ length: 18 + Math.floor(Math.random() * 12) }, () => randomChar()),
    duration: 3 + Math.random() * 6,
    delay: Math.random() * 4,
  }))
}

/* ─── Typewriter effect ─── */

function useTypewriter(text: string, speed: number, enabled: boolean) {
  const [index, setIndex] = useState(0)
  const completeRef = useRef(false)

  useEffect(() => {
    if (!enabled || index >= text.length) return
    const char = text[index]
    let delay = speed
    if (char === '.' || char === '!' || char === '?') delay = speed * 5
    else if (char === ',') delay = speed * 2.5
    else if (char === '—' || char === '–') delay = speed * 3
    else if (char === ' ' || char === '\n') delay = speed * 0.3
    else delay = speed * (0.6 + Math.random() * 0.8)

    const timer = setTimeout(() => setIndex((c) => c + 1), delay)
    return () => clearTimeout(timer)
  }, [index, text, speed, enabled])

  useEffect(() => {
    if (enabled && index >= text.length && !completeRef.current) {
      completeRef.current = true
    }
  }, [index, text.length, enabled])

  // Reset on text change
  useEffect(() => {
    setIndex(0)
    completeRef.current = false
  }, [text])

  return index
}

/* ─── Sub-components ─── */

const FilmGrain = memo(function FilmGrain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 60,
        opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
        mixBlendMode: 'overlay',
        animation: 'cinematic-grain 0.4s steps(8) infinite',
      }}
    />
  )
})

const Vignette = memo(function Vignette({ intensity = 0.85 }: { intensity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 55,
        background: `radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, ${intensity}) 100%)`,
      }}
    />
  )
})

const Scanlines = memo(function Scanlines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 58,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        mixBlendMode: 'multiply',
      }}
    />
  )
})

const LetterboxBars = memo(function LetterboxBars() {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none" style={{ zIndex: 65, height: '7dvh', minHeight: 28 }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none" style={{ zIndex: 65, height: '7dvh', minHeight: 28 }} />
    </>
  )
})

/* ─── Matrix Rain Canvas ─── */

interface MatrixRainOverlayProps {
  intensity: number // 0-1, controls opacity/speed
  columnCount: number
}

const MatrixRainOverlay = memo(function MatrixRainOverlay({ intensity, columnCount }: MatrixRainOverlayProps) {
  const columns = useMemo(() => {
    if (typeof window === 'undefined') return []
    return buildColumns(window.innerWidth, columnCount)
  }, [columnCount])

  const speedMultiplier = 1 + (1 - intensity) * 0.5

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        zIndex: 5,
        opacity: 0.2 + intensity * 0.25,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {columns.map((col) => (
        <div
          key={col.id}
          style={{
            position: 'absolute',
            left: col.x,
            top: '-100%',
            animation: `matrixFall ${(col.duration / speedMultiplier).toFixed(2)}s linear ${(col.delay / speedMultiplier).toFixed(2)}s infinite`,
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", "Lucida Console", monospace',
            fontSize: '14px',
            lineHeight: '14px',
          }}
        >
          {col.chars.map((char, ci) => (
            <div
              key={ci}
              style={{
                color: ci === col.chars.length - 1 ? HEAD_GREEN : MATRIX_GREEN,
                opacity: ci === col.chars.length - 1 ? 1 : Math.max(0.1, 1 - (col.chars.length - 1 - ci) * 0.06),
                textShadow: ci === col.chars.length - 1 ? `0 0 8px ${MATRIX_GREEN}` : 'none',
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes matrixFall {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(200vh + 100%)); }
        }
      `}</style>
    </div>
  )
})

/* ─── Animated text with typewriter ─── */

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
  style?: React.CSSProperties
  glowColor?: string
  onComplete?: () => void
}

const TypewriterText = memo(function TypewriterText({
  text,
  speed = 40,
  className = '',
  style,
  glowColor = 'rgba(0, 255, 65, 0.4)',
  onComplete,
}: TypewriterTextProps) {
  const charIndex = useTypewriter(text, speed, true)
  const visibleText = text.slice(0, charIndex)
  const isComplete = charIndex >= text.length

  useEffect(() => {
    if (isComplete && onComplete) {
      const timer = setTimeout(onComplete, 300)
      return () => clearTimeout(timer)
    }
  }, [isComplete, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6 }}
      className={className}
      style={{
        ...style,
        textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 80px ${glowColor.replace('0.4', '0.15')}`,
      }}
    >
      {visibleText}
      {!isComplete && (
        <span
          className="inline-block ml-0.5"
          style={{
            animation: 'cinematic-cursor 1s step-end infinite',
            color: 'rgba(0, 255, 65, 0.9)',
          }}
        >
          │
        </span>
      )}
    </motion.div>
  )
})

/* ─── Title reveal with metallic wipe ─── */

const TitleReveal = memo(function TitleReveal() {
  return (
    <motion.div
      className="relative z-[35] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      {/* Green atmospheric glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 65, 0.12) 0%, rgba(0, 180, 40, 0.05) 40%, transparent 60%)',
          filter: 'blur(40px)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      {/* Title with metallic reveal wipe */}
      <div className="relative inline-block overflow-hidden">
        {/* Title text */}
        <motion.h1
          className="relative text-7xl sm:text-8xl md:text-9xl font-bold tracking-[0.15em]"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            background: 'linear-gradient(180deg, #00ff41 0%, #00cc33 25%, #33ff66 50%, #009922 75%, #00dd44 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 30px rgba(0, 255, 65, 0.4)) drop-shadow(0 0 60px rgba(0, 200, 40, 0.2))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          ВОЛОДЬКА
        </motion.h1>

        {/* Metallic wipe overlay */}
        <motion.div
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 65, 0.3) 40%, rgba(255, 255, 255, 0.5) 50%, rgba(0, 255, 65, 0.3) 60%, transparent 100%)',
          }}
          initial={{ x: '-110%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />

        {/* Dark mask that wipes away */}
        <motion.div
          className="absolute inset-0 z-20"
          style={{ background: '#000' }}
          initial={{ scaleX: 1, transformOrigin: 'left' }}
          animate={{ scaleX: 0, transformOrigin: 'left' }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        />
      </div>
    </motion.div>
  )
})

/* ─── Subtitle reveal ─── */

const SubtitleReveal = memo(function SubtitleReveal() {
  return (
    <motion.div
      className="relative z-[35] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtitle */}
      <motion.p
        className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg tracking-[0.35em] uppercase"
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          background: 'linear-gradient(90deg, rgba(0,255,65,0.6), rgba(200,255,200,0.5), rgba(0,255,65,0.6))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
      >
        сказка между сменами
      </motion.p>

      {/* Decorative line */}
      <motion.div
        className="mt-6 sm:mt-8 mx-auto w-32 sm:w-48 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.5), rgba(200, 255, 200, 0.3), transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
      />

      {/* Dedication */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
      >
        <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(210, 195, 180, 0.3), transparent)' }} />
        <p
          className="font-serif text-xs sm:text-sm md:text-base tracking-[0.12em] italic"
          style={{
            fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
            color: 'rgba(210, 195, 180, 0.7)',
            textShadow: '0 0 20px rgba(210, 195, 180, 0.15), 0 0 40px rgba(210, 195, 180, 0.08)',
          }}
        >
          Памяти Владимира Лебедева
        </p>
        <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(210, 195, 180, 0.3), transparent)' }} />
      </motion.div>
    </motion.div>
  )
})

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT: CinematicMatrixIntro
   ═══════════════════════════════════════════════════════════ */

interface CinematicMatrixIntroProps {
  onComplete: () => void
}

export function CinematicMatrixIntro({ onComplete }: CinematicMatrixIntroProps) {
  const [phase, setPhase] = useState<MatrixIntroPhase>('rain')
  const skippedRef = useRef(false)

  // Phase advancement
  useEffect(() => {
    if (phase === 'done') return

    const duration = PHASE_TIMING[phase]
    if (duration === 0) return

    const timer = setTimeout(() => {
      const phases: MatrixIntroPhase[] = ['rain', 'text1', 'text2', 'title', 'subtitle', 'fadeout', 'done']
      const currentIndex = phases.indexOf(phase)
      if (currentIndex < phases.length - 1) {
        setPhase(phases[currentIndex + 1])
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [phase])

  // When fadeout completes, call onComplete
  useEffect(() => {
    if (phase === 'done' && !skippedRef.current) {
      skippedRef.current = true
      onComplete()
    }
  }, [phase, onComplete])

  const handleSkip = useCallback(() => {
    if (!skippedRef.current) {
      skippedRef.current = true
      onComplete()
    }
  }, [onComplete])

  // Rain intensity based on phase
  const rainIntensity = useMemo(() => {
    switch (phase) {
      case 'rain': return 0.5
      case 'text1': return 0.7
      case 'text2': return 1.0
      case 'title': return 0.4
      case 'subtitle': return 0.2
      case 'fadeout': return 0.1
      default: return 0
    }
  }, [phase])

  const columnCount = useMemo(() => {
    switch (phase) {
      case 'rain': return 80
      case 'text1': return 80
      case 'text2': return 120
      case 'title': return 60
      case 'subtitle': return 40
      default: return 40
    }
  }, [phase])

  // Visual flash on phase change
  const [flashActive, setFlashActive] = useState(false)
  useEffect(() => {
    if (phase === 'done') return
    setFlashActive(true)
    const timer = setTimeout(() => setFlashActive(false), 150)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div
      className="fixed inset-0 bg-black"
      style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
    >
      {/* Matrix Rain overlay */}
      {phase !== 'done' && (
        <MatrixRainOverlay intensity={rainIntensity} columnCount={columnCount} />
      )}

      {/* Center content area */}
      <div className="absolute inset-0 flex items-center justify-center z-[35]">
        <AnimatePresence mode="wait">
          {/* Phase 1: Pure rain (no text) */}
          {phase === 'rain' && (
            <motion.div
              key="rain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Phase 2: First text line */}
          {phase === 'text1' && (
            <motion.div
              key="text1"
              className="text-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <TypewriterText
                text="В ГОРОДЕ, ГДЕ СЛОВА ЗАПРЕЩЕНЫ..."
                speed={45}
                className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.08em]"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(0, 255, 65, 0.9)',
                }}
                glowColor="rgba(0, 255, 65, 0.35)"
              />
            </motion.div>
          )}

          {/* Phase 3: More text lines */}
          {phase === 'text2' && (
            <motion.div
              key="text2"
              className="text-center px-4 space-y-4 sm:space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <TypewriterText
                text="В ГОРОДЕ, ГДЕ СЛОВА ЗАПРЕЩЕНЫ..."
                speed={15}
                className="text-lg sm:text-xl md:text-2xl font-light tracking-[0.06em]"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(0, 255, 65, 0.5)',
                }}
                glowColor="rgba(0, 255, 65, 0.15)"
              />
              <TypewriterText
                text="ГДЕ КОД — ЭТО ЗАКОН..."
                speed={40}
                className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.08em]"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(0, 255, 65, 0.9)',
                }}
                glowColor="rgba(0, 255, 65, 0.35)"
              />
              <TypewriterText
                text="ГДЕ ПОЭЗИЯ — ЭТО ПРЕСТУПЛЕНИЕ..."
                speed={40}
                className="text-2xl sm:text-3xl md:text-5xl font-light tracking-[0.08em]"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(0, 255, 65, 0.9)',
                }}
                glowColor="rgba(0, 255, 65, 0.35)"
              />
            </motion.div>
          )}

          {/* Phase 4: Title reveal */}
          {phase === 'title' && (
            <TitleReveal key="title" />
          )}

          {/* Phase 5: Subtitle + dedication */}
          {phase === 'subtitle' && (
            <div key="subtitle" className="flex flex-col items-center">
              <TitleReveal />
              <SubtitleReveal />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Film grain */}
      <FilmGrain />

      {/* Vignette */}
      <Vignette intensity={0.85} />

      {/* Scanlines */}
      <Scanlines />

      {/* Letterbox bars */}
      <LetterboxBars />

      {/* Visual flash on phase change */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 70, background: 'rgba(0, 255, 65, 0.06)' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Fade out overlay */}
      <AnimatePresence>
        {phase === 'fadeout' && (
          <motion.div
            className="absolute inset-0 bg-black"
            style={{ zIndex: 75 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Skip button */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        onClick={handleSkip}
        onTouchStart={(e) => { e.preventDefault(); handleSkip() }}
        className="fixed bottom-10 right-8 z-[70] px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase
                   text-white/30 hover:text-white/70 border border-white/10 hover:border-white/30
                   bg-black/40 backdrop-blur-sm rounded transition-all duration-300
                   touch-manipulation select-none active:bg-white/10 active:scale-95"
        aria-label="Пропустить вступление"
      >
        Пропустить ▸▸
      </motion.button>
    </div>
  )
}
