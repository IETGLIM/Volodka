'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useArcadeScoreStore } from '@/state/arcadeScoreStore';
import { emitInteractionFeedback } from '@/lib/interactionFeedback';
import { useArcadeQteHudStore } from '@/state/arcadeQteHudStore';

const ROUNDS = 4;
const WINDOW_MS = 700;
const CYCLE_MS = 1400;

interface DrillQteProps {
  onComplete: (success: boolean) => void;
}

export const DrillQteBeat = memo(function DrillQteBeat({ onComplete }: DrillQteProps) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'open' | 'miss'>('wait');
  const [hits, setHits] = useState(0);
  const openAtRef = useRef(0);
  const addScore = useArcadeScoreStore((s) => s.addScore);
  const missCombo = useArcadeScoreStore((s) => s.missCombo);

  useEffect(() => {
    if (round >= ROUNDS) {
      onComplete(hits >= 2);
      return;
    }
    setPhase('wait');
    const t = window.setTimeout(() => {
      openAtRef.current = performance.now();
      setPhase('open');
    }, 600 + Math.random() * 400);
    return () => window.clearTimeout(t);
  }, [round, hits, onComplete]);

  useEffect(() => {
    if (phase !== 'open') return;
    const t = window.setTimeout(() => {
      setPhase('miss');
      missCombo();
      emitInteractionFeedback('fail', 'drill_qte_miss');
      window.setTimeout(() => setRound((r) => r + 1), 400);
    }, WINDOW_MS);
    return () => window.clearTimeout(t);
  }, [phase, missCombo]);

  const tryHit = useCallback(() => {
    if (phase !== 'open') return;
    const elapsed = performance.now() - openAtRef.current;
    if (elapsed <= WINDOW_MS) {
      setHits((h) => h + 1);
      addScore(40);
      emitInteractionFeedback('success', 'drill_qte_hit');
      setRound((r) => r + 1);
      setPhase('wait');
    }
  }, [phase, addScore]);

  useEffect(() => {
    useArcadeQteHudStore.getState().bind(tryHit, phase === 'open' ? 'СЕЙЧАС' : 'QTE');
    return () => useArcadeQteHudStore.getState().unbind();
  }, [tryHit, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        tryHit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryHit]);

  return (
    <div className="mt-4 space-y-3 font-mono">
      <p className="text-cyan-300/80 text-sm">Поймай паузу дрели — Space или тап в зелёное окно.</p>
      <div className="flex items-center justify-between text-[10px] text-cyan-500/50">
        <span>Раунд {Math.min(round + 1, ROUNDS)}/{ROUNDS}</span>
        <span>Попаданий: {hits}</span>
      </div>
      <button
        type="button"
        onClick={tryHit}
        className={`w-full h-14 rounded border transition-colors ${
          phase === 'open'
            ? 'border-emerald-400/70 bg-emerald-950/60 shadow-[0_0_24px_rgba(52,211,153,0.35)]'
            : phase === 'miss'
              ? 'border-red-500/50 bg-red-950/40'
              : 'border-cyan-500/20 bg-black/40'
        }`}
      >
        {phase === 'open' ? '▶ СЕЙЧАС' : phase === 'miss' ? '✕ мимо' : '… жди тишину'}
      </button>
      <motion.div
        className="h-1 bg-cyan-500/20 rounded overflow-hidden"
        aria-hidden
      >
        <motion.div
          className="h-full bg-cyan-400/70"
          animate={{ width: phase === 'open' ? '100%' : '0%' }}
          transition={{ duration: phase === 'open' ? WINDOW_MS / 1000 : 0.2 }}
        />
      </motion.div>
    </div>
  );
});

const CHAT_LINES = [
  { id: 'ok', label: 'Смотрю логи, 5 минут', correct: true },
  { id: 'no', label: 'Уже сплю, завтра', correct: false },
  { id: 'yes', label: 'Конечно, сейчас всё починю', correct: false },
  { id: 'mute', label: 'Отключить уведомления', correct: false },
];

interface ChatSpamProps {
  onComplete: (success: boolean) => void;
}

export const ChatSpamBeat = memo(function ChatSpamBeat({ onComplete }: ChatSpamProps) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [deadline, setDeadline] = useState(() => Date.now() + 4500);
  const addScore = useArcadeScoreStore((s) => s.addScore);
  const missCombo = useArcadeScoreStore((s) => s.missCombo);

  useEffect(() => {
    if (round >= 3) {
      onComplete(correct >= 2);
    }
  }, [round, correct, onComplete]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (Date.now() > deadline) {
        missCombo();
        setRound((r) => r + 1);
        setDeadline(Date.now() + 4500);
      }
    }, 200);
    return () => window.clearInterval(t);
  }, [deadline, missCombo]);

  const pick = (correctPick: boolean) => {
    if (correctPick) {
      setCorrect((c) => c + 1);
      addScore(35);
      emitInteractionFeedback('success', 'chat_spam_ok');
    } else {
      missCombo();
      emitInteractionFeedback('fail', 'chat_spam_bad');
    }
    setRound((r) => r + 1);
    setDeadline(Date.now() + 4500);
  };

  const msLeft = Math.max(0, deadline - Date.now());

  return (
    <div className="mt-4 space-y-3 font-mono">
      <p className="text-cyan-300/80 text-sm">
        Александр пишет в Slack. Не соглашайся на ночную смену — выбери границу.
      </p>
      <div className="text-[10px] text-amber-400/70 tabular-nums">
        Таймер: {(msLeft / 1000).toFixed(1)}s · раунд {Math.min(round + 1, 3)}/3
      </div>
      <div className="grid grid-cols-1 gap-2">
        {CHAT_LINES.map((line) => (
          <button
            key={line.id}
            type="button"
            onClick={() => pick(line.correct)}
            className="text-left px-3 py-2 rounded border border-cyan-500/25 bg-black/50 hover:border-cyan-400/50 text-sm text-cyan-100/90"
          >
            {line.label}
          </button>
        ))}
      </div>
    </div>
  );
});

interface WireHackStoryGateProps {
  onComplete: (success: boolean) => void;
}

/** Story overlay gate — opens same wire-hack as exploration rack. */
export const WireHackStoryGate = memo(function WireHackStoryGate({ onComplete }: WireHackStoryGateProps) {
  const openedRef = useRef(false);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    let cancelled = false;
    void import('@/state/wireHackOverlayStore').then(({ useWireHackOverlayStore }) => {
      if (cancelled) return;
      void import('@/game/quests/explorationQuestGraphs').then(({ shuffleWireIndices }) => {
        const sequence = shuffleWireIndices();
        useWireHackOverlayStore.getState().openWireHack({
          title: 'МАТРИЦА УЗЛОВ · demo-rack',
          sequence,
          onFinished: (success) => {
            useWireHackOverlayStore.getState().closeWireHack();
            onComplete(success);
          },
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <p className="mt-3 font-mono text-sm text-cyan-400/70 animate-pulse">
      Подключение к стойке… мини-игра открыта поверх сцены.
    </p>
  );
});
