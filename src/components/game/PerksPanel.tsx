
/* ─── Volodka RPG – Perks Panel (Polished) ───
 * Displays available perks organized by category tabs.
 * Perks are special abilities/traits acquired with perk points
 * (gained every 3 levels). Uses PanelWrapper with amber accent.
 * Cyberpunk visual style with scanlines, glow effects, and Framer Motion.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Lock,
  Check,
  Shield,
  Users,
  Sword,
  Feather,
  Cpu,
  Eye,
  ShieldCheck,
  Ghost,
  Megaphone,
  MessageCircle,
  Crown,
  HeartHandshake,
  Brain,
  Swords,
  Flame,
  Wind,
  BookOpen,
  Sparkles,
  Music,
  Terminal,
  BarChart3,
  Scan,
  Activity,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { usePerksPanelState } from '@/store/selectors';
import { PERKS, PERKS_MAP, PERK_CATEGORY_META, type PerkCategory, type PerkDefinition } from '@/data/perks';
import { PanelWrapper } from '@/components/game/PanelWrapper';

/* ─── Lucide icon map ─── */
const ICON_MAP: Record<string, React.ReactNode> = {
  Eye: <Eye className="size-4" />,
  ShieldCheck: <ShieldCheck className="size-4" />,
  Zap: <Zap className="size-4" />,
  Ghost: <Ghost className="size-4" />,
  Megaphone: <Megaphone className="size-4" />,
  MessageCircle: <MessageCircle className="size-4" />,
  Crown: <Crown className="size-4" />,
  HeartHandshake: <HeartHandshake className="size-4" />,
  Brain: <Brain className="size-4" />,
  Swords: <Swords className="size-4" />,
  Shield: <Shield className="size-4" />,
  Flame: <Flame className="size-4" />,
  Wind: <Wind className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  Sparkles: <Sparkles className="size-4" />,
  Music: <Music className="size-4" />,
  Terminal: <Terminal className="size-4" />,
  BarChart3: <BarChart3 className="size-4" />,
  Scan: <Scan className="size-4" />,
  Activity: <Activity className="size-4" />,
};

function getPerkIcon(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] ?? <Star className="size-4" />;
}

/* ─── Category tab icons with emojis ─── */
const CATEGORY_TAB_ICONS: Record<PerkCategory, { emoji: string; icon: React.ReactNode }> = {
  survival: { emoji: '🛡️', icon: <Shield className="size-3.5" /> },
  social: { emoji: '🤝', icon: <Users className="size-3.5" /> },
  combat: { emoji: '⚔️', icon: <Sword className="size-3.5" /> },
  poetic: { emoji: '🎭', icon: <Feather className="size-3.5" /> },
  technical: { emoji: '💻', icon: <Cpu className="size-3.5" /> },
};

/* ─── Perk state computation ─── */
type PerkState = 'locked' | 'available' | 'acquired' | 'exclusive';

function getPerkState(
  perk: PerkDefinition,
  unlockedPerks: string[],
  perkPoints: number,
  level: number,
): PerkState {
  if (unlockedPerks.includes(perk.id)) return 'acquired';

  // Check mutual exclusivity
  if (perk.mutuallyExclusiveWith) {
    const hasExclusive = perk.mutuallyExclusiveWith.some((exId) =>
      unlockedPerks.includes(exId),
    );
    if (hasExclusive) return 'exclusive';
  }

  // Check level requirement
  if (level < perk.minLevel) return 'locked';

  // Check prerequisite perks
  const prereqsMet = perk.requiredPerks.every((req) =>
    unlockedPerks.includes(req),
  );
  if (!prereqsMet) return 'locked';

  // Has perk points?
  if (perkPoints <= 0) return 'available'; // still available visually, just can't afford

  return 'available';
}

