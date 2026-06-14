import {
  HACKING_DIFFICULTY_CONFIG,
  HACKING_GRID_SIZE,
} from '@/engine/minigame/hacking/hackingGameConfig';
import type { HackingGameAction, HackingGameState } from '@/engine/minigame/hacking/hackingGameTypes';
import {
  createInitialHackingState,
  generateGrid,
  tryMovePlayer,
} from '@/engine/minigame/hacking/hackingGameUtils';

export { createInitialHackingState };

export function hackingGameReducer(
  state: HackingGameState,
  action: HackingGameAction,
): HackingGameState {
  switch (action.type) {
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty };

    case 'START_GAME': {
      const { grid, scanners, targetPos } = generateGrid(action.difficulty, action.random);
      const start = { row: HACKING_GRID_SIZE - 1, col: 0 };
      return {
        ...state,
        phase: 'playing',
        difficulty: action.difficulty,
        grid,
        scanners,
        targetPos,
        playerPos: start,
        path: [start],
        turn: 0,
        bandwidth: HACKING_DIFFICULTY_CONFIG[action.difficulty].bandwidth,
        dataCollected: [],
        movePacket: null,
        scannerAlert: null,
        scanLinePhase: 0,
      };
    }

    case 'MOVE_PLAYER': {
      const next = tryMovePlayer(state, action.row, action.col);
      return next ?? state;
    }

    case 'TICK_SCAN_LINE':
      return { ...state, scanLinePhase: state.scanLinePhase + 1 };

    case 'CLEAR_MOVE_PACKET':
      return state.movePacket ? { ...state, movePacket: null } : state;

    case 'CLEAR_SCANNER_ALERT':
      return state.scannerAlert ? { ...state, scannerAlert: null } : state;

    case 'BACK_TO_SETUP':
      return {
        ...createInitialHackingState(),
        difficulty: state.difficulty,
      };

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
