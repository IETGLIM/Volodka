
/* ─── Volodka RPG – Loading Screen (AAA+ CYBERPUNK / MATRIX / GOTHIC / HACKING) ─── */

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { CanvasMatrixRain } from './shared/CanvasMatrixRain';

/* ════════════════════════════════════════════════════════════════
   CANVAS MATRIX RAIN — imported from shared component
   ════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   TERMINAL BOOT TEXT — kernel-style system boot messages
   ════════════════════════════════════════════════════════════════ */

const BOOT_LINES = [
  '[    0.000000] Linux version 6.8.0-volodka (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC',
  '[    0.000001] Command line: BOOT_IMAGE=/vmlinuz root=UUID=a3f7e2c1 ro quiet splash',
  '[    0.012345] BIOS-provided physical RAM map:',
  '[    0.023456] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
  '[    0.034567] NX (Execute Disable) protection: active',
  '[    0.045678] DMI: Volodka Industries VOR-9000/CyberMainboard, BIOS 2.0.77',
  '[    0.056789] tsc: Fast TSC calibration using PIT',
  '[    0.067890] tsc: Detected 4200.000 MHz processor',
  '[    0.078901] Loading volodka://kernel ... OK',
  '[    0.089012] Initializing cgroup subsys cpuset',
  '[    0.090123] Initializing cgroup subsys cpu',
  '[    0.091234] CPU: AMD EPYC-Volodka 9754 128-Core Processor',
  '[    0.092345] x86/fpu: x87 FPU on chip',
  '[    0.093456] Loading poem_power.ko ... OK',
  '[    0.094567] Loading karma_engine.ko ... OK',
  '[    0.095678] Loading npc_ai_module.ko ... OK',
  '[    0.096789] volodka-security: Initializing karma firewall',
  '[    0.097890] volodka-quest: Quest tracker initialized (0/∞ active)',
  '[    0.098901] volodka-poetry: 13 poem fragments detected in memory',
  '[    0.099012] Mounting /dev/soul0 on /type/stories ... OK',
  '[    0.100123] volodka-network: eth0: link is up, 10000 Mbps',
  '[    0.101234] volodka-audio: AudioEngine initialized (48kHz/24bit)',
  '[    0.102345] volodka-physics: Rapier3D collider system ready',
  '[    0.103456] volodka-scene: Procedural world generator loaded',
  '[    0.104567] volodka-memory: Loading story nodes from /dev/destiny0',
  '[    0.105678] volodka-glitch: GlitchEffect module compiled [4 types]',
  '[    0.106789] volodka-matrix: Matrix rain columns allocated (120 cols)',
  '[    0.107890] volodka-cyber: Neon glow pipeline activated',
  '[    0.108901] volodka-combat: Combat system v2.1 loaded',
  '[    0.109012] volodka-poetry: Poem power system calibrated',
  '[    0.110123] systemd[1]: Started Volodka RPG Engine v0.5.0',
  '[    0.111234] systemd[1]: Starting В О Л О Д Ь К А ...',
  '[    0.112345] ██ BOOT COMPLETE ██',
];

function TerminalBootText() {
  const [visibleLines, setVisibleLines] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) return;
    const delay = visibleLines < 5 ? 80 : visibleLines < 15 ? 60 : 50;
    const timer = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLines]);

  return (
    <div
      ref={scrollRef}
      className="absolute bottom-0 left-0 right-0 max-h-[35dvh] overflow-hidden pointer-events-none z-[5]"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
    >
      <div className="px-4 py-2 font-mono text-[10px] leading-[1.6]">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className="whitespace-nowrap overflow-hidden"
            style={{
              color: line.includes('OK')
                ? 'rgba(52,211,153,0.5)'
                : line.includes('██')
                ? 'rgb(var(--cyber-cyan-rgb) / 0.7)'
                : line.includes('error') || line.includes('FAIL')
                ? 'rgba(251,113,133,0.5)'
                : 'rgba(0,255,65,0.3)',
              textShadow: line.includes('██')
                ? '0 0 10px rgb(var(--cyber-cyan-rgb) / 0.4)'
                : 'none',
            }}
          >
            {line}
          </div>
        ))}
        {visibleLines < BOOT_LINES.length && (
          <span className="inline-block w-1.5 h-3 bg-green-500/60 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HEX DUMP — random hex addresses scrolling in background
   ════════════════════════════════════════════════════════════════ */

/** Deterministic hex dump generator using xorshift32 PRNG.
 *  Pure function — same seed always produces same output.
 *  Defined outside the component to satisfy react-hooks/immutability lint. */
function generateHexDumpLines(seed: number, count: number): string[] {
  let s = seed;
  const next = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return s >>> 0; };
  return Array.from({ length: count }, (_, i) => {
    const addr = (0x7f000000 + i * 0x10).toString(16).padStart(8, '0');
    const hex = Array.from({ length: 16 }, () => (next() % 256).toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from({ length: 16 }, () => String.fromCharCode((next() % 95) + 32)).join('');
    return `${addr}  ${hex}  |${ascii}|`;
  });
}

function HexDumpOverlay() {
  // Deterministic hex dump — seeded PRNG generates the same output on server and client.
  // This avoids the hydration mismatch that Math.random() caused.
  // PRNG is a pure function outside render to satisfy react-hooks/immutability lint.
  const lines = useMemo(() => generateHexDumpLines(0x7f000001, 12), []);

  if (lines.length === 0) return null;

  return (
    <div
      className="absolute top-0 right-0 w-80 max-w-[40vw] pointer-events-none z-[3] overflow-hidden"
      suppressHydrationWarning
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.4) 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.4) 80%, transparent 100%)',
      }}
    >
      <div className="font-mono text-[8px] leading-[1.5] px-2 py-2 whitespace-nowrap overflow-hidden" style={{ color: 'rgba(0,255,65,0.12)' }}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GLITCH TITLE — random glitch animation on the title text
   ════════════════════════════════════════════════════════════════ */

