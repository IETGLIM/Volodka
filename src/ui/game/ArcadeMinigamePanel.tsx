'use client';

import { memo, useCallback } from 'react';
import type { MiniGame, StoryChoice, StoryEffect } from '@/data/types';
import {
  ChatSpamBeat,
  DrillQteBeat,
  WireHackStoryGate,
} from '@/ui/game/arcade/ArcadeBeatComponents';
import { BattleShardsGate } from '@/ui/game/arcade/BattleShardsGate';

interface ArcadeMinigamePanelProps {
  minigame: MiniGame;
  onChoice: (choice: StoryChoice) => void;
}

function effectToChoice(next: string, effect?: StoryEffect): StoryChoice {
  return { text: '', next, effect };
}

export const ArcadeMinigamePanel = memo(function ArcadeMinigamePanel({
  minigame,
  onChoice,
}: ArcadeMinigamePanelProps) {
  const finish = useCallback(
    (success: boolean) => {
      const next = success ? minigame.successNext : minigame.failNext;
      const effect = success ? minigame.successEffect : minigame.failEffect;
      onChoice(effectToChoice(next, effect));
    },
    [minigame, onChoice],
  );

  switch (minigame.type) {
    case 'drill_qte':
      return <DrillQteBeat onComplete={finish} />;
    case 'chat_spam':
      return <ChatSpamBeat onComplete={finish} />;
    case 'wire_hack':
      return <WireHackStoryGate onComplete={finish} />;
    case 'battle_shards':
      return <BattleShardsGate onComplete={finish} />;
    default:
      return (
        <p className="mt-3 font-mono text-xs text-amber-400/70">
          Мини-игра «{minigame.type}» пока не подключена — переход по успеху.
        </p>
      );
  }
});
