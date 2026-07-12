import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Skull } from 'lucide-react';
import {
  OPENSTACK_TERMINAL_COLORS,
  OPENSTACK_TERMINAL_LABELS,
} from '@/engine/minigame/openstack/openstackTerminalConstants';
import {
  getOutcomeIconMotion,
  getOutcomeMotionTransition,
} from '@/engine/minigame/openstack/openstackTerminalPresentation';
import type { OpenStackGamePhase } from '@/engine/minigame/openstack/openstackTerminalTypes';

type OpenStackTerminalOutcomeProps = {
  phase: Extract<OpenStackGamePhase, 'success' | 'failure'>;
  alreadySolved: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
};

export function OpenStackTerminalOutcome({
  phase,
  alreadySolved,
  reducedMotion,
  onClose,
  closeButtonRef,
}: OpenStackTerminalOutcomeProps) {
  const isSuccess = phase === 'success';
  const iconMotion = getOutcomeIconMotion(reducedMotion);
  const title = isSuccess
    ? alreadySolved
      ? OPENSTACK_TERMINAL_LABELS.successAlreadyTitle
      : OPENSTACK_TERMINAL_LABELS.successTitle
    : OPENSTACK_TERMINAL_LABELS.failureTitle;
  const body = isSuccess
    ? alreadySolved
      ? OPENSTACK_TERMINAL_LABELS.successAlreadyBody
      : OPENSTACK_TERMINAL_LABELS.successBody
    : OPENSTACK_TERMINAL_LABELS.failureBody;

  return (
    <motion.div
      key={phase}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getOutcomeMotionTransition(reducedMotion)}
      className="p-6 text-center"
      role="alert"
    >
      <motion.div
        className="flex justify-center mb-3"
        initial={iconMotion.initial}
        animate={iconMotion.animate}
        transition={iconMotion.transition}
      >
        {isSuccess ? (
          <CheckCircle2 className="size-10" style={{ color: OPENSTACK_TERMINAL_COLORS.success }} aria-hidden="true" />
        ) : (
          <Skull className="size-10" style={{ color: OPENSTACK_TERMINAL_COLORS.error }} aria-hidden="true" />
        )}
      </motion.div>
      <p
        className="text-lg font-bold font-mono mb-2"
        style={{
          color: isSuccess ? OPENSTACK_TERMINAL_COLORS.success : OPENSTACK_TERMINAL_COLORS.error,
          textShadow: isSuccess
            ? '0 0 15px rgba(68, 255, 136, 0.4)'
            : '0 0 15px rgba(255, 68, 68, 0.4)',
        }}
      >
        {title}
      </p>
      <p
        className="text-xs font-mono mb-1"
        style={{ color: isSuccess ? OPENSTACK_TERMINAL_COLORS.prompt : OPENSTACK_TERMINAL_COLORS.alertSub }}
      >
        {body}
      </p>
      {isSuccess && !alreadySolved && (
        <div className="flex items-center justify-center gap-4 mt-3 mb-4">
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              color: OPENSTACK_TERMINAL_COLORS.success,
              background: 'rgba(68, 255, 136, 0.1)',
              border: '1px solid rgba(68, 255, 136, 0.25)',
            }}
          >
            {OPENSTACK_TERMINAL_LABELS.rewardCoding}
          </span>
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              color: OPENSTACK_TERMINAL_COLORS.phase,
              background: 'rgba(255, 204, 0, 0.1)',
              border: '1px solid rgba(255, 204, 0, 0.25)',
            }}
          >
            {OPENSTACK_TERMINAL_LABELS.rewardKarma}
          </span>
        </div>
      )}
      {!isSuccess && (
        <div className="flex items-center justify-center mt-3 mb-4">
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              color: OPENSTACK_TERMINAL_COLORS.error,
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.25)',
            }}
          >
            {OPENSTACK_TERMINAL_LABELS.penaltyStress}
          </span>
        </div>
      )}
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className={`px-5 py-2 rounded text-xs font-mono font-bold transition-all duration-150 ${
          isSuccess ? 'openstack-outcome-btn--success' : 'openstack-outcome-btn--failure'
        }`}
      >
        {OPENSTACK_TERMINAL_LABELS.close}
      </button>
    </motion.div>
  );
}