function GlitchTitle({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = 2000 + Math.random() * 4000;
      return setTimeout(() => {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 200);
        timer = scheduleGlitch();
      }, delay);
    };
    let timer = scheduleGlitch();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center relative">
      {/* Background glow */}
      <div className="absolute inset-0 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.15) 0%, rgba(255,140,0,0.05) 40%, transparent 60%)' }} />

      <motion.h1
        className={`relative text-6xl sm:text-8xl font-black tracking-[0.2em] ${glitching ? 'title-glitch' : ''}`}
        style={{
          textShadow: glitching
            ? '-3px 0 #ff0000, 3px 0 #00ffff, 0 0 80px rgba(0,255,255,0.7)'
            : '0 0 60px rgba(0,255,255,0.5), 0 0 120px rgba(0,255,255,0.3), 0 0 200px rgba(255,140,0,0.1)',
        }}
        initial={{ opacity: 0, y: -30, scale: 0.9, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500 menu-title-breathe">
          {text}
        </span>
      </motion.h1>

      {/* Neon reflection */}
      <div
        className="relative text-6xl sm:text-8xl font-black tracking-[0.2em] pointer-events-none select-none -mt-3"
        style={{
          animation: 'neon-reflection 4s ease-in-out infinite',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
        }}
        aria-hidden
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/15 to-transparent">{text}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CYBERPUNK DUAL-RING SPINNER
   ════════════════════════════════════════════════════════════════ */

function CyberSpinner() {
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ animation: 'cyber-spinner 10s linear infinite' }}>
        <polygon points="50,5 95,35 95,65 50,95 5,65 5,35" fill="none" stroke="rgb(var(--cyber-cyan-rgb) / 0.3)" strokeWidth="0.8" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgb(var(--cyber-cyan-rgb) / 0.08)" strokeWidth="0.4" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgb(var(--cyber-cyan-rgb) / 0.08)" strokeWidth="0.4" />
        <circle cx="50" cy="5" r="1.8" fill="rgb(var(--cyber-cyan-rgb) / 0.6)" />
        <circle cx="95" cy="35" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
        <circle cx="95" cy="65" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
        <circle cx="50" cy="95" r="1.8" fill="rgb(var(--cyber-cyan-rgb) / 0.6)" />
        <circle cx="5" cy="65" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
        <circle cx="5" cy="35" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ animation: 'cyber-spinner-reverse 7s linear infinite' }}>
        <polygon points="50,15 85,50 50,85 15,50" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="0.6" />
        <circle cx="50" cy="15" r="1" fill="rgba(251,191,36,0.5)" />
        <circle cx="85" cy="50" r="1" fill="rgba(251,191,36,0.4)" />
        <circle cx="50" cy="85" r="1" fill="rgba(251,191,36,0.5)" />
        <circle cx="15" cy="50" r="1" fill="rgba(251,191,36,0.4)" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ animation: 'cyber-pulse-ring 3s ease-in-out infinite' }}>
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgb(var(--cyber-cyan-rgb) / 0.15)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CINEMATIC BARS
   ════════════════════════════════════════════════════════════════ */

const CinematicBars = memo(function CinematicBars() {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-[65] h-[6dvh] min-h-[24px] bg-black pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 z-[65] h-[6dvh] min-h-[24px] bg-black pointer-events-none" />
    </>
  );
});

/* ════════════════════════════════════════════════════════════════
   POEM QUOTES & TIPS
   ════════════════════════════════════════════════════════════════ */

