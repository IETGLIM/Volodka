
/* ─── Volodka RPG – MiniGameHub (Cyberpunk Arcade Quick-Access Terminal) ─── */
/* Full-screen modal displaying 3 mini-game cards with holographic effects.
 * Emits `minigame:open` events via the eventBus for the GameOrchestrator
 * to pick up and route to the appropriate game component. */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus } from '@/engine/EventBus';

// ─── Types ───

interface MiniGameHubProps {
  open: boolean;
  onClose: () => void;
}

type GameType = 'codebreaker' | 'openstack_terminal' | 'bash_terminal' | 'poetry' | 'hacking' | 'memory' | 'quiz' | 'rhythm';

interface MiniGameDef {
  gameType: GameType;
  icon: string;
  name: string;
  description: string;
  difficulty: number;
  accentColor: string;
  accentRgb: string;
  borderGlow: string;
  maxDifficulty: number;
}

// ─── Game Definitions ───

const GAMES: MiniGameDef[] = [
  {
    gameType: 'codebreaker',
    icon: '🔓',
    name: 'Взломщик кода',
    description: 'Расшифруйте код доступа к системе безопасности',
    difficulty: 3,
    accentColor: 'rgba(0, 229, 255, 0.9)',   // cyan
    accentRgb: '0, 229, 255',
    borderGlow: 'rgba(0, 229, 255, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'openstack_terminal',
    icon: '☁️',
    name: 'Терминал OpenStack',
    description: 'Управляйте облачной инфраструктурой через терминал',
    difficulty: 4,
    accentColor: 'rgba(251, 191, 36, 0.9)',   // amber
    accentRgb: '251, 191, 36',
    borderGlow: 'rgba(251, 191, 36, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'bash_terminal',
    icon: '⌨️',
    name: 'Терминал Bash',
    description: 'Выполняйте команды Linux для решения задач',
    difficulty: 5,
    accentColor: 'rgba(244, 63, 94, 0.9)',    // rose
    accentRgb: '244, 63, 94',
    borderGlow: 'rgba(244, 63, 94, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'poetry',
    icon: '✨',
    name: 'Поэтический транс',
    description: 'Составьте стихи из слов, чтобы раскрыть скрытые смыслы',
    difficulty: 2,
    accentColor: 'rgba(168, 85, 247, 0.9)',   // violet
    accentRgb: '168, 85, 247',
    borderGlow: 'rgba(168, 85, 247, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'hacking',
    icon: '🔓',
    name: 'Сетевой взлом',
    description: 'Пройдите через сеть к целевому серверу, избегая сканеров',
    difficulty: 3,
    accentColor: 'rgba(239, 68, 68, 0.9)',    // red
    accentRgb: '239, 68, 68',
    borderGlow: 'rgba(239, 68, 68, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'memory',
    icon: '🧠',
    name: 'Нейросеть',
    description: 'Запомните и повторите паттерн нейронной сети',
    difficulty: 2,
    accentColor: 'rgba(52, 211, 153, 0.9)',   // emerald
    accentRgb: '52, 211, 153',
    borderGlow: 'rgba(52, 211, 153, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'quiz',
    icon: '📡',
    name: 'Кибер-викторина',
    description: 'Проверьте знания о кибер-мире в trivia-викторине',
    difficulty: 2,
    accentColor: 'rgba(56, 189, 248, 0.9)',   // sky blue
    accentRgb: '56, 189, 248',
    borderGlow: 'rgba(56, 189, 248, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'rhythm',
    icon: '🎵',
    name: 'Кибер-ритм',
    description: 'Нажимайте клавиши в такт кибер-музыке',
    difficulty: 3,
    accentColor: 'rgba(236, 72, 153, 0.9)',   // pink
    accentRgb: '236, 72, 153',
    borderGlow: 'rgba(236, 72, 153, 0.3)',
    maxDifficulty: 5,
  },
];

// ─── Difficulty Dots ───

