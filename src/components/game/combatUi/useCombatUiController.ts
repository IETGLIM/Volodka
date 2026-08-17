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
import { isBossEnemyType } from '@/engine/combat/types';
import type { CombatState } from '@/shared/types/game';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import type { DamageNumberEvent, DamageNumberType } from '@/components/game/CombatDamageNumbers';

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
  const [richDamageEvents, setRichDamageEvents] = useState<DamageNumberEvent[]>([]);
  const richIdRef = useRef(0);
  const [pendingAction, setPendingAction] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const [introMeta, setIntroMeta] = useState<{ emoji: string; name: string; isBoss?: boolean } | null>(null);
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
    const unsub = eventBus.on('combat:start', ({ encounterName, encounterEmoji, enemyType }) => {
      const isBoss = enemyType ? isBossEnemyType(enemyType) : false;
      // For boss fights, the BossIntroCinematic component handles the dramatic
      // letterbox intro — we suppress the regular CombatIntroSplash by leaving
      // introMeta null, but still set introVisible=true so isPlayerTurn stays
      // false during the 3s cinematic (matching the boss intro runtime).
      if (isBoss) {
        setIntroMeta(null);
        setIntroVisible(true);
        // Auto-dismiss introVisible after the boss intro cinematic completes
        // (3s — matches BOSS_INTRO_TOTAL_MS in BossIntroCinematic.tsx). The
        // regular CombatIntroSplash would normally call dismissIntro via its
        // own timer, but we don't render it for bosses, so we schedule our
        // own dismissal here.
        scheduleTimeout(() => setIntroVisible(false), 3000);
        return;
      }
      setIntroMeta({
        emoji: encounterEmoji ?? '👾',
        name: encounterName ?? 'Противник',
        isBoss: false,
      });
      setIntroVisible(true);
    });
    return unsub;
  }, [scheduleTimeout]);

  useEffect(() => {
    const unsub = subscribeToCombat(setCombatState);
    return unsub;
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatState?.log.length]);

  /** Map combat log entry type → rich damage number type */
  const mapLogEntryToRichType = useCallback((entry: { type: string; damage?: number; isCritical?: boolean; text?: string }): DamageNumberType | null => {
    if (entry.type === 'critical_hit' || entry.type === 'affinity_super') return 'critical';
    if (entry.type === 'affinity_immune') return 'miss';
    if (entry.type === 'player_power' && (entry.damage ?? 0) > 0) return 'heal';
    if (entry.type === 'status_effect') {
      // Detect status type from Russian text keywords in log
      const text = entry.text ?? '';
      if (/паралич|stupor|ОГЛУШ/i.test(text)) return 'stun';
      if (/Отравлен|яд|ЯД/i.test(text)) return 'poison';
      if (/горен|ГОРЕНИЕ|ожог/i.test(text)) return 'burn';
      if (/обмороз|ОБМОРОЖ|замороз/i.test(text)) return 'freeze';
      if (entry.damage && entry.damage > 0) return 'damage';
      return null;
    }
    if (entry.damage && entry.damage > 0) return 'damage';
    return null;
  }, []);

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

        // Generate rich typed damage events for CombatDamageNumbers
        const richType = mapLogEntryToRichType(entry);
        if (richType) {
          const richId = `rich-${richIdRef.current++}`;
          const dmgVal = entry.type === 'affinity_immune' ? 0 : (entry.damage ?? 0);
          setRichDamageEvents((prev) => [...prev, {
            id: richId,
            type: richType,
            value: dmgVal,
          }]);
          const removeDelay = richType === 'critical' ? 1900
            : richType === 'miss' ? 1000
            : richType === 'heal' ? 1200
            : 1300;
          scheduleTimeout(() => {
            setRichDamageEvents((prev) => prev.filter((e) => e.id !== richId));
          }, removeDelay);
        }
      }
    }
    prevLogLen.current = currentLen;
  }, [combatState, scheduleTimeout, mapLogEntryToRichType]);

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
    richDamageEvents,
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
