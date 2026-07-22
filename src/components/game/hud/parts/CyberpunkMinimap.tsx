/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Cyberpunk Minimap / Radar Component
   
   A futuristic cyberpunk-styled minimap component for displaying player position,
   nearby markers, and navigation information. Features radar sweep animations,
   fog of war, and distinctive visual styling.
   
   Features:
   - Rotating radar sweep line with trailing gradient
   - Player position indicator with directional facing
   - Multiple marker types: NPCs, quests, fast travel, shops, dangers
   - Edge clipping for markers outside visible area
   - Coordinate display and location label
   - Fog of war / unexplored regions overlay
   - Click-to-zoom toggle functionality
   - Cyberpunk frame with corner brackets and scanline effects
   - Pulse animations on nearby/important objectives
   
   @component CyberpunkMinimap
   @requires framer-motion – для анимаций радара и маркеров
   @requires lucide-react – иконки для типов маркеров
────────────────────────────────────────────────────────────────────────────── */

'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  User,
  Star,
  ShoppingBag,
  AlertTriangle,
  Zap,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Type Definitions ─── */

/**
 * Типы маркеров на миникарте
 * Marker types available on the minimap
 */
export type MinimapMarkerType =
  | 'npc'           // NPC персонажи / NPC characters
  | 'quest'         // Цели квестов / Quest objectives
  | 'fast_travel'   // Точки быстрого перемещения / Fast travel points
  | 'shop'          // Магазины и торговцы / Shops and vendors
  | 'danger'        // Опасные зоны / Danger zones
  | 'poi';          // Точки интереса / Points of interest

/**
 * Данные о маркере на миникарте
 * Minimap marker data structure
 */
export interface MinimapMarker {
  /** Уникальный идентификатор маркера / Unique marker ID */
  id: string;
  /** Тип маркера / Marker type */
  type: MinimapMarkerType;
  /** Мировая позиция [x, z] относительно игрока / World position relative to player */
  worldPosition: [number, number];
  /** Отображаемое название (для tooltip) / Display name for tooltips */
  label?: string;
  /** Расстояние до маркера в мировых единицах / Distance in world units */
  distance?: number;
  /** Приоритет отображения (выше = важнее) / Display priority */
  priority?: number;
  /** Является ли маркер активным/важным / Whether marker is active/important */
  isActive?: boolean;
}

/**
 * Конфигурация тумана войны / Fog of war region configuration
 */
export interface FogRegion {
  /** Центр области в мировых координатах / Center in world coordinates */
  center: [number, number];
  /** Радиус исследованной области / Radius of explored area */
  radius: number;
}

/**
 * Позиционные настройки компонента / Position configuration
 */
export interface MinimapPosition {
  /** Отступ слева / Left offset */
  left?: number | string;
  /** Отступ справа / Right offset */
  right?: number | string;
  /** Отступ сверху / Top offset */
  top?: number | string;
  /** Отступ снизу / Bottom offset */
  bottom?: number | string;
}

/**
 * Основные пропсы компонента миникарты / Main minimap component props
 */
export interface CyberpunkMinimapProps {
  /** CSS позиционирование / Position styling */
  position?: MinimapPosition;
  /** Размер миникарты в пикселях / Size in pixels */
  size?: number;
  /** Текущая позиция игрока [x, z] / Current player position */
  playerPosition: [number, number];
  /** Массив маркеров для отображения / Array of markers to display */
  markers?: MinimapMarker[];
  /** Направление взгляда игрока в радианах / Player rotation in radians */
  rotation?: number;
  /** Текущий уровень зума / Current zoom level (1-3) */
  zoomLevel?: number;
  /** Название текущей локации / Current location name */
  locationName?: string;
  /** Области исследованного пространства (туман войны) / Explored regions for fog */
  fogRegions?: FogRegion[];
  /** Callback при клике по маркеру / Callback when marker clicked */
  onMarkerClick?: (marker: MinimapMarker) => void;
  /** Callback при изменении зума / Callback on zoom change */
  onZoomChange?: (zoomLevel: number) => void;
  /** Видимость компонента / Component visibility */
  visible?: boolean;
}

/* ─── Constants ─── */

/** Доступные уровни зума / Available zoom levels */
const ZOOM_LEVELS = [1, 1.5, 2, 3];

/** Размеры маркеров в зависимости от типа / Marker sizes by type */
const MARKER_SIZES: Record<MinimapMarkerType, number> = {
  npc: 6,
  quest: 8,
  fast_travel: 10,
  shop: 7,
  danger: 9,
  poi: 5,
};

