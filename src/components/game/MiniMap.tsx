'use client';

import { memo, useMemo, useState, useCallback, useId, useEffect } from 'react';
import { getExplorationLivePlayerPositionOrNull } from '@/lib/explorationLivePlayerBridge';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// ============================================
// TYPES
// ============================================

export interface MiniMapNPC {
  id: string;
  name: string;
  model: string;
  defaultPosition: { x: number; y: number; z: number };
  sceneId: string;
  /** Текущая позиция в мире; если нет — используется defaultPosition */
  position?: { x: number; y: number; z: number };
}

export interface MiniMapQuestMarker {
  id: string;
  position: { x: number; z: number };
  type: 'target' | 'area';
}

interface MiniMapProps {
  /** Если не передать — берётся из стора (чтобы `GameOrchestrator` не перерисовывался на каждый шаг игрока). */
  playerPosition?: { x: number; y: number; z: number; rotation?: number };
  sceneSize: { width: number; depth: number };
  sceneName: string;
  npcs: MiniMapNPC[];
  interactiveObjects?: Array<{ id: string; position: [number, number, number]; type: string }>;
  questMarkers?: MiniMapQuestMarker[];
  className?: string;
}

const ZOOM_MIN = 0.65;
const ZOOM_MAX = 1.85;
const ZOOM_STEP = 0.15;

const INTERACTIVE_OBJECT_LABEL: Record<string, string> = {
  book: 'Книга',
  chair: 'Стул',
  notebook: 'Блокнот',
  crate: 'Ящик',
  lamp: 'Свет',
  generic: 'Объект',
};

const COLORS = {
  bg: 'rgba(10, 4, 22, 0.92)',
  border: 'rgba(168, 85, 247, 0.35)',
  headerBg: 'rgba(34, 12, 48, 0.75)',
  grid: 'rgba(0, 255, 255, 0.22)',
  playerCore: '#22d3ee',
  playerGlow: 'rgba(34, 211, 238, 0.45)',
  npcCore: '#e879f9',
  npcGlow: 'rgba(232, 121, 249, 0.55)',
  poem: '#fbbf24',
  poemGlow: 'rgba(251, 191, 36, 0.65)',
  object: '#22d3ee',
  objectGlow: 'rgba(34, 211, 238, 0.55)',
  labelMuted: 'rgba(148, 163, 184, 0.85)',
  compass: 'rgba(34, 211, 238, 0.45)',
} as const;

function npcWorldPos(npc: MiniMapNPC) {
  return npc.position ?? npc.defaultPosition;
}

// ============================================
// MINI MAP COMPONENT
// ============================================

