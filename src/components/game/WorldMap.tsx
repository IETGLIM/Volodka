
/* ─── Volodka RPG – World Map with Discovered Locations ─── */
/* Schematic 2D map of the game world.
 * Nodes positioned by sceneLocationCategories.
 * Keyboard shortcut: M, HUD button: 🗺
 * All UI text in Russian. */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { X, Map as MapIcon, Lock, Clock, MapPin, Navigation } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useFastTravelState } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { SceneId } from '@/shared/types/game';
import { isSceneGateOpen } from '@/shared/sceneGates';
import type { LocationCategory } from '@/shared/types/locationCategory';

/* ─── Travel time cost (same as explorationSlice) ─── */
const TRAVEL_TIME: Partial<Record<SceneId, number>> = {
  volodka_room: 0,
  volodka_corridor: 0,
  home_evening: 0,
  zarema_albert_room: 0,
  solnysh_room: 0,
  street_night: 0.5,
  street_winter: 0.5,
  cafe_evening: 0.5,
  office_day: 0.5,
  park_day: 0.75,
  chk_forest_zorge: 1.0,
  library_day: 0.75,
  rooftop_edge: 1.0,
  river_pier: 1.0,
  factory_basement: 1.0,
  abandoned_factory: 1.0,
  chk_campfire_night: 1.0,
  pier_evening: 1.0,
  factory_roof: 1.0,
  library_basement: 0.75,
  city_square: 0.5,
  underground_bunker: 1.0,
  guild_mainframe: 0.5,
  zarema_room: 0,
  albert_backroom: 0.5,
  battle: 0,
  sleep_dream: 0,
};

/* ─── Category grouping for map layout ─── */
type MapRegion = 'home' | 'city' | 'cultural' | 'industrial' | 'special';

interface MapNode {
  id: SceneId;
  x: number;  // percentage 0-100
  y: number;  // percentage 0-100
  region: MapRegion;
  category: LocationCategory;
}

const REGION_COLORS: Record<MapRegion, string> = {
  home: '#22dd88',        // green
  city: '#0ef',           // cyan
  cultural: '#a78bfa',    // violet
  industrial: '#fb923c',  // amber
  special: '#f472b6',     // pink
};

const REGION_LABELS: Record<MapRegion, string> = {
  home: 'Дом',
  city: 'Город',
  cultural: 'Культура',
  industrial: 'Промзона',
  special: 'Особые',
};

/* ─── Node positions — grouped by region ─── */
const MAP_NODES: MapNode[] = [
  // ── Home area (top-left cluster) ──
  { id: 'volodka_room',       x: 12, y: 18, region: 'home', category: 'home' },
  { id: 'volodka_corridor',   x: 22, y: 28, region: 'home', category: 'corridor' },
  { id: 'home_evening',       x: 10, y: 38, region: 'home', category: 'home' },
  { id: 'zarema_albert_room', x: 26, y: 16, region: 'home', category: 'home' },
  { id: 'zarema_room',        x: 32, y: 10, region: 'home', category: 'home' },
  { id: 'solnysh_room',       x: 18, y: 46, region: 'home', category: 'home' },

  // ── City area (center) ──
  { id: 'street_night',       x: 48, y: 42, region: 'city', category: 'street' },
  { id: 'street_winter',      x: 56, y: 52, region: 'city', category: 'street' },
  { id: 'cafe_evening',       x: 68, y: 30, region: 'city', category: 'cafe' },
  { id: 'albert_backroom',    x: 76, y: 24, region: 'city', category: 'cafe' },
  { id: 'office_day',         x: 38, y: 62, region: 'city', category: 'office' },
  { id: 'guild_mainframe',    x: 44, y: 72, region: 'city', category: 'office' },
  { id: 'city_square',        x: 58, y: 38, region: 'city', category: 'street' },

  // ── Cultural area (right side) ──
  { id: 'park_day',           x: 78, y: 56, region: 'cultural', category: 'park' },
  { id: 'library_day',        x: 86, y: 68, region: 'cultural', category: 'library' },
  { id: 'library_basement',   x: 90, y: 78, region: 'cultural', category: 'library' },

  // ── Industrial area (bottom-left) ──
  { id: 'abandoned_factory',  x: 20, y: 78, region: 'industrial', category: 'factory' },
  { id: 'factory_basement',   x: 16, y: 88, region: 'industrial', category: 'factory' },
  { id: 'factory_roof',       x: 26, y: 70, region: 'industrial', category: 'factory' },
  { id: 'underground_bunker', x: 12, y: 94, region: 'industrial', category: 'factory' },
  { id: 'river_pier',         x: 34, y: 84, region: 'industrial', category: 'unknown' },

  // ── Special (scattered) ──
  { id: 'rooftop_edge',       x: 52, y: 14, region: 'special', category: 'rooftop' },
  { id: 'chk_forest_zorge',   x: 82, y: 42, region: 'special', category: 'unknown' },
  { id: 'chk_campfire_night', x: 88, y: 50, region: 'special', category: 'unknown' },
  { id: 'pier_evening',       x: 42, y: 90, region: 'special', category: 'unknown' },
  { id: 'sleep_dream',        x: 90, y: 10, region: 'special', category: 'unknown' },
  { id: 'battle',             x: 64, y: 86, region: 'special', category: 'unknown' },
];