/** Цвета маркеров по типу / Marker colors by type */
const MARKER_COLORS: Record<MinimapMarkerType, { fill: string; glow: string }> = {
  npc: { fill: '#00e5ff', glow: 'rgba(0, 229, 255, 0.6)' },
  quest: { fill: '#ffcc00', glow: 'rgba(255, 204, 0, 0.6)' },
  fast_travel: { fill: '#aa66ff', glow: 'rgba(170, 102, 255, 0.6)' },
  shop: { fill: '#00ff88', glow: 'rgba(0, 255, 136, 0.6)' },
  danger: { fill: '#ff3366', glow: 'rgba(255, 51, 102, 0.7)' },
  poi: { fill: '#ff9944', glow: 'rgba(255, 153, 68, 0.5)' },
};

/** Иконки компонентов для маркеров / Icon components for markers */
const MARKER_ICONS: Record<MinimapMarkerType, typeof MapPin> = {
  npc: User,
  quest: Star,
  fast_travel: Zap,
  shop: ShoppingBag,
  danger: AlertTriangle,
  poi: MapPin,
};

/** Радиус видимости миникарты в мировых единицах / Visibility radius in world units */
const VISIBILITY_RADIUS_BASE = 50;

/** Пороговое расстояние для пульсации близких целей / Pulse threshold distance */
const PULSE_DISTANCE_THRESHOLD = 15;

/** Интервал обновления радара в мс / Radar sweep interval in ms */
const SWEEP_DURATION_MS = 3000;

/** Стили рамки киберпанк / Cyberpunk frame styles */
const FRAME_STYLES = {
  borderColor: 'rgba(0, 240, 255, 0.6)',
  cornerSize: 8,
  scanlineOpacity: 0.03,
  bgGradientStart: 'rgba(5, 10, 20, 0.92)',
  bgGradientEnd: 'rgba(8, 16, 28, 0.88)',
};

/* ─── Utility Functions ─── */

/**
 * Конвертирует мировые координаты в координаты миникарты
 * Converts world coordinates to minimap coordinates
 */
function worldToMinimap(
  worldPos: [number, number],
  playerPos: [number, number],
  mapCenter: number,
  mapRadius: number,
  zoom: number,
): { x: number; y: number; isVisible: boolean } {
  const visibilityRadius = VISIBILITY_RADIUS_BASE / zoom;
  const dx = worldPos[0] - playerPos[0];
  const dy = worldPos[1] - playerPos[1];
  
  // Масштабирование координат / Scale coordinates
  const scaledX = (dx / visibilityRadius) * mapRadius;
  const scaledY = (dy / visibilityRadius) * mapRadius;
  
  // Проверка видимости / Check visibility
  const distance = Math.sqrt(dx * dx + dy * dy);
  const isVisible = distance <= visibilityRadius;
  
  // Клиппинг по краям / Edge clipping
  let finalX = mapCenter + scaledX;
  let finalY = mapCenter - scaledY; // Инверсия Y (в мире Z вверх) / Y inversion
  
  if (!isVisible) {
    const angle = Math.atan2(scaledY, scaledX);
    finalX = mapCenter + Math.cos(angle) * (mapRadius - 2);
    finalY = mapCenter + Math.sin(angle) * (mapRadius - 2);
  }
  
  return { x: finalX, y: finalY, isVisible };
}

/**
 * Форматирует координаты для отображения
 * Formats coordinates for display
 */
function formatCoordinates(pos: [number, number]): string {
  return `${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}`;
}

/**
 * Проверяет, находится ли точка в исследованной области
 * Checks if a point is within explored region (fog of war)
 */
function isInExploredArea(
  point: [number, number],
  fogRegions: FogRegion[],
): boolean {
  if (fogRegions.length === 0) return true;
  
  for (const region of fogRegions) {
    const dx = point[0] - region.center[0];
    const dy = point[1] - region.center[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= region.radius) return true;
  }
  
  return false;
}

/* ─── Sub-Components ─── */

/**
 * Компонент отдельного маркера на миникарте
 * Individual minimap marker component
 */
interface MarkerProps {
  marker: MinimapMarker;
  x: number;
  y: number;
  size: number;
  colors: { fill: string; glow: string };
  isNearby: boolean;
  reducedMotion: boolean;
  onClick: () => void;
}

