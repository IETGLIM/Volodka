
/* ─── Volodka RPG – Skill Tree Panel (Enhanced) ─── */
/* Cyberpunk circuit board / neural network visualization
 * Three branches: Technical (cyan), Social (magenta), Spiritual (amber)
 * 45 total nodes across 5 tiers with animated SVG connections
 *
 * Enhancements:
 * - Animated SVG connection lines with pulse/fill/dash animations
 * - Enhanced node visuals (unlocked glow, available breathe, locked grayscale)
 * - Prominent skill point badge
 * - Enhanced tooltip with prerequisites, cost, next-level effect
 * - Unlock cascade animation (flash ring + line fill)
 * - Hex grid background pattern
 * - Glassmorphism, custom scrollbar, responsive layout
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Sparkles, Star } from 'lucide-react';
import { useSkillTreePanelState } from '@/store/selectors';
import {
  SKILL_TREE_BY_BRANCH,
  BRANCH_META,
  SKILL_TREE_MAP,
  SKILL_EFFECT_MAP,
  type BranchMeta,
} from '@/data/skillTree';
import type { SkillBranch, SkillTreeNode } from '@/shared/types/game';
import { PanelWrapper } from '@/components/game/PanelWrapper';

/* ── Node state computation ── */
type NodeState = 'locked' | 'available' | 'unlocked';

function getNodeState(
  node: SkillTreeNode,
  unlockedSkills: string[],
  skillPoints: number,
): NodeState {
  if (unlockedSkills.includes(node.id)) return 'unlocked';
  const prereqsMet = node.requires.every((req) => unlockedSkills.includes(req));
  if (prereqsMet && skillPoints > 0) return 'available';
  if (prereqsMet && skillPoints <= 0) return 'available'; // still show as available visually, just can't afford
  return 'locked';
}

/* ── Connection state for SVG lines ── */
type LineState = 'locked' | 'available' | 'unlocked';

function getLineState(
  fromId: string,
  toId: string,
  unlockedSkills: string[],
): LineState {
  const fromUnlocked = unlockedSkills.includes(fromId);
  const toUnlocked = unlockedSkills.includes(toId);
  if (fromUnlocked && toUnlocked) return 'unlocked';
  if (fromUnlocked && !toUnlocked) return 'available';
  return 'locked';
}

/* ── Tier emoji icons per branch ── */
const NODE_ICONS: Record<string, string> = {
  tech_t1_coding: '⌨️',
  tech_t1_logic: '🧠',
  tech_t2_coding: '🔧',
  tech_t2_logic: '🔐',
  tech_t3_coding: '🌐',
  tech_t3_logic: '🔗',
  tech_t4_coding: '💎',
  tech_t4_logic: '🏆',
  tech_t5_ultimate: '⚡',
  social_t1_empathy: '👂',
  social_t1_persuasion: '🗣️',
  social_t2_empathy: '💞',
  social_t2_persuasion: '🎭',
  social_t3_empathy: '🌟',
  social_t3_persuasion: '📢',
  social_t4_empathy: '👁️',
  social_t4_persuasion: '👑',
  social_t5_ultimate: '💫',
  spirit_t1_intuition: '🔮',
  spirit_t1_writing: '✍️',
  spirit_t2_intuition: '🌀',
  spirit_t2_writing: '📝',
  spirit_t3_intuition: '👁️‍🗨️',
  spirit_t3_writing: '📜',
  spirit_t4_intuition: '🌠',
  spirit_t4_writing: '🎭',
  spirit_t5_ultimate: '🌟',
};

/* ── Animated particle effect on unlock ── */
function ParticleBurst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: color,
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i / 12) * Math.PI * 2) * 35,
            y: Math.sin((i / 12) * Math.PI * 2) * 35,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ── Unlock cascade flash ring ── */
function UnlockFlash({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none skill-node-flash-ring"
      style={{
        border: `2px solid ${color}`,
        boxShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
        margin: '-4px',
      }}
    />
  );
}