const POEM_QUOTES = [
  'Смерть есть лишь начало.',
  'И что-то пошло не так...',
  'Если знаешь куда идти — то и боги не встанут поперёк пути.',
  'Быть шутом в глазах людей — для него подобно смерти.',
  'Я камень. Домом служит сырая земля.',
  'Мой город не отпустит меня к тебе.',
  'Sic itur ad astra — так шествуют к звёздам.',
  'В этом мире никогда не выживают те, кто с детства витает в мыслях.',
  'Мы стремимся ради других...',
  'Вся клевета — вернётся в сто крат.',
  'Обязательно подумаю, интересная идея...',
  'Ну а тебе, друг мой! Глаголю я... от сердца!',
  'Ты держишь в руках куски того, что ещё не забыто.',
];

const TIPS = [
  'Исследуйте каждый уголок — скрытые стихи ждут в неожиданных местах.',
  'Поговорите с NPC несколько раз — их реплики меняются в зависимости от отношений.',
  'Стихи дают способности — используйте их в трудных ситуациях.',
  'Карма влияет на доступные выборы — каждый поступок имеет значение.',
  'Энергия тратится на действия — отдыхайте, чтобы восстановить силы.',
  'Нажмите E рядом с NPC, чтобы начать разговор.',
  'Используйте стихи-способности, чтобы обойти препятствия в заданиях.',
  'Стресс влияет на доступные варианты — не доводите себя до предела.',
  'WASD — движение, Shift — бег, Space — прыжок, E — взаимодействие.',
  'Нажмите 1, 2, 3 для быстрого выбора в диалогах.',
  'Собранные стихи можно перечитывать в книге стихов.',
  'У каждого NPC свой характер — подбирайте подход к каждому.',
];

/* ════════════════════════════════════════════════════════════════
   CRT SWEEP LINE
   ════════════════════════════════════════════════════════════════ */

function CRTSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[40] overflow-hidden">
      <motion.div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,255,0.2) 30%, rgba(0,255,255,0.3) 50%, rgba(0,255,255,0.2) 70%, transparent 95%)',
          boxShadow: '0 0 20px rgba(0,255,255,0.15), 0 -4px 12px rgba(0,255,255,0.05)',
        }}
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LOADING SCREEN COMPONENT — Main Entry
   ════════════════════════════════════════════════════════════════ */

interface LoadingScreenProps {
  /** Optional progress value 0-100; if omitted, shows indeterminate */
  progress?: number;
  /** Optional loading message */
  message?: string;
  /** If true, shows the title "ВОЛОДЬКА" with glitch effect */
  showTitle?: boolean;
}

