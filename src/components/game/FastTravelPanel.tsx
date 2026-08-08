
/* ─── Volodka RPG – Fast Travel Panel ───
   Top-down schematic city map showing discovered/undiscovered locations.
   Keyboard shortcut: F, HUD button: 🧭
   All UI text in Russian.
*/

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { X, Compass, Lock, Clock, MapPin } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useFastTravelState } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { SceneId } from '@/shared/types/game';
import { isSceneGateOpen } from '@/shared/sceneGates';

/* ─── Travel time cost (same as explorationSlice) ─── */
const TRAVEL_TIME: Partial<Record<SceneId, number>> = {
  volodka_room: 0,
  volodka_corridor: 0,
  home_evening: 0,
  zarema_albert_room: 0,
  street_night: 0.5,
  street_winter: 0.5,
  cafe_evening: 0.5,
  office_day: 0.5,
  park_day: 0.75,
  chk_forest_zorge: 1.0,
  library_day: 0.75,
  rooftop_edge: 1.0,
  abandoned_factory: 1.0,
  battle: 0,
  sleep_dream: 0,
};

/* ─── Node positions on the schematic map (x%, y%) ─── */
interface MapNode {
  id: SceneId;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  icon: string;
  group: 'home' | 'street' | 'outdoor' | 'special';
}

const MAP_NODES: MapNode[] = [
  // Home area (top-left cluster)
  { id: 'volodka_room', x: 15, y: 18, icon: '🛏️', group: 'home' },
  { id: 'volodka_corridor', x: 25, y: 25, icon: '🚪', group: 'home' },
  { id: 'home_evening', x: 15, y: 35, icon: '🍳', group: 'home' },
  { id: 'zarema_albert_room', x: 30, y: 15, icon: '🧸', group: 'home' },

  // Street area (center)
  { id: 'street_night', x: 45, y: 45, icon: '🌃', group: 'street' },
  { id: 'street_winter', x: 55, y: 55, icon: '❄️', group: 'street' },

  // Urban locations (right & bottom)
  { id: 'cafe_evening', x: 70, y: 30, icon: '☕', group: 'street' },
  { id: 'office_day', x: 30, y: 65, icon: '🏢', group: 'street' },

  // Outdoor (right side)
  { id: 'park_day', x: 75, y: 55, icon: '🌳', group: 'outdoor' },
  { id: 'chk_forest_zorge', x: 82, y: 42, icon: '🏕️', group: 'outdoor' },
  { id: 'library_day', x: 85, y: 70, icon: '📚', group: 'outdoor' },

  // Special / gated
  { id: 'rooftop_edge', x: 55, y: 15, icon: '🏙️', group: 'special' },
  { id: 'abandoned_factory', x: 20, y: 80, icon: '🏭', group: 'special' },

  // Dream / battle (far corners)
  { id: 'sleep_dream', x: 85, y: 15, icon: '💫', group: 'special' },
  { id: 'battle', x: 50, y: 85, icon: '⚔️', group: 'special' },
];

/* ─── Connection lines between nodes ─── */
const CONNECTIONS: [SceneId, SceneId][] = [
  ['volodka_room', 'volodka_corridor'],
  ['volodka_corridor', 'home_evening'],
  ['volodka_corridor', 'street_night'],
  ['volodka_corridor', 'zarema_albert_room'],
  ['street_night', 'cafe_evening'],
  ['street_night', 'office_day'],
  ['street_night', 'park_day'],
  ['street_night', 'rooftop_edge'],
  ['street_night', 'abandoned_factory'],
  ['street_night', 'street_winter'],
  ['park_day', 'library_day'],
  ['park_day', 'chk_forest_zorge'],
  ['volodka_room', 'sleep_dream'],
];

/* ─── Time period label ─── */
function timePeriodLabel(hour: number): string {
  if (hour >= 6 && hour < 10) return 'Утро';
  if (hour >= 10 && hour < 18) return 'День';
  if (hour >= 18 && hour < 21) return 'Вечер';
  return 'Ночь';
}

