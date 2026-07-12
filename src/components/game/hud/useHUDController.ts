import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSaveGame, useHUDControllerState } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { useActiveQuests } from '@/store/questStore';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS } from '@/engine/events';
import { floatKarma, floatEnergy, floatStress, floatXP, floatLevelUp } from '@/components/game/FloatingText';
import type { SkillAchievementNotice } from '@/components/game/hud/parts/AchievementPopup';
import { determineWeatherType, type WeatherType } from '@/data/weatherEffects';
import {
  resolveHudQuestBadgeCount,
  shouldPulseQuestBadge,
} from '@/hooks/questHudPresentation';
import type { HUDProps } from './hudTypes';

function useQuestNotificationCount(): { count: number; pulse: boolean; activeCount: number } {
  const activeQuests = useActiveQuests();
  const [recentNewCount, setRecentNewCount] = useState(0);
  const seenQuests = useRef<Set<string>>(new Set());
  const recentQueue = useRef<{ questId: string; time: number }[]>([]);

  const bumpRecent = useCallback((questId: string) => {
    recentQueue.current.push({ questId, time: Date.now() });
    const now = Date.now();
    const recent = recentQueue.current.filter((r) => now - r.time < 30000);
    recentQueue.current = recent;
    setRecentNewCount(recent.length);
  }, []);

  useEffect(() => {
    for (const q of activeQuests) {
      if (!seenQuests.current.has(q.questId)) {
        seenQuests.current.add(q.questId);
        bumpRecent(q.questId);
      }
    }
  }, [activeQuests, bumpRecent]);

  useEffect(() => {
    const unsubs = [
      eventBus.on('story:quest_available', ({ questId }) => bumpRecent(questId)),
      eventBus.on('quest:objective_updated', ({ questId }) => bumpRecent(questId)),
      eventBus.on('quest:accepted', ({ questId }) => bumpRecent(questId)),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [bumpRecent]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const recent = recentQueue.current.filter((entry) => now - entry.time < 30000);
      recentQueue.current = recent;
      setRecentNewCount(recent.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const count = resolveHudQuestBadgeCount(recentNewCount, activeQuests.length);
  return {
    count,
    pulse: shouldPulseQuestBadge(recentNewCount),
    activeCount: activeQuests.length,
  };
}

/** Game logic for exploration HUD — no layout JSX. */
export function useHUDController(props: HUDProps) {
  const {
    onOpenQuests,
    onOpenInventory,
    onOpenPoetry,
    onOpenJournal,
    onOpenCrafting,
    onOpenTrading,
    onOpenStats,
  } = props;

  const {
    currentSceneId,
    timeOfDay,
    weatherEnabled,
    rainIntensity,
    karma,
    energy,
    stress,
    level,
    xp,
    xpToNextLevel: xpToNext,
    unlockedPerks,
    collectedPoems,
  } = useHUDControllerState();
  const saveGame = useSaveGame();

  const [snowActive, setSnowActive] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  const currentWeather: WeatherType = useMemo(
    () => determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay],
  );

  const sceneName = SCENE_CONFIG[currentSceneId]?.name ?? 'Неизвестно';
  const questBadge = useQuestNotificationCount();
  const questNotificationCount = questBadge.count;
  const questBadgePulse = questBadge.pulse;
  const activeQuestCount = questBadge.activeCount;

  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) {
        clearTimeout(id);
      }
      timers.clear();
    };
  }, []);

  const handleSave = useCallback(() => {
    saveGame({ source: 'manual' });
    setShowSaveIndicator(true);
    scheduleTimeout(() => setShowSaveIndicator(false), 2000);
  }, [saveGame, scheduleTimeout]);

  const perkCount = unlockedPerks?.length ?? 0;

  const activeStatusEffectCount = useMemo(() => {
    let count = 0;
    if (currentWeather !== 'clear') count += 1;
    const PERK_EFFECT_MAP: Record<string, boolean> = {
      night_watch: true, iron_stomach: true, counterattack: true, poetic_trance: true,
    };
    for (const perkId of unlockedPerks) {
      if (PERK_EFFECT_MAP[perkId]) count += 1;
    }
    if (energy < 25) count += 1;
    if (stress > 70) count += 1;
    return count;
  }, [currentWeather, unlockedPerks, energy, stress]);

  const [karmaDirection, setKarmaDirection] = useState<'up' | 'down' | null>(null);
  const [karmaPulse, setKarmaPulse] = useState(false);
  const [energyPulse, setEnergyPulse] = useState(false);
  const [stressPulse, setStressPulse] = useState(false);
  const prevKarma = useRef(karma);
  const prevEnergy = useRef(energy);
  const prevStress = useRef(stress);
  const prevLevel = useRef(level);
  const prevXp = useRef(xp);
  const [justLeveled, setJustLeveled] = useState(false);
  const [skillAchievement, setSkillAchievement] = useState<SkillAchievementNotice | null>(null);

  useEffect(() => {
    if (karma !== prevKarma.current) {
      const delta = karma - prevKarma.current;
      prevKarma.current = karma;
      if (delta !== 0) floatKarma(delta);
      scheduleTimeout(() => {
        if (delta > 0) setKarmaDirection('up');
        else if (delta < 0) setKarmaDirection('down');
        scheduleTimeout(() => setKarmaDirection(null), 2000);
      }, 0);
      scheduleTimeout(() => setKarmaPulse(true), 0);
      scheduleTimeout(() => setKarmaPulse(false), 600);
    }
  }, [karma, scheduleTimeout]);

  useEffect(() => {
    if (energy !== prevEnergy.current) {
      const delta = energy - prevEnergy.current;
      prevEnergy.current = energy;
      if (delta !== 0) floatEnergy(delta);
      scheduleTimeout(() => setEnergyPulse(true), 0);
      scheduleTimeout(() => setEnergyPulse(false), 600);
    }
  }, [energy, scheduleTimeout]);

  useEffect(() => {
    if (stress !== prevStress.current) {
      const delta = stress - prevStress.current;
      prevStress.current = stress;
      if (delta !== 0) floatStress(delta);
      scheduleTimeout(() => setStressPulse(true), 0);
      scheduleTimeout(() => setStressPulse(false), 600);
    }
  }, [stress, scheduleTimeout]);

  useEffect(() => {
    if (xp !== prevXp.current) {
      const delta = xp - prevXp.current;
      prevXp.current = xp;
      if (delta > 0) floatXP(delta);
    }
  }, [xp]);

  useEffect(() => {
    if (level > prevLevel.current) {
      const newLevel = level;
      prevLevel.current = level;
      scheduleTimeout(() => {
        setJustLeveled(true);
        floatLevelUp(newLevel);
        scheduleTimeout(() => setJustLeveled(false), 1500);
      }, 0);
    }
  }, [level, scheduleTimeout]);

  useEffect(() => {
    const unsubSkill = eventBus.on('skill:level_up', (payload) => {
      setSkillAchievement({
        title: `${payload.skill} ур.${payload.level}`,
        description: 'Навык улучшен!',
        icon: '⬆',
      });
      scheduleTimeout(() => setSkillAchievement(null), 3000);
    });
    return () => {
      unsubSkill();
    };
  }, [scheduleTimeout]);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [moreMenuOpen]);

  const [photoModeOn, setPhotoModeOn] = useState(false);
  useEffect(() => {
    const activeSub = eventBus.on(PHOTO_EVENTS.active, () => setPhotoModeOn(true));
    const inactiveSub = eventBus.on(PHOTO_EVENTS.inactive, () => setPhotoModeOn(false));
    return () => { activeSub(); inactiveSub(); };
  }, []);

  const [hudMounted, setHudMounted] = useState(false);
  useEffect(() => {
    setHudMounted(true);
  }, []);

  const [poemBadgePulse, setPoemBadgePulse] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('ui:highlight_poem_badge', () => {
      setPoemBadgePulse(true);
      scheduleTimeout(() => setPoemBadgePulse(false), 8000);
    });
    return () => { unsub(); };
  }, [scheduleTimeout]);

  return {
    photoModeOn,
    hudMounted,
    timeOfDay,
    sceneName,
    currentWeather,
    collectedPoems,
    questNotificationCount,
    questBadgePulse,
    poemBadgePulse,
    activeQuestCount,
    showSaveIndicator,
    handleSave,
    karma,
    energy,
    stress,
    level,
    xp,
    xpToNext,
    perkCount,
    activeStatusEffectCount,
    karmaDirection,
    karmaPulse,
    energyPulse,
    stressPulse,
    justLeveled,
    skillAchievement,
    isLowEnergy: energy < 25,
    isHighStress: stress > 70,
    moreMenuOpen,
    setMoreMenuOpen,
    moreMenuRef,
    onOpenQuests,
    onOpenInventory,
    onOpenPoetry,
    onOpenJournal,
    onOpenCrafting,
    onOpenTrading,
    onOpenStats,
  };
}

export type HUDControllerState = ReturnType<typeof useHUDController>;

/** Alias for exploration HUD data hook. */
export { useHUDController as useExplorationHUD };
export type ExplorationHUDState = HUDControllerState;
