import { Star, Zap, Sparkles, Trophy, Package, Flag } from 'lucide-react';
import type { StoryEffect } from '@/shared/types/game';
import {
  buildRewardAriaLabel,
  buildRewardLabel,
} from '@/engine/quest/questAcceptDialogPresentation';

type QuestAcceptRewardRowProps = {
  reward: StoryEffect;
};

function getRewardLucideIcon(reward: StoryEffect) {
  switch (reward.type) {
    case 'addSkill': return <Star className="size-3.5 text-amber-400/70" />;
    case 'addKarma': return <Zap className="size-3.5 text-cyan-400/70" />;
    case 'addXp': return <Sparkles className="size-3.5 text-purple-400/70" />;
    case 'addCredits': return <Trophy className="size-3.5 text-yellow-400/70" />;
    case 'addItem': return <Package className="size-3.5 text-emerald-400/70" />;
    case 'setFlag': return <Flag className="size-3.5 text-amber-400/70" />;
    default: return <Sparkles className="size-3.5 text-slate-400/70" />;
  }
}

export function QuestAcceptRewardRow({ reward }: QuestAcceptRewardRowProps) {
  return (
    <div className="flex items-center gap-2">
      {getRewardLucideIcon(reward)}
      <span className="text-[12px] font-mono" style={{ color: '#ddaa66' }}>
        {buildRewardLabel(reward)}
      </span>
      <span className="sr-only">{buildRewardAriaLabel(reward)}</span>
    </div>
  );
}
