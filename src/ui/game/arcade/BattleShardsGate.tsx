'use client';

import { memo, useEffect, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/state';

interface BattleShardsGateProps {
  onComplete: (success: boolean) => void;
}

export const BattleShardsGate = memo(function BattleShardsGate({ onComplete }: BattleShardsGateProps) {
  const doneRef = useRef(false);
  const travelToScene = useGameStore((s) => s.travelToScene);

  useEffect(() => {
    travelToScene('battle');
    const off = eventBus.on('arcade:battle_complete', () => {
      if (doneRef.current) return;
      doneRef.current = true;
      travelToScene('kitchen_night');
      onComplete(true);
    });
    return () => {
      off();
    };
  }, [onComplete, travelToScene]);

  return (
    <div className="mt-4 font-mono text-sm text-red-300/85">
      Инцидент всплыл как shard-цели на сцене боя. Кликай по красным блокам в 3D, пока волна не снята.
    </div>
  );
});