/* ── Enhanced SVG Connection Line ── */
function ConnectionLine({
  from,
  to,
  color,
  lineState,
  justFilled,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  lineState: LineState;
  justFilled: boolean;
}) {
  // Calculate line length for dashoffset animation
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // State-dependent styles
  const strokeColor =
    lineState === 'unlocked'
      ? color
      : lineState === 'available'
        ? `${color}55`
        : 'rgba(100,116,139,0.12)';

  const strokeWidth = lineState === 'unlocked' ? 2 : lineState === 'available' ? 1.5 : 1;

  const className =
    lineState === 'unlocked'
      ? justFilled ? 'skill-line-filling' : 'skill-line-unlocked'
      : lineState === 'available'
        ? 'skill-line-available'
        : '';

  const dashArray =
    lineState === 'unlocked' && !justFilled
      ? 'none'
      : lineState === 'available'
        ? '6 4'
        : '4 6';

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={justFilled ? length : dashArray}
      className={className}
      style={{
        transition: 'stroke 0.5s ease, stroke-width 0.5s ease',
        filter: lineState === 'unlocked' ? `drop-shadow(0 0 3px ${color}40)` : 'none',
        ['--line-color' as string]: `${color}50`,
        ['--line-length' as string]: length,
      }}
    />
  );
}