/* ─── Scene description snippets ─── */
const SCENE_DESCRIPTIONS: Partial<Record<SceneId, string>> = {
  volodka_room: 'Маленькая комната в коммуналке. Экран монитора — единственный свет.',
  volodka_corridor: 'Длинный тёмный коридор коммуналки. Пахнет краской и временем.',
  home_evening: 'Общая кухня. Тёплый свет и запах чая.',
  zarema_albert_room: 'Комната соседей. Книги и детские игрушки.',
  street_night: 'Ночной город. Неон и туман между домами.',
  street_winter: 'Зимняя улица. Снег глушит звуки.',
  cafe_evening: 'Кафе «Синяя яма». Синий неон и кофе.',
  office_day: 'Офис IT-гильдии. Белый свет, ряды мониторов.',
  park_day: 'Городской парк. Редкие деревья и тишина.',
  chk_forest_zorge: 'Лес на Зорге. Костёр ЧК, портвейн и металл.',
  library_day: 'Старая библиотека. Запах бумаги и пыли.',
  rooftop_edge: 'Край крыши. Весь город как на ладони.',
  abandoned_factory: 'Заброшенный завод. Ржавчина и эхо.',
  sleep_dream: 'Мир сна. Всё возможно.',
  battle: 'Арена боя.',
};

