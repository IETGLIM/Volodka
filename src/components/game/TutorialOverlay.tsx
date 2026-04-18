'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { getNPCsForScene, getNpcExplorationPosition } from '@/data/npcDefinitions';

export const TutorialOverlay = memo(function TutorialOverlay({
  gameMode,
  isDialogue,
}: {
  gameMode: 'visual-novel' | 'exploration' | 'dialogue' | 'cutscene';
  isDialogue: boolean;
}) {
  const { flags, exploration, setFlag } = useGameStore(
    useShallow((s) => ({
      flags: s.playerState.flags,
      exploration: s.exploration,
      setFlag: s.setFlag,
    })),
  );

  const nearNpc = useMemo(() => {
    if (gameMode !== 'exploration') return false;
    const pos = exploration.playerPosition;
    const sid = exploration.currentSceneId;
    const t = exploration.timeOfDay;
    return getNPCsForScene(sid, t).some((n) => {
      const p = getNpcExplorationPosition(n, sid, t, exploration.npcStates[n.id]?.position);
      return Math.hypot(p.x - pos.x, p.z - pos.z) < 3.2;
    });
  }, [
    gameMode,
    exploration.playerPosition,
    exploration.currentSceneId,
    exploration.timeOfDay,
    exploration.npcStates,
  ]);

  const disabled = flags.tutorialsDisabled === true;
  const showMovement = gameMode === 'exploration' && !disabled && !flags.tutorial_seen_movement;
  const showInteract =
    gameMode === 'exploration' && !disabled && !flags.tutorial_seen_interact && nearNpc && !isDialogue;

  const lines = useMemo(() => {
    const l: string[] = [];
    if (showMovement) {
      l.push('WASD — движение');
      l.push('E — взаимодействие');
      l.push('I — инвентарь');
    } else if (showInteract) {
      l.push('Нажмите E, чтобы поговорить или использовать объект');
    }
    return l;
  }, [showMovement, showInteract]);

  if (disabled || gameMode !== 'exploration' || lines.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        className="game-fm-layer game-fm-layer-promote intro-recall-frame pointer-events-auto fixed bottom-32 left-4 z-40 max-w-xs rounded-lg border border-cyan-500/40 bg-black/82 p-3 font-mono text-xs text-cyan-100 shadow-xl backdrop-blur"
      >
        {lines.map((t) => (
          <div key={t} className="py-0.5">
            {t}
          </div>
        ))}
        <button
          type="button"
          className="mt-2 w-full rounded border border-slate-600 py-1 text-[10px] text-slate-300 hover:border-cyan-500/50"
          onClick={() => {
            if (showMovement) setFlag('tutorial_seen_movement');
            if (showInteract) setFlag('tutorial_seen_interact');
          }}
        >
          Понятно
        </button>
        <button
          type="button"
          className="mt-1 w-full rounded border border-slate-700 py-1 text-[9px] text-slate-500 hover:text-slate-300"
          onClick={() => setFlag('tutorialsDisabled')}
        >
          Не показывать подсказки
        </button>
      </motion.div>
    </AnimatePresence>
  );
});
