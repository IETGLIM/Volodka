import type { HackingDifficulty } from '@/engine/minigame/hacking/hackingGameTypes';

export const HACKING_GRID_SIZE = 6;

export const HACKING_DIFFICULTY_CONFIG: Record<
  HackingDifficulty,
  {
    label: string;
    firewalls: number;
    dataNodes: number;
    scanners: number;
    bandwidth: number;
    scannerInterval: number;
    description: string;
  }
> = {
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

export const HACKING_MOVE_PACKET_MS = 300;
export const HACKING_SCANNER_ALERT_MS = 1500;
export const HACKING_SCAN_LINE_TICK_MS = 100;
