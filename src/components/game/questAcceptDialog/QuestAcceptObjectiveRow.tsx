import type { QuestObjective } from '@/shared/types/game';
import {
  buildObjectiveAriaLabel,
  getObjectiveIcon,
} from '@/engine/quest/questAcceptDialogPresentation';

type QuestAcceptObjectiveRowProps = {
  objective: QuestObjective;
};

export function QuestAcceptObjectiveRow({ objective }: QuestAcceptObjectiveRowProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
        {getObjectiveIcon(objective)}
      </span>
      <span className="text-[12px] font-mono" style={{ color: '#99bbbb' }}>
        {objective.description}
      </span>
      <span className="sr-only">{buildObjectiveAriaLabel(objective)}</span>
    </div>
  );
}
