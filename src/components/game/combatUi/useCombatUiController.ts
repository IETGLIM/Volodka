import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { eventBus } from '@/engine/EventBus';
import { useUIStore } from '@/store/stores/uiStore';
import { useCutsceneStore } from '@/store/stores/cutsceneStore';
import { getGamePhase } from '@/shared/gamePhase';
import {
  playerAttack,
  playerDefend,
  playerUsePoemPower,
  playerFlee,
  getAvailableCombatPowers,
  getActiveBuffs,
  getGamepadSelectedPoemIndex,
  subscribeToCombat,
} from '@/engine/CombatSystem';
import type { CombatState } from '@/shared/types/game';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useTouchDevice } from '@/hooks/useTouchDevice';

export function useCombatUiController() {
  const combatActive = useUIStore((s) => s.combatActive);
  const mainMenuOpen = useUIStore((s) => s.mainMenuOpen);
  const introActive = useUIStore((s) => s.introActive);
  const activeCutsceneId = useCutsceneStore((s) => s.activeCutsceneId);
  const mode = getGamePhase({ mainMenuOpen, introActive, combatActive, activeCutsceneId });
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [showPowers, setShowPowers] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<
    Array<{ id: number; damage: number; type: string; isCritical?: boolean }>
  >([]);
  const [pendingAction, setPendingAction] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const [introMeta, setIntroMeta] = useState<{ emoji: string; name: string } | null>(null);
  const gamepadConnected = useGamepadConnected();
  const isTouchDevice = useTouchDevice();
  const [gamepadSelectedIdx, setGamepadSelectedIdx] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const damageIdRef = useRef(0);
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

  const dismissIntro = useCallback(() => setIntroVisible(false), []);

  useEffect(() => {
    const unsub = eventBus.on('combat:start', ({ encounterName, encounterEmoji }) => {
      setIntroMeta({
        emoji: encounterEmoji ?? '👾',
        name: encounterName ?? 'Противник',
      });
      setIntroVisible(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToCombat(setCombatState);
    return unsub;
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatState?.log.length]);

  const prevLogLen = useRef(0);
  useEffect(() => {
    if (!combatState) return;
    const currentLen = combatState.log.length;
    if (currentLen > prevLogLen.current) {
      const newEntries = combatState.log.slice(prevLogLen.current);
      for (const entry of newEntries) {
        if (entry.damage && entry.damage > 0) {
          const id = damageIdRef.current++;
          const isCrit = entry.isCritical || entry.type === 'critical_hit';
          setDamageNumbers((prev) => [
            ...prev,
            { id, damage: entry.damage!, type: entry.type, isCritical: isCrit },
          ]);
          scheduleTimeout(() => {
            setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
          }, isCrit ? 1800 : 1200);

          if (isCrit) {
            setScreenShake(true);
            setFlashColor('rgba(255,255,100,0.15)');
            scheduleTimeout(() => {
              setScreenShake(false);
              setFlashColor(null);
            }, 300);
          } else if (entry.type === 'enemy_attack' || entry.type === 'enemy_special') {
            setScreenShake(true);
            setFlashColor('rgba(239,68,68,0.1)');
            scheduleTimeout(() => {
              setScreenShake(false);
              setFlashColor(null);
            }, 300);
          }
        }
      }
    }
    prevLogLen.current = currentLen;
  }, [combatState, scheduleTimeout]);

  useEffect(() => {
    if (combatState?.isPlayerTurn || combatState?.status !== 'active') {
      scheduleTimeout(() => setPendingAction(false), 0);
    }
  }, [combatState?.isPlayerTurn, combatState?.turn, combatState?.status, scheduleTimeout]);

  useEffect(() => {
    if (!pendingAction) return;
    const id = setTimeout(() => {
      setPendingAction(false);
    }, 10_000);
    return () => clearTimeout(id);
  }, [pendingAction]);

  const availablePowers = useMemo(
    () => getAvailableCombatPowers(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [combatState?.powerCooldowns, combatState?.turn],
  );
  const playerBuffs = useMemo(
    () => getActiveBuffs('player'),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [combatState?.buffs],
  );
  const enemyBuffs = useMemo(
    () => getActiveBuffs('enemy'),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [combatState?.buffs],
  );

  const handleAttack = useCallback(() => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerAttack();
    setShowPowers(false);
  }, [pendingAction, combatState]);

  const handleDefend = useCallback(() => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerDefend();
    setShowPowers(false);
  }, [pendingAction, combatState]);

  const handlePower = useCallback(
    (poemId: string) => {
      if (pendingAction || !combatState?.isPlayerTurn) return;
      setPendingAction(true);
      playerUsePoemPower(poemId);
      setShowPowers(false);
    },
    [pendingAction, combatState],
  );

  const handleFlee = useCallback(() => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerFlee();
    setShowPowers(false);
  }, [pendingAction, combatState]);

  useEffect(() => {
    if (mode !== 'combat' || !combatState) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const isPlayerTurn = combatState.isPlayerTurn && combatState.status === 'active';
      if (!isPlayerTurn || pendingAction) return;

      if (showPowers && availablePowers.length > 0) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9 && num <= availablePowers.length) {
          const power = availablePowers[num - 1];
          if (power && power.cooldownRemaining <= 0) {
            handlePower(power.poemId);
          }
          return;
        }
        if (e.key === 'Escape') {
          setShowPowers(false);
          return;
        }
      }

      switch (e.key) {
        case '1':
          handleAttack();
          break;
        case '2':
          handleDefend();
          break;
        case '3':
          if (availablePowers.length === 1) {
            handlePower(availablePowers[0].poemId);
          } else {
            setShowPowers((p) => !p);
          }
          break;
        case '4':
          handleFlee();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode,
    combatState,
    pendingAction,
    handleAttack,
    handleDefend,
    handlePower,
    handleFlee,
    availablePowers,
    showPowers,
  ]);

  useEffect(() => {
    if (!gamepadConnected) return;
    let rafId: number;
    let lastIdx = -1;
    const tick = () => {
      const idx = getGamepadSelectedPoemIndex();
      if (idx !== lastIdx) {
        lastIdx = idx;
        setGamepadSelectedIdx(idx);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [gamepadConnected]);

  useEffect(() => {
    if (mode !== 'combat') return;
    const unsub = eventBus.on('combat:gamepad_dpad_nav', ({ direction }) => {
      if (direction === 'up' || direction === 'down') {
        setShowPowers(true);
      }
    });
    return unsub;
  }, [mode]);

  const togglePowers = useCallback(() => {
    if (availablePowers.length === 1) {
      handlePower(availablePowers[0].poemId);
    } else {
      setShowPowers((p) => !p);
    }
  }, [availablePowers, handlePower]);

  const cyclePoemSelection = useCallback(
    (dir: number) => {
      if (availablePowers.length === 0) return;
      setShowPowers(true);
      setGamepadSelectedIdx((prev) => {
        const next = (prev + dir + availablePowers.length) % availablePowers.length;
        return next;
      });
    },
    [availablePowers.length],
  );

  return {
    mode,
    combatState,
    showPowers,
    setShowPowers,
    damageNumbers,
    pendingAction,
    screenShake,
    flashColor,
    introVisible,
    introMeta,
    dismissIntro,
    gamepadConnected,
    isTouchDevice,
    gamepadSelectedIdx,
    logEndRef,
    availablePowers,
    playerBuffs,
    enemyBuffs,
    handleAttack,
    handleDefend,
    handlePower,
    handleFlee,
    togglePowers,
    cyclePoemSelection,
  };
}
