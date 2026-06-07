
/* ─── Volodka RPG – Hacking Minigame "Network Intrusion" ─── */
/* Cyberpunk pathfinding puzzle: navigate a network grid to reach
 * the target server while avoiding firewalls and security scanners. */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { CYBER_CYAN_RGB } from '@/shared/constants/cyberPalette';

/* ─── Accent colors (red theme for hacking) ─── */
const ACCENT_RGB = '239, 68, 68';
const ACCENT_COLOR = `rgba(${ACCENT_RGB}, 0.9)`;
const ACCENT_GLOW = `rgba(${ACCENT_RGB}, 0.3)`;
const CYAN_RGB = CYBER_CYAN_RGB;
const CYAN_COLOR = `rgba(${CYAN_RGB}, 0.9)`;
const GREEN_RGB = '34, 197, 94';
const AMBER_RGB = '251, 191, 36';

/* ─── Types ─── */
type Difficulty = 'novice' | 'hacker' | 'master';
type NodeType = 'empty' | 'firewall' | 'data' | 'target' | 'scanner' | 'player';
type GamePhase = 'setup' | 'playing' | 'won' | 'lost';

interface GridNode {
  row: number;
  col: number;
  type: NodeType;
  id: string;
}

interface ScannerState {
  row: number;
  col: number;
  id: string;
  patrolPath: { row: number; col: number }[];
  patrolIndex: number;
}

interface HackingGameProps {
  onClose: () => void;
}

/* ─── Difficulty configurations ─── */
const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  firewalls: number;
  dataNodes: number;
  scanners: number;
  bandwidth: number;
  scannerInterval: number;
  description: string;
}> = {
  novice: {
    label: 'Новичок',
    firewalls: 6,
    dataNodes: 4,
    scanners: 1,
    bandwidth: 18,
    scannerInterval: 4,
    description: 'Минимальная защита, немного сканеров',
  },
  hacker: {
    label: 'Хакер',
    firewalls: 9,
    dataNodes: 3,
    scanners: 2,
    bandwidth: 15,
    scannerInterval: 3,
    description: 'Умеренная защита, активные сканеры',
  },
  master: {
    label: 'Мастер',
    firewalls: 12,
    dataNodes: 2,
    scanners: 3,
    bandwidth: 12,
    scannerInterval: 2,
    description: 'Максимальная защита, повсюду сканеры',
  },
};

const GRID_SIZE = 6;

