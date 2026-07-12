import {
  HACKING_DIFFICULTY_CONFIG,
  HACKING_GRID_SIZE,
} from '@/engine/minigame/hacking/hackingGameConfig';
import type {
  GridNode,
  GridPosition,
  HackingDifficulty,
  HackingGamePhase,
  HackingGameState,
  RandomFn,
  ScannerCollisionStatus,
  ScannerState,
} from '@/engine/minigame/hacking/hackingGameTypes';

export function posKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function createEmptyGrid(size = HACKING_GRID_SIZE): GridNode[][] {
  const grid: GridNode[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      grid[r][c] = { row: r, col: c, type: 'empty', id: posKey(r, c) };
    }
  }
  return grid;
}

export function createInitialHackingState(): HackingGameState {
  const start = { row: HACKING_GRID_SIZE - 1, col: 0 };
  return {
    phase: 'setup',
    difficulty: 'hacker',
    grid: createEmptyGrid(),
    scanners: [],
    targetPos: { row: 0, col: HACKING_GRID_SIZE - 1 },
    playerPos: start,
    path: [start],
    turn: 0,
    bandwidth: HACKING_DIFFICULTY_CONFIG.hacker.bandwidth,
    dataCollected: [],
    movePacket: null,
    scannerAlert: null,
    scanLinePhase: 0,
  };
}

