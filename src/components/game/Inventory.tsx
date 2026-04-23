"use client";

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { InventoryItem, ItemRarity } from '@/data/types';

// ============================================
// TYPES
// ============================================

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// КИБЕРПАНК СТИЛИ РЕДКОСТИ
// ============================================

const RARITY_STYLES: Record<ItemRarity, { 
  bg: string; 
  border: string; 
  glow: string; 
  text: string;
  name: string;
}> = {
  common: { 
    bg: 'rgba(100, 116, 139, 0.2)', 
    border: '#64748b', 
    glow: 'rgba(100, 116, 139, 0.3)', 
    text: '#94a3b8',
    name: 'Обычный'
  },
  uncommon: { 
    bg: 'rgba(34, 197, 94, 0.15)', 
    border: '#22c55e', 
    glow: 'rgba(34, 197, 94, 0.4)', 
    text: '#4ade80',
    name: 'Необычный'
  },
  rare: { 
    bg: 'rgba(59, 130, 246, 0.15)', 
    border: '#3b82f6', 
    glow: 'rgba(59, 130, 246, 0.4)', 
    text: '#60a5fa',
    name: 'Редкий'
  },
  epic: { 
    bg: 'rgba(168, 85, 247, 0.15)', 
    border: '#a855f7', 
    glow: 'rgba(168, 85, 247, 0.4)', 
    text: '#c084fc',
    name: 'Эпический'
  },
  legendary: { 
    bg: 'rgba(251, 146, 60, 0.15)', 
    border: '#fb923c', 
    glow: 'rgba(251, 146, 60, 0.4)', 
    text: '#fdba74',
    name: 'Легендарный'
  },
};

const SLOT_SIZE = 56;
const INVENTORY_COLS = 6;
/** Базовое число рядов; при большем количестве предметов сетка расширяется по рядам, прокрутка — overflow-y-auto. */
const INVENTORY_ROWS = 4;

// ============================================
// ITEM TOOLTIP - КИБЕРПАНК
// ============================================

interface ItemTooltipProps {
  item: InventoryItem;
  position: { x: number; y: number };
}

const TOOLTIP_MAX_W = 280;
const TOOLTIP_MAX_H = 220;

