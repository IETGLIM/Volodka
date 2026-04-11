"use client";

import React, { useState, useCallback, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { InventoryItem, ItemRarity } from '@/data/types';

// ============================================
// TYPES
// ============================================

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DragItem {
  id: string;
  index: number;
  sourceSlot: 'inventory' | 'equipment';
}

interface DropResult {
  targetSlot: 'inventory' | 'equipment';
  targetIndex: number;
}

// ============================================
// CONSTANTS
// ============================================

const RARITY_COLORS: Record<ItemRarity, { bg: string; border: string; glow: string; text: string }> = {
  common: { bg: 'rgba(128, 128, 128, 0.2)', border: '#808080', glow: 'rgba(128, 128, 128, 0.3)', text: '#a0a0a0' },
  uncommon: { bg: 'rgba(30, 255, 0, 0.15)', border: '#1eff00', glow: 'rgba(30, 255, 0, 0.4)', text: '#1eff00' },
  rare: { bg: 'rgba(0, 112, 255, 0.15)', border: '#0070ff', glow: 'rgba(0, 112, 255, 0.4)', text: '#0070ff' },
  epic: { bg: 'rgba(163, 53, 238, 0.15)', border: '#a335ee', glow: 'rgba(163, 53, 238, 0.4)', text: '#a335ee' },
  legendary: { bg: 'rgba(255, 128, 0, 0.15)', border: '#ff8000', glow: 'rgba(255, 128, 0, 0.4)', text: '#ff8000' },
};

const SLOT_SIZE = 64;
const INVENTORY_COLS = 6;
const INVENTORY_ROWS = 4;

// ============================================
// ITEM TOOLTIP
// ============================================

interface ItemTooltipProps {
  item: InventoryItem;
  position: { x: number; y: number };
}

const ItemTooltip = memo(function ItemTooltip({ item, position }: ItemTooltipProps) {
  const rarity = RARITY_COLORS[item.item.rarity];

  const statsText = useMemo(() => {
    const stats: string[] = [];
    if (item.item.type === 'artifact') {
      stats.push(`Тип: Артефакт`);
    }
    return stats;
  }, [item.item.type]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-[100] pointer-events-none"
      style={{
        left: Math.min(position.x + 16, window.innerWidth - 260),
        top: Math.min(position.y + 16, window.innerHeight - 200),
      }}
    >
      <div
        className="p-3 rounded-lg min-w-[200px] max-w-[260px]"
        style={{
          background: 'rgba(15, 15, 20, 0.95)',
          border: `2px solid ${rarity.border}`,
          boxShadow: `0 0 20px ${rarity.glow}`,
        }}
      >
        {/* Item name */}
        <h3
          className="font-bold text-base mb-1"
          style={{ color: rarity.text }}
        >
          {item.item.icon} {item.item.name}
        </h3>

        {/* Rarity */}
        <p className="text-xs mb-2 capitalize" style={{ color: rarity.text }}>
          {item.item.rarity === 'legendary' ? 'Легендарный' :
           item.item.rarity === 'epic' ? 'Эпический' :
           item.item.rarity === 'rare' ? 'Редкий' :
           item.item.rarity === 'uncommon' ? 'Необычный' : 'Обычный'}
        </p>

        {/* Description */}
        {item.item.description && (
          <p className="text-sm text-slate-300 mb-2 italic">
            "{item.item.description}"
          </p>
        )}

        {/* Stats */}
        {statsText.length > 0 && (
          <div className="text-xs text-slate-400 space-y-1 border-t border-slate-700 pt-2 mt-2">
            {statsText.map((stat, i) => (
              <p key={i}>{stat}</p>
            ))}
          </div>
        )}

        {/* Quantity */}
        {item.quantity > 1 && (
          <p className="text-xs text-slate-500 mt-2">
            Количество: {item.quantity}
          </p>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// INVENTORY SLOT
// ============================================

interface InventorySlotProps {
  item: InventoryItem | null;
  index: number;
  onDragStart: (item: InventoryItem, index: number) => void;
  onDragEnd: () => void;
  onDrop: (targetIndex: number) => void;
  onHover: (item: InventoryItem | null, position: { x: number; y: number }) => void;
  isDragOver: boolean;
}

const InventorySlot = memo(function InventorySlot({
  item,
  index,
  onDragStart,
  onDragEnd,
  onDrop,
  onHover,
  isDragOver,
}: InventorySlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!item) return;

    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.item.id, index }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart(item, index);
  }, [item, index, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop(index);
  }, [index, onDrop]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (item) {
      onHover(item, { x: e.clientX, y: e.clientY });
    }
  }, [item, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null, { x: 0, y: 0 });
  }, [onHover]);

  const rarity = item ? RARITY_COLORS[item.item.rarity] : null;

  return (
    <div
      ref={slotRef}
      className={`
        relative rounded-lg transition-all duration-150 cursor-pointer
        ${isDragOver ? 'ring-2 ring-purple-500 ring-opacity-70 scale-105' : ''}
        ${isDragging ? 'opacity-30' : ''}
      `}
      style={{
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        background: item ? rarity?.bg : 'rgba(30, 30, 40, 0.6)',
        border: item ? `2px solid ${rarity?.border}` : '2px solid rgba(100, 100, 120, 0.3)',
        boxShadow: item ? `0 0 10px ${rarity?.glow}` : 'none',
      }}
      draggable={!!item}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item && (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-2xl select-none">{item.item.icon}</span>
          {item.quantity > 1 && (
            <span
              className="absolute bottom-0.5 right-1 text-xs font-bold text-white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {item.quantity}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================
// MAIN INVENTORY COMPONENT
// ============================================

export const Inventory = memo(function Inventory({ isOpen, onClose }: InventoryProps) {
  const { inventory, removeItem } = useGameStore();
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Create slots array (fill empty slots with null)
  const slots = useMemo(() => {
    const totalSlots = INVENTORY_COLS * INVENTORY_ROWS;
    const result: (InventoryItem | null)[] = [...inventory];
    while (result.length < totalSlots) {
      result.push(null);
    }
    return result;
  }, [inventory]);

  const handleDragStart = useCallback((item: InventoryItem, _index: number) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedItem && targetIndex !== dragOverIndex) {
      // Here you would implement the actual inventory reordering
      // For now, just clear the drag state
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [draggedItem, dragOverIndex]);

  const handleHover = useCallback((item: InventoryItem | null, position: { x: number; y: number }) => {
    setHoveredItem(item);
    setTooltipPosition(position);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="p-6 rounded-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 45, 0.95))',
          border: '1px solid rgba(100, 100, 140, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎒 Инвентарь
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Inventory Grid */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${INVENTORY_COLS}, ${SLOT_SIZE}px)`,
          }}
        >
          {slots.map((item, index) => (
            <InventorySlot
              key={item?.item.id || `empty-${index}`}
              item={item}
              index={index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onHover={handleHover}
              isDragOver={dragOverIndex === index}
            />
          ))}
        </div>

        {/* Item count */}
        <div className="mt-4 text-sm text-slate-400 text-center">
          {inventory.length} / {INVENTORY_COLS * INVENTORY_ROWS} предметов
        </div>

        {/* Instructions */}
        <div className="mt-2 text-xs text-slate-500 text-center">
          Перетащите предметы для изменения порядка
        </div>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredItem && (
          <ItemTooltip item={hoveredItem} position={tooltipPosition} />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================
// INVENTORY BUTTON
// ============================================

export const InventoryButton = memo(function InventoryButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 transition-colors"
      title="Инвентарь (I)"
    >
      <span className="text-xl">🎒</span>
    </motion.button>
  );
});

export default Inventory;