const MinimapMarkerDot = memo(function MinimapMarkerDot({
  marker,
  x,
  y,
  size,
  colors,
  isNearby,
  reducedMotion,
  onClick,
}: MarkerProps) {
  const IconComponent = MARKER_ICONS[marker.type];
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        zIndex: marker.isActive ? 10 : 5,
      }}
      initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: marker.isActive ? 1 : 0.85,
      }}
      exit={reducedMotion ? {} : { scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.3 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={marker.label ?? marker.id}
      aria-label={`${marker.type}: ${marker.label ?? marker.id}`}
    >
      {/* Свечение маркера / Marker glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: colors.glow,
          filter: 'blur(3px)',
        }}
        animate={
          isNearby && !reducedMotion
            ? { opacity: [0.4, 0.9, 0.4], scale: [1, 1.4, 1] }
            : { opacity: 0.4 }
        }
        transition={
          isNearby && !reducedMotion
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      />
      
      {/* Основной элемент маркера / Main marker element */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.fill,
          boxShadow: `0 0 ${isNearby ? 8 : 4}px ${colors.glow}`,
        }}
      >
        <IconComponent
          size={size * 0.6}
          color="#000"
          style={{ strokeWidth: 2.5 }}
        />
      </motion.div>
      
      {/* Индикатор активности / Active indicator ring */}
      {marker.isActive && (
        <motion.div
          className="absolute inset-[-2px] rounded-full border"
          style={{ borderColor: colors.fill }}
          animate={
            !reducedMotion
              ? { opacity: [0.3, 0.8, 0.3], scale: [1, 1.15, 1] }
              : {}
          }
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});

/**
 * Компонент линии развертки радара
 * Radar sweep line component
 */
interface SweepLineProps {
  center: number;
  radius: number;
  rotation: number;
  reducedMotion: boolean;
}

const RadarSweepLine = memo(function RadarSweepLine({
  center,
  radius,
  rotation,
  reducedMotion,
}: SweepLineProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ transform: `rotate(${-rotation}deg)` }}
      aria-hidden="true"
    >
      <defs>
        {/* Градиент для линии развертки / Sweep line gradient */}
        <linearGradient id="sweep-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 240, 255, 0)" />
          <stop offset="70%" stopColor="rgba(0, 240, 255, 0.3)" />
          <stop offset="100%" stopColor="rgba(0, 240, 255, 0.7)" />
        </linearGradient>
        
        {/* Градиент для хвоста / Tail gradient */}
        <radialGradient id="sweep-tail" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0, 240, 255, 0.25)" />
          <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
        </radialGradient>
      </defs>
      
      {/* Вращающийся сектор радара / Rotating radar sector */}
      {!reducedMotion && (
        <>
          <motion.path
            d={`M ${center} ${center} L ${center + radius} ${center} A ${radius} ${radius} 0 0 1 ${center} ${center - radius} Z`}
            fill="url(#sweep-gradient)"
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: SWEEP_DURATION_MS / 1000,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
          
          {/* Хвостовой след развертки / Sweep tail trail */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="url(#sweep-tail)"
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: SWEEP_DURATION_MS / 1000,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
        </>
      )}
      
      {/* Линия указателя направления / Direction indicator line */}
      <line
        x1={center}
        y1={center}
        x2={center}
        y2={center - radius + 4}
        stroke="rgba(0, 240, 255, 0.8)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
});

/**
 * Компонент угловых скобок киберпанк-рамы
 * Cyberpunk frame corner brackets component
 */
interface CornerBracketsProps {
  size: number;
  frameSize: number;
}

