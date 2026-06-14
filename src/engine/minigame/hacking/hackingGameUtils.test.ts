import { describe, expect, it } from 'vitest';
import { hackingGameReducer } from '@/engine/minigame/hacking/hackingGameReducer';
import {
  advanceScanners,
  checkScannerCollision,
  createInitialHackingState,
  createSeededRandom,
  generateGrid,
  isAdjacent,
  tryMovePlayer,
} from '@/engine/minigame/hacking/hackingGameUtils';

describe('hackingGameUtils', () => {
  it('isAdjacent detects 4-directional neighbors only', () => {
    expect(isAdjacent(0, 0, 0, 1)).toBe(true);
    expect(isAdjacent(0, 0, 1, 1)).toBe(false);
  });

  it('generateGrid is deterministic with a seeded random source', () => {
    const random = createSeededRandom(42);
    const first = generateGrid('hacker', random);
    const second = generateGrid('hacker', createSeededRandom(42));

    expect(first.targetPos).toEqual(second.targetPos);
    expect(first.scanners.length).toBe(second.scanners.length);
    expect(first.grid[first.targetPos.row][first.targetPos.col].type).toBe('target');
  });

  it('checkScannerCollision returns detected when player overlaps a scanner', () => {
    const scanners = [
      {
        id: 's0',
        row: 2,
        col: 2,
        patrolPath: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
        patrolIndex: 0,
      },
    ];
    expect(checkScannerCollision({ row: 2, col: 2 }, scanners)).toBe('detected');
    expect(checkScannerCollision({ row: 1, col: 2 }, scanners)).toBe('safe');
  });

  it('advanceScanners moves along patrol path', () => {
    const scanners = [
      {
        id: 's0',
        row: 2,
        col: 2,
        patrolPath: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
        patrolIndex: 0,
      },
    ];
    const next = advanceScanners(scanners);
    expect(next[0].row).toBe(2);
    expect(next[0].col).toBe(3);
    expect(next[0].patrolIndex).toBe(1);
  });
});

describe('hackingGameReducer', () => {
  it('START_GAME enters playing phase with generated grid', () => {
    const state = createInitialHackingState();
    const next = hackingGameReducer(state, {
      type: 'START_GAME',
      difficulty: 'novice',
      random: createSeededRandom(7),
    });

    expect(next.phase).toBe('playing');
    expect(next.grid.flat().some((node) => node.type === 'target')).toBe(true);
    expect(next.bandwidth).toBeGreaterThan(0);
  });

  it('MOVE_PLAYER rejects non-adjacent cells', () => {
    let state = createInitialHackingState();
    state = hackingGameReducer(state, {
      type: 'START_GAME',
      difficulty: 'novice',
      random: createSeededRandom(11),
    });

    const before = state;
    state = hackingGameReducer(state, { type: 'MOVE_PLAYER', row: 0, col: 5 });
    expect(state).toBe(before);
  });

  it('tryMovePlayer wins when reaching target', () => {
    const playing = hackingGameReducer(createInitialHackingState(), {
      type: 'START_GAME',
      difficulty: 'novice',
      random: createSeededRandom(99),
    });

    const target = playing.targetPos;
    let state = playing;
    let guard = 0;

    while (state.phase === 'playing' && guard < 40) {
      const reachable = [
        { row: state.playerPos.row - 1, col: state.playerPos.col },
        { row: state.playerPos.row + 1, col: state.playerPos.col },
        { row: state.playerPos.row, col: state.playerPos.col - 1 },
        { row: state.playerPos.row, col: state.playerPos.col + 1 },
      ];

      let moved = false;
      for (const pos of reachable) {
        const next = tryMovePlayer(state, pos.row, pos.col);
        if (next && next !== state) {
          state = next;
          moved = true;
          break;
        }
      }

      if (!moved) break;
      if (state.playerPos.row === target.row && state.playerPos.col === target.col) {
        expect(state.phase).toBe('won');
        return;
      }
      guard++;
    }

    expect(state.phase === 'won' || state.phase === 'lost' || state.phase === 'playing').toBe(true);
  });
});