/** Mulberry32 PRNG for deterministic grid generation in tests. */
export function createSeededRandom(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clientRandom(): RandomFn {
  return () => Math.random();
}

export function generateGrid(
  difficulty: HackingDifficulty,
  random: RandomFn,
  size = HACKING_GRID_SIZE,
): {
  grid: GridNode[][];
  scanners: ScannerState[];
  targetPos: GridPosition;
} {
  const config = HACKING_DIFFICULTY_CONFIG[difficulty];
  const grid = createEmptyGrid(size);

  grid[size - 1][0].type = 'player';

  const targetRow = Math.floor(random() * 2);
  const targetCol = 3 + Math.floor(random() * 3);
  grid[targetRow][targetCol].type = 'target';
  const targetPos = { row: targetRow, col: targetCol };

  const protectedCells = new Set<string>();
  protectedCells.add(posKey(size - 1, 0));
  protectedCells.add(posKey(size - 1, 1));
  protectedCells.add(posKey(size - 2, 0));
  protectedCells.add(posKey(targetRow, targetCol));

  let firewallsPlaced = 0;
  while (firewallsPlaced < config.firewalls) {
    const r = Math.floor(random() * size);
    const c = Math.floor(random() * size);
    const key = posKey(r, c);
    if (protectedCells.has(key) || grid[r][c].type !== 'empty') continue;
    grid[r][c].type = 'firewall';
    protectedCells.add(key);
    firewallsPlaced++;
  }

  let dataPlaced = 0;
  while (dataPlaced < config.dataNodes) {
    const r = Math.floor(random() * size);
    const c = Math.floor(random() * size);
    const key = posKey(r, c);
    if (protectedCells.has(key) || grid[r][c].type !== 'empty') continue;
    grid[r][c].type = 'data';
    protectedCells.add(key);
    dataPlaced++;
  }

  const scanners: ScannerState[] = [];
  let scannersPlaced = 0;
  while (scannersPlaced < config.scanners) {
    const r = Math.floor(random() * size);
    const c = Math.floor(random() * size);
    const key = posKey(r, c);
    if (protectedCells.has(key) || grid[r][c].type !== 'empty') continue;
    if (Math.abs(r - (size - 1)) + Math.abs(c) < 3) continue;

    const isHorizontal = random() > 0.5;
    const patrolPath: GridPosition[] = [];

    if (isHorizontal) {
      for (let pc = 0; pc < size; pc++) {
        if (grid[r][pc].type !== 'firewall' && grid[r][pc].type !== 'target') {
          patrolPath.push({ row: r, col: pc });
        }
      }
    } else {
      for (let pr = 0; pr < size; pr++) {
        if (grid[pr][c].type !== 'firewall' && grid[pr][c].type !== 'target') {
          patrolPath.push({ row: pr, col: c });
        }
      }
    }

    if (patrolPath.length < 2) continue;

    scanners.push({
      row: r,
      col: c,
      id: `scanner-${scannersPlaced}`,
      patrolPath,
      patrolIndex: patrolPath.findIndex((p) => p.row === r && p.col === c),
    });
    protectedCells.add(key);
    scannersPlaced++;
  }

  return { grid, scanners, targetPos };
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

export function checkScannerCollision(
  playerPos: GridPosition,
  scanners: readonly ScannerState[],
): ScannerCollisionStatus {
  for (const scanner of scanners) {
    if (scanner.row === playerPos.row && scanner.col === playerPos.col) {
      return 'detected';
    }
  }
  return 'safe';
}

export function advanceScanners(scanners: readonly ScannerState[]): ScannerState[] {
  return scanners.map((scanner) => {
    const nextIndex = (scanner.patrolIndex + 1) % scanner.patrolPath.length;
    const nextPos = scanner.patrolPath[nextIndex];
    return { ...scanner, row: nextPos.row, col: nextPos.col, patrolIndex: nextIndex };
  });
}

export function getScannerPositions(scanners: readonly ScannerState[]): Set<string> {
  const positions = new Set<string>();
  for (const scanner of scanners) {
    positions.add(posKey(scanner.row, scanner.col));
  }
  return positions;
}

export function computeReachableNodes(
  playerPos: GridPosition,
  grid: GridNode[][],
  size = HACKING_GRID_SIZE,
): Set<string> {
  const reachable = new Set<string>();
  const dirs: GridPosition[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  for (const { row: dr, col: dc } of dirs) {
    const nr = playerPos.row + dr;
    const nc = playerPos.col + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (grid[nr]?.[nc]?.type === 'firewall') continue;
    reachable.add(posKey(nr, nc));
  }

  return reachable;
}

export function getPathSet(path: readonly GridPosition[]): Set<string> {
  const pathSet = new Set<string>();
  for (const point of path) {
    pathSet.add(posKey(point.row, point.col));
  }
  return pathSet;
}

export function tryMovePlayer(
  state: HackingGameState,
  row: number,
  col: number,
): HackingGameState | null {
  if (state.phase !== 'playing') return null;
  if (!isAdjacent(state.playerPos.row, state.playerPos.col, row, col)) return null;
  if (state.grid[row]?.[col]?.type === 'firewall') return null;

  const newBandwidth = state.bandwidth - 1;
  if (newBandwidth < 0) return null;

  const newPos = { row, col };
  const cellKey = posKey(row, col);
  const newTurn = state.turn + 1;
  const dataCollected =
    state.grid[row][col].type === 'data' && !state.dataCollected.includes(cellKey)
      ? [...state.dataCollected, cellKey]
      : state.dataCollected;

  const movePacket = { from: { ...state.playerPos }, to: newPos };

  if (row === state.targetPos.row && col === state.targetPos.col) {
    return {
      ...state,
      playerPos: newPos,
      path: [...state.path, newPos],
      bandwidth: newBandwidth,
      turn: newTurn,
      dataCollected,
      movePacket,
      phase: 'won',
      scannerAlert: null,
    };
  }

  let scanners = state.scanners;
  let scannerAlert: string | null = null;
  const scannerInterval = HACKING_DIFFICULTY_CONFIG[state.difficulty].scannerInterval;

  if (newTurn % scannerInterval === 0) {
    scanners = advanceScanners(scanners);
    scannerAlert = '⚠ Сканеры перемещены!';
  }

  let phase: HackingGamePhase = state.phase;
  if (newBandwidth <= 0) {
    phase = 'lost';
  } else if (checkScannerCollision(newPos, scanners) === 'detected') {
    phase = 'lost';
  }

  return {
    ...state,
    playerPos: newPos,
    path: [...state.path, newPos],
    bandwidth: newBandwidth,
    turn: newTurn,
    dataCollected,
    scanners,
    scannerAlert,
    movePacket,
    phase,
  };
}

export function calculateHackingRewards(
  state: Pick<HackingGameState, 'dataCollected' | 'bandwidth'>,
  random: RandomFn = Math.random,
): {
  totalXP: number;
  dataBonus: number;
  bandwidthBonus: number;
  karmaReward: number;
  codingSkill: number;
  dataCount: number;
} {
  const baseXP = 20;
  const dataCount = state.dataCollected.length;
  const dataBonus = dataCount * 2;
  const bandwidthBonus = state.bandwidth > 5 ? 5 : 0;
  const totalXP = baseXP + dataBonus + bandwidthBonus;
  const karmaReward = 3 + Math.floor(random() * 6);

  return {
    totalXP,
    dataBonus,
    bandwidthBonus,
    karmaReward,
    codingSkill: 1,
    dataCount,
  };
}
