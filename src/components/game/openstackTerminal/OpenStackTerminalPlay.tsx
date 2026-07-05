import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import { OpenStackTerminalCommandButton } from '@/components/game/openstackTerminal/OpenStackTerminalCommandButton';
import {
  OPENSTACK_TERMINAL_COLORS,
  OPENSTACK_TERMINAL_LABELS,
} from '@/engine/minigame/openstack/openstackTerminalConstants';
import {
  buildTerminalLogText,
  getPhaseMotionTransition,
  getProcessingCursorMotion,
} from '@/engine/minigame/openstack/openstackTerminalPresentation';
import type {
  OpenStackPhaseConfig,
  TerminalLine,
} from '@/engine/minigame/openstack/openstackTerminalTypes';

type OpenStackTerminalPlayProps = {
  phaseIndex: number;
  currentPhaseConfig: OpenStackPhaseConfig | undefined;
  terminalLines: TerminalLine[];
  terminalRef: RefObject<HTMLDivElement | null>;
  selectedOption: number | null;
  isProcessing: boolean;
  reducedMotion: boolean;
  onSelect: (index: number) => void;
};

export function OpenStackTerminalPlay({
  phaseIndex,
  currentPhaseConfig,
  terminalLines,
  terminalRef,
  selectedOption,
  isProcessing,
  reducedMotion,
  onSelect,
}: OpenStackTerminalPlayProps) {
  const cursorMotion = getProcessingCursorMotion(reducedMotion);
  const logText = buildTerminalLogText(terminalLines);

  if (!currentPhaseConfig) return null;

  return (
    <motion.div
      key={`phase-${phaseIndex}`}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={getPhaseMotionTransition(reducedMotion)}
    >
      <div
        ref={terminalRef}
        className="openstack-terminal-output p-4 max-h-52 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Вывод терминала OpenStack"
      >
        <span className="sr-only">{logText}</span>
        {terminalLines.map((line, index) => (
          <div
            key={`line-${index}-${line.text.slice(0, 12)}`}
            style={{ color: line.color }}
            className={line.isCommand ? 'font-bold' : ''}
            aria-hidden="true"
          >
            {line.text || '\u00A0'}
          </div>
        ))}
        {isProcessing && (
          <motion.span
            style={{ color: OPENSTACK_TERMINAL_COLORS.command }}
            animate={cursorMotion.animate}
            transition={cursorMotion.transition}
            aria-hidden="true"
          >
            ▌
          </motion.span>
        )}
      </div>

      <div className="p-4">
        <div
          className="text-[10px] font-mono mb-2 uppercase tracking-wider"
          style={{ color: OPENSTACK_TERMINAL_COLORS.muted }}
        >
          {OPENSTACK_TERMINAL_LABELS.commandsHeading}
        </div>
        <div className="space-y-2" role="group" aria-label={OPENSTACK_TERMINAL_LABELS.commandsHeading}>
          {currentPhaseConfig.options.map((option, index) => (
            <OpenStackTerminalCommandButton
              key={`${currentPhaseConfig.id}-${option.command}`}
              option={option}
              index={index}
              isSelected={selectedOption === index}
              isProcessing={isProcessing}
              onSelect={onSelect}
            />
          ))}
        </div>
        <div className="text-[9px] font-mono mt-3 text-center" style={{ color: OPENSTACK_TERMINAL_COLORS.hint }}>
          {OPENSTACK_TERMINAL_LABELS.keyboardHint(currentPhaseConfig.options.length)}
        </div>
      </div>
    </motion.div>
  );
}
