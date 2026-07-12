import {
  OPENSTACK_TERMINAL_COLORS,
  OPENSTACK_TERMINAL_LABELS,
} from '@/engine/minigame/openstack/openstackTerminalConstants';
import type { OpenStackGamePhase, TerminalLine } from '@/engine/minigame/openstack/openstackTerminalTypes';

export function getTimeLeftColor(timeLeft: number): string {
  if (timeLeft > 30) return OPENSTACK_TERMINAL_COLORS.success;
  if (timeLeft > 15) return OPENSTACK_TERMINAL_COLORS.phase;
  return OPENSTACK_TERMINAL_COLORS.error;
}

export function formatPhaseHeader(phaseNumber: number, title: string): string {
  return OPENSTACK_TERMINAL_LABELS.phaseHeader(phaseNumber, title);
}

export function buildTerminalLogText(lines: readonly TerminalLine[]): string {
  return lines.map((line) => line.text).filter(Boolean).join('\n');
}

export function getPanelMotionTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' as const };
}

export function getPhaseMotionTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.2 };
}

export function getOutcomeMotionTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.4 };
}

export function getAlertCursorMotion(reducedMotion: boolean) {
  if (reducedMotion) {
    return { animate: undefined, transition: { duration: 0 } };
  }
  return {
    animate: { opacity: [0, 1, 0.5, 1] },
    transition: { duration: 1.5, repeat: Infinity },
  };
}

export function getProcessingCursorMotion(reducedMotion: boolean) {
  if (reducedMotion) {
    return { animate: undefined, transition: { duration: 0 } };
  }
  return {
    animate: { opacity: [1, 0] },
    transition: { duration: 0.5, repeat: Infinity },
  };
}

export function getOutcomeIconMotion(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { scale: 1 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: 'spring' as const, stiffness: 200, damping: 12, delay: 0.1 },
  };
}

export function buildPhaseLiveAnnouncement(phase: OpenStackGamePhase, phaseIndex: number): string {
  if (phase === 'alert') return OPENSTACK_TERMINAL_LABELS.alertInit;
  if (phase === 'success') return OPENSTACK_TERMINAL_LABELS.outcomeSuccessAlert;
  if (phase === 'failure') return OPENSTACK_TERMINAL_LABELS.outcomeFailureAlert;
  return `Фаза ${phaseIndex + 1} из 3`;
}

export function triggerOpenStackHaptic(outcome: 'success' | 'failure', reducedMotion: boolean): void {
  if (reducedMotion) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(outcome === 'success' ? [35, 25, 35] : [90]);
}
