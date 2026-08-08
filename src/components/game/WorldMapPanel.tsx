
/* ─── Volodka RPG – Canvas-based World Map Panel (Enhanced) ───
 * Full-screen canvas map showing discovered game scenes.
 * Scenes organized by area, with connections, quest markers, fast travel.
 * Keyboard: Tab to toggle, Escape to close.
 * All UI text in Russian. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { X, Compass, Clock, MapPin, Lock, Zap, Users, ShieldAlert } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useFastTravelState, useActiveQuests } from '@/store/selectors';
import { SCENE_DEFINITIONS, type SceneId } from '@/config/sceneDefinitions';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { isSceneGateOpen, SCENE_FLAG_GATES } from '@/shared/sceneGates';
import { hapticMedium, hapticError } from '@/shared/utils/hapticFeedback';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { NPC_SCHEDULES_MAP } from '@/data/npcSchedules';
import '../styles/world-map.css';

/* ─── Area/region definitions ─── */
type MapRegion = 'home' | 'city' | 'cultural' | 'industrial' | 'special';

const REGION_COLORS: Record<MapRegion, string> = {
  home: '#22dd88',
  city: '#0ef',
  cultural: '#a78bfa',
  industrial: '#fb923c',
  special: '#f472b6',
};

const REGION_LABELS: Record<MapRegion, string> = {
  home: 'ДОМ',
  city: 'ГОРОД',
  cultural: 'КУЛЬТУРА',
  industrial: 'ПРОМЗОНА',
  special: 'ОСОБЫЕ',
};

/* ─── Connection types ─── */
type ConnectionType = 'road' | 'path' | 'secret';

const CONNECTION_STYLES: Record<ConnectionType, { label: string; dash: number[]; color: string; width: number }> = {
  road:   { label: 'Дорога',  dash: [6, 4],  color: 'rgba(0, 229, 255, 0.25)',  width: 1.5 },
  path:   { label: 'Тропа',  dash: [4, 4],  color: 'rgba(0, 229, 255, 0.18)',  width: 1.0 },
  secret: { label: 'Секрет', dash: [2, 6],  color: 'rgba(167, 139, 250, 0.2)', width: 0.8 },
};

interface TypedConnection {
  from: SceneId;
  to: SceneId;
  type: ConnectionType;
}

/* ─── Canvas map node positions (percentage-based) ─── */
interface MapNode {
  id: SceneId;
  x: number;
  y: number;
  region: MapRegion;
}

const MAP_NODES: MapNode[] = [
  // Home cluster
  { id: 'volodka_room',       x: 12, y: 18, region: 'home' },
  { id: 'volodka_corridor',   x: 22, y: 28, region: 'home' },
  { id: 'home_evening',       x: 10, y: 38, region: 'home' },
  { id: 'zarema_albert_room', x: 26, y: 16, region: 'home' },
  { id: 'zarema_room',        x: 32, y: 10, region: 'home' },
  { id: 'solnysh_room',       x: 18, y: 46, region: 'home' },

  // City cluster
  { id: 'street_night',       x: 48, y: 42, region: 'city' },
  { id: 'street_winter',      x: 56, y: 52, region: 'city' },
  { id: 'cafe_evening',       x: 68, y: 30, region: 'city' },
  { id: 'albert_backroom',    x: 76, y: 24, region: 'city' },
  { id: 'office_day',         x: 38, y: 62, region: 'city' },
  { id: 'guild_mainframe',    x: 44, y: 72, region: 'city' },
  { id: 'city_square',        x: 58, y: 38, region: 'city' },

  // Cultural area
  { id: 'park_day',           x: 78, y: 56, region: 'cultural' },
  { id: 'library_day',        x: 86, y: 68, region: 'cultural' },
  { id: 'library_basement',   x: 90, y: 78, region: 'cultural' },

  // Industrial area
  { id: 'abandoned_factory',  x: 20, y: 78, region: 'industrial' },
  { id: 'factory_basement',   x: 16, y: 88, region: 'industrial' },
  { id: 'factory_roof',       x: 26, y: 70, region: 'industrial' },
  { id: 'underground_bunker', x: 12, y: 94, region: 'industrial' },
  { id: 'river_pier',         x: 34, y: 84, region: 'industrial' },

  // Special
  { id: 'rooftop_edge',       x: 52, y: 14, region: 'special' },
  { id: 'chk_forest_zorge',   x: 82, y: 42, region: 'special' },
  { id: 'chk_campfire_night', x: 88, y: 50, region: 'special' },
  { id: 'pier_evening',       x: 42, y: 90, region: 'special' },
  { id: 'sleep_dream',        x: 90, y: 10, region: 'special' },
  { id: 'battle',             x: 64, y: 86, region: 'special' },
  { id: 'forest_clearing',    x: 86, y: 34, region: 'special' },
];

