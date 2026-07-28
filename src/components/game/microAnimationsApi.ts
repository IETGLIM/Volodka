/* ─── MicroAnimations imperative API (stat / item pools) ─── */

export interface StatChangeEntry {
  id: number;
  statName: string;
  value: number;
  color?: string;
  x: number;
  y: number;
  createdAt: number;
}

let statChangeNextId = 0;
export const statChangePool: StatChangeEntry[] = [];
export const statChangeListeners = new Set<() => void>();

function notifyStatChangeListeners() {
  for (const fn of statChangeListeners) fn();
}

export function notifyStatChangePoolListeners() {
  notifyStatChangeListeners();
}

export function showStatChange(statName: string, value: number, color?: string) {
  const entry: StatChangeEntry = {
    id: statChangeNextId++,
    statName,
    value,
    color,
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: window.innerHeight * 0.4 + (Math.random() - 0.5) * 40,
    createdAt: Date.now(),
  };
  statChangePool.push(entry);
  while (statChangePool.length > 8) statChangePool.shift();
  notifyStatChangeListeners();
}

export interface ItemGainedEntry {
  id: number;
  name: string;
  icon?: string;
  rarity?: string;
  createdAt: number;
}

let itemGainedNextId = 0;
export const itemGainedPool: ItemGainedEntry[] = [];
export const itemGainedListeners = new Set<() => void>();

function notifyItemGainedListeners() {
  for (const fn of itemGainedListeners) fn();
}

export function notifyItemGainedPoolListeners() {
  notifyItemGainedListeners();
}

export function showItemGained(name: string, icon?: string, rarity?: string) {
  const entry: ItemGainedEntry = {
    id: itemGainedNextId++,
    name,
    icon,
    rarity,
    createdAt: Date.now(),
  };
  itemGainedPool.push(entry);
  while (itemGainedPool.length > 3) itemGainedPool.shift();
  notifyItemGainedListeners();
}