/* ─── Connection lines between logically related nodes ─── */
const CONNECTIONS: [SceneId, SceneId][] = [
  // Home cluster
  ['volodka_room', 'volodka_corridor'],
  ['volodka_corridor', 'home_evening'],
  ['volodka_corridor', 'zarema_albert_room'],
  ['volodka_corridor', 'solnysh_room'],
  ['zarema_albert_room', 'zarema_room'],
  // Home → Street
  ['volodka_corridor', 'street_night'],
  // City cluster
  ['street_night', 'cafe_evening'],
  ['street_night', 'office_day'],
  ['street_night', 'city_square'],
  ['street_night', 'street_winter'],
  ['cafe_evening', 'albert_backroom'],
  ['office_day', 'guild_mainframe'],
  // City → Cultural
  ['street_night', 'park_day'],
  ['park_day', 'library_day'],
  ['library_day', 'library_basement'],
  // City → Special
  ['street_night', 'rooftop_edge'],
  ['street_night', 'abandoned_factory'],
  ['park_day', 'chk_forest_zorge'],
  ['chk_forest_zorge', 'chk_campfire_night'],
  // City → Industrial
  ['abandoned_factory', 'factory_basement'],
  ['abandoned_factory', 'factory_roof'],
  ['factory_basement', 'underground_bunker'],
  ['abandoned_factory', 'river_pier'],
  // Misc
  ['river_pier', 'pier_evening'],
  ['pier_evening', 'park_day'],
  ['volodka_room', 'sleep_dream'],
];

/* ─── Scene description snippets ─── */
const SCENE_DESCRIPTIONS: Partial<Record<SceneId, string>> = {
  volodka_room: 'Маленькая комната в коммуналке. Экран монитора — единственный свет.',
  volodka_corridor: 'Длинный тёмный коридор коммуналки. Пахнет краской и временем.',
  home_evening: 'Общая кухня. Тёплый свет и запах чая.',
  zarema_albert_room: 'Комната соседей. Книги и детские игрушки.',
  zarema_room: 'Комната Заремы. Шёлк и схемы.',
  solnysh_room: 'Солнешкина комната. Ковры и акварели.',
  street_night: 'Ночной город. Неон и туман между домами.',
  street_winter: 'Зимняя улица. Снег глушит звуки.',
  cafe_evening: 'Кафе «Синяя яма». Синий неон и кофе.',
  albert_backroom: 'Подсобка Альберта. Кофейные тайны.',
  office_day: 'Офис IT-гильдии. Белый свет, ряды мониторов.',
  guild_mainframe: 'Серверная гильдии. Гул машин и мерцание.',
  city_square: 'Городская площадь. Фонтан и неон.',
  park_day: 'Городской парк. Редкие деревья и тишина.',
  library_day: 'Старая библиотека. Запах бумаги и пыли.',
  library_basement: 'Подвал библиотеки. Забытые архивы.',
  rooftop_edge: 'Край крыши. Весь город как на ладони.',
  abandoned_factory: 'Заброшенный завод. Ржавчина и эхо.',
  factory_basement: 'Подвал завода. Шёпот машин и старых тайн.',
  factory_roof: 'Крыша завода. Металл и горизонт.',
  underground_bunker: 'Подземный бункер. Секреты под землёй.',
  river_pier: 'Речной пирс. Плеск воды и туман.',
  chk_forest_zorge: 'Лес на Зорге. Тени между сосен.',
  chk_campfire_night: 'Костёр ЧК. Портвейн и металл.',
  pier_evening: 'Пирс вечером. Волны и закат.',
  sleep_dream: 'Мир сна. Всё возможно.',
  battle: 'Арена боя. Стихии сталкиваются.',
};