/* ─── Typed connections ─── */
const TYPED_CONNECTIONS: TypedConnection[] = [
  // Home cluster — roads
  { from: 'volodka_room', to: 'volodka_corridor', type: 'road' },
  { from: 'volodka_corridor', to: 'home_evening', type: 'road' },
  { from: 'volodka_corridor', to: 'zarema_albert_room', type: 'road' },
  { from: 'volodka_corridor', to: 'solnysh_room', type: 'road' },
  { from: 'zarema_albert_room', to: 'zarema_room', type: 'path' },
  // Home → City
  { from: 'volodka_corridor', to: 'street_night', type: 'road' },
  // City cluster — roads
  { from: 'street_night', to: 'cafe_evening', type: 'road' },
  { from: 'street_night', to: 'office_day', type: 'road' },
  { from: 'street_night', to: 'city_square', type: 'road' },
  { from: 'street_night', to: 'street_winter', type: 'path' },
  { from: 'cafe_evening', to: 'albert_backroom', type: 'secret' },
  { from: 'office_day', to: 'guild_mainframe', type: 'secret' },
  // City → Cultural
  { from: 'street_night', to: 'park_day', type: 'path' },
  { from: 'park_day', to: 'library_day', type: 'road' },
  { from: 'library_day', to: 'library_basement', type: 'secret' },
  // City → Special
  { from: 'street_night', to: 'rooftop_edge', type: 'secret' },
  // City → Industrial
  { from: 'street_night', to: 'abandoned_factory', type: 'path' },
  // Cultural → Special
  { from: 'park_day', to: 'chk_forest_zorge', type: 'path' },
  { from: 'chk_forest_zorge', to: 'chk_campfire_night', type: 'path' },
  { from: 'chk_forest_zorge', to: 'forest_clearing', type: 'secret' },
  // Industrial internal
  { from: 'abandoned_factory', to: 'factory_basement', type: 'secret' },
  { from: 'abandoned_factory', to: 'factory_roof', type: 'path' },
  { from: 'factory_basement', to: 'underground_bunker', type: 'secret' },
  { from: 'abandoned_factory', to: 'river_pier', type: 'road' },
  { from: 'river_pier', to: 'pier_evening', type: 'road' },
  { from: 'pier_evening', to: 'park_day', type: 'path' },
  // Dream
  { from: 'volodka_room', to: 'sleep_dream', type: 'secret' },
];

/* ─── Energy cost per scene for fast travel ─── */
const TRAVEL_ENERGY_COST: Partial<Record<SceneId, number>> = {
  volodka_room: 0, volodka_corridor: 0, home_evening: 0,
  zarema_albert_room: 0, solnysh_room: 0, zarema_room: 0,
  street_night: 5, street_winter: 5, cafe_evening: 5,
  office_day: 5, city_square: 5, guild_mainframe: 5,
  park_day: 10, library_day: 10, library_basement: 10,
  rooftop_edge: 15, abandoned_factory: 15, factory_basement: 15,
  factory_roof: 15, river_pier: 15, chk_forest_zorge: 20,
  chk_campfire_night: 20, pier_evening: 15,
  underground_bunker: 25, albert_backroom: 5,
  forest_clearing: 20, battle: 0, sleep_dream: 0,
};