/* ─── Props ─── */
interface FastTravelPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Component ─── */
export function FastTravelPanel({ open, onClose }: FastTravelPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const { currentSceneId, timeOfDay, discoveredScenes, playerFlags } = useFastTravelState();
  const fastTravelTo = useGameStore((s) => s.fastTravelTo);

  const [hoveredScene, setHoveredScene] = useState<SceneId | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);

  // Build lookup for node positions
  const nodeMap = useMemo(() => {
    const map = new Map<SceneId, MapNode>();
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

  // Handle travel click
  const handleTravel = useCallback(
    (sceneId: SceneId) => {
      if (sceneId === currentSceneId) return;
      if (!isAccessible(sceneId)) return;

      setIsTraveling(true);
      // Brief fade-to-black, then travel
      setTimeout(() => {
        fastTravelTo(sceneId);
        setTimeout(() => {
          setIsTraveling(false);
          onClose();
        }, 400);
      }, 300);
    },
    [currentSceneId, fastTravelTo, isAccessible, onClose],
  );

  // Count discovered vs total
  const discoverableScenes = useMemo(
    () => MAP_NODES.filter((n) => n.id !== 'battle' && n.id !== 'sleep_dream'),
    [],
  );
  const discoveredCount = useMemo(
    () => discoverableScenes.filter((n) => discoveredScenes.includes(n.id)).length,
    [discoveredScenes, discoverableScenes],
  );

  return (
    <>
      {/* Travel fade overlay */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div
            key="fast-travel-fade"
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
            key="fast-travel-panel"
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: UI_LAYERS.PANEL }}
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
              className="relative z-10 w-full max-w-3xl mx-4"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              {...dialogProps}
            >
              <div
                className="rounded-lg border border-cyan-500/20 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(8,12,18,0.97) 0%, rgba(5,8,14,0.98) 100%)',
                  boxShadow: '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.08), 0 8px 32px rgba(0, 0, 0, 0.6)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/15">
                  <div className="flex items-center gap-3">
                    <Compass className="size-5 text-cyan-400/70" />
                    <h2 {...titleProps} className="text-lg font-semibold text-slate-100 tracking-wide">
                      БЫСТРЫЙ ПЕРЕХОД
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
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                      aria-label="Закрыть"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Map area */}
                <div className="relative px-5 py-4" style={{ minHeight: 380 }}>
                  {/* Schematic background grid */}
                  <div
                    className="absolute inset-4 rounded-lg border border-slate-700/20 overflow-hidden"
                    style={{ background: 'rgba(8, 12, 22, 0.6)' }}
                  >
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--cyber-cyan)" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Connection lines */}
                  <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]">
                    {CONNECTIONS.map(([from, to]) => {
                      const fromNode = nodeMap.get(from);
                      const toNode = nodeMap.get(to);
                      if (!fromNode || !toNode) return null;

                      const fromDiscovered = discoveredScenes.includes(from);
                      const toDiscovered = discoveredScenes.includes(to);
                      const bothDiscovered = fromDiscovered && toDiscovered;

                      return (
                        <line
                          key={`${from}-${to}`}
                          x1={`${fromNode.x}%`}
                          y1={`${fromNode.y}%`}
                          x2={`${toNode.x}%`}
                          y2={`${toNode.y}%`}
                          stroke={bothDiscovered ? 'rgb(var(--cyber-cyan-rgb) / 0.3)' : 'rgba(71,85,105,0.15)'}
                          strokeWidth={bothDiscovered ? 1.5 : 1}
                          strokeDasharray={bothDiscovered ? '6 4' : '3 6'}
                        />
                      );
                    })}
                  </svg>

                  {/* Location nodes */}
                  <div className="absolute inset-4">
                    {MAP_NODES.map((node) => {
                      const isDiscovered = discoveredScenes.includes(node.id);
                      const isCurrent = node.id === currentSceneId;
                      const accessible = isAccessible(node.id);
                      const _isHovered = hoveredScene === node.id;
                      void _isHovered;
                      const gateOpen = isSceneGateOpen(node.id, playerFlags);
                      const isRumored = !isDiscovered && gateOpen;
                      const _travelHours = TRAVEL_TIME[node.id] ?? 0.5;
                      void _travelHours;
                      const config = SCENE_CONFIG[node.id];

                      return (
                        <div
                          key={node.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                          {/* Node button */}
                          <motion.button
                            onClick={() => handleTravel(node.id)}
                            onMouseEnter={() => setHoveredScene(node.id)}
                            onMouseLeave={() => setHoveredScene(null)}
                            disabled={!accessible || isCurrent}
                            className={`
                              relative flex flex-col items-center justify-center
                              rounded-full transition-all duration-200 cursor-pointer
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60
                              ${isCurrent
                                ? 'w-14 h-14'
                                : isDiscovered
                                  ? 'w-11 h-11 hover:scale-110'
                                  : 'w-9 h-9 cursor-default'
                              }
                            `}
                            style={{
                              background: isCurrent
                                ? 'rgba(52, 211, 153, 0.15)'
                                : isDiscovered
                                  ? 'rgb(var(--cyber-cyan-rgb) / 0.08)'
                                  : 'rgba(51, 65, 85, 0.2)',
                              border: isCurrent
                                ? '2px solid rgba(52, 211, 153, 0.6)'
                                : isDiscovered
                                  ? '1.5px solid rgb(var(--cyber-cyan-rgb) / 0.35)'
                                  : '1px solid rgba(71, 85, 105, 0.3)',
                              boxShadow: isCurrent
                                ? '0 0 20px rgba(52, 211, 153, 0.3), inset 0 0 10px rgba(52, 211, 153, 0.1)'
                                : isDiscovered
                                  ? '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.15)'
                                  : 'none',
                            }}
                            whileTap={accessible && !isCurrent ? { scale: 0.9 } : {}}
                          >
                            {/* Current location pulsing glow */}
                            {isCurrent && (
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                animate={{
                                  boxShadow: [
                                    '0 0 0px rgba(52, 211, 153, 0)',
                                    '0 0 20px rgba(52, 211, 153, 0.4)',
                                    '0 0 0px rgba(52, 211, 153, 0)',
                                  ],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              />
                            )}

                            {/* Icon or locked indicator */}
                            {isDiscovered || isRumored ? (
                              <span className={`text-lg ${isCurrent ? 'text-2xl' : ''} ${isRumored ? 'opacity-50' : ''}`}>
                                {node.icon}
                              </span>
                            ) : (
                              <Lock className="size-3.5 text-slate-600" />
                            )}

                            {/* Scene name below node */}
                            <span
                              className={`
                                absolute -bottom-5 whitespace-nowrap text-[9px] font-mono
                                ${isCurrent
                                  ? 'text-emerald-400'
                                  : isDiscovered
                                    ? 'text-cyan-400/70'
                                    : isRumored
                                      ? 'text-amber-500/60'
                                      : 'text-slate-600'
                                }
                              `}
                            >
                              {isDiscovered && config
                                ? (config.name.length > 12
                                    ? config.name.substring(0, 12) + '…'
                                    : config.name)
                                : isRumored && config
                                  ? (config.name.length > 12
                                      ? config.name.substring(0, 12) + '…'
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
                    {hoveredScene && (() => {
                      const node = nodeMap.get(hoveredScene);
                      if (!node) return null;

                      const isDiscovered = discoveredScenes.includes(hoveredScene);
                      const isCurrent = hoveredScene === currentSceneId;
                      const config = SCENE_CONFIG[hoveredScene];
                      const travelHours = TRAVEL_TIME[hoveredScene] ?? 0.5;
                      const gateOpen = isSceneGateOpen(hoveredScene, playerFlags);
                      const isRumored = !isDiscovered && gateOpen;

                      // Position tooltip, clamped to not overflow
                      const tooltipX = Math.min(Math.max(node.x, 15), 75);
                      const tooltipY = node.y > 50 ? node.y - 22 : node.y + 12;

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
                            className="px-3 py-2 rounded-md border backdrop-blur-md min-w-[160px] max-w-[220px]"
                            style={{
                              background: 'rgba(8, 12, 22, 0.92)',
                              borderColor: isCurrent
                                ? 'rgba(52, 211, 153, 0.4)'
                                : isDiscovered
                                  ? 'rgb(var(--cyber-cyan-rgb) / 0.3)'
                                  : 'rgba(71, 85, 105, 0.3)',
                              boxShadow: `0 0 15px ${isCurrent ? 'rgba(52,211,153,0.15)' : isDiscovered ? 'rgb(var(--cyber-cyan-rgb) / 0.1)' : 'rgba(0,0,0,0.3)'}`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{node.icon}</span>
                              <span className={`text-xs font-semibold ${isCurrent ? 'text-emerald-400' : isDiscovered ? 'text-cyan-300' : isRumored ? 'text-amber-400/70' : 'text-slate-500'}`}>
                                {isDiscovered && config ? config.name : isRumored && config ? config.name : '???'}
                              </span>
                            </div>

                            {isDiscovered && (
                              <>
                                <p className="text-[10px] text-slate-400 leading-tight mb-1.5">
                                  {SCENE_DESCRIPTIONS[hoveredScene] ?? ''}
                                </p>
                                <div className="flex items-center gap-2">
                                  {isCurrent ? (
                                    <span className="text-[9px] text-emerald-400/80 font-mono flex items-center gap-1">
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
                                {isRumored ? 'Слухи — иди через парк' : 'Не исследовано'}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* Legend & Footer */}
                <div className="px-5 py-3 border-t border-slate-800/50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border-2 border-emerald-400/60 bg-emerald-400/15 inline-block" />
                        <span className="text-slate-400">Текущая</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-cyan-400/35 bg-cyan-400/8 inline-block" />
                        <span className="text-slate-400">Открыто</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-slate-600/30 bg-slate-700/20 inline-block" />
                        <span className="text-slate-400">Неизвестно</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500/50 font-mono tracking-wider">
                        volodka://fast-travel
                      </span>
                      <div className="flex items-center gap-1">
                        <kbd className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-700/30 bg-slate-800/40">F</kbd>
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
