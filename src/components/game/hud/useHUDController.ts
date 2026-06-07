import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useCollectedPoems,
  useHUDExploration,
  useHUDPlayerVitals,
  useSaveGame,
} from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { useActiveQuests } from '@/store/questStore';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS } from '@/engine/events';
import { floatKarma, floatEnergy, floatStress, floatXP } from '@/components/game/FloatingText';
import { determineWeatherType, type WeatherType } from '@/data/weatherEffects';
import type { HUDProps } from './hudTypes';

function useQuestNotificationCount(): number {
  const activeQuests = useActiveQuests();
  const [newCount, setNewCount] = useState(0);
  const seenQuests = useRef<Set<string>>(new Set());
  const recentQueue = useRef<{ questId: string; time: number }[]>([]);

  useEffect(() => {
    for (const q of activeQuests) {
      if (!seenQuests.current.has(q.questId)) {
        seenQuests.current.add(q.questId);
        recentQueue.current.push({ questId: q.questId, time: Date.now() });
      }
    }

    const now = Date.now();
    const recent = recentQueue.current.filter((r) => now - r.time < 30000);
    recentQueue.current = recent;
    setNewCount(recent.length);

    const timer = setInterval(() => {
      const n = Date.now();
      const r = recentQueue.current.filter((e) => n - e.time < 30000);
      recentQueue.current = r;
      setNewCount(r.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeQuests]);

  return newCount;
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

  const { currentSceneId, timeOfDay, weatherEnabled, rainIntensity } = useHUDExploration();
  const playerVitals = useHUDPlayerVitals();
  const saveGame = useSaveGame();
  const collectedPoems = useCollectedPoems();

  const [snowActive, setSnowActive] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload: { active: boolean }) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  const currentWeather: WeatherType = useMemo(
    () => determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay],
  );

  const sceneName = SCENE_CONFIG[currentSceneId]?.name ?? 'Неизвестно';
  const questNotificationCount = useQuestNotificationCount();

  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const handleSave = useCallback(() => {
    saveGame({ source: 'manual' });
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  }, [saveGame]);

  const { karma, energy, stress, level, xp, xpToNextLevel: xpToNext, unlockedPerks } = playerVitals;
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
  const karmaDirectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [karmaPulse, setKarmaPulse] = useState(false);
  const [energyPulse, setEnergyPulse] = useState(false);
  const [stressPulse, setStressPulse] = useState(false);
  const prevKarma = useRef(karma);
  const prevEnergy = useRef(energy);
  const prevStress = useRef(stress);
  const prevLevel = useRef(level);
  const prevXp = useRef(xp);

  useEffect(() => {
    if (karma !== prevKarma.current) {
      const delta = karma - prevKarma.current;
      prevKarma.current = karma;
      if (delta !== 0) floatKarma(delta);
      const dirTimeout = setTimeout(() => {
        if (delta > 0) setKarmaDirection('up');
        else if (delta < 0) setKarmaDirection('down');
        if (karmaDirectionTimeout.current) clearTimeout(karmaDirectionTimeout.current);
        karmaDirectionTimeout.current = setTimeout(() => setKarmaDirection(null), 2000);
      }, 0);
      const t = setTimeout(() => setKarmaPulse(true), 0);
      const t2 = setTimeout(() => setKarmaPulse(false), 600);
      return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(dirTimeout); };
    }
  }, [karma]);

  useEffect(() => {
    if (energy !== prevEnergy.current) {
      const delta = energy - prevEnergy.current;
      prevEnergy.current = energy;
      if (delta !== 0) floatEnergy(delta);
      const t = setTimeout(() => setEnergyPulse(true), 0);
      const t2 = setTimeout(() => setEnergyPulse(false), 600);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [energy]);

  useEffect(() => {
    if (stress !== prevStress.current) {
      const delta = stress - prevStress.current;
      prevStress.current = stress;
      if (delta !== 0) floatStress(delta);
      const t = setTimeout(() => setStressPulse(true), 0);
      const t2 = setTimeout(() => setStressPulse(false), 600);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [stress]);

  useEffect(() => {
    if (xp !== prevXp.current) {
      const delta = xp - prevXp.current;
      prevXp.current = xp;
      if (delta > 0) floatXP(delta);
    }
  }, [xp]);

  useEffect(() => {
    if (level > prevLevel.current) prevLevel.current = level;
  }, [level]);

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

  return {
    photoModeOn,
    hudMounted,
    timeOfDay,
    sceneName,
    currentWeather,
    collectedPoems,
    questNotificationCount,
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