/* ─── Single Perk Card ─── */
function PerkCard({
  perk,
  state,
  categoryColor,
  onAcquire,
  canAfford,
}: {
  perk: PerkDefinition;
  state: PerkState;
  categoryColor: string;
  onAcquire: (id: string) => void;
  canAfford: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const icon = getPerkIcon(perk.icon);

  const isAcquired = state === 'acquired';
  const isAvailable = state === 'available';
  const isLocked = state === 'locked';
  const isExclusive = state === 'exclusive';

  const borderColor = isAcquired
    ? categoryColor
    : isAvailable && canAfford
      ? `${categoryColor}88`
      : isAvailable
        ? `${categoryColor}55`
        : isExclusive
          ? 'rgba(251,113,133,0.3)'
          : 'rgba(100,116,139,0.15)';

  const bgColor = isAcquired
    ? `${categoryColor}12`
    : isAvailable && canAfford
      ? `${categoryColor}0c`
      : isAvailable
        ? `${categoryColor}06`
        : 'rgba(15,23,42,0.4)';

  // Stronger glow for available perks that can be afforded
  const glowStyle = isAvailable && canAfford
    ? {
        boxShadow: `0 0 20px ${categoryColor}40, 0 0 40px ${categoryColor}18, inset 0 0 12px ${categoryColor}0a`,
      }
    : isAvailable
      ? {
          boxShadow: `0 0 10px ${categoryColor}20, inset 0 0 6px ${categoryColor}05`,
        }
      : isAcquired
        ? { boxShadow: `0 0 8px ${categoryColor}20, inset 0 0 4px ${categoryColor}08` }
        : {};

  // Pulsing border animation for available perks with perk points
  const availablePulseStyle = isAvailable && canAfford
    ? {
        animation: 'perk-available-pulse 2.5s ease-in-out infinite',
      }
    : {};

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      animate={isAcquired ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2, repeat: isAcquired ? Infinity : 0, ease: 'easeInOut' }}
    >
      <div
        className={`
          relative rounded-lg border p-3 transition-all duration-300
          ${isAvailable && canAfford ? 'cursor-pointer hover:scale-[1.02]' : ''}
          ${isLocked ? 'opacity-50' : ''}
          ${isExclusive ? 'opacity-40' : ''}
        `}
        style={{
          borderColor,
          background: bgColor,
          ...glowStyle,
          ...availablePulseStyle,
        }}
      >
        {/* Top row: icon + name + status */}
        <div className="flex items-start gap-2.5">
          {/* Icon container */}
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              borderColor: `${categoryColor}25`,
              background: isAcquired
                ? `${categoryColor}15`
                : isAvailable && canAfford
                  ? `${categoryColor}0c`
                  : isAvailable
                    ? `${categoryColor}06`
                    : 'rgba(0,0,0,0.3)',
              color: isAcquired || isAvailable ? categoryColor : 'rgba(100,116,139,0.5)',
              boxShadow: isAvailable && canAfford
                ? `0 0 10px ${categoryColor}20, inset 0 0 4px ${categoryColor}08`
                : 'none',
            }}
          >
            {isAcquired ? (
              <Check className="size-4" style={{ color: categoryColor }} />
            ) : isLocked ? (
              <Lock className="size-3.5 text-slate-600" />
            ) : isExclusive ? (
              <AlertTriangle className="size-3.5 text-rose-400/50" />
            ) : (
              icon
            )}
          </div>

          {/* Name + description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="text-xs font-semibold font-mono truncate"
                style={{
                  color: isAcquired ? categoryColor : isAvailable ? '#e2e8f0' : '#94a3b8',
                  textShadow: isAcquired
                    ? `0 0 8px ${categoryColor}60`
                    : isAvailable && canAfford
                      ? `0 0 6px ${categoryColor}30`
                      : 'none',
                }}
              >
                {perk.name}
              </span>
              {isAcquired && (
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: `linear-gradient(135deg, ${categoryColor}25, ${categoryColor}10)`,
                    color: categoryColor,
                    border: `1px solid ${categoryColor}40`,
                    textShadow: `0 0 8px ${categoryColor}60, 0 0 16px ${categoryColor}30`,
                    boxShadow: `0 0 10px ${categoryColor}25, inset 0 0 6px ${categoryColor}10`,
                  }}
                >
                  АКТИВ
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">
              {perk.description}
            </p>
          </div>
        </div>

        {/* Effects list — slightly larger and more readable */}
        <div className="mt-2 flex flex-wrap gap-1">
          {perk.effects.map((effect, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: isAcquired ? `${categoryColor}10` : isAvailable ? `${categoryColor}06` : 'rgba(0,0,0,0.3)',
                color: isAcquired ? `${categoryColor}cc` : isAvailable ? `${categoryColor}99` : '#64748b',
                border: `1px solid ${isAcquired ? `${categoryColor}15` : isAvailable ? `${categoryColor}08` : 'rgba(100,116,139,0.1)'}`,
              }}
            >
              {effect.description}
            </span>
          ))}
        </div>

        {/* Prerequisite connection line for locked/available perks */}
        {perk.requiredPerks.length > 0 && !isAcquired && (
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, ${categoryColor}20, ${categoryColor}08)`,
              }}
            />
            <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: `${categoryColor}80` }}>
              <Lock className="size-2.5" />
              <span>← </span>
              {perk.requiredPerks.map((id, idx) => (
                <span key={id}>
                  <span style={{ color: `${categoryColor}aa` }}>{PERKS_MAP[id]?.name ?? id}</span>
                  {idx < perk.requiredPerks.length - 1 && <span className="text-slate-600"> + </span>}
                </span>
              ))}
            </div>
            <div
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, ${categoryColor}08, ${categoryColor}20)`,
              }}
            />
          </div>
        )}

        {/* Requirements (for locked perks) */}
        {isLocked && (
          <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500 font-mono">
            {perk.minLevel > 1 && (
              <span className="flex items-center gap-0.5">
                <Star className="size-2.5" />Ур.{perk.minLevel}
              </span>
            )}
            {perk.requiredPerks.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Lock className="size-2.5" />
                {perk.requiredPerks.map((id) => PERKS_MAP[id]?.name ?? id).join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Exclusive notice */}
        {isExclusive && (
          <div className="mt-2 flex items-center gap-1 text-[9px] text-rose-400/60 font-mono">
            <AlertTriangle className="size-2.5" />
            <span>Несовместимо с выбранной чертой</span>
          </div>
        )}

        {/* Acquire button */}
        {isAvailable && canAfford && (
          <button
            onClick={() => onAcquire(perk.id)}
            className="mt-2.5 w-full py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}25, ${categoryColor}10)`,
              border: `1px solid ${categoryColor}50`,
              color: categoryColor,
              boxShadow: `0 0 16px ${categoryColor}20, 0 0 4px ${categoryColor}10, inset 0 0 8px ${categoryColor}08`,
              textShadow: `0 0 6px ${categoryColor}40`,
            }}
          >
            Выбрать черту
          </button>
        )}

        {isAvailable && !canAfford && (
          <div
            className="mt-2.5 w-full py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-center opacity-50"
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(100,116,139,0.15)',
              color: '#64748b',
            }}
          >
            Нет очков черт
          </div>
        )}

        {/* Flavor text on hover */}
        <AnimatePresence>
          {hovered && perk.flavorText && !isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p
                className="mt-2 text-[9px] italic leading-tight pt-2 border-t"
                style={{
                  color: `${categoryColor}80`,
                  borderColor: `${categoryColor}15`,
                  fontFamily: '"Georgia", "Times New Roman", serif',
                }}
              >
                «{perk.flavorText}»
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export function PerksPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { progression, acquirePerk, canAcquirePerk } = usePerksPanelState();

  const { perkPoints, unlockedPerks } = progression;
  const level = progression.level;
  const [activeCategory, setActiveCategory] = useState<PerkCategory | 'all'>('all');
  const [recentlyAcquired, setRecentlyAcquired] = useState<string | null>(null);

  // Close on Escape handled by PanelWrapper
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Filter perks by active category
  const filteredPerks = activeCategory === 'all'
    ? PERKS
    : PERKS.filter((p) => p.category === activeCategory);

  // Count acquired per category
  const categoryCounts: Record<PerkCategory, { acquired: number; total: number }> = {
    survival: { acquired: 0, total: 0 },
    social: { acquired: 0, total: 0 },
    combat: { acquired: 0, total: 0 },
    poetic: { acquired: 0, total: 0 },
    technical: { acquired: 0, total: 0 },
  };
  for (const perk of PERKS) {
    categoryCounts[perk.category].total++;
    if (unlockedPerks.includes(perk.id)) {
      categoryCounts[perk.category].acquired++;
    }
  }

  const totalAcquired = unlockedPerks.length;
  const totalPerks = PERKS.length;

  // Handle perk acquisition
  const handleAcquire = useCallback((perkId: string) => {
    if (!canAcquirePerk(perkId)) return;
    acquirePerk(perkId);
    setRecentlyAcquired(perkId);
    setTimeout(() => setRecentlyAcquired(null), 800);
  }, [canAcquirePerk, acquirePerk]);

  // Category tabs
  const categories: PerkCategory[] = ['survival', 'social', 'combat', 'poetic', 'technical'];

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title="ЧЕРТЫ"
      urlPath="volodka://perks"
      accentColor="amber"
      layout="centered"
      maxWidth="max-w-4xl"
      icon={<Feather className="size-4 text-amber-400/60" />}
      shortcutLabel="V"
      headerExtra={
        <div className="flex items-center gap-3">
          {/* Perk points display */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border"
            style={{
              borderColor: 'rgba(251,191,36,0.3)',
              background: 'rgba(251,191,36,0.08)',
            }}
          >
            <Zap className="size-3.5 text-amber-400" />
            <span
              className="text-xs font-bold font-mono text-amber-300 neon-text-amber"
            >
              {perkPoints}
            </span>
            <span className="text-[10px] text-amber-400/70 font-mono">очков черт</span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">volodka://perks</span>
          <span className="text-[9px] text-slate-500 font-mono">
            Получено: {totalAcquired}/{totalPerks} • Очки черт даются каждые 3 уровня
          </span>
        </div>
      }
    >
      <div className="scanline-overlay" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {/* ── Category tabs ── */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/40 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-800/60 text-slate-100'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            ✦ Все
          </button>
          {categories.map((cat) => {
            const meta = PERK_CATEGORY_META[cat];
            const isActive = activeCategory === cat;
            const count = categoryCounts[cat];
            const tabIcon = CATEGORY_TAB_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all shrink-0 ${
                  isActive ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
                style={isActive ? {
                  background: `${meta.color}15`,
                  boxShadow: `0 0 10px ${meta.color}20, inset 0 0 6px ${meta.color}08`,
                } : {}}
              >
                <span className="shrink-0">{tabIcon.emoji}</span>
                <span style={{ color: isActive ? meta.color : undefined }}>{meta.name}</span>
                <span className="text-[8px] opacity-50">{count.acquired}/{count.total}</span>
              </button>
            );
          })}
        </div>

        {/* ── Perks grid ── */}
        <div className="relative p-4 sm:p-6 overflow-auto max-h-[65vh] custom-scrollbar">
          {/* Decorative background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="perk-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#perk-grid)" />
          </svg>

          {/* Decorative glow spots */}
          <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)' }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.03) 0%, transparent 70%)' }}
          />

          {/* Grid of perk cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
            <AnimatePresence mode="popLayout">
              {filteredPerks.map((perk) => {
                const state = getPerkState(perk, unlockedPerks, perkPoints, level);
                const meta = PERK_CATEGORY_META[perk.category];
                return (
                  <motion.div
                    key={perk.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PerkCard
                      perk={perk}
                      state={state}
                      categoryColor={meta.color}
                      onAcquire={handleAcquire}
                      canAfford={perkPoints > 0}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filteredPerks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm font-mono">
              Нет доступных черт в этой категории
            </div>
          )}
        </div>
      </div>
    </PanelWrapper>
  );
}
