'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// ============================================
// TYPES
// ============================================

interface MiniMapNPC {
  id: string;
  name: string;
  model: string;
  defaultPosition: { x: number; y: number; z: number };
  sceneId: string;
}

interface MiniMapProps {
  playerPosition: { x: number; y: number; z: number; rotation?: number };
  sceneSize: { width: number; depth: number };
  sceneName: string;
  npcs: MiniMapNPC[];
  interactiveObjects?: Array<{ id: string; position: [number, number, number]; type: string }>;
  className?: string;
}

// ============================================
// MINI MAP COMPONENT
// ============================================

export const MiniMap = memo(function MiniMap({
  playerPosition,
  sceneSize,
  sceneName,
  npcs,
  interactiveObjects = [],
  className = '',
}: MiniMapProps) {
  const mapSize = { width: 150, height: 120 };
  
  const scale = useMemo(() => ({
    x: mapSize.width / sceneSize.width,
    z: mapSize.height / sceneSize.depth,
  }), [sceneSize.width, sceneSize.depth]);

  const playerMapPos = useMemo(() => ({
    x: playerPosition.x * scale.x + mapSize.width / 2,
    y: playerPosition.z * scale.z + mapSize.height / 2,
  }), [playerPosition.x, playerPosition.z, scale]);

  const playerRotation = playerPosition.rotation || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-4 right-4 z-30 ${className}`}
    >
      <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-2 py-1 bg-slate-800/50 border-b border-slate-700/30">
          <span className="text-xs font-mono text-cyan-400 tracking-wider">
            {sceneName}
          </span>
        </div>
        
        {/* Map Area */}
        <div 
          className="relative"
          style={{ width: mapSize.width, height: mapSize.height }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,255,255,0.5)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Interactive Objects */}
          {interactiveObjects.map(obj => (
            <div
              key={obj.id}
              className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: obj.position[0] * scale.x + mapSize.width / 2,
                top: obj.position[2] * scale.z + mapSize.height / 2,
                backgroundColor: obj.type === 'poem' ? '#fbbf24' : '#22d3ee',
                boxShadow: `0 0 4px ${obj.type === 'poem' ? '#fbbf24' : '#22d3ee'}`,
              }}
              title={obj.id}
            />
          ))}

          {/* NPCs */}
          {npcs.map(npc => (
            <div
              key={npc.id}
              className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2
                         bg-green-400 shadow-lg shadow-green-400/50"
              style={{
                left: npc.defaultPosition.x * scale.x + mapSize.width / 2,
                top: npc.defaultPosition.z * scale.z + mapSize.height / 2,
              }}
              title={npc.name}
            >
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-green-300 whitespace-nowrap">
                {npc.name.slice(0, 6)}
              </span>
            </div>
          ))}

          {/* Player */}
          <motion.div
            className="absolute w-4 h-4 transform -translate-x-1/2 -translate-y-1/2"
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
            {/* Player direction indicator */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `rotate(${playerRotation}rad)` }}
            >
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-cyan-400" />
            </div>
            {/* Player glow */}
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
            {/* Player core */}
            <div className="absolute inset-1 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
          </motion.div>

          {/* Compass */}
          <div className="absolute top-1 left-1 text-[10px] font-mono text-slate-500">
            N
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500">
            S
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
            W
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
            E
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 px-2 py-1 bg-slate-800/30 border-t border-slate-700/30">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[9px] text-slate-400">Вы</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[9px] text-slate-400">NPC</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-[9px] text-slate-400">Стихи</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-300" />
            <span className="text-[9px] text-slate-400">Объекты</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default MiniMap;