export const MiniMap = memo(function MiniMap({
  playerPosition: playerPositionProp,
  sceneSize,
  sceneName,
  npcs,
  interactiveObjects = [],
  questMarkers = [],
  className = '',
}: MiniMapProps) {
  const gameMode = useGameStore((s) => s.gameMode);
  const playerPositionFromStore = useGameStore((s) => s.exploration.playerPosition);
  const [, setLiveTick] = useState(0);
  useEffect(() => {
    if (gameMode !== 'exploration' || playerPositionProp != null) return;
    const id = window.setInterval(() => {
      setLiveTick((n) => n + 1);
    }, 110);
    return () => window.clearInterval(id);
  }, [gameMode, playerPositionProp]);

  const live = gameMode === 'exploration' && playerPositionProp == null ? getExplorationLivePlayerPositionOrNull() : null;
  const playerPosition = playerPositionProp ?? live ?? playerPositionFromStore;

  const gridPatternId = useId().replace(/:/g, '');
  const mapSize = { width: 150, height: 120 };
  const [zoom, setZoom] = useState(1);

  const scale = useMemo(
    () => ({
      x: mapSize.width / sceneSize.width,
      z: mapSize.height / sceneSize.depth,
    }),
    [sceneSize.width, sceneSize.depth],
  );

  const playerMapPos = useMemo(
    () => ({
      x: playerPosition.x * scale.x + mapSize.width / 2,
      y: playerPosition.z * scale.z + mapSize.height / 2,
    }),
    [playerPosition.x, playerPosition.z, scale.x, scale.z],
  );

  const playerRotation = playerPosition.rotation || 0;

  const bumpZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
  }, []);

  const onWheelMap = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bumpZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
  }, [bumpZoom]);

  return (
    <motion.div
      data-exploration-ui
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed z-30 select-none touch-manipulation bottom-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom)))] right-[max(1rem,env(safe-area-inset-right))] ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-lg shadow-xl backdrop-blur-sm"
        style={{
          background: COLORS.bg,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: COLORS.border,
          boxShadow: '0 0 24px rgba(168, 85, 247, 0.12), inset 0 0 40px rgba(0, 255, 255, 0.04)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 px-2 py-1"
          style={{ background: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}` }}
        >
          <span className="bg-gradient-to-r from-cyan-200 via-cyan-300 to-emerald-400/90 bg-clip-text text-xs font-mono tracking-wider text-transparent">
            {sceneName}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Уменьшить масштаб карты"
              className="h-5 min-w-[1.25rem] rounded border border-fuchsia-500/30 bg-black/40 px-1 font-mono text-[10px] text-fuchsia-200 hover:border-cyan-400/50 hover:text-cyan-200"
              onClick={() => bumpZoom(-ZOOM_STEP)}
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-[9px] text-slate-400">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="Увеличить масштаб карты"
              className="h-5 min-w-[1.25rem] rounded border border-fuchsia-500/30 bg-black/40 px-1 font-mono text-[10px] text-fuchsia-200 hover:border-cyan-400/50 hover:text-cyan-200"
              onClick={() => bumpZoom(ZOOM_STEP)}
            >
              +
            </button>
          </div>
        </div>

        {/* Map Area */}
        <div
          className="relative overflow-hidden"
          style={{ width: mapSize.width, height: mapSize.height }}
          onWheel={onWheelMap}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: `${playerMapPos.x}px ${playerMapPos.y}px`,
            }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]">
              <defs>
                <pattern id={gridPatternId} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke={COLORS.grid} strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
            </svg>

            {interactiveObjects.map((obj) => (
              <div
                key={obj.id}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 transform rounded-full"
                style={{
                  left: obj.position[0] * scale.x + mapSize.width / 2,
                  top: obj.position[2] * scale.z + mapSize.height / 2,
                  backgroundColor: obj.type === 'poem' ? COLORS.poem : COLORS.object,
                  boxShadow: `0 0 5px ${obj.type === 'poem' ? COLORS.poemGlow : COLORS.objectGlow}`,
                }}
                title={`${INTERACTIVE_OBJECT_LABEL[obj.type] ?? 'Объект'} (${obj.id})`}
              />
            ))}

            {questMarkers.map((m) => {
              const left = m.position.x * scale.x + mapSize.width / 2;
              const top = m.position.z * scale.z + mapSize.height / 2;
              if (m.type === 'area') {
                return (
                  <div
                    key={m.id}
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-yellow-400/70 bg-yellow-400/25"
                    style={{ left, top, boxShadow: '0 0 10px rgba(250, 204, 21, 0.45)' }}
                    title="Зона квеста"
                  />
                );
              }
              return (
                <div
                  key={m.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transform font-mono text-[12px] text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.9)]"
                  style={{ left, top }}
                  title="Цель квеста"
                >
                  ✕
                </div>
              );
            })}

            {npcs.map((npc) => {
              const p = npcWorldPos(npc);
              return (
                <div
                  key={npc.id}
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform rounded-full"
                  style={{
                    left: p.x * scale.x + mapSize.width / 2,
                    top: p.z * scale.z + mapSize.height / 2,
                    backgroundColor: COLORS.npcCore,
                    boxShadow: `0 0 8px ${COLORS.npcGlow}`,
                  }}
                  title={npc.name}
                >
                  <span
                    className="absolute -bottom-3 left-1/2 max-w-[52px] -translate-x-1/2 truncate text-[8px] whitespace-nowrap"
                    style={{ color: COLORS.npcGlow }}
                  >
                    {npc.name.slice(0, 6)}
                  </span>
                </div>
              );
            })}

            <motion.div
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform"
              style={{
                left: playerMapPos.x,
                top: playerMapPos.y,
              }}
              animate={{
                left: playerMapPos.x,
                top: playerMapPos.y,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${playerRotation}rad)` }}
              >
                <div
                  className="h-0 w-0 border-b-[10px] border-l-[6px] border-r-[6px] border-b-cyan-400 border-l-transparent border-r-transparent"
                  style={{ filter: `drop-shadow(0 0 4px ${COLORS.playerGlow})` }}
                />
              </div>
              <div
                className="absolute inset-0 animate-ping rounded-full"
                style={{ background: COLORS.playerGlow }}
              />
              <div
                className="absolute inset-1 rounded-full shadow-lg"
                style={{
                  background: COLORS.playerCore,
                  boxShadow: `0 0 10px ${COLORS.playerGlow}`,
                }}
              />
            </motion.div>

            <div className="pointer-events-none absolute left-1 top-1 font-mono text-[10px]" style={{ color: COLORS.compass }}>
              N
            </div>
            <div
              className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[10px]"
              style={{ color: COLORS.compass }}
            >
              S
            </div>
            <div
              className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[10px]"
              style={{ color: COLORS.compass }}
            >
              W
            </div>
            <div
              className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[10px]"
              style={{ color: COLORS.compass }}
            >
              E
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-2 border-t px-2 py-1"
          style={{
            background: 'rgba(15, 6, 28, 0.55)',
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: COLORS.playerCore }} />
            <span className="text-[9px]" style={{ color: COLORS.labelMuted }}>
              Вы
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: COLORS.npcCore }} />
            <span className="text-[9px]" style={{ color: COLORS.labelMuted }}>
              NPC
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: COLORS.poem }} />
            <span className="text-[9px]" style={{ color: COLORS.labelMuted }}>
              Стихи
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: COLORS.object }} />
            <span className="text-[9px]" style={{ color: COLORS.labelMuted }}>
              Объекты
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default MiniMap;
