import { memo } from 'react';
import type { OpenStackCommandOption } from '@/engine/minigame/openstack/openstackTerminalTypes';
import { OPENSTACK_TERMINAL_LABELS } from '@/engine/minigame/openstack/openstackTerminalConstants';

type OpenStackTerminalCommandButtonProps = {
  option: OpenStackCommandOption;
  index: number;
  isSelected: boolean;
  isProcessing: boolean;
  onSelect: (index: number) => void;
};

export const OpenStackTerminalCommandButton = memo(function OpenStackTerminalCommandButton({
  option,
  index,
  isSelected,
  isProcessing,
  onSelect,
}: OpenStackTerminalCommandButtonProps) {
  const keyLabel = `${index + 1}`;
  const stateClass = isSelected
    ? option.isCorrect
      ? 'openstack-cmd-btn--selected-correct'
      : 'openstack-cmd-btn--selected-wrong'
    : '';
  const dimClass = isProcessing && !isSelected ? 'openstack-cmd-btn--dimmed' : '';

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      disabled={isProcessing}
      aria-label={OPENSTACK_TERMINAL_LABELS.commandAria(index + 1, option.command)}
      className={`openstack-cmd-btn w-full flex items-center gap-3 px-3 py-2 rounded text-left font-mono text-xs transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70 ${stateClass} ${dimClass}`}
    >
      <span className="openstack-cmd-key flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0">
        {keyLabel}
      </span>
      <span className="font-bold">{option.command}</span>
    </button>
  );
});
