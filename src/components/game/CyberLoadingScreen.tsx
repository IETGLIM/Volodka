/* ─── Volodka RPG – Cyberpunk Loading Screen v2.0 ───
   Улучшенный загрузочный экран:
   – Matrix rain background effect
   – Glitch text анимации
   – Progress bar с neon glow
   – Случайные кибер-цитаты
   – Particle effects
   – Smooth transitions
*/

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Cyber Quotes (loading screen tips) ─── */
const CYBER_QUOTES = [
  { text: "В коде есть поэзия. Нужно лишь уметь её читать...", author: "Володька" },
  { text: "Каждая ошибка — это возможность стать лучше.", author: "System" },
  { text: "Алгоритмы не лгут. Люди интерпретируют их.", author: "Unknown" },
  { text: "Информация — это оружие. Обращайся с ней осторожно.", author: "Security Protocol" },
  { text: "Сеть помнит всё. Выбирай свои действия мудро.", author: "NetWatch" },
  { text: "Поэзия — это баг в системе, который стал фичей.", author: "AI_Poet" },
  { text: "Когда мир погружается во тьму, светят только слова.", author: "Володька" },
  { text: "Каждый цикл — это шанс начать сначала.", author: "System Reboot" },
];

/* ─── Matrix Rain Character ─── */
function MatrixRain() {
  const [columns, setColumns] = useState<Array<{ id: number; speed: number; chars: string[] }>>([]);
  
  useEffect(() => {
    const matrixChars = 'アイウエオカキケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFabcdef<>{}|/\\=+*#@!';
    const colCount = Math.floor(window.innerWidth / 20);
    
    const newColumns = Array.from({ length: colCount }, (_, i) => ({
      id: i,
      speed: 0.5 + Math.random() * 1.5,
      chars: Array.from(
        { length: 15 + Math.floor(Math.random() * 10) }, 
        () => matrixChars[Math.floor(Math.random() * matrixChars.length)]
      ),
    }));
    
    setColumns(newColumns);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute top-0 flex flex-col items-center font-mono text-[10px] leading-4"
          style={{
            left: `${(col.id / columns.length) * 100}%`,
            animation: `matrixFall ${col.speed}s linear infinite`,
          }}
        >
          {col.chars.map((char, i) => (
            <span
              key={i}
              className="text-green-400"
              style={{ 
                opacity: 1 - (i / col.chars.length),
                textShadow: i === 0 ? '0 0 8px #39ff14' : undefined,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Progress Bar with Neon Glow ─── */
interface CyberProgressProps {
  progress: number; // 0-100
  status?: string;
  showPercentage?: boolean;
}

export function CyberProgressBar({ 
  progress, 
  status = 'Загрузка...', 
  showPercentage = true,
}: CyberProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Status text */}
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3"
      >
        <span className="text-sm font-mono text-cyan-300 tracking-wider uppercase">
          {status}
        </span>
      </motion.div>

      {/* Progress bar container */}
      <div className="relative h-2 rounded-full bg-slate-900 border border-slate-700/40 overflow-hidden">
        {/* Background grid pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 49%, rgba(var(--cyber-cyan-rgb), 0.1) 50%, transparent 51%),
              linear-gradient(180deg, transparent 49%, rgba(var(--cyber-cyan-rgb), 0.05) 50%, transparent 51%)
            `,
            backgroundSize: '8px 8px',
          }}
        />

        {/* Fill animation */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-matrix), var(--cyber-cyan))',
            boxShadow: '0 0 12px rgba(var(--cyber-cyan-rgb), 0.6), 0 0 24px rgba(var(--cyber-matrix-rgb), 0.3)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Glow head */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 rounded-full bg-white"
          style={{
            left: `${clampedProgress}%`,
            transform: 'translateX(-50%)',
            boxShadow: '0 0 16px #fff, 0 0 32px var(--cyber-cyan)',
          }}
        />
        
        {/* Scan line effect */}
        <motion.div
          className="absolute inset-y-0 w-8 opacity-60 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            left: `${clampedProgress}%`,
            transform: 'translateX(-50%)',
          }}
          animate={{ x: [-100, 200] as const }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Percentage display */}
      {showPercentage && (
        <motion.div
          key={Math.floor(clampedProgress / 10)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-right mt-2"
        >
          <span className="text-lg font-mono font-bold text-cyan-300" 
            style={{ textShadow: '0 0 8px rgba(var(--cyber-cyan-rgb), 0.5)' }}>
            {Math.round(clampedProgress)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Full Cyberpunk Loading Screen ─── */
interface CyberLoadingScreenProps {
  progress?: number;
  status?: string;
  showQuote?: boolean;
  onComplete?: () => void;
  minDisplayTime?: number;
}

export function CyberLoadingScreen({
  progress = 0,
  status = 'Инициализация...',
  showQuote = true,
  onComplete,
  minDisplayTime = 2000,
}: CyberLoadingScreenProps) {
  const [currentQuote, setCurrentQuote] = useState(CYBER_QUOTES[0]);
  const [isComplete, setIsComplete] = useState(progress >= 100);

  /* Rotate quotes periodically */
  useEffect(() => {
    if (!showQuote) return;
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * CYBER_QUOTES.length);
      setCurrentQuote(CYBER_QUOTES[randomIndex]);
    }, 5000);

    return () => clearInterval(interval);
  }, [showQuote]);

  /* Handle completion */
  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true);
      
      // Wait minimum display time before calling onComplete
      setTimeout(() => {
        onComplete?.();
      }, minDisplayTime);
    }
  }, [progress, isComplete, onComplete, minDisplayTime]);

  return (
    <div className="fixed inset-0 z-[--z-loading] bg-black flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <MatrixRain />
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Scan lines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)',
        }}
      />

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo / Title */}
        <motion.div
          className="text-center"
          animate={isComplete ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400"
            style={{ textShadow: '0 0 40px rgba(var(--cyber-cyan-rgb), 0.3)' }}
          >
            ВОЛОДЬКА
          </h1>
          <p className="mt-1 text-xs md:text-sm font-mono text-slate-500 tracking-widest">
            {'<'} SYSTEM INITIALIZATION {'>'}
          </p>
        </motion.div>

        {/* Progress section */}
        <div className="w-full space-y-3">
          <CyberProgressBar 
            progress={progress} 
            status={status} 
          />
          
          {/* Status icons row */}
          <div className="flex justify-between items-center px-2 text-[9px] font-mono text-slate-600">
            <span>[CORE]</span>
            <span>[RENDER]</span>
            <span>[AUDIO]</span>
            <span>[PHYSICS]</span>
            <span>[DATA]</span>
          </div>
        </div>

        {/* Quote section */}
        <AnimatePresence mode="wait">
          {showQuote && currentQuote && (
            <motion.div
              key={currentQuote.text}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="border-l-2 border-cyan-500/30 pl-4 py-2"
            >
              <p className="text-sm italic text-slate-400 leading-relaxed">
                "{currentQuote.text}"
              </p>
              <p className="text-[10px] font-mono text-cyan-600/60 mt-1 text-right">
                — {currentQuote.author}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion indicator */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-green-400">SYSTEM READY</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
      <div className="absolute top-4 right-4 w-16 h-px bg-gradient-to-l from-cyan-500/50 to-transparent" />
      <div className="absolute bottom-4 left-4 w-16 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
      <div className="absolute bottom-4 right-4 w-16 h-px bg-gradient-to-l from-cyan-500/50 to-transparent" />

      {/* Version info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-700">
        v4.2.42 // Volodka RPG Engine
      </div>

      {/* CSS for animations (inline since we can't modify global CSS here easily) */}
      <style>{`
        @keyframes matrixFall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(calc(100vh + 100%)); }
        }
        @keyframes textGlitchSubtle {
          0%, 95%, 98%, 100% { 
            text-shadow: none;
            transform: translate(0);
          }
          96% { 
            text-shadow: 2px 0 var(--cyber-cyan), -2px 0 var(--cyber-rose);
            transform: translate(-1px, 1px);
          }
          97% { 
            text-shadow: -2px 0 var(--cyber-cyan), 2px 0 var(--cyber-rose);
            transform: translate(1px, -1px);
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Quick loading spinner for inline use ─── */
export function CyberSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-8',
    lg: 'size-12',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent"
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center dot */}
        <div className="absolute inset-2 rounded-full bg-cyan-400/20" />
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="text-xs font-mono text-slate-400"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

/* ─── Skeleton loader for content placeholders ─── */
export function CyberSkeleton({
  width = 'w-full',
  height = 'h-4',
  variant = 'default',
}: { 
  width?: string; 
  height?: string;
  variant?: 'default' | 'rounded' | 'circular' | 'text';
}) {
  const variants = {
    default: 'rounded',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-sm',
  };

  return (
    <div
      className={`skeleton-cyber ${variants[variant]} ${width} ${height}`}
    />
  );
}

export default CyberLoadingScreen;