/* ─── Travel time ─── */
const TRAVEL_TIME: Partial<Record<SceneId, number>> = {
  volodka_room: 0, volodka_corridor: 0, home_evening: 0,
  zarema_albert_room: 0, solnysh_room: 0, zarema_room: 0,
  street_night: 0.5, street_winter: 0.5, cafe_evening: 0.5,
  office_day: 0.5, city_square: 0.5, guild_mainframe: 0.5,
  park_day: 0.75, library_day: 0.75, library_basement: 0.75,
  rooftop_edge: 1.0, abandoned_factory: 1.0, factory_basement: 1.0,
  factory_roof: 1.0, river_pier: 1.0, chk_forest_zorge: 1.0,
  chk_campfire_night: 1.0, pier_evening: 1.0,
  underground_bunker: 1.0, albert_backroom: 0.5,
  forest_clearing: 1.0, battle: 0, sleep_dream: 0,
};

/* ─── Danger levels ─── */
type DangerLevel = 'safe' | 'moderate' | 'dangerous';

const SCENE_DANGER: Partial<Record<SceneId, DangerLevel>> = {
  volodka_room: 'safe', volodka_corridor: 'safe', home_evening: 'safe',
  zarema_albert_room: 'safe', zarema_room: 'safe', solnysh_room: 'safe',
  street_night: 'moderate', street_winter: 'moderate', cafe_evening: 'safe',
  office_day: 'safe', city_square: 'safe', guild_mainframe: 'moderate',
  park_day: 'safe', library_day: 'safe', library_basement: 'moderate',
  rooftop_edge: 'dangerous', abandoned_factory: 'dangerous',
  factory_basement: 'dangerous', factory_roof: 'dangerous',
  underground_bunker: 'dangerous', river_pier: 'moderate',
  chk_forest_zorge: 'dangerous', chk_campfire_night: 'moderate',
  pier_evening: 'moderate', albert_backroom: 'safe',
  forest_clearing: 'moderate', battle: 'dangerous', sleep_dream: 'safe',
};

const DANGER_LABELS: Record<DangerLevel, string> = {
  safe: 'Безопасно',
  moderate: 'Осторожно',
  dangerous: 'Опасно',
};

/* ─── Scene type labels (Russian) ─── */
const SCENE_TYPE_LABELS: Record<string, string> = {
  indoor: 'Помещение',
  outdoor: 'Улица',
  underground: 'Подземелье',
  dream: 'Сон',
};

/* ─── Region label positions ─── */
const REGION_CENTERS: { region: MapRegion; x: number; y: number }[] = [
  { region: 'home', x: 20, y: 8 },
  { region: 'city', x: 54, y: 24 },
  { region: 'cultural', x: 84, y: 48 },
  { region: 'industrial', x: 20, y: 68 },
  { region: 'special', x: 68, y: 8 },
];

/* ─── Helpers ─── */
function timePeriodLabel(hour: number): string {
  if (hour >= 6 && hour < 10) return 'Утро';
  if (hour >= 10 && hour < 18) return 'День';
  if (hour >= 18 && hour < 21) return 'Вечер';
  return 'Ночь';
}

/** Get NPCs currently at a scene */
function getNpcsAtScene(sceneId: SceneId, timeOfDay: number): string[] {
  const npcNames: string[] = [];
  for (const schedule of Object.values(NPC_SCHEDULES_MAP)) {
    for (const entry of schedule.entries) {
      if (entry.sceneId === sceneId) {
        const hour = timeOfDay;
        const wrap = entry.startHour < entry.endHour
          ? hour >= entry.startHour && hour < entry.endHour
          : hour >= entry.startHour || hour < entry.endHour;
        if (wrap && !npcNames.includes(schedule.npcId)) {
          npcNames.push(schedule.npcId);
        }
      }
    }
  }
  return npcNames;
}

/** Get the unlock condition text for a gated scene */
function getUnlockConditionText(sceneId: SceneId): string | null {
  const gate = SCENE_FLAG_GATES[sceneId];
  if (!gate) return null;
  const LABELS: Record<string, string> = {
    rooftop_unlocked: 'Доберитесь до крыши через сюжет',
    factory_unlocked: 'Исследуйте заброшенный завод',
    visited_river_pier: 'Посетите набережную',
    entered_factory_basement: 'Спуститесь в подвал завода',
  };
  return LABELS[gate] ?? 'Выполните условие сюжета';
}

/* ─── Canvas drawing ─── */
const NODE_RADIUS = 8;
const NODE_RADIUS_CURRENT = 12;
const PADDING = 40;