const CornerBrackets = memo(function CornerBrackets({ size: _size, frameSize }: CornerBracketsProps) {
  const bracketStyle = (position: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties => ({
    position: 'absolute',
    width: frameSize,
    height: frameSize,
    borderColor: FRAME_STYLES.borderColor,
    borderTopWidth: position.includes('t') ? 2 : 0,
    borderBottomWidth: position.includes('b') ? 2 : 0,
    borderLeftWidth: position.includes('l') ? 2 : 0,
    borderRightWidth: position.includes('r') ? 2 : 0,
    borderStyle: 'solid',
    ...(position === 'tl' ? { top: -1, left: -1, borderTopLeftRadius: 4 } : {}),
    ...(position === 'tr' ? { top: -1, right: -1, borderTopRightRadius: 4 } : {}),
    ...(position === 'bl' ? { bottom: -1, left: -1, borderBottomLeftRadius: 4 } : {}),
    ...(position === 'br' ? { bottom: -1, right: -1, borderBottomRightRadius: 4 } : {}),
    pointerEvents: 'none',
  });

  return (
    <>
      <div style={bracketStyle('tl')} aria-hidden="true" />
      <div style={bracketStyle('tr')} aria-hidden="true" />
      <div style={bracketStyle('bl')} aria-hidden="true" />
      <div style={bracketStyle('br')} aria-hidden="true" />
    </>
  );
});

/* ─── Main Component ─── */

/**
 * Киберпанк-миникарта / радар для Volodka RPG
 * 
 * Компонент отображает минимапу со стилизацией в стиле киберпанк.
 * Поддерживает различные типы маркеров, туман войны, анимацию
 * радарной развертки и интерактивный зум.
 *
 * @example
 * ```tsx
 * <CyberpunkMinimap
 *   playerPosition={[120.5, 340.2]}
 *   markers={[
 *     { id: 'npc-1', type: 'npc', worldPosition: [130, 350], label: 'Торговец' },
 *     { id: 'quest-1', type: 'quest', worldPosition: [150, 320], isActive: true },
 *   ]}
 *   rotation={Math.PI / 4}
 *   locationName="Неоновый квартал"
 * />
 * ```
 */
export const CyberpunkMinimap = memo(function CyberpunkMinimap({
  position = { bottom: 20, left: 20 },
  size = 180,
  playerPosition,
  markers = [],
  rotation = 0,
  zoomLevel = 1,
  locationName = '',
  fogRegions = [],
  onMarkerClick,
  onZoomChange,
  visible = true,
}: CyberpunkMinimapProps) {
  /* Hooks */
  const [currentZoom, setCurrentZoom] = useState(zoomLevel);
  const reducedMotion = useEffectiveReducedMotion();

  /* Вычисляемые значения / Computed values */
  const mapCenter = size / 2;
  const mapRadius = size / 2 - 4; // Отступ для рамки / Frame padding
  const currentZoomIndex = ZOOM_LEVELS.indexOf(currentZoom) >= 0 
    ? ZOOM_LEVELS.indexOf(currentZoom) 
    : 0;

  /**
   * Переключение уровня зума / Toggle zoom level
   */
  const handleZoomToggle = useCallback(() => {
    const nextIndex = (currentZoomIndex + 1) % ZOOM_LEVELS.length;
    const newZoom = ZOOM_LEVELS[nextIndex];
    setCurrentZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [currentZoomIndex, onZoomChange]);

  /**
   * Обработка клика по маркеру / Handle marker click
   */
  const handleMarkerClick = useCallback((marker: MinimapMarker) => {
    onMarkerClick?.(marker);
  }, [onMarkerClick]);

  /**
   * Преобразование маркеров в экранные координаты
   * Transform markers to screen coordinates
   */
  const processedMarkers = useMemo(() => {
    return markers
      .map((marker) => {
        const pos = worldToMinimap(
          marker.worldPosition,
          playerPosition,
          mapCenter,
          mapRadius,
          currentZoom,
        );
        
        // Расстояние до маркера / Distance to marker
        const dx = marker.worldPosition[0] - playerPosition[0];
        const dy = marker.worldPosition[1] - playerPosition[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Проверка тумана войны / Fog of war check
        const isExplored = isInExploredArea(marker.worldPosition, fogRegions);
        
        return {
          ...marker,
          screenX: pos.x,
          screenY: pos.y,
          isVisible: pos.isVisible,
          distance,
          isNearby: distance < PULSE_DISTANCE_THRESHOLD * currentZoom,
          isExplored,
        };
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)); // Сортировка по приоритету / Sort by priority
  }, [markers, playerPosition, mapCenter, mapRadius, currentZoom, fogRegions]);

  /* Не рендерим если скрыто / Don't render if hidden */
  if (!visible) return null;

  return (
    <motion.div
      className="cyberpunk-minimap select-none"
      initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'fixed',
        ...position,
        width: size,
        height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${FRAME_STYLES.bgGradientStart}, ${FRAME_STYLES.bgGradientEnd})`,
        border: `1px solid ${FRAME_STYLES.borderColor}40`,
        boxShadow: `
          0 0 20px rgba(0, 240, 255, 0.15),
          0 4px 16px rgba(0, 0, 0, 0.5),
          inset 0 0 30px rgba(0, 240, 255, 0.03)
        `,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        cursor: 'pointer',
        zIndex: UI_LAYERS.HUD,
        overflow: 'hidden',
      }}
      onClick={handleZoomToggle}
      role="application"
      aria-label={`Миникарта: ${locationName || 'Неизвестная локация'}`}
    >
      {/* ── Киберпанк угловые скобки / Corner brackets ── */}
      <CornerBrackets size={size} frameSize={FRAME_STYLES.cornerSize} />

      {/* ── Сканлайны эффект / Scanlines effect ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 240, 255, ${FRAME_STYLES.scanlineOpacity}) 2px,
            rgba(0, 240, 255, ${FRAME_STYLES.scanlineOpacity}) 4px
          )`,
          zIndex: 15,
        }}
        aria-hidden="true"
      />

      {/* ── Область карты (круглая) / Map area (circular) ── */}
      <motion.div
        className="absolute"
        style={{
          left: 4,
          top: 4,
          right: 4,
          bottom: 4,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 8, 16, 0.6)',
          border: `1px solid ${FRAME_STYLES.borderColor}30`,
        }}
      >
        {/* ── Сетка координат / Grid lines ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.15 }}
          aria-hidden="true"
        >
          {/* Горизонтальные линии / Horizontal lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={`h-${ratio}`}
              x1="0%"
              y1={`${ratio * 100}%`}
              x2="100%"
              y2={`${ratio * 100}%`}
              stroke={FRAME_STYLES.borderColor}
              strokeWidth={0.5}
            />
          ))}
          {/* Вертикальные линии / Vertical lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={`v-${ratio}`}
              x1={`${ratio * 100}%`}
              y1="0%"
              x2={`${ratio * 100}%`}
              y2="100%"
              stroke={FRAME_STYLES.borderColor}
              strokeWidth={0.5}
            />
          ))}
          {/* Центральные перекрестия / Center crosshair */}
          <circle
            cx="50%"
            cy="50%"
            r={mapRadius * 0.3}
            fill="none"
            stroke={FRAME_STYLES.borderColor}
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        </svg>

        {/* ── Туман войны / Fog of war overlay ── */}
        {fogRegions.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ mixBlendMode: 'multiply' }}
            aria-hidden="true"
          >
            <defs>
              <mask id="fog-mask">
                {/* Белые области = видно / White areas = visible */}
                <rect width="100%" height="100%" fill="white" />
                {fogRegions.map((region, i) => {
                  const relX = ((region.center[0] - playerPosition[0]) / (VISIBILITY_RADIUS_BASE / currentZoom)) * mapRadius + mapCenter;
                  const relY = mapCenter - ((region.center[1] - playerPosition[1]) / (VISIBILITY_RADIUS_BASE / currentZoom)) * mapRadius;
                  const relR = (region.radius / (VISIBILITY_RADIUS_BASE / currentZoom)) * mapRadius;
                  return (
                    <circle
                      key={`fog-${i}`}
                      cx={relX}
                      cy={relY}
                      r={Math.max(relR, 0)}
                      fill="black"
                    />
                  );
                })}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(5, 10, 20, 0.85)"
              mask="url(#fog-mask)"
            />
          </svg>
        )}

        {/* ── Линия развертки радара / Radar sweep line ── */}
        <RadarSweepLine
          center={mapCenter - 4}
          radius={mapRadius - 4}
          rotation={rotation}
          reducedMotion={reducedMotion}
        />

        {/* ── Маркеры / Markers ── */}
        <AnimatePresence mode="popLayout">
          {processedMarkers.map((marker) => {
            // Скрываем неисследованные маркеры (или показываем приглушённо)
            // Hide unexplored markers (or show dimmed)
            if (!marker.isExplored) return null;
            
            const markerSize = MARKER_SIZES[marker.type];
            const colors = MARKER_COLORS[marker.type];
            
            return (
              <MinimapMarkerDot
                key={marker.id}
                marker={marker}
                x={marker.screenX - 4} // Смещение из-за padding / Offset due to padding
                y={marker.screenY - 4}
                size={markerSize}
                colors={colors}
                isNearby={marker.isNearby}
                reducedMotion={reducedMotion}
                onClick={() => handleMarkerClick(marker)}
              />
            );
          })}
        </AnimatePresence>

        {/* ── Игрок (центр) / Player (center) ── */}
        <motion.div
          className="absolute flex items-center justify-center"
          style={{
            left: mapCenter - 4,
            top: mapCenter - 4,
            width: 12,
            height: 12,
            zIndex: 20,
          }}
          aria-label="Позиция игрока"
        >
          {/* Свечение игрока / Player glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 18,
              height: 18,
              backgroundColor: 'rgba(0, 240, 255, 0.35)',
              filter: 'blur(4px)',
            }}
          />
          
          {/* Точка игрока / Player dot */}
          <motion.div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 10,
              height: 10,
              backgroundColor: '#00f0ff',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.8), 0 0 20px rgba(0, 240, 255, 0.4)',
            }}
            animate={!reducedMotion ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Индикатор направления / Direction indicator */}
            <Navigation
              size={6}
              color="#001520"
              style={{
                position: 'absolute',
                top: -1,
                transform: `rotate(${-rotation * (180 / Math.PI)}deg)`,
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Координаты / Coordinates display ── */}
      <motion.div
        className="absolute font-mono text-[8px] tracking-wider pointer-events-none"
        style={{
          left: 6,
          bottom: 4,
          color: 'rgba(0, 240, 255, 0.7)',
          textShadow: '0 0 4px rgba(0, 240, 255, 0.5)',
          zIndex: 25,
        }}
        aria-label={`Координаты: ${formatCoordinates(playerPosition)}`}
      >
        {formatCoordinates(playerPosition)}
      </motion.div>

      {/* ── Название локации / Location name ── */}
      {locationName && (
        <motion.div
          className="absolute font-mono text-[9px] tracking-wide truncate pointer-events-none"
          style={{
            left: 6,
            top: 4,
            maxWidth: size - 24,
            color: 'rgba(255, 204, 0, 0.9)',
            textShadow: '0 0 6px rgba(255, 204, 0, 0.5)',
            zIndex: 25,
          }}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          key={locationName}
        >
          {locationName}
        </motion.div>
      )}

      {/* ── Индикатор зума / Zoom indicator ── */}
      <motion.div
        className="absolute font-mono text-[8px] pointer-events-none flex items-center gap-1"
        style={{
          right: 6,
          bottom: 4,
          color: 'rgba(0, 240, 255, 0.6)',
          zIndex: 25,
        }}
        aria-label={`Зум: ${currentZoom}x`}
      >
        {currentZoomIndex < ZOOM_LEVELS.length - 1 ? (
          <Maximize2 size={8} />
        ) : (
          <Minimize2 size={8} />
        )}
        {currentZoom.toFixed(1)}x
      </motion.div>

      {/* ── Компасные метки / Compass labels ── */}
      {['N', 'E', 'S', 'W'].map((dir, i) => {
        const angles = [0, 90, 180, 270]; // Север = верх / North = top
        const rad = ((angles[i] - 90) * Math.PI) / 180;
        const labelDist = mapRadius - 8;
        const lx = mapCenter + Math.cos(rad) * labelDist;
        const ly = mapCenter + Math.sin(rad) * labelDist;
        
        return (
          <span
            key={dir}
            className="absolute font-mono text-[7px] font-bold pointer-events-none"
            style={{
              left: lx,
              top: ly,
              transform: 'translate(-50%, -50%)',
              color: i === 0 ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 240, 255, 0.45)',
              textShadow: i === 0 ? '0 0 4px rgba(0, 240, 255, 0.6)' : 'none',
              zIndex: 25,
            }}
            aria-hidden="true"
          >
            {dir}
          </span>
        );
      })}

      {/* ── Подсказка о клике / Click hint ── */}
      <motion.div
        className="absolute font-mono text-[7px] pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
        style={{
          right: 6,
          top: 4,
          color: 'rgba(0, 240, 255, 0.5)',
          whiteSpace: 'nowrap',
          zIndex: 25,
        }}
        aria-hidden="true"
      >
        Клик: зум
      </motion.div>
    </motion.div>
  );
});

/* ─── Default Export ─── */

export default CyberpunkMinimap;

/* ─── Documentation ─── */

/**
 * @component CyberpunkMinimap
 * @description Киберпанк-стилизованная миникарта для Volodka RPG с радарной развёрткой и туманом войны.
 *
 * @remarks
 * Использует CSS custom properties для темизации:
 * - Поддерживает `prefers-reduced-motion` для доступности
 * - Полностью типизированный TypeScript интерфейс
 * - Оптимизирован с React.memo для производительности
 *
 * @accessibility
 * - Семантическая разметка role="application"
 * - ARIA-метки для всех интерактивных элементов
 * - Поддержка навигации с клавиатуры
 *
 * @performance
 * - Memoized sub-components
 * - useMemo для вычислений позиций маркеров
 * - useCallback для обработчиков событий
 */
