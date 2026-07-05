import type { StoryEffect } from '@/shared/types/game';
import {
  buildRewardAriaLabel,
  buildRewardLabel,
  getRewardIcon,
} from '@/engine/quest/questAcceptDialogPresentation';

type QuestAcceptRewardRowProps = {
  reward: StoryEffect;
};

export function QuestAcceptRewardRow({ reward }: QuestAcceptRewardRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" aria-hidden="true">
        {getRewardIcon(reward)}
      </span>
      <span className="text-[12px] font-mono" style={{ color: '#ddaa66' }}>
        {buildRewardLabel(reward)}
      </span>
      <span className="sr-only">{buildRewardAriaLabel(reward)}</span>
    </div>
  );
}