const ItemTooltip = memo(function ItemTooltip({ item, position }: ItemTooltipProps) {
  const rarity = RARITY_STYLES[item.item.rarity];
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));

  useEffect(() => {
    const sync = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    sync();
    window.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('resize', sync);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 5 }}
      className="fixed z-[100] pointer-events-none"
      style={{
        left: Math.min(position.x + 16, viewport.w - TOOLTIP_MAX_W),
        top: Math.min(position.y + 16, viewport.h - TOOLTIP_MAX_H),
      }}
    >
      <div
        className="relative min-w-[220px] max-w-[280px] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 10, 20, 0.98) 0%, rgba(15, 15, 30, 0.98) 100%)',
          border: `2px solid ${rarity.border}`,
          borderRadius: '8px',
          boxShadow: `0 0 25px ${rarity.glow}, 0 10px 30px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: rarity.border }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: rarity.border }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: rarity.border }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: rarity.border }} />
        
        {/* Scanlines */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
          }}
        />

        <div className="relative p-3">
          {/* Icon and name */}
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-10 h-10 rounded flex items-center justify-center text-2xl"
              style={{
                background: rarity.bg,
                border: `1px solid ${rarity.border}`,
                boxShadow: `0 0 10px ${rarity.glow}`,
              }}
            >
              {item.item.icon}
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: rarity.text }}>
                {item.item.name}
              </h3>
              <p className="text-xs" style={{ color: rarity.text }}>
                {rarity.name}
              </p>
            </div>
          </div>

          {/* Description */}
          {item.item.description && (
            <p className="text-sm text-slate-400 mb-2 italic border-l-2 border-cyan-500/30 pl-2">
              "{item.item.description}"
            </p>
          )}

          {/* Type */}
          <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700/50 pt-2">
            <span className="px-2 py-0.5 bg-slate-800/50 rounded text-cyan-400">
              {item.item.type}
            </span>
            {item.quantity > 1 && (
              <span className="text-slate-400">
                ×{item.quantity}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// INVENTORY SLOT - КИБЕРПАНК
// ============================================

interface InventorySlotProps {
  item: InventoryItem | null;
  index: number;
  onHover: (item: InventoryItem | null, position: { x: number; y: number }) => void;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

const InventorySlot = memo(function InventorySlot({
  item,
  index,
  onHover,
  isSelected,
  onSelect,
}: InventorySlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (item) {
      onHover(item, { x: e.clientX, y: e.clientY });
    }
  }, [item, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null, { x: 0, y: 0 });
  }, [onHover]);

  const handleClick = useCallback(() => {
    onSelect(index);
  }, [index, onSelect]);

  const rarity = item ? RARITY_STYLES[item.item.rarity] : null;

  return (
    <motion.div
      ref={slotRef}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-cyan-400/70' : ''}
      `}
      style={{
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        background: item ? rarity?.bg : 'rgba(15, 15, 25, 0.6)',
        border: item ? `2px solid ${rarity?.border}` : '1px solid rgba(100, 100, 120, 0.2)',
        borderRadius: '6px',
        boxShadow: item ? `0 0 12px ${rarity?.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Empty slot decoration */}
      {!item && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded border border-slate-700/30" />
        </div>
      )}
      
      {item && (
        <div className="w-full h-full flex items-center justify-center relative">
          <span className="text-xl select-none">{item.item.icon}</span>
          {item.quantity > 1 && (
            <span
              className="absolute bottom-0.5 right-1 text-xs font-bold text-white px-1 rounded"
              style={{ 
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                background: 'rgba(0,0,0,0.5)',
              }}
            >
              {item.quantity}
            </span>
          )}
          
          {/* Shine effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
              borderRadius: '4px',
            }}
          />
        </div>
      )}
    </motion.div>
  );
});

// ============================================
// MAIN INVENTORY COMPONENT
// ============================================

export const Inventory = memo(function Inventory({ isOpen, onClose }: InventoryProps) {
  const { inventory } = useGameStore();
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Слоты: минимум 6×4; при переполнении добавляются полные ряды по 6 ячеек
  const slots = useMemo(() => {
    const base = INVENTORY_COLS * INVENTORY_ROWS;
    const n = inventory.length;
    const totalSlots = n <= base ? base : Math.ceil(n / INVENTORY_COLS) * INVENTORY_COLS;
    const result: (InventoryItem | null)[] = [...inventory];
    while (result.length < totalSlots) {
      result.push(null);
    }
    return result;
  }, [inventory]);

  const handleHover = useCallback((item: InventoryItem | null, position: { x: number; y: number }) => {
    setHoveredItem(item);
    setTooltipPosition(position);
  }, []);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="game-critical-motion fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="game-panel relative flex max-h-[85vh] w-full max-w-[min(95vw,28rem)] flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 10, 20, 0.98) 0%, rgba(15, 15, 30, 0.98) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(34, 211, 238, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cyberpunk corner decorations */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-400/50" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-400/50" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-400/50" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-400/50" />
        
        {/* Scanlines */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
          }}
        />

        {/* Header */}
        <div className="relative shrink-0 border-b border-cyan-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                <span className="text-xl">🎒</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  ИНВЕНТАРЬ
                </h2>
                <p className="text-xs text-slate-500">
                  {inventory.length} / {slots.length} ячеек
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded border border-slate-600/50 bg-slate-700/50 text-slate-400 transition-all hover:border-red-500/50 hover:bg-red-500/30 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="game-panel relative min-h-0 flex-1 overflow-y-auto p-4">
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
                onHover={handleHover}
                isSelected={selectedIndex === index}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* Действия с выбранным предметом (логика use/drop — позже) */}
        {selectedIndex !== null && slots[selectedIndex] != null && (
          <div className="relative shrink-0 border-t border-cyan-500/20 bg-slate-950/40 px-4 py-2">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-slate-500">
              Выбрано: {slots[selectedIndex]!.item.name}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                title="Использование предметов будет добавлено в следующих версиях"
                className="rounded border border-slate-600/40 bg-slate-800/40 px-3 py-1.5 font-mono text-xs text-slate-500 cursor-not-allowed"
              >
                Использовать
              </button>
              <button
                type="button"
                disabled
                title="Выброс предмета будет добавлен в следующих версиях"
                className="rounded border border-slate-600/40 bg-slate-800/40 px-3 py-1.5 font-mono text-xs text-slate-500 cursor-not-allowed"
              >
                Выбросить
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative shrink-0 border-t border-cyan-500/20 bg-slate-900/30 p-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="text-cyan-500">▶</span> Клик — выбрать предмет
            </span>
            <span className="flex items-center gap-1">
              Наведи — информация <span className="text-cyan-500">◀</span>
            </span>
          </div>
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
// INVENTORY BUTTON - КИБЕРПАНК
// ============================================

export const InventoryButton = memo(function InventoryButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 flex items-center justify-center rounded-xl transition-all"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.9), rgba(20, 20, 35, 0.9))',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        boxShadow: '0 0 15px rgba(34, 211, 238, 0.1)',
      }}
      title="Инвентарь (I)"
    >
      <span className="text-2xl">🎒</span>
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-1 border-l-1 border-cyan-400/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-1 border-r-1 border-cyan-400/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-1 border-l-1 border-cyan-400/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-1 border-r-1 border-cyan-400/50" />
    </motion.button>
  );
});

export default Inventory;
