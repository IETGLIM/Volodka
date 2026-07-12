import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { OPENSTACK_TERMINAL_COLORS, OPENSTACK_TERMINAL_LABELS } from '@/engine/minigame/openstack/openstackTerminalConstants';
import { getAlertCursorMotion, getPhaseMotionTransition } from '@/engine/minigame/openstack/openstackTerminalPresentation';

type OpenStackTerminalAlertProps = {
  reducedMotion: boolean;
};

export function OpenStackTerminalAlert({ reducedMotion }: OpenStackTerminalAlertProps) {
  const cursorMotion = getAlertCursorMotion(reducedMotion);

  return (
    <motion.div
      key="alert"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={getPhaseMotionTransition(reducedMotion)}
      className="p-6 text-center"
      role="alert"
    >
      <motion.div
        initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertTriangle className="size-8" style={{ color: OPENSTACK_TERMINAL_COLORS.alert }} aria-hidden="true" />
          <div
            className="text-2xl font-bold font-mono"
            style={{
              color: OPENSTACK_TERMINAL_COLORS.alert,
              textShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
            }}
          >
            {OPENSTACK_TERMINAL_LABELS.alertTitle}
          </div>
          <AlertTriangle className="size-8" style={{ color: OPENSTACK_TERMINAL_COLORS.alert }} aria-hidden="true" />
        </div>
        <div className="text-sm font-mono mb-2" style={{ color: OPENSTACK_TERMINAL_COLORS.alertSub }}>
          {OPENSTACK_TERMINAL_LABELS.alertSubtitle}
        </div>
        <div className="text-xs font-mono" style={{ color: OPENSTACK_TERMINAL_COLORS.muted }}>
          {OPENSTACK_TERMINAL_LABELS.alertInit}
        </div>
      </motion.div>
      <motion.div className="mt-4" animate={cursorMotion.animate} transition={cursorMotion.transition}>
        <span className="text-xs font-mono" style={{ color: OPENSTACK_TERMINAL_COLORS.command }} aria-hidden="true">
          ▌
        </span>
      </motion.div>
    </motion.div>
  );
}