function drawWorldMap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  discoveredScenes: string[],
  currentSceneId: SceneId,
  playerFlags: Record<string, boolean | undefined>,
  questSceneIds: Set<string>,
  hoveredNode: SceneId | null,
  time: number,
) {
  ctx.clearRect(0, 0, w, h);

  const mapW = w - PADDING * 2;
  const mapH = h - PADDING * 2;

  const toX = (pct: number) => PADDING + (pct / 100) * mapW;
  const toY = (pct: number) => PADDING + (pct / 100) * mapH;

  const nodeMap = new Map<SceneId, MapNode>();
  for (const n of MAP_NODES) nodeMap.set(n.id, n);

  // Connection type lookup
  const connTypeMap = new Map<string, ConnectionType>();
  for (const tc of TYPED_CONNECTIONS) {
    connTypeMap.set(`${tc.from}->${tc.to}`, tc.type);
    connTypeMap.set(`${tc.to}->${tc.from}`, tc.type);
  }

  // Background grid
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
  ctx.lineWidth = 0.5;
  const gridSize = 40;
  for (let gx = PADDING; gx < w - PADDING; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, PADDING);
    ctx.lineTo(gx, h - PADDING);
    ctx.stroke();
  }
  for (let gy = PADDING; gy < h - PADDING; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(PADDING, gy);
    ctx.lineTo(w - PADDING, gy);
    ctx.stroke();
  }

  // Region labels
  ctx.font = '600 11px "Geist Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (const rc of REGION_CENTERS) {
    ctx.fillStyle = REGION_COLORS[rc.region] + '40';
    ctx.fillText(REGION_LABELS[rc.region], toX(rc.x), toY(rc.y));
  }

  // Typed connection lines
  for (const conn of TYPED_CONNECTIONS) {
    const from = nodeMap.get(conn.from);
    const to = nodeMap.get(conn.to);
    if (!from || !to) continue;

    const fromDisc = discoveredScenes.includes(conn.from);
    const toDisc = discoveredScenes.includes(conn.to);
    const bothDisc = fromDisc && toDisc;
    const style = CONNECTION_STYLES[conn.type];

    ctx.beginPath();
    ctx.moveTo(toX(from.x), toY(from.y));
    ctx.lineTo(toX(to.x), toY(to.y));

    if (bothDisc) {
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.setLineDash(style.dash);
    } else {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 6]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw connection type indicator for discovered connections on hover
    if (bothDisc && hoveredNode && (hoveredNode === conn.from || hoveredNode === conn.to)) {
      const mx = (toX(from.x) + toX(to.x)) / 2;
      const my = (toY(from.y) + toY(to.y)) / 2;
      ctx.font = '400 8px "Geist Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = conn.type === 'secret' ? 'rgba(167, 139, 250, 0.5)' : 'rgba(148, 163, 184, 0.5)';
      ctx.fillText(style.label, mx, my - 5);
    }
  }

  // Nodes
  for (const node of MAP_NODES) {
    const x = toX(node.x);
    const y = toY(node.y);
    const isDisc = discoveredScenes.includes(node.id);
    const isCurrent = node.id === currentSceneId;
    const gateOpen = isSceneGateOpen(node.id, playerFlags);
    const isRumored = !isDisc && gateOpen;
    const isLocked = !isDisc && !gateOpen;
    const hasQuest = questSceneIds.has(node.id);
    const isHovered = hoveredNode === node.id;
    const def = SCENE_DEFINITIONS[node.id];

    // Current scene — pulsing cyan dot
    if (isCurrent) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      const glowRadius = NODE_RADIUS_CURRENT + 8 + pulse * 6;
      const gradient = ctx.createRadialGradient(x, y, NODE_RADIUS_CURRENT, x, y, glowRadius);
      gradient.addColorStop(0, `rgba(0, 229, 255, ${0.3 + pulse * 0.15})`);
      gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Quest marker (amber glow)
    if (hasQuest && isDisc) {
      const questPulse = 0.5 + 0.5 * Math.sin(time * 4);
      const qR = NODE_RADIUS + 6 + questPulse * 4;
      const qGrad = ctx.createRadialGradient(x, y, NODE_RADIUS, x, y, qR);
      qGrad.addColorStop(0, `rgba(255, 171, 0, ${0.4 + questPulse * 0.2})`);
      qGrad.addColorStop(1, 'rgba(255, 171, 0, 0)');
      ctx.beginPath();
      ctx.arc(x, y, qR, 0, Math.PI * 2);
      ctx.fillStyle = qGrad;
      ctx.fill();
    }

    // Node circle
    const radius = isCurrent ? NODE_RADIUS_CURRENT : isDisc ? NODE_RADIUS : 6;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (isCurrent) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.lineWidth = 2;
    } else if (isDisc) {
      ctx.fillStyle = isHovered
        ? 'rgba(0, 229, 255, 0.2)'
        : `${REGION_COLORS[node.region]}15`;
      ctx.strokeStyle = isHovered
        ? REGION_COLORS[node.region]
        : `${REGION_COLORS[node.region]}80`;
      ctx.lineWidth = isHovered ? 2 : 1.5;
    } else if (isLocked) {
      // Locked location — red-tinted circle
      ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 1;
    } else if (isRumored) {
      ctx.fillStyle = 'rgba(255, 171, 0, 0.08)';
      ctx.strokeStyle = 'rgba(255, 171, 0, 0.3)';
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
      ctx.lineWidth = 1;
    }
    ctx.fill();
    ctx.stroke();

    // Inner dot for discovered
    if (isDisc && !isCurrent) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = REGION_COLORS[node.region];
      ctx.fill();
    }

    // Lock icon for locked locations
    if (isLocked) {
      ctx.font = '600 9px "Geist Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.fillText('🔒', x, y + 3);
    }

    // Quest diamond marker
    if (hasQuest && isDisc) {
      ctx.save();
      ctx.translate(x + radius + 2, y - radius - 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#ffab00';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }

    // Scene name label
    ctx.font = isCurrent
      ? '600 11px "Geist", ui-sans-serif, sans-serif'
      : '400 9px "Geist", ui-sans-serif, sans-serif';
    ctx.textAlign = 'center';

    const name = isDisc && def
      ? def.name
      : isRumored && def
        ? def.name
        : isLocked && def
          ? def.name
          : '???';

    ctx.fillStyle = isCurrent
      ? 'rgba(0, 229, 255, 0.9)'
      : isDisc
        ? 'rgba(203, 213, 225, 0.8)'
        : isLocked
          ? 'rgba(239, 68, 68, 0.4)'
          : isRumored
            ? 'rgba(255, 171, 0, 0.5)'
            : 'rgba(100, 116, 139, 0.4)';

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(name.length > 18 ? name.substring(0, 18) + '…' : name, x, y + radius + 14);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // "Вы здесь" label for current
    if (isCurrent) {
      ctx.font = '700 9px "Geist", ui-sans-serif, sans-serif';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.fillText('ВЫ ЗДЕСЬ', x, y + radius + 26);
    }
  }
}