/* ─── Region group bounding boxes (for region labels) ─── */
const REGION_CENTERS: { region: MapRegion; x: number; y: number }[] = [
  { region: 'home', x: 20, y: 8 },
  { region: 'city', x: 54, y: 24 },
  { region: 'cultural', x: 84, y: 48 },
  { region: 'industrial', x: 20, y: 68 },
  { region: 'special', x: 68, y: 8 },
];

/* ─── Time period label ─── */
function timePeriodLabel(hour: number): string {
  if (hour >= 6 && hour < 10) return 'Утро';
  if (hour >= 10 && hour < 18) return 'День';
  if (hour >= 18 && hour < 21) return 'Вечер';
  return 'Ночь';
}

/* ─── Props ─── */
interface WorldMapProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Travel confirmation dialog ─── */
function TravelConfirmDialog({
  sceneId: _sceneId,
  sceneName,
  travelHours,
  onConfirm,
  onCancel,
}: {
  sceneId: SceneId;
  sceneName: string;
  travelHours: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <motion.div
        className="relative z-10 mx-4 p-5 rounded-lg border border-cyan-500/30 max-w-sm w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(8,12,18,0.98) 0%, rgba(5,8,14,0.99) 100%)',
          boxShadow: '0 0 30px rgb(var(--cyber-cyan-rgb) / 0.15), 0 8px 32px rgba(0, 0, 0, 0.7)',
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="size-4 text-cyan-400/70" />
          <h3 className="text-sm font-semibold text-slate-100">Перейти в локацию?</h3>
        </div>
        <p className="text-slate-300 text-sm mb-1">{sceneName}</p>
        {travelHours > 0 && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
            <Clock className="size-3" />
            Время в пути: {travelHours} ч.
          </p>
        )}
        {travelHours === 0 && (
          <p className="text-xs text-emerald-400/70 mb-4">Мгновенный переход</p>
        )}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Отмена
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-md text-sm text-slate-100 transition-colors"
            style={{
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
            }}
          >
            Перейти
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main component ─── */
export function WorldMap({ open, onClose }: WorldMapProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const { currentSceneId, timeOfDay, discoveredScenes, playerFlags } = useFastTravelState();
  const fastTravelTo = useGameStore((s) => s.fastTravelTo);

  const [hoveredScene, setHoveredScene] = useState<SceneId | null>(null);
  const [focusSceneId, setFocusSceneId] = useState<SceneId | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelTarget, setTravelTarget] = useState<{ id: SceneId; name: string; hours: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setFocusSceneId(null);
      return;
    }
    const unsub = eventBus.on('worldmap:focus_scene', ({ sceneId }) => {
      setFocusSceneId(sceneId);
      setHoveredScene(sceneId);
    });
    return unsub;
  }, [open]);

  // Build lookup for node positions
  const nodeMap = useMemo(() => {
    const map = new Map<string, MapNode>();
    for (const node of MAP_NODES) {
      map.set(node.id, node);
    }
    return map;
  }, []);

  // Check if a scene is accessible (discovered + flag gate)
  const isAccessible = useCallback(
    (sceneId: SceneId) => {
      if (!discoveredScenes.includes(sceneId)) return false;
      if (!isSceneGateOpen(sceneId, playerFlags)) return false;
      return true;
    },
    [discoveredScenes, playerFlags],
  );

  // Handle travel click — show confirmation
  const handleNodeClick = useCallback(
    (sceneId: SceneId) => {
      if (sceneId === currentSceneId) return;
      if (!isAccessible(sceneId)) return;

      const config = SCENE_CONFIG[sceneId];
      const travelHours = TRAVEL_TIME[sceneId] ?? 0.5;
      setTravelTarget({
        id: sceneId,
        name: config?.name ?? sceneId,
        hours: travelHours,
      });
    },
    [currentSceneId, isAccessible],
  );

  // Confirm travel
  const confirmTravel = useCallback(() => {
    if (!travelTarget) return;
    setIsTraveling(true);
    setTimeout(() => {
      fastTravelTo(travelTarget.id);
      setTimeout(() => {
        setIsTraveling(false);
        setTravelTarget(null);
        onClose();
      }, 400);
    }, 300);
  }, [travelTarget, fastTravelTo, onClose]);

  // Cancel travel
  const cancelTravel = useCallback(() => {
    setTravelTarget(null);
  }, []);

  // Count discovered vs total (exclude battle/sleep_dream)
  const discoverableScenes = useMemo(
    () => MAP_NODES.filter((n) => n.id !== 'battle' && n.id !== 'sleep_dream'),
    [],
  );
  const discoveredCount = useMemo(
    () => discoverableScenes.filter((n) => discoveredScenes.includes(n.id)).length,
    [discoveredScenes, discoverableScenes],
  );

  // Excluded scenes that shouldn't show on the map
  const isExcluded = useCallback((id: SceneId) => id === 'battle' || id === 'sleep_dream', []);

  return (
    <>
      {/* Travel fade overlay */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div
            key="world-travel-fade"
            className="fixed inset-0 bg-black pointer-events-none"
            style={{ zIndex: UI_LAYERS.MENU - 1 }}
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
            style={{ zIndex: UI_LAYERS.MENU }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Content */}
            <FocusTrap initialFocusRef={closeButtonRef}>
            <motion.div
              className="relative z-10 w-full max-w-4xl mx-4"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              {...dialogProps}
            >
              <div
                className="relative rounded-lg border border-cyan-500/20 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(8,12,18,0.97) 0%, rgba(5,8,14,0.98) 100%)',
                  boxShadow: '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.08), 0 8px 32px rgba(0, 0, 0, 0.6)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/15">
                  <div className="flex items-center gap-3">
                    <MapIcon className="size-5 text-cyan-400/70" />
                    <h2 {...titleProps} className="text-lg font-semibold text-slate-100 tracking-wide">
                      КАРТА МИРА
                    </h2>
                    <span className="text-xs text-cyan-400/50 font-mono ml-2">
                      {discoveredCount}/{discoverableScenes.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-cyan-500/15 bg-cyan-950/20">
                      <Clock className="size-3 text-cyan-400/60" />
                      <span className="text-cyan-400/80 text-[11px] font-mono">
                        {Math.floor(timeOfDay).toString().padStart(2, '0')}:
                        {((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')} — {timePeriodLabel(timeOfDay)}
                      </span>
                    </div>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors close-btn-glow"
                      aria-label="Закрыть"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Map area */}
                <div className="relative px-5 py-4" style={{ minHeight: 440 }}>
                  {/* Schematic background grid */}
                  <div
                    className="absolute inset-4 rounded-lg border border-slate-700/20 overflow-hidden"
                    style={{ background: 'rgba(4, 6, 14, 0.8)' }}
                  >
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
                      <defs>
                        <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--cyber-cyan)" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#map-grid)" />
                    </svg>
                  </div>

                  {/* Region labels */}
                  <div className="absolute inset-4 pointer-events-none">
                    {REGION_CENTERS.map(({ region, x, y }) => (
                      <div
                        key={region}
                        className="absolute text-[9px] font-mono uppercase tracking-[0.2em] opacity-30"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          color: REGION_COLORS[region],
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {REGION_LABELS[region]}
                      </div>
                    ))}
                  </div>

                  {/* Connection lines */}
                  <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]">
                    {CONNECTIONS.map(([from, to]) => {
                      if (isExcluded(from) || isExcluded(to)) return null;
                      const fromNode = nodeMap.get(from);
                      const toNode = nodeMap.get(to);
                      if (!fromNode || !toNode) return null;

                      const fromDiscovered = discoveredScenes.includes(from);
                      const toDiscovered = discoveredScenes.includes(to);
                      const bothDiscovered = fromDiscovered && toDiscovered;
                      const regionColor = REGION_COLORS[fromNode.region];

                      return (
                        <line
                          key={`${from}-${to}`}
                          x1={`${fromNode.x}%`}
                          y1={`${fromNode.y}%`}
                          x2={`${toNode.x}%`}
                          y2={`${toNode.y}%`}
                          stroke={bothDiscovered ? regionColor : 'rgba(71,85,105,0.12)'}
                          strokeWidth={bothDiscovered ? 1.5 : 0.8}
                          strokeDasharray={bothDiscovered ? '6 4' : '2 6'}
                          opacity={bothDiscovered ? 0.5 : 1}
                        />
                      );
                    })}
                  </svg>

                  {/* Location nodes */}
                  <div className="absolute inset-4">
                    {MAP_NODES.filter((n) => !isExcluded(n.id)).map((node) => {
                      const isDiscovered = discoveredScenes.includes(node.id);
                      const isCurrent = node.id === currentSceneId;
                      const isFocused = focusSceneId === node.id;
                      const accessible = isAccessible(node.id);
                      const gateOpen = isSceneGateOpen(node.id, playerFlags);
                      const isRumored = !isDiscovered && gateOpen;
                      const config = SCENE_CONFIG[node.id];
                      const regionColor = REGION_COLORS[node.region];

                      return (
                        <div
                          key={node.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                          {/* Node button */}
                          <motion.button
                            onClick={() => handleNodeClick(node.id)}
                            onMouseEnter={() => setHoveredScene(node.id)}
                            onMouseLeave={() => setHoveredScene(focusSceneId)}
                            disabled={!accessible || isCurrent}
                            className={`
                              relative flex flex-col items-center justify-center
                              rounded-full transition-all duration-200 cursor-pointer
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60
                              ${isCurrent
                                ? 'w-14 h-14'
                                : isDiscovered || isFocused
                                  ? 'w-11 h-11 hover:scale-110'
                                  : isRumored
                                    ? 'w-9 h-9 cursor-default'
                                    : 'w-7 h-7 cursor-default'
                              }
                            `}
                            style={{
                              background: isCurrent
                                ? `${regionColor}20`
                                : isDiscovered
                                  ? `${regionColor}12`
                                  : 'rgba(51, 65, 85, 0.15)',
                              border: isFocused
                                ? '2px solid rgba(0,229,255,0.7)'
                                : isCurrent
                                  ? `2px solid ${regionColor}99`
                                  : isDiscovered
                                    ? `1.5px solid ${regionColor}55`
                                    : '1px solid rgba(71, 85, 105, 0.2)',
                              boxShadow: isFocused
                                ? '0 0 18px rgba(0,229,255,0.55), 0 0 4px rgba(255,200,80,0.4)'
                                : isCurrent
                                  ? `0 0 20px ${regionColor}44, inset 0 0 10px ${regionColor}18`
                                  : isDiscovered
                                    ? `0 0 8px ${regionColor}22`
                                    : 'none',
                            }}
                            animate={isFocused ? { scale: [1, 1.08, 1] } : undefined}
                            transition={isFocused ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                            whileTap={accessible && !isCurrent ? { scale: 0.9 } : {}}
                          >
                            {/* Current location pulsing glow */}
                            {isCurrent && (
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                animate={{
                                  boxShadow: [
                                    `0 0 0px ${regionColor}00`,
                                    `0 0 24px ${regionColor}66`,
                                    `0 0 0px ${regionColor}00`,
                                  ],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              />
                            )}

                            {/* Node content */}
                            {isDiscovered ? (
                              <MapPin
                                className={`size-4 ${isCurrent ? 'size-5' : ''}`}
                                style={{ color: regionColor }}
                              />
                            ) : isRumored ? (
                              <span className="text-[8px] font-mono text-amber-400/50">?</span>
                            ) : (
                              <div className="size-1.5 rounded-full bg-slate-700" />
                            )}

                            {/* Scene name below node */}
                            <span
                              className={`
                                absolute -bottom-5 whitespace-nowrap text-[9px] font-mono
                                ${isCurrent
                                  ? 'font-semibold'
                                  : ''
                                }
                              `}
                              style={{
                                color: isCurrent
                                  ? regionColor
                                  : isDiscovered
                                    ? `${regionColor}aa`
                                    : isRumored
                                      ? 'rgba(251, 191, 36, 0.5)'
                                      : 'rgba(71, 85, 105, 0.4)',
                              }}
                            >
                              {isDiscovered && config
                                ? (config.name.length > 14
                                    ? config.name.substring(0, 14) + '…'
                                    : config.name)
                                : isRumored && config
                                  ? (config.name.length > 14
                                      ? config.name.substring(0, 14) + '…'
                                      : config.name)
                                  : '???'
                              }
                            </span>
                          </motion.button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tooltip for hovered node */}
                  <AnimatePresence>
                    {hoveredScene && !isExcluded(hoveredScene) && (() => {
                      const node = nodeMap.get(hoveredScene);
                      if (!node) return null;

                      const isDiscovered = discoveredScenes.includes(hoveredScene);
                      const isCurrent = hoveredScene === currentSceneId;
                      const config = SCENE_CONFIG[hoveredScene];
                      const travelHours = TRAVEL_TIME[hoveredScene] ?? 0.5;
                      const gateOpen = isSceneGateOpen(hoveredScene, playerFlags);
                      const isRumored = !isDiscovered && gateOpen;
                      const regionColor = REGION_COLORS[node.region];

                      // Position tooltip, clamped to not overflow
                      const tooltipX = Math.min(Math.max(node.x, 15), 75);
                      const tooltipY = node.y > 55 ? node.y - 22 : node.y + 12;

                      return (
                        <motion.div
                          key={`tooltip-${hoveredScene}`}
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${tooltipX}%`,
                            top: `${tooltipY}%`,
                            transform: 'translateX(-50%)',
                          }}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div
                            className="px-3 py-2 rounded-md border backdrop-blur-md min-w-[170px] max-w-[240px]"
                            style={{
                              background: 'rgba(8, 12, 22, 0.92)',
                              borderColor: isCurrent
                                ? `${regionColor}66`
                                : isDiscovered
                                  ? `${regionColor}44`
                                  : 'rgba(71, 85, 105, 0.3)',
                              boxShadow: `0 0 15px ${isCurrent ? `${regionColor}28` : isDiscovered ? `${regionColor}18` : 'rgba(0,0,0,0.3)'}`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="size-3" style={{ color: regionColor }} />
                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color: isCurrent ? regionColor : isDiscovered ? `${regionColor}cc` : isRumored ? 'rgba(251,191,36,0.7)' : 'rgba(100,116,139,0.6)',
                                }}
                              >
                                {isDiscovered && config ? config.name : isRumored && config ? config.name : '???'}
                              </span>
                            </div>

                            {isDiscovered && (
                              <>
                                <p className="text-[10px] text-slate-400 leading-tight mb-1.5">
                                  {SCENE_DESCRIPTIONS[hoveredScene] ?? ''}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isCurrent ? (
                                    <span className="text-[9px] font-mono flex items-center gap-1" style={{ color: regionColor }}>
                                      <MapPin className="size-2.5" /> Вы здесь
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-cyan-400/60 font-mono flex items-center gap-1">
                                      <Clock className="size-2.5" />
                                      {travelHours > 0 ? `${travelHours} ч.` : 'Мгновенно'}
                                    </span>
                                  )}
                                  {!gateOpen && (
                                    <span className="text-[9px] text-amber-400/60 font-mono flex items-center gap-1">
                                      <Lock className="size-2.5" /> Закрыто
                                    </span>
                                  )}
                                </div>
                              </>
                            )}

                            {!isDiscovered && (
                              <p className="text-[10px] text-slate-600 italic">
                                {isRumored ? 'Слухи об этом месте…' : 'Не исследовано'}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  {/* Travel confirmation dialog */}
                  <AnimatePresence>
                    {travelTarget && (
                      <TravelConfirmDialog
                        sceneId={travelTarget.id}
                        sceneName={travelTarget.name}
                        travelHours={travelTarget.hours}
                        onConfirm={confirmTravel}
                        onCancel={cancelTravel}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Legend & Footer */}
                <div className="px-5 py-3 border-t border-slate-800/50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 text-[10px] flex-wrap">
                      {Object.entries(REGION_LABELS).map(([region, label]) => (
                        <span key={region} className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full inline-block border"
                            style={{
                              borderColor: `${REGION_COLORS[region as MapRegion]}88`,
                              background: `${REGION_COLORS[region as MapRegion]}22`,
                            }}
                          />
                          <span className="text-slate-400">{label}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500/50 font-mono tracking-wider">
                        volodka://world-map
                      </span>
                      <div className="flex items-center gap-1">
                        <kbd className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-700/30 bg-slate-800/40">M</kbd>
                        <span className="text-[9px] text-slate-500">открыть/закрыть</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