/* ─── Grid generation ─── */
function generateGrid(difficulty: Difficulty): {
  grid: GridNode[][];
  scanners: ScannerState[];
  targetPos: { row: number; col: number };
  dataCollected: Set<string>;
} {
  const config = DIFFICULTY_CONFIG[difficulty];
  const grid: GridNode[][] = [];

  // Initialize empty grid
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = { row: r, col: c, type: 'empty', id: `${r}-${c}` };
    }
  }

  // Player start: bottom-left
  grid[GRID_SIZE - 1][0].type = 'player';

  // Target: top-right area (random within top 2 rows, right 3 cols)
  const targetRow = Math.floor(Math.random() * 2);
  const targetCol = 3 + Math.floor(Math.random() * 3);
  grid[targetRow][targetCol].type = 'target';
  const targetPos = { row: targetRow, col: targetCol };

  // Place firewalls (avoiding player start, target, and adjacent to player)
  let firewallsPlaced = 0;
  const protectedCells = new Set<string>();
  // Protect cells near player start
  protectedCells.add(`${GRID_SIZE - 1}-0`);
  protectedCells.add(`${GRID_SIZE - 1}-1`);
  protectedCells.add(`${GRID_SIZE - 2}-0`);
  protectedCells.add(`${targetRow}-${targetCol}`);

  while (firewallsPlaced < config.firewalls) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    const key = `${r}-${c}`;
    if (protectedCells.has(key) || grid[r][c].type !== 'empty') continue;
    grid[r][c].type = 'firewall';
    protectedCells.add(key);
    firewallsPlaced++;
  }

  // Place data nodes
  let dataPlaced = 0;
  while (dataPlaced < config.dataNodes) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    const key = `${r}-${c}`;
    if (protectedCells.has(key) || grid[r][c].type !== 'empty') continue;
    grid[r][c].type = 'data';
    protectedCells.add(key);
    dataPlaced++;
  }

  // Place scanners on empty cells (not too close to player)
  const scanners: ScannerState[] = [];
  let scannersPlaced = 0;
  while (scannersPlaced < config.scanners) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    const key = `${r}-${c}`;
    if (protectedCells.has(key) || grid[r][c].type !== 'empty') continue;
    if (Math.abs(r - (GRID_SIZE - 1)) + Math.abs(c) < 3) continue; // min distance from player

    // Create patrol path (horizontal or vertical line)
    const isHorizontal = Math.random() > 0.5;
    const patrolPath: { row: number; col: number }[] = [];

    if (isHorizontal) {
      for (let pc = 0; pc < GRID_SIZE; pc++) {
        if (grid[r][pc].type !== 'firewall' && grid[r][pc].type !== 'target') {
          patrolPath.push({ row: r, col: pc });
        }
      }
    } else {
      for (let pr = 0; pr < GRID_SIZE; pr++) {
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

  return { grid, scanners, targetPos, dataCollected: new Set<string>() };
}

/* ─── Check if two positions are adjacent (4-directional) ─── */
function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

/* ─── Node visual component ─── */
function NetworkNode({
  node,
  isPlayerHere,
  isScannerHere,
  isPath,
  isReachable,
  isDataCollected,
  onClick,
  scanLinePhase,
}: {
  node: GridNode;
  isPlayerHere: boolean;
  isScannerHere: boolean;
  isPath: boolean;
  isReachable: boolean;
  isDataCollected: boolean;
  onClick: () => void;
  scanLinePhase: number;
}) {
  const getNodeStyle = (): { bg: string; border: string; glow: string; icon: string } => {
    if (isPlayerHere) {
      return {
        bg: `rgba(${CYAN_RGB}, 0.15)`,
        border: `rgba(${CYAN_RGB}, 0.7)`,
        glow: `0 0 15px rgba(${CYAN_RGB}, 0.4), inset 0 0 10px rgba(${CYAN_RGB}, 0.15)`,
        icon: '◈',
      };
    }
    if (isScannerHere) {
      return {
        bg: 'rgba(251, 146, 60, 0.15)',
        border: 'rgba(251, 146, 60, 0.7)',
        glow: '0 0 15px rgba(251, 146, 60, 0.4), inset 0 0 10px rgba(251, 146, 60, 0.15)',
        icon: '◉',
      };
    }

    switch (node.type) {
      case 'firewall':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.5)',
          glow: '0 0 10px rgba(239, 68, 68, 0.2)',
          icon: '🛡',
        };
      case 'data':
        if (isDataCollected) {
          return {
            bg: 'rgba(34, 197, 94, 0.03)',
            border: 'rgba(34, 197, 94, 0.15)',
            glow: 'none',
            icon: '✓',
          };
        }
        return {
          bg: 'rgba(34, 197, 94, 0.12)',
          border: 'rgba(34, 197, 94, 0.5)',
          glow: '0 0 12px rgba(34, 197, 94, 0.25)',
          icon: '◆',
        };
      case 'target':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: 'rgba(168, 85, 247, 0.7)',
          glow: '0 0 18px rgba(168, 85, 247, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.1)',
          icon: '⬡',
        };
      default:
        if (isPath) {
          return {
            bg: `rgba(${CYAN_RGB}, 0.06)`,
            border: `rgba(${CYAN_RGB}, 0.25)`,
            glow: `0 0 6px rgba(${CYAN_RGB}, 0.1)`,
            icon: '',
          };
        }
        if (isReachable) {
          return {
            bg: `rgba(${CYAN_RGB}, 0.04)`,
            border: `rgba(${CYAN_RGB}, 0.35)`,
            glow: `0 0 10px rgba(${CYAN_RGB}, 0.15)`,
            icon: '',
          };
        }
        return {
          bg: 'rgba(30, 41, 59, 0.4)',
          border: 'rgba(71, 85, 105, 0.25)',
          glow: 'none',
          icon: '',
        };
    }
  };

  const style = getNodeStyle();
  const isClickable = isReachable && !isPlayerHere && node.type !== 'firewall';

  return (
    <motion.div
      className="relative flex items-center justify-center rounded-md cursor-pointer select-none"
      style={{
        width: '100%',
        aspectRatio: '1',
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        boxShadow: style.glow,
      }}
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.08 } : {}}
      whileTap={isClickable ? { scale: 0.92 } : {}}
      animate={
        isPlayerHere
          ? {
              boxShadow: [
                `0 0 10px rgba(${CYAN_RGB}, 0.3), inset 0 0 8px rgba(${CYAN_RGB}, 0.1)`,
                `0 0 20px rgba(${CYAN_RGB}, 0.5), inset 0 0 12px rgba(${CYAN_RGB}, 0.2)`,
                `0 0 10px rgba(${CYAN_RGB}, 0.3), inset 0 0 8px rgba(${CYAN_RGB}, 0.1)`,
              ],
            }
          : node.type === 'target'
            ? {
                boxShadow: [
                  '0 0 12px rgba(168, 85, 247, 0.25), inset 0 0 8px rgba(168, 85, 247, 0.08)',
                  '0 0 22px rgba(168, 85, 247, 0.45), inset 0 0 14px rgba(168, 85, 247, 0.15)',
                  '0 0 12px rgba(168, 85, 247, 0.25), inset 0 0 8px rgba(168, 85, 247, 0.08)',
                ],
              }
            : isScannerHere
              ? {
                  boxShadow: [
                    '0 0 8px rgba(251, 146, 60, 0.2), inset 0 0 6px rgba(251, 146, 60, 0.08)',
                    '0 0 16px rgba(251, 146, 60, 0.4), inset 0 0 10px rgba(251, 146, 60, 0.15)',
                    '0 0 8px rgba(251, 146, 60, 0.2), inset 0 0 6px rgba(251, 146, 60, 0.08)',
                  ],
                }
              : {}
      }
      transition={
        isPlayerHere || node.type === 'target' || isScannerHere
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : {}
      }
    >
      {/* Scan line effect */}
      <div
        className="absolute inset-0 rounded-md overflow-hidden pointer-events-none"
        style={{ opacity: 0.3 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${CYAN_RGB}, 0.4), transparent)`,
            top: `${(scanLinePhase * 20) % 100}%`,
          }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Node icon/label */}
      <span
        className="relative z-10 text-sm font-mono"
        style={{
          color: isPlayerHere
            ? CYAN_COLOR
            : isScannerHere
              ? 'rgba(251, 146, 60, 0.9)'
              : node.type === 'firewall'
                ? 'rgba(239, 68, 68, 0.8)'
                : node.type === 'data'
                  ? isDataCollected
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(34, 197, 94, 0.9)'
                  : node.type === 'target'
                    ? 'rgba(168, 85, 247, 0.9)'
                    : 'rgba(100, 116, 139, 0.3)',
          textShadow: isPlayerHere
            ? `0 0 8px rgba(${CYAN_RGB}, 0.5)`
            : node.type === 'target'
              ? '0 0 8px rgba(168, 85, 247, 0.5)'
              : 'none',
        }}
      >
        {style.icon}
      </span>

      {/* Connection lines to adjacent reachable nodes (rendered by parent) */}
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function HackingGame({ onClose }: HackingGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('hacker');
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [turn, setTurn] = useState(0);
  const [bandwidth, setBandwidth] = useState(15);
  const [dataCollected, setDataCollected] = useState<Set<string>>(new Set());
  const [playerPos, setPlayerPos] = useState({ row: GRID_SIZE - 1, col: 0 });
  const [path, setPath] = useState<{ row: number; col: number }[]>([{ row: GRID_SIZE - 1, col: 0 }]);
  const [scanLinePhase, setScanLinePhase] = useState(0);
  const [movePacket, setMovePacket] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [scannerAlert, setScannerAlert] = useState<string | null>(null);
  const gridInitRef = useRef(false);

  const [grid, setGrid] = useState<GridNode[][]>(() => {
    const g: GridNode[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      g[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        g[r][c] = { row: r, col: c, type: 'empty', id: `${r}-${c}` };
      }
    }
    return g;
  });

  const [scanners, setScanners] = useState<ScannerState[]>([]);
  const [targetPos, setTargetPos] = useState({ row: 0, col: GRID_SIZE - 1 });

  const config = DIFFICULTY_CONFIG[difficulty];

  // Initialize game
  const initGame = useCallback((diff: Difficulty) => {
    const result = generateGrid(diff);
    setGrid(result.grid);
    setScanners(result.scanners);
    setTargetPos(result.targetPos);
    setDataCollected(new Set());
    setPlayerPos({ row: GRID_SIZE - 1, col: 0 });
    setPath([{ row: GRID_SIZE - 1, col: 0 }]);
    setTurn(0);
    setBandwidth(DIFFICULTY_CONFIG[diff].bandwidth);
    setGamePhase('playing');
    setMovePacket(null);
    setScannerAlert(null);
    gridInitRef.current = true;
  }, []);

  // Scanner positions as a set for quick lookup
  const scannerPositions = useMemo(() => {
    const posSet = new Set<string>();
    scanners.forEach((s) => posSet.add(`${s.row}-${s.col}`));
    return posSet;
  }, [scanners]);

  // Compute reachable nodes (adjacent to current player position)
  const reachableNodes = useMemo(() => {
    const reachable = new Set<string>();
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = playerPos.row + dr;
      const nc = playerPos.col + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      if (grid[nr]?.[nc]?.type === 'firewall') continue;
      reachable.add(`${nr}-${nc}`);
    }
    return reachable;
  }, [playerPos, grid]);

  // Path set for highlighting
  const pathSet = useMemo(() => {
    const pSet = new Set<string>();
    path.forEach((p) => pSet.add(`${p.row}-${p.col}`));
    return pSet;
  }, [path]);

  // Handle player move
  const handleMove = useCallback((row: number, col: number) => {
    if (gamePhase !== 'playing') return;
    if (!isAdjacent(playerPos.row, playerPos.col, row, col)) return;
    if (grid[row]?.[col]?.type === 'firewall') return;

    const newBandwidth = bandwidth - 1;
    if (newBandwidth < 0) return;

    // Animate packet
    setMovePacket({ from: { ...playerPos }, to: { row, col } });
    setTimeout(() => setMovePacket(null), 300);

    const newPos = { row, col };
    setPlayerPos(newPos);
    setBandwidth(newBandwidth);
    setPath((prev) => [...prev, newPos]);

    const newTurn = turn + 1;
    setTurn(newTurn);

    // Check for data node collection
    if (grid[row][col].type === 'data' && !dataCollected.has(`${row}-${col}`)) {
      setDataCollected((prev) => new Set([...prev, `${row}-${col}`]));
    }

    // Check win condition (reached target)
    if (row === targetPos.row && col === targetPos.col) {
      setGamePhase('won');
      return;
    }

    // Check if bandwidth is zero
    if (newBandwidth <= 0) {
      setGamePhase('lost');
      return;
    }

    // Move scanners every N turns
    const scannerInterval = DIFFICULTY_CONFIG[difficulty].scannerInterval;
    if (newTurn % scannerInterval === 0) {
      setScanners((prevScanners) => {
        const updatedScanners = prevScanners.map((scanner) => {
          const nextIndex = (scanner.patrolIndex + 1) % scanner.patrolPath.length;
          const nextPos = scanner.patrolPath[nextIndex];

          // Check if scanner moves to player position
          if (nextPos.row === newPos.row && nextPos.col === newPos.col) {
            setTimeout(() => setGamePhase('lost'), 100);
          }

          return { ...scanner, row: nextPos.row, col: nextPos.col, patrolIndex: nextIndex };
        });

        // Check if any scanner is now on the player
        for (const s of updatedScanners) {
          if (s.row === newPos.row && s.col === newPos.col) {
            setTimeout(() => setGamePhase('lost'), 100);
            break;
          }
        }

        return updatedScanners;
      });

      // Show scanner alert
      setScannerAlert('⚠ Сканеры перемещены!');
      setTimeout(() => setScannerAlert(null), 1500);
    } else {
      // Still check if player moved to a scanner position
      for (const s of scanners) {
        if (s.row === row && s.col === col) {
          setTimeout(() => setGamePhase('lost'), 100);
          break;
        }
      }
    }
  }, [gamePhase, playerPos, grid, bandwidth, turn, targetPos, difficulty, scanners, dataCollected]);

  // Scan line animation
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const interval = setInterval(() => {
      setScanLinePhase((prev) => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [gamePhase]);

  // Check for scanner collision after scanners move
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    for (const s of scanners) {
      if (s.row === playerPos.row && s.col === playerPos.col) {
        // Defer setState to avoid synchronous setState in effect
        const timer = setTimeout(() => setGamePhase('lost'), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [scanners, playerPos, gamePhase]);

  // Calculate score and rewards
  const calculateRewards = useCallback(() => {
    const baseXP = 20;
    const dataBonus = dataCollected.size * 2;
    const bandwidthBonus = bandwidth > 5 ? 5 : 0;
    const totalXP = baseXP + dataBonus + bandwidthBonus;

    const karmaReward = 3 + Math.floor(Math.random() * 6); // 3-8
    const codingSkill = 1;

    return { totalXP, dataBonus, bandwidthBonus, karmaReward, codingSkill, dataCount: dataCollected.size };
  }, [dataCollected, bandwidth]);

  // Handle claiming rewards
  const handleClaimRewards = useCallback(() => {
    const rewards = calculateRewards();
    const store = useGameStore.getState();

    store.addXp(rewards.totalXP);
    store.addKarma(rewards.karmaReward);
    store.addSkill('coding', rewards.codingSkill);
    store.setFlag('hacking_complete', true);

    eventBus.emit('minigame:complete', {
      gameType: 'hacking',
      success: true,
      reward: [
        { type: 'addXp', value: rewards.totalXP },
        { type: 'addKarma', value: rewards.karmaReward },
      ],
    });

    onClose();
  }, [calculateRewards, onClose]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset to setup
  const handleBackToSetup = useCallback(() => {
    setGamePhase('setup');
    gridInitRef.current = false;
  }, []);

  /* ─── Render: Setup screen ─── */
  const renderSetup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="text-center py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl mb-4"
      >
        🔓
      </motion.div>

      <h3
        className="text-xl font-bold font-mono tracking-widest uppercase mb-2"
        style={{ color: ACCENT_COLOR }}
      >
        Сетевой взлом
      </h3>
      <p className="text-xs font-mono mb-6" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
        Пройдите через сеть к целевому серверу, избегая файрволов и сканеров
      </p>

      {/* Difficulty selection */}
      <div className="space-y-3 mb-6">
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(
          ([key, cfg]) => (
            <motion.button
              key={key}
              onClick={() => setDifficulty(key)}
              className="w-full px-4 py-3 rounded-md text-left transition-all duration-200"
              style={{
                background: difficulty === key ? `rgba(${ACCENT_RGB}, 0.12)` : 'rgba(0, 0, 0, 0.3)',
                border: `1.5px solid ${difficulty === key ? `rgba(${ACCENT_RGB}, 0.5)` : 'rgba(71, 85, 105, 0.2)'}`,
                boxShadow: difficulty === key ? `0 0 15px rgba(${ACCENT_RGB}, 0.15)` : 'none',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-sm font-bold tracking-wider uppercase"
                  style={{
                    color: difficulty === key ? ACCENT_COLOR : 'rgba(148, 163, 184, 0.6)',
                  }}
                >
                  {cfg.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
                  BW: {cfg.bandwidth}
                </span>
              </div>
              <p className="font-mono text-[10px] mt-1" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                {cfg.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(239, 68, 68, 0.6)' }}>
                  🛡 {cfg.firewalls}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(34, 197, 94, 0.6)' }}>
                  ◆ {cfg.dataNodes}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(251, 146, 60, 0.6)' }}>
                  ◉ {cfg.scanners}
                </span>
              </div>
            </motion.button>
          ),
        )}
      </div>

      {/* Start button */}
      <motion.button
        onClick={() => initGame(difficulty)}
        className="w-full py-3 rounded-md font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-200"
        style={{
          background: `rgba(${ACCENT_RGB}, 0.15)`,
          border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
          color: ACCENT_COLOR,
          boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
          e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
          e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
        }}
      >
        Начать взлом
      </motion.button>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: CYAN_COLOR }}>◈</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Вы</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(168, 85, 247, 0.9)' }}>⬡</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Цель</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>🛡</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Файрвол</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(34, 197, 94, 0.9)' }}>◆</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Данные</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(251, 146, 60, 0.9)' }}>◉</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Сканер</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="font-mono text-[10px]" style={{ color: `rgba(${CYAN_RGB}, 0.5)` }}>—</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Путь</span>
        </div>
      </div>
    </motion.div>
  );

  /* ─── Render: Game grid ─── */
  const renderGame = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stats bar */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-md mb-3"
        style={{ background: 'rgba(0, 0, 0, 0.3)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
      >
        <div className="flex items-center gap-3">
          {/* Bandwidth */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
              BW
            </span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30, 41, 59, 0.6)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: bandwidth > 5
                    ? `rgba(${CYAN_RGB}, 0.7)`
                    : bandwidth > 2
                      ? `rgba(${AMBER_RGB}, 0.7)`
                      : 'rgba(239, 68, 68, 0.7)',
                }}
                animate={{ width: `${(bandwidth / config.bandwidth) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span
              className="font-mono text-xs font-bold"
              style={{
                color: bandwidth > 5
                  ? CYAN_COLOR
                  : bandwidth > 2
                    ? `rgba(${AMBER_RGB}, 0.9)`
                    : ACCENT_COLOR,
              }}
            >
              {bandwidth}
            </span>
          </div>

          {/* Turn counter */}
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
            Ход: {turn}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Data collected */}
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color: `rgba(${GREEN_RGB}, 0.8)` }}>◆</span>
            <span className="font-mono text-xs" style={{ color: `rgba(${GREEN_RGB}, 0.8)` }}>
              {dataCollected.size}
            </span>
          </div>

          {/* Difficulty badge */}
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: `rgba(${ACCENT_RGB}, 0.08)`,
              border: `1px solid rgba(${ACCENT_RGB}, 0.2)`,
              color: `rgba(${ACCENT_RGB}, 0.6)`,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Scanner alert */}
      <AnimatePresence>
        {scannerAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-2"
          >
            <span
              className="font-mono text-xs font-bold tracking-wider"
              style={{ color: 'rgba(251, 146, 60, 0.9)', textShadow: '0 0 8px rgba(251, 146, 60, 0.3)' }}
            >
              {scannerAlert}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="relative">
        {/* Connection lines between nodes */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
          viewBox={`0 0 ${GRID_SIZE * 100} ${GRID_SIZE * 100}`}
        >
          {/* Draw path lines */}
          {path.length > 1 && path.map((p, i) => {
            if (i === 0) return null;
            const prev = path[i - 1];
            return (
              <motion.line
                key={`path-${i}`}
                x1={prev.col * 100 + 50}
                y1={prev.row * 100 + 50}
                x2={p.col * 100 + 50}
                y2={p.row * 100 + 50}
                stroke={`rgba(${CYAN_RGB}, 0.25)`}
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Draw grid connection lines (subtle) */}
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const lines: React.ReactNode[] = [];
              // Right connection
              if (c < GRID_SIZE - 1 && grid[r][c].type !== 'firewall' && grid[r][c + 1].type !== 'firewall') {
                lines.push(
                  <line
                    key={`h-${r}-${c}`}
                    x1={c * 100 + 50}
                    y1={r * 100 + 50}
                    x2={(c + 1) * 100 + 50}
                    y2={r * 100 + 50}
                    stroke="rgba(71, 85, 105, 0.12)"
                    strokeWidth="1"
                  />
                );
              }
              // Down connection
              if (r < GRID_SIZE - 1 && grid[r][c].type !== 'firewall' && grid[r + 1][c].type !== 'firewall') {
                lines.push(
                  <line
                    key={`v-${r}-${c}`}
                    x1={c * 100 + 50}
                    y1={r * 100 + 50}
                    x2={c * 100 + 50}
                    y2={(r + 1) * 100 + 50}
                    stroke="rgba(71, 85, 105, 0.12)"
                    strokeWidth="1"
                  />
                );
              }
              return lines;
            })
          )}

          {/* Move packet animation */}
          {movePacket && (
            <motion.circle
              r="4"
              fill={`rgba(${CYAN_RGB}, 0.8)`}
              initial={{
                cx: movePacket.from.col * 100 + 50,
                cy: movePacket.from.row * 100 + 50,
                opacity: 1,
              }}
              animate={{
                cx: movePacket.to.col * 100 + 50,
                cy: movePacket.to.row * 100 + 50,
                opacity: 0,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}
        </svg>

        {/* Node grid */}
        <div
          className="grid gap-1.5 relative"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            zIndex: 2,
          }}
        >
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const node = grid[r][c];
              const isPlayerHere = playerPos.row === r && playerPos.col === c;
              const isScannerHere = scannerPositions.has(`${r}-${c}`) && !isPlayerHere;
              const isPath = pathSet.has(`${r}-${c}`) && !isPlayerHere;
              const isReachable = reachableNodes.has(`${r}-${c}`);
              const isDataCollected = dataCollected.has(`${r}-${c}`);

              return (
                <NetworkNode
                  key={node.id}
                  node={node}
                  isPlayerHere={isPlayerHere}
                  isScannerHere={isScannerHere}
                  isPath={isPath}
                  isReachable={isReachable}
                  isDataCollected={isDataCollected}
                  onClick={() => handleMove(r, c)}
                  scanLinePhase={scanLinePhase}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Instructions */}
      <p className="font-mono text-[10px] text-center mt-3" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
        Нажмите на соседнюю ячейку для перемещения • Достигните целевого сервера ⬡
      </p>
    </motion.div>
  );

  /* ─── Render: Results screen ─── */
  const renderResults = () => {
    const isWin = gamePhase === 'won';
    const rewards = isWin ? calculateRewards() : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="text-4xl mb-3"
        >
          {isWin ? '🔓' : '💀'}
        </motion.div>

        <h3
          className="text-lg font-bold font-mono tracking-widest uppercase mb-2"
          style={{
            color: isWin ? 'rgba(34, 197, 94, 0.9)' : ACCENT_COLOR,
          }}
        >
          {isWin ? 'Взлом завершён' : 'Обнаружен сканером'}
        </h3>

        {isWin && rewards && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <span className="text-xs font-mono block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                Очки опыта
              </span>
              <motion.span
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                className="text-3xl font-bold font-mono"
                style={{ color: CYAN_COLOR, textShadow: `0 0 20px rgba(${CYAN_RGB}, 0.4)` }}
              >
                {rewards.totalXP}
              </motion.span>
            </motion.div>

            {/* Score breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-md p-3 mb-4 space-y-1.5"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
              }}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Базовые очки</span>
                <span style={{ color: CYAN_COLOR }}>+20 XP</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Собранные данные ({rewards.dataCount})</span>
                <span style={{ color: `rgba(${GREEN_RGB}, 0.9)` }}>+{rewards.dataBonus} XP</span>
              </div>
              {rewards.bandwidthBonus > 0 && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Бонус пропускной способности</span>
                  <span style={{ color: `rgba(${AMBER_RGB}, 0.9)` }}>+{rewards.bandwidthBonus} XP</span>
                </div>
              )}
            </motion.div>

            {/* Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-md p-3 mb-4"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
              }}
            >
              <span
                className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
                style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
              >
                Награды
              </span>
              <div className="flex items-center justify-center gap-4 text-xs font-mono">
                <span style={{ color: '#00ffee' }}>+{rewards.totalXP} XP</span>
                <span style={{ color: '#ffcc00' }}>+{rewards.karmaReward} карма</span>
                <span style={{ color: ACCENT_COLOR }}>+1 код</span>
              </div>
            </motion.div>

            {/* Claim button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={handleClaimRewards}
              className="w-full py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
              style={{
                background: `rgba(${ACCENT_RGB}, 0.15)`,
                border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
                color: ACCENT_COLOR,
                boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
                e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
                e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
              }}
            >
              Забрать награды
            </motion.button>
          </>
        )}

        {!isWin && (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-mono text-xs mb-6"
              style={{ color: 'rgba(148, 163, 184, 0.5)' }}
            >
              Сканер безопасности обнаружил ваше присутствие в сети. Попробуйте снова.
            </motion.p>

            <div className="flex gap-3">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => initGame(difficulty)}
                className="flex-1 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
                style={{
                  background: `rgba(${ACCENT_RGB}, 0.15)`,
                  border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
                  color: ACCENT_COLOR,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Повторить
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleBackToSetup}
                className="flex-1 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
                style={{
                  background: 'rgba(71, 85, 105, 0.1)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  color: 'rgba(148, 163, 184, 0.6)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Выбор сложности
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  /* ─── Main render ─── */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Game panel */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 8, 15, 0.97), rgba(18, 8, 12, 0.97))',
          borderColor: `rgba(${ACCENT_RGB}, 0.25)`,
          boxShadow: `0 0 30px rgba(${ACCENT_RGB}, 0.08), inset 0 0 30px rgba(${ACCENT_RGB}, 0.02)`,
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderBottom: `1px solid rgba(${ACCENT_RGB}, 0.15)`,
            background: `rgba(${ACCENT_RGB}, 0.03)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT_COLOR, fontSize: '18px' }}>🔓</span>
            <h2
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: ACCENT_COLOR, fontFamily: 'monospace' }}
            >
              СЕТЕВОЙ ВЗЛОМ
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {gamePhase === 'playing' && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  Ходов:
                </span>
                <motion.span
                  key={turn}
                  initial={{ scale: 1.3, color: CYAN_COLOR }}
                  animate={{ scale: 1, color: `rgba(${CYAN_RGB}, 0.9)` }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-bold font-mono"
                  style={{ color: CYAN_COLOR }}
                >
                  {turn}
                </motion.span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg font-mono"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${ACCENT_RGB}, 0.015) 2px, rgba(${ACCENT_RGB}, 0.015) 4px)`,
          }}
        />

        <div className="relative z-10 p-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">
            {gamePhase === 'setup' && <div key="setup">{renderSetup()}</div>}
            {gamePhase === 'playing' && <div key="playing">{renderGame()}</div>}
            {(gamePhase === 'won' || gamePhase === 'lost') && <div key="results">{renderResults()}</div>}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-2 border-t flex items-center justify-center"
          style={{ borderColor: `rgba(${ACCENT_RGB}, 0.1)` }}
        >
          <div className="flex items-center gap-1.5">
            <kbd
              className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(100, 116, 139, 0.25)',
                color: 'rgba(148, 163, 184, 0.5)',
              }}
            >
              Esc
            </kbd>
            <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
              выйти
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