/* ─── Tooltip data ─── */
interface TooltipData {
  id: SceneId;
  name: string;
  x: number;
  y: number;
  isDisc: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  accessible: boolean;
  travelHours: number;
  energyCost: number;
  hasQuest: boolean;
  sceneType: string;
  dangerLevel: DangerLevel | undefined;
  npcNames: string[];
  unlockCondition: string | null;
}

/* ─── Props ─── */
interface WorldMapPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Component ─── */
export function WorldMapPanel({ open, onClose }: WorldMapPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const { currentSceneId, timeOfDay, discoveredScenes, playerFlags } = useFastTravelState();
  const activeQuests = useActiveQuests();
  const fastTravelTo = useGameStore((s) => s.fastTravelTo);
  const playerEnergy = useGameStore((s) => s.playerState.energy);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SceneId | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // Scenes with active quests
  const questSceneIds = useMemo(() => {
    const set = new Set<string>();
    for (const q of activeQuests) {
      const qDef = getQuestDefinitions().find((d) => d.id === q.questId);
      if (qDef?.objectives) {
        for (const obj of qDef.objectives) {
          if (obj.target && !q.objectives[obj.id]) {
            set.add(obj.target as string);
          }
        }
      }
    }
    return set;
  }, [activeQuests]);

  // Canvas resize
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [open]);

  // Canvas animation loop
  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const animate = (timestamp: number) => {
      const timeSec = timestamp / 1000;
      canvas.width = canvasSize.w * dpr;
      canvas.height = canvasSize.h * dpr;
      canvas.style.width = `${canvasSize.w}px`;
      canvas.style.height = `${canvasSize.h}px`;
      ctx.scale(dpr, dpr);

      drawWorldMap(
        ctx,
        canvasSize.w,
        canvasSize.h,
        discoveredScenes,
        currentSceneId,
        playerFlags,
        questSceneIds,
        hoveredNode,
        timeSec,
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [open, canvasSize, discoveredScenes, currentSceneId, playerFlags, questSceneIds, hoveredNode]);

  // Mouse interaction
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const mapW = rect.width - PADDING * 2;
      const mapH = rect.height - PADDING * 2;

      let found: SceneId | null = null;
      let tooltip: TooltipData | null = null;

      for (const node of MAP_NODES) {
        const nx = PADDING + (node.x / 100) * mapW;
        const ny = PADDING + (node.y / 100) * mapH;
        const dist = Math.hypot(mx - nx, my - ny);
        if (dist < 18) {
          found = node.id;
          const isDisc = discoveredScenes.includes(node.id);
          const isCurrent = node.id === currentSceneId;
          const gateOpen = isSceneGateOpen(node.id, playerFlags);
          const isLocked = !isDisc && !gateOpen;
          const hasQuest = questSceneIds.has(node.id);
          const def = SCENE_DEFINITIONS[node.id];
          const npcNames = isDisc ? getNpcsAtScene(node.id, timeOfDay) : [];

          tooltip = {
            id: node.id,
            name: isDisc && def ? def.name : isLocked && def ? def.name : '???',
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            isDisc,
            isCurrent,
            isLocked,
            accessible: isDisc && gateOpen && !isCurrent,
            travelHours: TRAVEL_TIME[node.id] ?? 0.5,
            energyCost: TRAVEL_ENERGY_COST[node.id] ?? 5,
            hasQuest,
            sceneType: def?.type ?? 'unknown',
            dangerLevel: SCENE_DANGER[node.id],
            npcNames,
            unlockCondition: isLocked ? getUnlockConditionText(node.id) : null,
          };
          break;
        }
      }

      setHoveredNode(found);
      setTooltipData(tooltip);
      canvas.style.cursor = found && tooltip?.accessible !== false ? 'pointer' : 'default';
    },
    [discoveredScenes, currentSceneId, playerFlags, questSceneIds, tooltipData, timeOfDay],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      void e;
      if (!hoveredNode || isTraveling) return;

      const isDisc = discoveredScenes.includes(hoveredNode);
      const isCurrent = hoveredNode === currentSceneId;
      const gateOpen = isSceneGateOpen(hoveredNode, playerFlags);
      const energyCost = TRAVEL_ENERGY_COST[hoveredNode] ?? 5;

      if (!isDisc || isCurrent || !gateOpen) {
        hapticError();
        return;
      }

      // Check energy cost
      if (energyCost > 0 && playerEnergy < energyCost) {
        hapticError();
        return;
      }

      hapticMedium();
      setIsTraveling(true);

      setTimeout(() => {
        fastTravelTo(hoveredNode);
        setTimeout(() => {
          setIsTraveling(false);
          onClose();
        }, 400);
      }, 300);
    },
    [hoveredNode, discoveredScenes, currentSceneId, playerFlags, fastTravelTo, isTraveling, onClose, playerEnergy],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltipData(null);
  }, []);

  // Discovered count
  const discoverableScenes = MAP_NODES.filter(
    (n) => n.id !== 'battle' && n.id !== 'sleep_dream',
  );
  const discoveredCount = discoverableScenes.filter((n) =>
    discoveredScenes.includes(n.id),
  ).length;

  return (
    <>
      {/* Travel fade overlay */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div
            key="world-map-travel-fade"
            className="fixed inset-0 bg-black pointer-events-none"
            style={{ zIndex: UI_LAYERS.PANEL - 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && !isTraveling && (
          <motion.div
            key="world-map-panel"
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: UI_LAYERS.PANEL }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <FocusTrap initialFocusRef={closeButtonRef}>
              <motion.div
                ref={containerRef}
                className="relative z-10 w-full max-w-4xl mx-4 h-[75vh] min-h-[400px]"
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                {...dialogProps}
              >
                <div
                  className="absolute inset-0 rounded-lg border border-cyan-500/20 overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(6,10,18,0.97) 0%, rgba(4,6,12,0.98) 100%)',
                    boxShadow:
                      '0 0 60px rgb(var(--cyber-cyan-rgb) / 0.06), 0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(0,229,255,0.08)',
                  }}
                />

                {/* Canvas */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ padding: '4rem 1.5rem 3rem 1.5rem' }}
                  onMouseMove={handleCanvasMouseMove}
                  onClick={handleCanvasClick}
                  onMouseLeave={handleCanvasMouseLeave}
                />

                {/* Header overlay */}
                <div
                  className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 border-b border-cyan-500/10"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(6,10,18,0.95) 0%, rgba(6,10,18,0) 100%)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="size-5 text-cyan-400/70" />
                    <h2
                      {...titleProps}
                      className="text-base font-semibold text-slate-100 tracking-wide"
                    >
                      КАРТА МИРА
                    </h2>
                    <span className="text-xs text-cyan-400/50 font-mono ml-1">
                      {discoveredCount}/{discoverableScenes.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Energy display */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-amber-500/15 bg-amber-950/20">
                      <Zap className="size-3 text-amber-400/70" />
                      <span className="text-amber-400/80 text-[11px] font-mono">
                        {playerEnergy}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-cyan-500/15 bg-cyan-950/20">
                      <Clock className="size-3 text-cyan-400/60" />
                      <span className="text-cyan-400/80 text-[11px] font-mono">
                        {Math.floor(timeOfDay)
                          .toString()
                          .padStart(2, '0')}
                        :{((timeOfDay % 1) * 60 | 0)
                          .toString()
                          .padStart(2, '0')}{' '}
                        — {timePeriodLabel(timeOfDay)}
                      </span>
                    </div>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                      aria-label="Закрыть карту"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Footer overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-5 py-2.5 border-t border-slate-800/40"
                  style={{
                    background:
                      'linear-gradient(0deg, rgba(6,10,18,0.95) 0%, rgba(6,10,18,0) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            border: '2px solid rgba(0,229,255,0.8)',
                            background: 'rgba(0,229,255,0.2)',
                          }}
                        />
                        <span className="text-slate-400">Текущая</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            border: '1.5px solid rgba(34,221,136,0.5)',
                            background: 'rgba(34,221,136,0.1)',
                          }}
                        />
                        <span className="text-slate-400">Открыто</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.06)',
                          }}
                        />
                        <span className="text-slate-400">Закрыто</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            border: '1px solid rgba(255,171,0,0.3)',
                            background: 'rgba(255,171,0,0.08)',
                          }}
                        />
                        <span className="text-slate-400">Слухи</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 inline-block rotate-45"
                          style={{ background: '#ffab00' }}
                        />
                        <span className="text-slate-400">Квест</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Connection type legend */}
                      <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: 'rgba(0,229,255,0.4)', borderWidth: '1.5px' }} />
                          <span>Дорога</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: 'rgba(0,229,255,0.25)' }} />
                          <span>Тропа</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: 'rgba(167,139,250,0.3)', borderStyle: 'dotted' }} />
                          <span>Секрет</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500/50 font-mono tracking-wider">
                        volodka://world-map
                      </span>
                      <div className="flex items-center gap-1">
                        <kbd className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-700/30 bg-slate-800/40">
                          M
                        </kbd>
                        <span className="text-[9px] text-slate-500">/</span>
                        <kbd className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-700/30 bg-slate-800/40">
                          TAB
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Tooltip */}
                {tooltipData && (
                  <div
                    className="absolute z-20 pointer-events-none world-map-tooltip px-3 py-2.5"
                    style={{
                      left: `${Math.min(tooltipData.x + 16, canvasSize.w - 240)}px`,
                      top: `${tooltipData.y > canvasSize.h / 2 ? tooltipData.y - 140 : tooltipData.y + 16}px`,
                      minWidth: 200,
                      maxWidth: 240,
                    }}
                  >
                    {/* Header */}
                    <div className="world-map-tooltip__header">
                      <span className="world-map-tooltip__name">
                        {tooltipData.name}
                      </span>
                      {tooltipData.isDisc && tooltipData.sceneType !== 'unknown' && (
                        <span
                          className="world-map-tooltip__type-badge"
                          style={{
                            background: tooltipData.sceneType === 'underground'
                              ? 'rgba(251,146,60,0.15)'
                              : tooltipData.sceneType === 'dream'
                                ? 'rgba(167,139,250,0.15)'
                                : tooltipData.sceneType === 'outdoor'
                                  ? 'rgba(34,197,94,0.15)'
                                  : 'rgba(0,229,255,0.12)',
                            color: tooltipData.sceneType === 'underground'
                              ? 'rgba(251,146,60,0.9)'
                              : tooltipData.sceneType === 'dream'
                                ? 'rgba(167,139,250,0.9)'
                                : tooltipData.sceneType === 'outdoor'
                                  ? 'rgba(34,197,94,0.9)'
                                  : 'rgba(0,229,255,0.8)',
                          }}
                        >
                          {SCENE_TYPE_LABELS[tooltipData.sceneType] ?? tooltipData.sceneType}
                        </span>
                      )}
                    </div>

                    {/* Current location indicator */}
                    {tooltipData.isCurrent ? (
                      <div className="world-map-tooltip__row world-map-tooltip__row--cyan">
                        <MapPin className="size-2.5" /> Вы здесь
                      </div>
                    ) : tooltipData.isDisc ? (
                      <>
                        {/* Travel info for discovered */}
                        <div className="world-map-tooltip__row world-map-tooltip__row--cyan">
                          <Clock className="size-2.5" />
                          {tooltipData.travelHours > 0
                            ? `${tooltipData.travelHours} ч. пути`
                            : 'Мгновенно'}
                          {tooltipData.energyCost > 0 && (
                            <span className="world-map-tooltip__cost ml-1">
                              <Zap className="size-2" />
                              {tooltipData.energyCost}
                              {playerEnergy < tooltipData.energyCost && ' (мало)'}
                            </span>
                          )}
                        </div>
                        {tooltipData.hasQuest && (
                          <div className="world-map-tooltip__row world-map-tooltip__row--amber">
                            ◆ Активный квест
                          </div>
                        )}
                      </>
                    ) : null}

                    {/* Danger level */}
                    {tooltipData.isDisc && tooltipData.dangerLevel && (
                      <div className={`world-map-tooltip__row mt-0.5`}>
                        <ShieldAlert className="size-2.5" style={{
                          color: tooltipData.dangerLevel === 'dangerous'
                            ? 'rgba(239,68,68,0.8)'
                            : tooltipData.dangerLevel === 'moderate'
                              ? 'rgba(251,191,36,0.8)'
                              : 'rgba(34,197,94,0.8)',
                        }} />
                        <span className={`world-map-tooltip__danger world-map-tooltip__danger--${tooltipData.dangerLevel}`}>
                          {DANGER_LABELS[tooltipData.dangerLevel]}
                        </span>
                      </div>
                    )}

                    {/* NPCs at this location */}
                    {tooltipData.isDisc && tooltipData.npcNames.length > 0 && (
                      <div className="world-map-tooltip__npcs">
                        <Users className="size-2.5 text-cyan-400/50" style={{ flexShrink: 0, marginTop: 2 }} />
                        {tooltipData.npcNames.map((npcId) => (
                          <span key={npcId} className="world-map-tooltip__npc-tag">
                            {npcId}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Locked condition */}
                    {tooltipData.isLocked && tooltipData.unlockCondition && (
                      <div className="world-map-tooltip__lock">
                        <Lock className="size-2.5" />
                        {tooltipData.unlockCondition}
                      </div>
                    )}

                    {/* Inaccessible discovered (gated) */}
                    {!tooltipData.isCurrent && tooltipData.isDisc && !tooltipData.accessible && (
                      <span className="text-[9px] text-amber-400/60 font-mono mt-1 block">
                        ◆ Закрыто
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
