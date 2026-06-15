import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { audioEngine } from '@/engine/AudioEngine';
import { getGameStore } from '@/store/gameStore';
import { getDaySeed, getWeekSeed, getDailyMissionPool, getWeeklyMissionPool } from '@/data/dailyMissions';
import {
  canAcceptMoreMissions,
  countActiveMissions,
  countClaimedMissions,
  partitionMissions,
  tryAbandonDailyMission,
  tryAcceptDailyMission,
  tryClaimDailyMission,
} from '@/engine/questBoard/questBoardPresentation';
import {
  QUEST_BOARD_LABELS,
  QUEST_BOARD_MAX_ACTIVE_MISSIONS,
} from '@/engine/questBoard/questBoardConstants';
import {
  useAcceptedDailyMissions,
  usePlayerLevel,
  useQuestBoardStoreActions,
} from '@/components/game/questBoard/useQuestBoardSelectors';

export type QuestBoardTab = 'daily' | 'weekly';

export function useQuestBoardController() {
  const { acceptDailyMission, abandonDailyMission, claimDailyMissionReward } = useQuestBoardStoreActions();
  const acceptedDailyMissions = useAcceptedDailyMissions();
  const playerLevel = usePlayerLevel();

  const [activeTab, setActiveTab] = useState<QuestBoardTab>('daily');
  const [tabAnnouncement, setTabAnnouncement] = useState('');

  const daySeed = useMemo(() => getDaySeed(), []);
  const weekSeed = useMemo(() => getWeekSeed(), []);

  const dailyMissions = useMemo(
    () => getDailyMissionPool(daySeed, playerLevel),
    [daySeed, playerLevel],
  );

  const weeklyMissions = useMemo(
    () => getWeeklyMissionPool(weekSeed, playerLevel),
    [weekSeed, playerLevel],
  );

  const currentMissions = activeTab === 'daily' ? dailyMissions : weeklyMissions;

  const { activeMissions, availableMissions } = useMemo(
    () => partitionMissions(currentMissions, acceptedDailyMissions),
    [currentMissions, acceptedDailyMissions],
  );

  const activeCount = useMemo(
    () => countActiveMissions(acceptedDailyMissions),
    [acceptedDailyMissions],
  );

  const completedCount = useMemo(
    () => countClaimedMissions(acceptedDailyMissions),
    [acceptedDailyMissions],
  );

  const canAcceptMore = canAcceptMoreMissions(activeCount, QUEST_BOARD_MAX_ACTIVE_MISSIONS);
  const slotsFull = !canAcceptMore;

  useEffect(() => {
    setTabAnnouncement(
      activeTab === 'daily'
        ? QUEST_BOARD_LABELS.tabDailySelected
        : QUEST_BOARD_LABELS.tabWeeklySelected,
    );
  }, [activeTab]);

  const getAcceptedMissions = useCallback(
    () => getGameStore().acceptedDailyMissions,
    [],
  );

  const handleAccept = useCallback(
    (missionId: string) => {
      if (tryAcceptDailyMission(acceptDailyMission, missionId, getAcceptedMissions)) {
        audioEngine.playSfx('quest_complete');
      }
    },
    [acceptDailyMission, getAcceptedMissions],
  );

  const handleAbandon = useCallback(
    (missionId: string) => {
      tryAbandonDailyMission(abandonDailyMission, missionId, getAcceptedMissions);
    },
    [abandonDailyMission, getAcceptedMissions],
  );

  const handleClaim = useCallback(
    (missionId: string) => {
      if (tryClaimDailyMission(claimDailyMissionReward, missionId, getAcceptedMissions)) {
        audioEngine.playSfx('quest_complete');
      }
    },
    [claimDailyMissionReward, getAcceptedMissions],
  );

  const handleTabListKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setActiveTab((current) => (current === 'daily' ? 'weekly' : 'daily'));
  }, []);

  return {
    activeTab,
    setActiveTab,
    tabAnnouncement,
    dailyMissions,
    weeklyMissions,
    activeMissions,
    availableMissions,
    currentMissions,
    activeCount,
    completedCount,
    maxActive: QUEST_BOARD_MAX_ACTIVE_MISSIONS,
    canAcceptMore,
    slotsFull,
    handleAccept,
    handleAbandon,
    handleClaim,
    handleTabListKeyDown,
  };
}