function DifficultyDots({ count, max, accentRgb }: { count: number; max: number; accentRgb: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: i < count
              ? `rgba(${accentRgb}, 0.85)`
              : 'rgba(100, 116, 139, 0.15)',
            boxShadow: i < count
              ? `0 0 6px rgba(${accentRgb}, 0.5)`
              : 'none',
          }}
        />
      ))}
      <span
        className="font-mono text-[10px] ml-1 uppercase tracking-wider"
        style={{ color: `rgba(${accentRgb}, 0.5)` }}
      >
        {count}/{max}
      </span>
    </div>
  );
}

// ─── Mini-Game Card ───

function MiniGameCard({ game, onLaunch }: { game: MiniGameDef; onLaunch: (gt: GameType) => void }) {
  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className="rounded-lg border bg-slate-950/90 backdrop-blur-md p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden"
        style={{
          borderColor: `rgba(${game.accentRgb}, 0.2)`,
          boxShadow: `0 0 15px rgba(${game.accentRgb}, 0.04), inset 0 0 15px rgba(${game.accentRgb}, 0.02)`,
        }}
      >
        {/* ── Header: Icon + Name ── */}
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none select-none" role="img" aria-label={game.name}>
            {game.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3
              className="font-mono text-sm font-bold tracking-wide uppercase truncate"
              style={{ color: game.accentColor }}
            >
              {game.name}
            </h3>
            <p
              className="font-mono text-xs mt-1 leading-relaxed"
              style={{ color: 'rgba(148, 163, 184, 0.65)' }}
            >
              {game.description}
            </p>
          </div>
        </div>

        {/* ── Difficulty Indicator ── */}
        <div>
          <span
            className="font-mono text-[10px] uppercase tracking-wider block mb-1.5"
            style={{ color: 'rgba(148, 163, 184, 0.4)' }}
          >
            Сложность
          </span>
          <DifficultyDots
            count={game.difficulty}
            max={game.maxDifficulty}
            accentRgb={game.accentRgb}
          />
        </div>

        {/* ── Stats Section ── */}
        <div
          className="rounded-md px-3 py-2"
          style={{ background: 'rgba(15, 23, 42, 0.5)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: 'rgba(148, 163, 184, 0.35)' }}
            >
              Рекорд
            </span>
            <span
              className="font-mono text-xs"
              style={{ color: `rgba(${game.accentRgb}, 0.35)` }}
            >
              ---
            </span>
          </div>
        </div>

        {/* ── Launch Button ── */}
        <motion.button
          onClick={() => onLaunch(game.gameType)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
          style={{
            color: game.accentColor,
            background: `rgba(${game.accentRgb}, 0.08)`,
            border: `1px solid rgba(${game.accentRgb}, 0.25)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `rgba(${game.accentRgb}, 0.18)`;
            e.currentTarget.style.borderColor = `rgba(${game.accentRgb}, 0.5)`;
            e.currentTarget.style.boxShadow = `0 0 20px rgba(${game.accentRgb}, 0.2), inset 0 0 12px rgba(${game.accentRgb}, 0.06)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `rgba(${game.accentRgb}, 0.08)`;
            e.currentTarget.style.borderColor = `rgba(${game.accentRgb}, 0.25)`;
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label={`Запустить ${game.name}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Запуск
        </motion.button>

        {/* ── Holographic/Shimmer overlay ── */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden"
          aria-hidden="true"
        >
          {/* Diagonal shimmer sweep */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                115deg,
                transparent 30%,
                rgba(${game.accentRgb}, 0.04) 42%,
                rgba(${game.accentRgb}, 0.08) 48%,
                rgba(${game.accentRgb}, 0.04) 54%,
                transparent 66%
              )`,
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
          {/* Edge glow */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              boxShadow: `0 0 25px rgba(${game.accentRgb}, 0.1), inset 0 0 25px rgba(${game.accentRgb}, 0.03)`,
              border: `1px solid rgba(${game.accentRgb}, 0.15)`,
              borderRadius: '0.5rem',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inner content (remounts on open) ───

function MiniGameHubContent({ onClose }: { onClose: () => void }) {
  const handleLaunch = useCallback(
    (gameType: GameType) => {
      eventBus.emit('minigame:open', { gameType });
      onClose();
    },
    [onClose],
  );

  return (
    <motion.div
      className="relative z-10 w-full max-w-4xl mx-4"
      initial={{ scale: 0.92, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 30 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
          borderColor: 'rgba(0, 229, 255, 0.2)',
          boxShadow:
            '0 0 60px rgba(0, 229, 255, 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(0, 229, 255, 0.05)',
          clipPath:
            'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        {/* ── Terminal Header ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgba(0, 229, 255, 0.15)',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Colored dots */}
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-red-500/80" />
            <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/35">
              volodka://minigames
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
            aria-label="Закрыть аркаду"
          >
            ✕
          </button>
        </div>

        {/* ── Title Section ── */}
        <div className="px-6 pt-6 pb-4 text-center">
          <motion.h2
            className="font-mono text-2xl font-bold tracking-[0.3em] uppercase"
            style={{
              color: 'rgba(0, 229, 255, 0.85)',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Аркада
          </motion.h2>
          <motion.p
            className="font-mono text-xs mt-2"
            style={{ color: 'rgba(148, 163, 184, 0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            volodka://minigames — Быстрый доступ к мини-играм
          </motion.p>
        </div>

        {/* ── Scanlines overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.012) 2px, rgba(0, 229, 255, 0.012) 4px)',
          }}
        />

        {/* ── Game Cards Grid ── */}
        <div className="px-6 pb-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAMES.map((game, idx) => (
              <motion.div
                key={game.gameType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15 + idx * 0.08,
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <MiniGameCard game={game} onLaunch={handleLaunch} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-3 border-t flex items-center justify-center"
          style={{ borderColor: 'rgba(0, 229, 255, 0.1)' }}
        >
          <div className="flex items-center gap-1.5">
            <kbd
              className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(100, 116, 139, 0.25)',
                color: 'rgba(148, 163, 184, 0.5)',
              }}
            >
              Esc
            </kbd>
            <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
              назад
            </span>
          </div>
        </div>
      </div>

      {/* ── Corner glow decorations ── */}
      <div
        className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgba(0, 229, 255, 0.3)',
          borderLeft: '2px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '-2px -2px 10px rgba(0, 229, 255, 0.1)',
        }}
      />
      <div
        className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgba(0, 229, 255, 0.3)',
          borderRight: '2px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '2px -2px 10px rgba(0, 229, 255, 0.1)',
        }}
      />
      <div
        className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
        style={{
          borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
          borderLeft: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '-2px 2px 10px rgba(251, 191, 36, 0.05)',
        }}
      />
      <div
        className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
          borderRight: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '2px 2px 10px rgba(251, 191, 36, 0.05)',
        }}
      />
    </motion.div>
  );
}

// ─── Shimmer keyframe style (injected once) ───

let styleInjected = false;

function ensureShimmerStyle() {
  if (typeof document === 'undefined') return;
  if (styleInjected) return;
  const id = 'volodka-minigame-hub-shimmer';
  if (document.getElementById(id)) {
    styleInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

// ─── Main Component ───

export function MiniGameHub({ open, onClose }: MiniGameHubProps) {
  // ── Inject shimmer keyframes ──
  useEffect(() => {
    if (open) ensureShimmerStyle();
  }, [open]);

  // ── ESC to close ──
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center font-mono"
          style={{ zIndex: UI_LAYERS.MENU }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── Backdrop with gradient + scanlines ── */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            style={{
              background:
                'linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(5, 8, 18, 0.92) 100%)',
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* ── Scanlines overlay on backdrop ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
            }}
          />

          {/* ── Panel content ── */}
          <MiniGameHubContent onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
