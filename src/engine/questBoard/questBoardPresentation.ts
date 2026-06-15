import type { Transition } from 'framer-motion';
import type { DailyMission, DailyMissionResetSchedule } from '@/data/dailyMissions';
import type { AcceptedDailyMission } from '@/shared/types/game';
import { QUEST_BOARD_LABELS } from '@/engine/questBoard/questBoardConstants';
import { QUEST_BOARD_MAX_ACTIVE_MISSIONS } from '@/shared/quest/questBoardConstants';

export type MissionWithAccepted = {
  mission: DailyMission;
  accepted: AcceptedDailyMission;
};

export function partitionMissions(
  missions: DailyMission[],
  acceptedDailyMissions: AcceptedDailyMission[],
): { activeMissions: MissionWithAccepted[]; availableMissions: DailyMission[] } {
  const acceptedById = new Map(acceptedDailyMissions.map((entry) => [entry.missionId, entry]));

  const activeMissions: MissionWithAccepted[] = [];
  const availableMissions: DailyMission[] = [];

  for (const mission of missions) {
    const accepted = acceptedById.get(mission.id);
    if (accepted) {
      activeMissions.push({ mission, accepted });
    } else {
      availableMissions.push(mission);
    }
  }

  return { activeMissions, availableMissions };
}

export function countActiveMissions(acceptedDailyMissions: AcceptedDailyMission[]): number {
  return acceptedDailyMissions.filter((mission) => !mission.completed && !mission.claimed).length;
}

export function countClaimedMissions(acceptedDailyMissions: AcceptedDailyMission[]): number {
  return acceptedDailyMissions.filter((mission) => mission.claimed).length;
}

export function getResetTargetDate(resetSchedule: DailyMissionResetSchedule, now = new Date()): Date {
  if (resetSchedule === 'daily') {
    const target = new Date(now);
    target.setHours(24, 0, 0, 0);
    return target;
  }

  const target = new Date(now);
  const day = target.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  target.setDate(target.getDate() + daysUntilMonday);
  target.setHours(0, 0, 0, 0);
  return target;
}

export function formatResetTimeLeft(
  resetSchedule: DailyMissionResetSchedule,
  now = new Date(),
): string {
  const target = getResetTargetDate(resetSchedule, now);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return QUEST_BOARD_LABELS.resetSoon;
  }

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return QUEST_BOARD_LABELS.resetDaysHours(days, hours);
  }

  return QUEST_BOARD_LABELS.resetHoursMinutes(hours, minutes);
}

export function computeObjectiveProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
}

export function isObjectiveComplete(current: number, target: number): boolean {
  return current >= target;
}

export function getMissionCardVisualState(
  isAccepted: boolean,
  isCompleted: boolean,
  isClaimed: boolean,
  categoryColor: string,
): {
  borderColor: string;
  background: string;
  opacity: number;
} {
  if (isClaimed) {
    return {
      borderColor: 'rgba(100,116,139,0.1)',
      background: 'rgba(15,23,42,0.2)',
      opacity: 0.5,
    };
  }
  if (isCompleted) {
    return {
      borderColor: 'rgba(16,185,129,0.3)',
      background: 'rgba(16,185,129,0.06)',
      opacity: 1,
    };
  }
  if (isAccepted) {
    return {
      borderColor: `${categoryColor}30`,
      background: `${categoryColor}08`,
      opacity: 1,
    };
  }
  return {
    borderColor: 'rgba(100,116,139,0.15)',
    background: 'rgba(15,23,42,0.4)',
    opacity: 1,
  };
}

export function getCardEnterMotion(reducedMotion: boolean): {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y: number };
  exit: { opacity: number; y: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2 },
  };
}

export function getProgressBarTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.4, 0, 0.2, 1] };
}

export function canAcceptMoreMissions(
  activeCount: number,
  maxActive: number = QUEST_BOARD_MAX_ACTIVE_MISSIONS,
): boolean {
  return activeCount < maxActive;
}

export function safeMissionAction(action: () => void): boolean {
  try {
    action();
    return true;
  } catch {
    return false;
  }
}

export function wasMissionAccepted(
  missionId: string,
  acceptedDailyMissions: readonly AcceptedDailyMission[],
): boolean {
  return acceptedDailyMissions.some((entry) => entry.missionId === missionId);
}

export function wasMissionClaimed(
  missionId: string,
  acceptedDailyMissions: readonly AcceptedDailyMission[],
): boolean {
  const entry = acceptedDailyMissions.find((mission) => mission.missionId === missionId);
  return entry?.claimed ?? false;
}

export function tryAcceptDailyMission(
  accept: (missionId: string) => void,
  missionId: string,
  getAcceptedMissions: () => readonly AcceptedDailyMission[],
): boolean {
  const before = wasMissionAccepted(missionId, getAcceptedMissions());
  safeMissionAction(() => accept(missionId));
  return !before && wasMissionAccepted(missionId, getAcceptedMissions());
}

export function tryClaimDailyMission(
  claim: (missionId: string) => void,
  missionId: string,
  getAcceptedMissions: () => readonly AcceptedDailyMission[],
): boolean {
  const before = wasMissionClaimed(missionId, getAcceptedMissions());
  safeMissionAction(() => claim(missionId));
  return !before && wasMissionClaimed(missionId, getAcceptedMissions());
}

export function tryAbandonDailyMission(
  abandon: (missionId: string) => void,
  missionId: string,
  getAcceptedMissions: () => readonly AcceptedDailyMission[],
): boolean {
  const before = wasMissionAccepted(missionId, getAcceptedMissions());
  safeMissionAction(() => abandon(missionId));
  return before && !wasMissionAccepted(missionId, getAcceptedMissions());
}