export function LoadingScreen({ progress, message = 'Загрузка...', showTitle = false }: LoadingScreenProps) {
  const reduceMotion = useReducedMotion();
  const [showTip, setShowTip] = useState(true);
  const [showBootText, setShowBootText] = useState(true);

  const quoteIndex = useMemo(() => {
    return Math.floor(Math.random() * POEM_QUOTES.length);
  }, []);

  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const scheduleNext = (): ReturnType<typeof setTimeout> => {
      return setTimeout(() => {
        setShowTip(false);
        setTimeout(() => {
          setTipIndex((prev) => (prev + 1) % TIPS.length);
          setShowTip(true);
          tipTimerRef.current = scheduleNext();
        }, 300);
      }, 4000);
    };
    const tipTimerRef = { current: scheduleNext() };
    return () => clearTimeout(tipTimerRef.current);
  }, []);

  // Hide boot text after it finishes
  useEffect(() => {
    const timer = setTimeout(() => setShowBootText(false), BOOT_LINES.length * 60 + 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black overflow-hidden loading-screen-fade-in" style={{ zIndex: UI_LAYERS.LOADING }}>
      {/* ── Layer 0: Matrix Rain Canvas ── */}
      {!reduceMotion && (
      <div className="absolute inset-0 z-[1]">
        <CanvasMatrixRain />
      </div>
      )}

      {/* ── Layer 1: Film grain ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
          animation: 'cinematic-grain 0.4s steps(8) infinite',
        }}
      />

      {/* ── Layer 2: Scanlines ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        }}
      />

      {/* ── Layer 3: Hex dump overlay ── */}
      <HexDumpOverlay />

      {/* ── Layer 4: Terminal boot text ── */}
      <AnimatePresence>
        {showBootText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-[5]"
          >
            <TerminalBootText />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 5: Breathing glow ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[6]"
        animate={{
          background: [
            'radial-gradient(ellipse at 40% 50%, rgb(var(--cyber-cyan-rgb) / 0.03) 0%, transparent 70%)',
            'radial-gradient(ellipse at 60% 50%, rgb(var(--cyber-cyan-rgb) / 0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse at 40% 50%, rgb(var(--cyber-cyan-rgb) / 0.03) 0%, transparent 70%)',
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }}
      />
      {/* Amber glow accent */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[6]"
        animate={{
          background: [
            'radial-gradient(ellipse at 70% 60%, rgba(251,191,36,0.015) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 40%, rgba(251,191,36,0.03) 0%, transparent 50%)',
            'radial-gradient(ellipse at 70% 60%, rgba(251,191,36,0.015) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* ── Layer 6: CRT sweep line ── */}
      <CRTSweep />

      {/* ── Layer 7: Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[55]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* ── Layer 8: Cinematic letterbox bars ── */}
      <CinematicBars />

      {/* ── Corner decorations ── */}
      <motion.div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-cyan-500/20 z-[70]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/20 z-[70]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
      <motion.div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-amber-500/15 z-[70]" animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
      <motion.div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-amber-500/15 z-[70]" animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} />

      {/* ════════════════════════════════════════════════════════════
         CENTER CONTENT
         ════════════════════════════════════════════════════════════ */}
      <div className="relative z-[60] flex flex-col items-center gap-5">
        {/* Title with glitch effect */}
        {showTitle && (
          <GlitchTitle text="ВОЛОДЬКА" />
        )}

        {/* Subtitle — only when title is shown */}
        {showTitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="font-mono text-sm sm:text-base tracking-[0.4em] uppercase"
            style={{
              background: 'linear-gradient(90deg, rgba(0,255,255,0.8), rgba(255,140,0,0.6), rgba(0,255,255,0.8))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: 'none',
            }}
          >
            сказка между сменами
          </motion.p>
        )}

        {/* Cyberpunk spinner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="loading-spinner-pulse"
        >
          <CyberSpinner />
        </motion.div>

        {/* ── Terminal-style progress section ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-72 flex flex-col items-center gap-3"
        >
          {/* Progress bar — cyberpunk styled */}
          <div className="w-full h-2 bg-slate-900/80 rounded-sm overflow-hidden relative border border-cyan-900/30">
            {/* Track glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 6px rgb(var(--cyber-cyan-rgb) / 0.1)' }} />
            {/* Segment marks */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {[25, 50, 75].map((mark) => (
                <div key={mark} className="absolute top-0 bottom-0 w-px bg-cyan-900/20" style={{ left: `${mark}%` }} />
              ))}
            </div>
            {progress !== undefined ? (
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.4), 0 0 4px rgba(52,211,153,0.2)',
                }}
              />
            ) : (
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '40%',
                  boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.4), 0 0 4px rgba(52,211,153,0.2)',
                }}
              />
            )}
          </div>

          {/* Loading text — terminal style */}
          <div className="w-full flex items-center justify-between">
            <p className="text-[11px] text-cyan-500/70 tracking-wider font-mono">
              {message}<span className="loading-dots" />
            </p>
            {progress !== undefined && (
              <span className="text-[11px] text-cyan-400/60 font-mono tabular-nums">
                {progress}%
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Terminal URL footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex items-center gap-2 mt-1"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
          <span className="text-[9px] font-mono text-cyan-500/30 uppercase tracking-[0.2em]">volodka://boot</span>
        </motion.div>

        {/* ── Random poem quote ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="max-w-sm text-center mt-3"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.4))' }} />
            <span className="text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] font-mono">Цитата</span>
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgb(var(--cyber-cyan-rgb) / 0.4), transparent)' }} />
          </div>
          <p
            className="text-sm text-slate-400/60 italic leading-relaxed"
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              textShadow: '0 0 15px rgb(var(--cyber-cyan-rgb) / 0.08)',
            }}
          >
            &laquo;{POEM_QUOTES[quoteIndex]}&raquo;
          </p>
        </motion.div>

        {/* ── Tip of the day ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.8 }}
          className="max-w-xs text-center mt-1"
        >
          <AnimatePresence mode="wait">
            {showTip && (
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-center gap-3 mb-1">
                  <div className="h-px w-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4))' }} />
                  <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-mono">Совет</span>
                  <div className="h-px w-6" style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.4), transparent)' }} />
                </div>
                <p className="text-xs text-slate-500/50 leading-relaxed">
                  {TIPS[tipIndex]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Bottom-right version info ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 right-6 z-[70] flex flex-col items-end gap-0.5"
      >
        <span className="font-mono text-[10px] tracking-[0.15em] text-cyan-500/25">v0.5.0</span>
        <span className="font-mono text-[8px] tracking-[0.1em] text-slate-700/40">build.2025</span>
      </motion.div>

      {/* ── Bottom-left dedication ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 3 }}
        className="absolute bottom-8 left-6 font-serif text-[10px] text-slate-500/30 tracking-wider z-[70] italic dedication-glow"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
      >
        Памяти Владимира Лебедева
      </motion.div>
    </div>
  );
}
