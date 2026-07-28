/* eslint-disable react-refresh/only-export-components */
/* ─── Volodka RPG – Enhanced Action Bar with Cyberpunk Visuals v2.0 ───
   Новая компонента с расширенными визуальными эффектами:
   – Neon buttons с pulse анимацией
   – Holographic panel эффекты
   – Energy ring декораторы
   – Enhanced tooltips
   – Responsive design
*/

import { memo, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Shield,
  Zap,
  Heart,
  BookOpen,
  Map,
  Camera,
  Settings,
  ChevronDown,
  Sparkles,
  Target,
  Radio,
} from 'lucide-react';

/* ─── Types ─── */
export interface ActionBarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  variant?: 'cyan' | 'amber' | 'matrix' | 'rose';
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
  cooldown?: number; // 0-100 percentage
}

interface EnhancedActionBarProps {
  actions: ActionBarAction[];
  position?: 'top-left' | 'top-right' | 'bottom-center' | 'bottom-left' | 'bottom-right';
  orientation?: 'horizontal' | 'vertical';
  compact?: boolean;
  showLabels?: boolean;
  onActionExecute?: (actionId: string) => void;
}

/* ─── Variant Style Mapper ─── */
const variantClasses: Record<string, string> = {
  cyan: 'neon-btn-cyan',
  amber: 'neon-btn-amber',
  matrix: 'neon-btn-matrix',
  rose: 'neon-btn-cyan border-rose-400/50 text-rose-300',
};

const glowColors: Record<string, string> = {
  cyan: 'var(--cyber-cyan)',
  amber: 'var(--cyber-amber)',
  matrix: 'var(--cyber-matrix)',
  rose: 'var(--cyber-rose)',
};

