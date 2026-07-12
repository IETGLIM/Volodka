import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  HACKING_MOVE_PACKET_MS,
  HACKING_SCANNER_ALERT_MS,
  HACKING_SCAN_LINE_TICK_MS,
} from '@/engine/minigame/hacking/hackingGameConfig';
import {
  createInitialHackingState,
  hackingGameReducer,
} from '@/engine/minigame/hacking/hackingGameReducer';
import {
  clientRandom,
  computeReachableNodes,
  getPathSet,
  getScannerPositions,
} from '@/engine/minigame/hacking/hackingGameUtils';
import type { HackingDifficulty } from '@/engine/minigame/hacking/hackingGameTypes';

const KEY_TO_DELTA: Record<string, { dr: number; dc: number }> = {
  ArrowUp: { dr: -1, dc: 0 },
  ArrowDown: { dr: 1, dc: 0 },
  ArrowLeft: { dr: 0, dc: -1 },
  ArrowRight: { dr: 0, dc: 1 },
};

export function useHackingGame() {
  const [state, dispatch] = useReducer(hackingGameReducer, undefined, createInitialHackingState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setDifficulty = useCallback((difficulty: HackingDifficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', difficulty });
  }, []);

  const startGame = useCallback((difficulty: HackingDifficulty = state.difficulty) => {
    dispatch({ type: 'START_GAME', difficulty, random: clientRandom() });
  }, [state.difficulty]);

  const movePlayer = useCallback((row: number, col: number) => {
    dispatch({ type: 'MOVE_PLAYER', row, col });
  }, []);

  const backToSetup = useCallback(() => {
    dispatch({ type: 'BACK_TO_SETUP' });
  }, []);

  const movePlayerByKey = useCallback(
    (key: string) => {
      const delta = KEY_TO_DELTA[key];
      if (!delta || state.phase !== 'playing') return false;

      const targetRow = state.playerPos.row + delta.dr;
      const targetCol = state.playerPos.col + delta.dc;
      const reachable = computeReachableNodes(state.playerPos, state.grid);
      if (!reachable.has(`${targetRow}-${targetCol}`)) return false;

      dispatch({ type: 'MOVE_PLAYER', row: targetRow, col: targetCol });
      return true;
    },
    [state.phase, state.playerPos, state.grid],
  );

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => dispatch({ type: 'TICK_SCAN_LINE' }), HACKING_SCAN_LINE_TICK_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    if (!state.movePacket) return;
    const timer = setTimeout(() => {
      if (mountedRef.current) dispatch({ type: 'CLEAR_MOVE_PACKET' });
    }, HACKING_MOVE_PACKET_MS);
    return () => clearTimeout(timer);
  }, [state.movePacket]);

  useEffect(() => {
    if (!state.scannerAlert) return;
    const timer = setTimeout(() => {
      if (mountedRef.current) dispatch({ type: 'CLEAR_SCANNER_ALERT' });
    }, HACKING_SCANNER_ALERT_MS);
    return () => clearTimeout(timer);
  }, [state.scannerAlert]);

  const scannerPositions = getScannerPositions(state.scanners);
  const reachableNodes = computeReachableNodes(state.playerPos, state.grid);
  const pathSet = getPathSet(state.path);

  return {
    state,
    setDifficulty,
    startGame,
    movePlayer,
    movePlayerByKey,
    backToSetup,
    scannerPositions,
    reachableNodes,
    pathSet,
  };
}
