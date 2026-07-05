export type HackingDifficulty = 'novice' | 'hacker' | 'master';
export type HackingNodeType = 'empty' | 'firewall' | 'data' | 'target' | 'scanner' | 'player';
export type HackingGamePhase = 'setup' | 'playing' | 'won' | 'lost';
export type ScannerCollisionStatus = 'safe' | 'detected';

export type RandomFn = () => number;

export interface GridPosition {
  row: number;
  col: number;
}

export interface GridNode {
  row: number;
  col: number;
  type: HackingNodeType;
  id: string;
}

export interface ScannerState {
  row: number;
  col: number;
  id: string;
  patrolPath: GridPosition[];
  patrolIndex: number;
}

export interface MovePacket {
  from: GridPosition;
  to: GridPosition;
}

export interface HackingGameState {
  phase: HackingGamePhase;
  difficulty: HackingDifficulty;
  grid: GridNode[][];
  scanners: ScannerState[];
  targetPos: GridPosition;
  playerPos: GridPosition;
  path: GridPosition[];
  turn: number;
  bandwidth: number;
  dataCollected: string[];
  movePacket: MovePacket | null;
  scannerAlert: string | null;
  scanLinePhase: number;
}

export type HackingGameAction =
  | { type: 'SET_DIFFICULTY'; difficulty: HackingDifficulty }
  | { type: 'START_GAME'; difficulty: HackingDifficulty; random: RandomFn }
  | { type: 'MOVE_PLAYER'; row: number; col: number }
  | { type: 'TICK_SCAN_LINE' }
  | { type: 'CLEAR_MOVE_PACKET' }
  | { type: 'CLEAR_SCANNER_ALERT' }
  | { type: 'BACK_TO_SETUP' };

export interface HackingRewards {
  totalXP: number;
  dataBonus: number;
  bandwidthBonus: number;
  karmaReward: number;
  codingSkill: number;
  dataCount: number;
}