/* ─── Cooldown Overlay Component ─── */
function CooldownOverlay({ value, color }: { value: number; color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-md" style={{ pointerEvents: 'none' }}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60 transition-all duration-100"
        style={{ height: `${value}%` }}
      />
      {/* Glow line at the edge of cooldown */}
      {value > 0 && value < 100 && (
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            bottom: `${value}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      )}
    </div>
  );
}

/* ─── Badge Component ─── */
function ActionBadge({ content, variant = 'cyan' }: { content: string | number; variant?: string }) {
  const bgColor = variant === 'amber' ? 'bg-amber-500' : variant === 'matrix' ? 'bg-green-400' : 'bg-cyan-500';
  return (
    <span
      className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center ${bgColor} text-[9px] font-bold text-black rounded-full px-1 font-mono`}
    >
      {content}
    </span>
  );
}

/* ─── Single Action Button ─── */
const ActionBarButton = memo(function ActionBarButton({
  action,
  compact,
  showLabels,
  onExecute,
  _index,
}: {
  action: ActionBarAction;
  compact: boolean;
  showLabels: boolean;
  onExecute: (id: string) => void;
  index: number;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (action.disabled) return;
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    action.onClick?.();
    onExecute(action.id);
  }, [action, onExecute]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const variant = action.variant || 'cyan';
  const baseClass = variantClasses[variant];
  const glowColor = glowColors[variant];

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      disabled={action.disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: action.disabled ? 0.4 : 1, 
        scale: isPressed ? 0.95 : (action.active ? 1.05 : 1),
      }}
      whileHover={{ scale: action.disabled ? 1 : 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative flex items-center gap-2 rounded-md font-mono text-xs
        transition-all duration-200 cursor-pointer select-none
        ${baseClass}
        ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
        ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${action.active ? 'ring-1 ring-current' : ''}
      `}
      title={action.shortcut ? `${action.label} [${action.shortcut}]` : action.label}
      aria-label={action.label}
      style={action.active ? { boxShadow: `0 0 12px ${glowColor}, inset 0 0 8px ${glowColor}30` } : undefined}
    >
      {/* Cooldown overlay */}
      {action.cooldown !== undefined && action.cooldown > 0 && (
        <CooldownOverlay value={action.cooldown} color={glowColor} />
      )}

      {/* Icon */}
      <span
        className={`flex-shrink-0 ${compact ? 'size-3.5' : 'size-4'} ${action.active ? 'drop-shadow-lg' : ''}`}
        style={action.active ? { filter: `drop-shadow(0 0 4px ${glowColor})` } : undefined}
      >
        {action.icon}
      </span>

      {/* Label */}
      {showLabels && !compact && (
        <span className="hidden sm:inline whitespace-nowrap">{action.label}</span>
      )}

      {/* Badge */}
      {action.badge !== undefined && (
        <ActionBadge content={action.badge} variant={variant} />
      )}

      {/* Shortcut hint for non-compact mode */}
      {action.shortcut && !compact && (
        <span className="hidden md:inline ml-auto text-[9px] opacity-50">
          [{action.shortcut}]
        </span>
      )}
    </motion.button>
  );
});

/* ─── Main Enhanced Action Bar ─── */
export const EnhancedActionBar = memo(function EnhancedActionBar({
  actions,
  position = 'bottom-center',
  orientation = 'horizontal',
  compact = false,
  showLabels = true,
  onActionExecute,
}: EnhancedActionBarProps) {
  const [expanded, setExpanded] = useState(false);

  const handleActionExecute = useCallback(
    (actionId: string) => {
      onActionExecute?.(actionId);
    },
    [onActionExecute]
  );

  /* Position styles */
  const positionStyles: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  /* Container orientation styles */
  const containerClass = orientation === 'horizontal'
    ? 'flex-row flex-wrap'
    : 'flex-col gap-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`fixed z-[--z-hud] ${positionStyles[position]} ${containerClass} gap-1.5 p-2 holo-panel rounded-xl max-w-[calc(100vw-2rem)]`}
      role="toolbar"
      aria-label="Панель быстрых действий"
    >
      {/* Header strip for vertical / expanded mode */}
      {(orientation === 'vertical' || expanded) && (
        <div className="w-full pb-2 mb-2 border-b border-cyan-500/20">
          <span className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
            ⚡ Действия
          </span>
        </div>
      )}

      {/* Action buttons */}
      <AnimatePresence mode="popLayout">
        {actions.map((action, index) => (
          <ActionBarButton
            key={action.id}
            action={action}
            compact={compact}
            showLabels={showLabels}
            onExecute={handleActionExecute}
            index={index}
          />
        ))}
      </AnimatePresence>

      {/* Expand/Collapse toggle for horizontal mode with many actions */}
      {actions.length > 6 && orientation === 'horizontal' && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="hidden lg:flex items-center justify-center size-8 rounded-md border border-slate-600/30 bg-slate-800/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </button>
      )}
    </motion.div>
  );
});

/* ─── Default Combat Action Preset ─── */
export function createCombatActionBar(onAction: (id: string) => void): ActionBarAction[] {
  return [
    {
      id: 'attack',
      label: 'Атака',
      icon: <Sword className="size-full" />,
      shortcut: 'A',
      variant: 'cyan',
      onClick: () => onAction('attack'),
    },
    {
      id: 'defend',
      label: 'Защита',
      icon: <Shield className="size-full" />,
      shortcut: 'D',
      variant: 'amber',
      onClick: () => onAction('defend'),
    },
    {
      id: 'skill',
      label: 'Навык',
      icon: <Zap className="size-full" />,
      shortcut: 'S',
      variant: 'matrix',
      onClick: () => onAction('skill'),
    },
    {
      id: 'heal',
      label: 'Лечение',
      icon: <Heart className="size-full" />,
      shortcut: 'H',
      variant: 'rose',
      onClick: () => onAction('heal'),
      badge: '+',
    },
    {
      id: 'item',
      label: 'Предмет',
      icon: <Sparkles className="size-full" />,
      shortcut: 'I',
      onClick: () => onAction('item'),
    },
  ];
}

/* ─── Default Exploration Action Preset ─── */
export function createExplorationActionBar(onAction: (id: string) => void): ActionBarAction[] {
  return [
    {
      id: 'poetry',
      label: 'Стихи',
      icon: <BookOpen className="size-full" />,
      shortcut: 'P',
      variant: 'amber',
      onClick: () => onAction('poetry'),
      badge: '📖',
    },
    {
      id: 'map',
      label: 'Карта',
      icon: <Map className="size-full" />,
      shortcut: 'M',
      onClick: () => onAction('map'),
    },
    {
      id: 'photo',
      label: 'Фото',
      icon: <Camera className="size-full" />,
      shortcut: 'F5',
      onClick: () => onAction('photo'),
    },
    {
      id: 'scan',
      label: 'Сканир.',
      icon: <Radio className="size-full" />,
      shortcut: 'V',
      variant: 'matrix',
      onClick: () => onAction('scan'),
    },
    {
      id: 'target',
      label: 'Цель',
      icon: <Target className="size-full" />,
      shortcut: 'T',
      onClick: () => onAction('target'),
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings className="size-full" />,
      shortcut: 'Esc',
      onClick: () => onAction('settings'),
    },
  ];
}

export default EnhancedActionBar;