/* ── Single skill tree node (hexagonal, enhanced) ── */
function SkillNode({
  node,
  state,
  branchColor,
  onUnlock,
  justUnlocked,
  skillPoints,
}: {
  node: SkillTreeNode;
  state: NodeState;
  branchColor: string;
  onUnlock: (id: string) => void;
  justUnlocked: boolean;
  skillPoints: number;
}) {
  const [hovered, setHovered] = useState(false);
  const tooltipId = `skill-tooltip-${node.id}`;
  const icon = NODE_ICONS[node.id] || '⬡';
  const isUltimate = node.tier === 5;

  /* State-dependent styles */
  const borderColor =
    state === 'unlocked'
      ? branchColor
      : state === 'available'
        ? `${branchColor}88`
        : 'rgba(100,116,139,0.2)';

  const bgColor =
    state === 'unlocked'
      ? `${branchColor}18`
      : state === 'available'
        ? `${branchColor}0a`
        : 'rgba(15,23,42,0.5)';

  const size = isUltimate ? 'w-16 h-16' : 'w-[52px] h-[52px]';
  const fontSize = isUltimate ? 'text-lg' : 'text-base';

  // Get prerequisite names
  const prerequisiteNames = node.requires.map((reqId) => {
    const reqNode = SKILL_TREE_MAP[reqId];
    return reqNode ? reqNode.name : reqId;
  });

  // Get skill effect info
  const effectInfo = SKILL_EFFECT_MAP[node.id];

  const canAfford = state === 'available' && skillPoints > 0;

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      animate={
        state === 'unlocked'
          ? { scale: justUnlocked ? [1, 1.18, 1.05, 1] : 1.05 }
          : { scale: 1 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Hexagonal node button */}
      <button
        onClick={() => canAfford && onUnlock(node.id)}
        disabled={state === 'locked' || state === 'unlocked'}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-describedby={hovered ? tooltipId : undefined}
        className={`
          ${size} relative flex items-center justify-center
          transition-all duration-300 group
          ${state === 'available' ? 'hover:scale-110 cursor-pointer' : ''}
          ${state === 'locked' ? 'opacity-40 cursor-not-allowed' : ''}
          ${state === 'unlocked' ? 'cursor-default' : ''}
          ${state === 'available' ? 'skill-node-available' : ''}
        `}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: bgColor,
          border: `2px solid ${borderColor}`,
          ['--node-color' as string]: `${branchColor}40`,
          ...(state === 'unlocked' && !justUnlocked
            ? { boxShadow: `0 0 10px ${branchColor}35, 0 0 20px ${branchColor}15, inset 0 0 8px ${branchColor}10` }
            : {}),
        }}
        aria-label={node.name}
      >
        {/* Inner content */}
        <div
          className="absolute inset-[3px] flex items-center justify-center"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background:
              state === 'unlocked'
                ? `linear-gradient(135deg, ${branchColor}15, transparent)`
                : 'transparent',
          }}
        >
          <span
            className={`${fontSize} select-none ${
              state === 'locked' ? 'grayscale opacity-50' : ''
            }`}
          >
            {state === 'locked' ? (
              <Lock className="size-3.5 text-slate-600" />
            ) : (
              icon
            )}
          </span>
        </div>

        {/* Ultimate badge */}
        {isUltimate && state === 'unlocked' && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{
              background: branchColor,
              color: '#000',
              boxShadow: `0 0 8px ${branchColor}60`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            ★
          </motion.div>
        )}
      </button>

      {/* Unlock cascade flash ring */}
      <UnlockFlash color={branchColor} active={justUnlocked} />

      {/* Particle burst on unlock */}
      <ParticleBurst color={branchColor} active={justUnlocked} />

      {/* Node name below (compact) */}
      <div className="mt-1 text-center max-w-[60px]">
        <span
          className="text-[8px] font-mono leading-tight block truncate"
          style={{
            color: state === 'unlocked' ? branchColor : state === 'available' ? `${branchColor}99` : 'rgba(100,116,139,0.4)',
            textShadow: state === 'unlocked' ? `0 0 4px ${branchColor}30` : 'none',
          }}
        >
          {node.name}
        </span>
      </div>

      {/* Enhanced Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-3 w-56 p-3 rounded-lg border backdrop-blur-xl pointer-events-none"
            style={{
              background:
                'linear-gradient(145deg, rgba(0,0,0,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.88) 100%)',
              borderColor: `${branchColor}30`,
              boxShadow: `0 0 20px ${branchColor}12, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Header: name + state */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{icon}</span>
                <span
                  className="text-xs font-semibold text-slate-100"
                  style={{ textShadow: `0 0 6px ${branchColor}40` }}
                >
                  {node.name}
                </span>
              </div>
              {state === 'unlocked' && (
                <span
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: `${branchColor}20`,
                    color: branchColor,
                    border: `1px solid ${branchColor}30`,
                  }}
                >
                  АКТИВ
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[10px] text-slate-400 leading-tight mb-2">
              {node.description}
            </p>

            {/* Effect */}
            <div
              className="text-[10px] font-mono font-semibold px-2 py-1 rounded mb-2"
              style={{
                background: `${branchColor}12`,
                color: branchColor,
                border: `1px solid ${branchColor}20`,
              }}
            >
              {state === 'unlocked' ? '✓ ' : ''}
              {node.effect}
            </div>

            {/* Prerequisites */}
            {prerequisiteNames.length > 0 && (
              <div className="mb-2">
                <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500">
                  Требования:
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {prerequisiteNames.map((name, i) => {
                    const reqId = node.requires[i];
                    const isMet = state !== 'locked';
                    return (
                      <span
                        key={reqId}
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: isMet ? `${branchColor}10` : 'rgba(100,116,139,0.1)',
                          color: isMet ? branchColor : 'rgba(100,116,139,0.5)',
                          border: `1px solid ${isMet ? `${branchColor}20` : 'rgba(100,116,139,0.15)'}`,
                        }}
                      >
                        {isMet ? '✓ ' : '○ '}
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cost / unlock hint */}
            {state === 'available' && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded"
                style={{
                  background: canAfford
                    ? 'rgba(251,191,36,0.08)'
                    : 'rgba(100,116,139,0.08)',
                  border: `1px solid ${canAfford ? 'rgba(251,191,36,0.2)' : 'rgba(100,116,139,0.15)'}`,
                }}
              >
                <Zap
                  className="size-2.5"
                  style={{ color: canAfford ? '#fbbf24' : '#64748b' }}
                />
                <span
                  className="text-[9px] font-mono"
                  style={{ color: canAfford ? '#fbbf24' : '#64748b' }}
                >
                  {canAfford
                    ? 'Нажмите для разблокировки (1 очко)'
                    : `Недостаточно очков (нужно 1, есть ${skillPoints})`}
                </span>
              </div>
            )}
            {state === 'locked' && (
              <div className="flex items-center gap-1.5">
                <Lock className="size-2.5 text-slate-600" />
                <span className="text-[9px] text-slate-500 font-mono">
                  Требуются предыдущие навыки
                </span>
              </div>
            )}
            {state === 'unlocked' && effectInfo && (
              <div className="flex items-center gap-1 text-[8px] text-slate-500 font-mono">
                <Star className="size-2 text-amber-500/50" />
                <span>
                  +{effectInfo.value} {effectInfo.skill}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Single branch column ── */
function BranchColumn({
  branch,
  meta,
  unlockedSkills,
  skillPoints,
  onUnlock,
  recentlyUnlocked,
}: {
  branch: SkillBranch;
  meta: BranchMeta;
  unlockedSkills: string[];
  skillPoints: number;
  onUnlock: (id: string) => void;
  recentlyUnlocked: string | null;
}) {
  const nodes = SKILL_TREE_BY_BRANCH[branch];
  const color = meta.color;

  // Group nodes by tier
  const tiers: SkillTreeNode[][] = [];
  for (let t = 1; t <= 5; t++) {
    const tierNodes = nodes.filter((n) => n.tier === t);
    if (tierNodes.length > 0) tiers.push(tierNodes);
  }

  // Track recently-unlocked connections for fill animation
  const recentlyUnlockedSet = useMemo(() => {
    const set = new Set<string>();
    if (recentlyUnlocked) set.add(recentlyUnlocked);
    return set;
  }, [recentlyUnlocked]);

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* Branch header with icon and name */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}25`,
            boxShadow: `0 0 8px ${color}10`,
          }}
        >
          {meta.icon}
        </div>
        <div>
          <span
            className="text-xs font-bold font-mono uppercase tracking-wider block"
            style={{ color, textShadow: `0 0 8px ${color}40` }}
          >
            {meta.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {meta.skills.map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                {i > 0 && <span className="text-[8px] text-slate-700">•</span>}
                <span className="text-[9px] font-mono" style={{ color: `${color}99` }}>
                  {s}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tier rows */}
      {tiers.map((tierNodes, tierIdx) => (
        <div key={tierIdx} className="w-full">
          {/* SVG Connection lines between tiers */}
          {tierIdx > 0 && (
            <div className="flex justify-center mb-1">
              <svg width="120" height="28" className="overflow-visible">
                {tierNodes.map((node) =>
                  node.requires.map((reqId) => {
                    const reqNode = SKILL_TREE_MAP[reqId];
                    if (!reqNode) return null;
                    const lineState = getLineState(reqId, node.id, unlockedSkills);
                    const justFilled =
                      recentlyUnlocked !== null &&
                      (recentlyUnlockedSet.has(node.id) || recentlyUnlockedSet.has(reqId));

                    // Calculate SVG positions
                    const toX =
                      tierNodes.length === 1
                        ? 60
                        : node === tierNodes[0]
                          ? 35
                          : 85;
                    const fromX =
                      tierNodes.length === 1
                        ? 60
                        : reqId.includes(
                            node.id.split('_').slice(-1)[0],
                          )
                          ? toX
                          : 60;

                    return (
                      <ConnectionLine
                        key={`${reqId}-${node.id}`}
                        from={{ x: fromX, y: 0 }}
                        to={{ x: toX, y: 28 }}
                        color={color}
                        lineState={lineState}
                        justFilled={justFilled && lineState === 'unlocked'}
                      />
                    );
                  }),
                )}
              </svg>
            </div>
          )}

          {/* Tier label with gradient divider */}
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}25, transparent)`,
              }}
            />
            <span
              className="text-[8px] font-mono uppercase tracking-widest"
              style={{ color: `${color}55` }}
            >
              {tierIdx === 4 ? '★ УЛЬТА' : `Уровень ${tierIdx + 1}`}
            </span>
            <div
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}25, transparent)`,
              }}
            />
          </div>

          {/* Nodes in this tier */}
          <div className="flex justify-center gap-3">
            {tierNodes.map((node) => {
              const state = getNodeState(node, unlockedSkills, skillPoints);
              return (
                <SkillNode
                  key={node.id}
                  node={node}
                  state={state}
                  branchColor={color}
                  onUnlock={onUnlock}
                  justUnlocked={recentlyUnlocked === node.id}
                  skillPoints={skillPoints}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export function SkillTreePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { progression, unlockSkillTreeNode, canUnlockSkill } = useSkillTreePanelState();

  const { skillPoints, unlockedSkills } = progression;
  const [activeBranch, setActiveBranch] = useState<SkillBranch | 'all'>('all');
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<string | null>(null);

  // Keyboard handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 't' ||
        e.key === 'T' ||
        e.key === 'е' ||
        e.key === 'Е' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  const handleUnlock = useCallback(
    (nodeId: string) => {
      if (!canUnlockSkill(nodeId)) return;
      unlockSkillTreeNode(nodeId);
      setRecentlyUnlocked(nodeId);
      setTimeout(() => setRecentlyUnlocked(null), 900);
    },
    [canUnlockSkill, unlockSkillTreeNode],
  );

  // Count unlocked per branch
  const branchCounts: Record<SkillBranch, { unlocked: number; total: number }> =
    useMemo(
      () => {
        const counts: Record<SkillBranch, { unlocked: number; total: number }> = {
          technical: { unlocked: 0, total: SKILL_TREE_BY_BRANCH.technical.length },
          social: { unlocked: 0, total: SKILL_TREE_BY_BRANCH.social.length },
          spiritual: { unlocked: 0, total: SKILL_TREE_BY_BRANCH.spiritual.length },
        };
        for (const id of unlockedSkills) {
          const node = SKILL_TREE_MAP[id];
          if (node) counts[node.branch].unlocked += 1;
        }
        return counts;
      },
      [unlockedSkills],
    );

  const totalNodes =
    SKILL_TREE_BY_BRANCH.technical.length +
    SKILL_TREE_BY_BRANCH.social.length +
    SKILL_TREE_BY_BRANCH.spiritual.length;

  const branches: SkillBranch[] = ['technical', 'social', 'spiritual'];

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title="ДЕРЕВО НАВЫКОВ"
      urlPath="volodka://skilltree"
      accentColor="cyan"
      layout="centered"
      maxWidth="max-w-5xl"
      icon={<Sparkles className="size-4 text-cyan-400/60" />}
      shortcutLabel="T"
      headerExtra={
        <div className="flex items-center gap-3">
          {/* Prominent skill point badge */}
          <motion.div
            className="skill-point-badge flex items-center gap-2 px-3.5 py-1.5 rounded-lg border backdrop-blur-md"
            style={{
              borderColor: 'rgba(251,191,36,0.35)',
              background: 'rgba(251,191,36,0.1)',
            }}
            animate={
              skillPoints > 0
                ? {
                    scale: [1, 1.03, 1],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Zap className="size-4 text-amber-400" />
            <span
              className="text-sm font-bold font-mono text-amber-300"
              style={{
                textShadow: '0 0 8px rgba(251,191,36,0.5)',
              }}
            >
              {skillPoints}
            </span>
            <span className="text-[10px] text-amber-400/70 font-mono">
              очков
            </span>
          </motion.div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">
            volodka://skilltree
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-slate-500 font-mono">
              Разблокировано:{' '}
              <span className="text-cyan-400/70">
                {unlockedSkills.length}/{totalNodes}
              </span>
            </span>
          </div>
        </div>
      }
    >
      <div className="scanline-overlay relative" style={{ background: 'rgba(0,0,0,0.15)' }}>
        {/* ── Branch tabs ── */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/40 overflow-x-auto">
          <button
            onClick={() => setActiveBranch('all')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeBranch === 'all'
                ? 'bg-slate-800/60 text-slate-100'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            Все ветки
          </button>
          {branches.map((b) => {
            const meta = BRANCH_META[b];
            const isActive = activeBranch === b;
            return (
              <button
                key={b}
                onClick={() => setActiveBranch(b)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                  isActive
                    ? 'text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={
                  isActive
                    ? {
                        background: `${meta.color}15`,
                        boxShadow: `0 0 8px ${meta.color}15, inset 0 0 4px ${meta.color}08`,
                      }
                    : {}
                }
              >
                <span className="text-xs">{meta.icon}</span>
                <span style={{ color: isActive ? meta.color : undefined }}>
                  {meta.name}
                </span>
                <span className="text-[8px] opacity-50">
                  {branchCounts[b].unlocked}/{branchCounts[b].total}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tree area with hex grid background ── */}
        <div
          className="relative overflow-y-auto skill-tree-scroll"
          style={{ minHeight: '420px', maxHeight: '65vh' }}
        >
          {/* Hex grid background */}
          <div className="absolute inset-0 skill-hex-bg pointer-events-none" />

          {/* Decorative circuit traces (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="skill-circuit-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#00ccff"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#skill-circuit-grid)" />
          </svg>

          {/* Decorative ambient glow spots */}
          <div
            className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(0,204,255,0.04) 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(255,0,204,0.04) 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(255,170,0,0.04) 0%, transparent 70%)`,
            }}
          />

          {/* ── Branch columns ── */}
          <div
            className={`relative z-10 p-4 sm:p-6 flex gap-2 sm:gap-6 ${
              activeBranch === 'all' ? '' : 'justify-center'
            } flex-col sm:flex-row`}
          >
            {branches.map((b, branchIndex) => {
              const meta = BRANCH_META[b];
              if (activeBranch !== 'all' && activeBranch !== b) return null;
              return (
                <motion.div
                  key={b}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.4,
                    delay: branchIndex * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={
                    activeBranch !== 'all' ? 'w-full max-w-md' : 'flex-1'
                  }
                >
                  {/* Branch container with glassmorphism */}
                  <div
                    className="rounded-xl border p-3 sm:p-4 backdrop-blur-md"
                    style={{
                      borderColor: `${meta.color}18`,
                      background: `linear-gradient(180deg, ${meta.color}06 0%, rgba(0,0,0,0.2) 50%, ${meta.color}04 100%)`,
                    }}
                  >
                    <BranchColumn
                      branch={b}
                      meta={meta}
                      unlockedSkills={unlockedSkills}
                      skillPoints={skillPoints}
                      onUnlock={handleUnlock}
                      recentlyUnlocked={recentlyUnlocked}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
