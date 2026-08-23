
/* ─── Volodka RPG – Character Profile Panel (Cyberpunk Stats Overlay) ─── */

import { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import {
  X,
  Zap,
  Activity,
  Shield,
  HardHat,
  Shirt,
  Gem,
  Sword,
  BookOpen,
  Trophy,
  Package,
  Footprints,
  Star,
  ChevronUp,
  Sparkles,
  Coins,
  Brain,
  Flame,
  Swords,
  Wind,
  PenLine } from 'lucide-react';
import {
  useCharacterProfilePanelState } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { findNpcById } from '@/data/allNpcDefinitions';
import { POEMS } from '@/data/poems';
import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';
import { Card, CardContent } from '@/components/ui/card';
import { PERKS_MAP, PERK_CATEGORY_META } from '@/data/perks';
import type { EquipmentSlot } from '@/shared/types/game';

const TOTAL_POEMS = POEMS.length;

/* ══════════════════════════════════════════════════════════════
   SVG RADAR CHART — Pentagon showing player skills
   ══════════════════════════════════════════════════════════════ */

const RADAR_STATS: Array<{ key: string; label: string; color: string }> = [
  { key: 'writing', label: 'Поэзия', color: '#f59e0b' },
  { key: 'coding', label: 'Взлом', color: '#00e5ff' },
  { key: 'empathy', label: 'Эмпатия', color: '#f472b6' },
  { key: 'persuasion', label: 'Улица', color: '#a78bfa' },
  { key: 'intuition', label: 'Храбрость', color: '#fb923c' },
  { key: 'logic', label: 'Интеллект', color: '#60a5fa' },
];

const RADAR_N = RADAR_STATS.length;
const RADAR_ANGLE_STEP = (2 * Math.PI) / RADAR_N;
const RADAR_SIZE = 120;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = RADAR_SIZE / 2 - 20;

function polarToCart(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)];
}

function StatRadarChart({ skills }: { skills: Record<string, number> }) {
  const maxVal = 100;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const shapePoints = useMemo(() => {
    return RADAR_STATS.map((stat, i) => {
      const angle = i * RADAR_ANGLE_STEP;
      const val = Math.min(maxVal, (skills[stat.key] ?? 0)) / maxVal;
      const [x, y] = polarToCart(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS * val, angle);
      return `${x},${y}`;
    }).join(' ');
  }, [skills]);

  return (
    <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="w-full h-full profile-radar-glow">
      {/* Grid pentagons */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: RADAR_N }, (_, i) => {
          const [x, y] = polarToCart(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS * level, i * RADAR_ANGLE_STEP);
          return `${x},${y}`;
        }).join(' ');
        return <polygon key={level} points={pts} className="profile-radar-grid" />;
      })}
      {/* Axes */}
      {RADAR_STATS.map((_, i) => {
        const [x, y] = polarToCart(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS, i * RADAR_ANGLE_STEP);
        return <line key={i} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={x} y2={y} className="profile-radar-axis" />;
      })}
      {/* Data shape */}
      <polygon
        points={shapePoints}
        fill="rgba(0, 229, 255, 0.08)"
        stroke="#00e5ff"
        strokeWidth="1.5"
        className="profile-radar-shape"
      />
      {/* Data dots + labels */}
      {RADAR_STATS.map((stat, i) => {
        const angle = i * RADAR_ANGLE_STEP;
        const val = Math.min(maxVal, (skills[stat.key] ?? 0)) / maxVal;
        const [dx, dy] = polarToCart(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS * val, angle);
        const [lx, ly] = polarToCart(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS + 14, angle);
        return (
          <g key={stat.key}>
            <circle cx={dx} cy={dy} r={3} fill={stat.color} className="profile-radar-dot" style={{ color: stat.color }} />
            <text x={lx} y={ly - 3} textAnchor="middle" className="profile-radar-label" fill={stat.color}>{stat.label}</text>
            <text x={lx} y={ly + 7} textAnchor="middle" className="profile-radar-value-label" fill={stat.color}>{skills[stat.key] ?? 0}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAPER-DOLL EQUIPMENT DISPLAY
   ══════════════════════════════════════════════════════════════ */

function PaperDollEquipment({ equippedItems }: { equippedItems: Record<EquipmentSlot, { id: string; name: string } | null> }) {
  const slots: Array<{ key: EquipmentSlot; posClass: string }> = [
    { key: 'head', posClass: 'equip-slot-head' },
    { key: 'body', posClass: 'equip-slot-body' },
    { key: 'hands', posClass: 'equip-slot-hands' },
    { key: 'accessory', posClass: 'equip-slot-accessory' },
    { key: 'legs', posClass: 'equip-slot-legs' },
    { key: 'feet', posClass: 'equip-slot-feet' },
  ];

  return (
    <div className="equipment-doll">
      <div className="equipment-doll-body">
        <svg viewBox="0 0 80 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-slate-600">
          <path d="M40 10 L52 18 L54 35 L52 50 L46 58 L46 75 L52 85 L52 95 L28 95 L28 85 L34 75 L34 58 L28 50 L26 35 L28 18 Z" />
          <circle cx="35" cy="25" r="2" opacity="0.3" />
          <circle cx="45" cy="25" r="2" opacity="0.3" />
        </svg>
      </div>
      {slots.map(({ key, posClass }) => {
        const equipped = equippedItems[key];
        const cfg = SLOT_CONFIG[key];
        return (
          <div
            key={key}
            className={`equip-slot ${posClass} ${equipped ? 'equip-slot-equipped' : ''}`}
          >
            <cfg.Icon className={`size-4 ${equipped ? 'text-amber-400/70' : 'text-slate-600/40'}`} />
            <span className="equip-slot-label">{cfg.label}</span>
            {equipped ? (
              <span className="equip-slot-item" title={equipped.name}>{equipped.name}</span>
            ) : (
              <span className="equip-slot-empty">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKILL TREE MINI-PREVIEW
   ══════════════════════════════════════════════════════════════ */

const SKILL_TREE_ICONS: Record<string, string> = {
  writing: '✍️',
  coding: '💻',
  empathy: '💜',
  persuasion: '🎤',
  intuition: '🔥',
  logic: '🧠',
};

function SkillTreeMiniPreview({ skills, unlockedSkills }: { skills: Record<string, number>; unlockedSkills: string[] }) {
  return (
    <div className="skill-tree-mini">
      {Object.entries(SKILL_DISPLAY).map(([key, { label }]) => {
        const isUnlocked = unlockedSkills.includes(key);
        const value = skills[key as keyof typeof skills] ?? 0;
        return (
          <div
            key={key}
            className={`skill-tree-mini-node ${isUnlocked ? 'skill-unlocked' : ''}`}
            title={`${label}: ${value}`}
          >
            <span>{SKILL_TREE_ICONS[key] ?? '?'}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   AUTO-GENERATED BIOGRAPHY
   ══════════════════════════════════════════════════════════════ */

function BiographySection({
  karma,
  skills,
  currentAct,
  collectedPoems,
  npcRelations,
}: {
  karma: number;
  skills: Record<string, number>;
  currentAct: number;
  collectedPoems: string[];
  npcRelations: Array<{ npcId: string; value: number }>;
}) {
  const bio = useMemo(() => {
    const parts: string[] = [];

    // Opening based on act
    if (currentAct <= 2) {
      parts.push('Владимир Лебедев — инженер, чья душа растеряна между кодом и строками. Город Уфа держит его в своих неоновых тисках.');
    } else if (currentAct <= 4) {
      parts.push('Инженер-поэт, затерянный в кибернетической Уфе. Каждый найденный стих — шаг глубже в лабиринт собственной памяти.');
    } else {
      parts.push('Поэт между сменами, чей голос теперь слышен на улицах мёртвых серверов. Владимир больше не просто выживает — он ищет.');
    }

    // Karma reflection
    if (karma >= KARMA_HIGH_THRESHOLD) {
      parts.push('Светлая натура, стремящаяся к справедливости. Окружающие чувствуют его искренность.');
    } else if (karma <= KARMA_LOW_THRESHOLD) {
      parts.push('Тёмная сторона притягивает — но Владимир ещё не потерян окончательно. Выбор всегда остаётся.');
    } else {
      parts.push('Балансируя между светом и тьмой, он идёт своим путём.');
    }

    // Dominant skill
    const topSkill = Object.entries(skills).sort(([, a], [, b]) => b - a)[0];
    if (topSkill && topSkill[1] > 30) {
      const skillLabel = SKILL_DISPLAY[topSkill[0]]?.label ?? topSkill[0];
      parts.push(`Его ${skillLabel.toLowerCase()} выделяется среди прочих качеств.`);
    }

    // Poem affinity
    if (collectedPoems.length >= 5) {
      parts.push(`Собрал ${collectedPoems.length} стихотворений — слова стали его оружием.`);
    }

    // Social tendency
    const friends = npcRelations.filter((r) => r.value >= 60);
 if (friends.length >= 3) {
      parts.push('В городе у него больше союзников, чем врагов.');
    }

    return parts.join(' ');
  }, [karma, skills, currentAct, collectedPoems.length, npcRelations]);

  return (
    <div className="profile-biography">
      <div className="flex items-center gap-1.5 mb-2">
        <PenLine className="size-3" style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.4)' }} />
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Биография</span>
      </div>
      <p className="profile-biography-text">{bio}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KARMA METER WITH FACTION DISPOSITION
   ══════════════════════════════════════════════════════════════ */

function KarmaMeterWithDisposition({ karma, npcRelations }: { karma: number; npcRelations: Array<{ npcId: string; value: number }> }) {
  const thumbPos = Math.max(0, Math.min(100, karma));
  const thumbColor = karma >= KARMA_HIGH_THRESHOLD
    ? '#00e5ff'
    : karma <= KARMA_LOW_THRESHOLD
      ? '#fb7185'
      : '#fbbf24';

  // Group NPCs into factions based on ID prefixes
  const factionGroups = useMemo(() => {
    const network = npcRelations.filter((r) => ['albert', 'kate', 'zarema'].includes(r.npcId));
    const neutrals = npcRelations.filter((r) => ['lyonya', 'grigory', 'anya'].includes(r.npcId));
    const enemies = npcRelations.filter((r) => ['tolpa', 'dmitry'].some((e) => r.npcId.includes(e)));
    return [
      { name: 'Сеть', relations: network, color: '#00e5ff' },
      { name: 'Нейтралы', relations: neutrals, color: '#fbbf24' },
      { name: 'Толпа', relations: enemies, color: '#fb7185' },
    ];
  }, [npcRelations]);

  return (
    <div className="space-y-3">
      {/* Karma track */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-slate-500 font-mono">Карма</span>
          <span
            className="text-xs font-bold font-mono"
            style={{ color: thumbColor, textShadow: `0 0 8px ${thumbColor}50` }}
          >
            {karma}
          </span>
        </div>
        <div className="karma-meter-track">
          <div
            className="karma-meter-thumb"
            style={{ left: `${thumbPos}%`, background: thumbColor, color: thumbColor }}
          />
        </div>
      </div>
      {/* Faction disposition bars */}
      <div className="space-y-2">
        {factionGroups.map((faction) => {
          const avg = faction.relations.length > 0
            ? Math.round(faction.relations.reduce((s, r) => s + r.value, 0) / faction.relations.length)
            : 0;
          return (
            <div key={faction.name}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] font-mono" style={{ color: `${faction.color}90` }}>{faction.name}</span>
                <span className="text-[9px] font-mono tabular-nums" style={{ color: `${faction.color}70` }}>{avg}</span>
              </div>
              <div className="faction-disposition-bar bg-slate-800/50">
                <div className="faction-disposition-center" />
                <motion.div
                  className="faction-disposition-fill"
                  style={{ background: faction.color, boxShadow: `0 0 4px ${faction.color}40` }}
                  initial={false}
                  animate={{ width: `${Math.max(2, avg)}%` }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SVG PLAYER PORTRAIT — Geometric / Cyberpunk style
   Vladimir Lebedev: Tired engineer-poet, angular features,
   stubble, slightly disheveled
   ══════════════════════════════════════════════════════════════ */
function PlayerPortrait() {
  const color = 'var(--cyber-cyan)'; // cyan-400
  const accent = '#06b6d4'; // cyan-500
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {/* Face outline — angular, slightly gaunt */}
      <path
        d="M28 24 L36 18 L44 18 L52 24 L55 40 L52 56 L44 62 L36 62 L28 56 L25 40 Z"
        fill="none" stroke={color} strokeWidth="1.5"
      />
      {/* Disheveled hair — messy lines */}
      <path d="M26 26 Q28 10 40 8 Q52 10 54 26" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 L28 16" stroke={color} strokeWidth="1" />
      <path d="M30 12 L28 20" stroke={color} strokeWidth="0.8" opacity="0.6" />
      <path d="M38 8 L36 16" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M44 8 L46 14" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M52 12 L50 18" stroke={color} strokeWidth="0.8" opacity="0.6" />
      <path d="M56 24 L52 16" stroke={color} strokeWidth="1" />
      {/* Tired eyes — slight bags */}
      <path d="M30 35 Q34 32 38 35" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 35 Q46 32 50 35" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="34.5" r="1.2" fill={color} opacity="0.8" />
      <circle cx="46" cy="34.5" r="1.2" fill={color} opacity="0.8" />
      {/* Eye bags — tired */}
      <path d="M30 36.5 Q34 38 38 36.5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M42 36.5 Q46 38 50 36.5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      {/* Nose — angular */}
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      {/* Stubble suggestion — dots */}
      <circle cx="34" cy="52" r="0.4" fill={color} opacity="0.2" />
      <circle cx="38" cy="54" r="0.4" fill={color} opacity="0.2" />
      <circle cx="42" cy="54" r="0.4" fill={color} opacity="0.2" />
      <circle cx="46" cy="52" r="0.4" fill={color} opacity="0.2" />
      <circle cx="36" cy="56" r="0.4" fill={color} opacity="0.15" />
      <circle cx="40" cy="57" r="0.4" fill={color} opacity="0.15" />
      <circle cx="44" cy="56" r="0.4" fill={color} opacity="0.15" />
      {/* Mouth — tired, slight downturn */}
      <path d="M35 50 Q40 48 45 50" fill="none" stroke={color} strokeWidth="1" />
      {/* Cybernetic accent — small circuit lines */}
      <line x1="55" y1="36" x2="60" y2="34" stroke={accent} strokeWidth="0.6" opacity="0.4" />
      <line x1="60" y1="34" x2="62" y2="36" stroke={accent} strokeWidth="0.6" opacity="0.4" />
      <circle cx="62" cy="36" r="0.8" fill={accent} opacity="0.5" />
      <line x1="25" y1="42" x2="20" y2="44" stroke={accent} strokeWidth="0.6" opacity="0.3" />
      <circle cx="20" cy="44" r="0.6" fill={accent} opacity="0.4" />
    </svg>
  );
}

/* ── Animated stat bar with glow and segment marks ── */
function CyberStatBar({
  value,
  max = 100,
  color,
  glowColor,
  showSegments = true }: {
  value: number;
  max?: number;
  color: string;
  glowColor: string;
  showSegments?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden">
      {showSegments && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="absolute top-0 bottom-0 w-px bg-slate-700/50"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      )}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 8px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}

/* ── Skill bar (smaller, for skills section) ── */
function SkillBar({ value, max = 100, color, label }: { value: number; max?: number; color: string; label: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 font-mono w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 4px ${color}40` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="text-[10px] text-slate-500 font-mono tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

/* ── Karma helpers ── */
function karmaColor(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'text-cyan-400';
  if (karma <= KARMA_LOW_THRESHOLD) return 'text-rose-400';
  return 'text-amber-400';
}

function karmaStroke(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'var(--cyber-cyan)';
  if (karma <= KARMA_LOW_THRESHOLD) return '#fb7185';
  return '#fbbf24';
}

function karmaBg(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'rgb(var(--cyber-cyan-rgb) / 0.08)';
  if (karma <= KARMA_LOW_THRESHOLD) return 'rgba(251,113,133,0.08)';
  return 'rgba(251,191,36,0.08)';
}

function karmaLabel(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'Свет';
  if (karma <= KARMA_LOW_THRESHOLD) return 'Тьма';
  return 'Баланс';
}

function karmaLabelFull(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'Светлая сторона';
  if (karma <= KARMA_LOW_THRESHOLD) return 'Тёмная сторона';
  return 'Баланс';
}

/* ── Karma Alignment Indicator ── */
function KarmaAlignmentIndicator({ karma }: { karma: number }) {
  const color = karmaStroke(karma);
  const alignment = karmaLabel(karma);
  const isLight = karma >= KARMA_HIGH_THRESHOLD;
  const isDark = karma <= KARMA_LOW_THRESHOLD;
  const isBalanced = !isLight && !isDark;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 56 56">
          {/* Outer ring */}
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="2" />
          {/* Progress arc */}
          <circle
            cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${(karma / 100) * (2 * Math.PI * 24)} ${2 * Math.PI * 24}`}
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
          />
          {/* Yin-Yang / alignment icon */}
          <text x="28" y="32" textAnchor="middle" fontSize="18" fill={color} className="select-none"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)`, transition: 'fill 0.5s ease' }}>
            {isLight ? '☀' : isDark ? '☽' : '☯'}
          </text>
          {/* Glow dots at cardinal points */}
          <circle cx="28" cy="4" r="1.5" fill={color} opacity={isLight ? 0.8 : 0.15}
            style={{ transition: 'opacity 0.5s ease, fill 0.5s ease' }} />
          <circle cx="52" cy="28" r="1.5" fill={color} opacity={isBalanced ? 0.8 : 0.15}
            style={{ transition: 'opacity 0.5s ease, fill 0.5s ease' }} />
          <circle cx="28" cy="52" r="1.5" fill={color} opacity={isDark ? 0.8 : 0.15}
            style={{ transition: 'opacity 0.5s ease, fill 0.5s ease' }} />
        </svg>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-widest ${karmaColor(karma)}`}
        style={{ textShadow: `0 0 6px ${color}40` }}>
        {alignment}
      </span>
    </div>
  );
}

/* ── NPC relationship bar ── */
function NpcRelationBar({ npcId, value }: { npcId: string; value: number }) {
  const npcDef = findNpcById(npcId);
  const name = npcDef?.name ?? npcId;
  const glowColor = npcDef?.appearance?.glowColor ?? '#94a3b8';

  const barColor = value >= 65
    ? 'bg-emerald-400'
    : value <= 30
      ? 'bg-rose-400'
      : 'bg-amber-400';
  const textColor = value >= 65
    ? 'text-emerald-400'
    : value <= 30
      ? 'text-rose-400'
      : 'text-amber-400';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 font-mono w-16 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          style={{
            boxShadow: `0 0 4px ${glowColor}40` }}
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className={`text-[10px] font-mono tabular-nums w-5 text-right ${textColor}`}>{value}</span>
    </div>
  );
}

/* ── Equipment slot icon ── */
const SLOT_CONFIG: Record<EquipmentSlot, { label: string; Icon: typeof HardHat }> = {
  weapon: { label: 'Оружие', Icon: Sword },
  head: { label: 'Голова', Icon: HardHat },
  body: { label: 'Тело', Icon: Shirt },
  legs: { label: 'Ноги', Icon: Activity },
  feet: { label: 'Обувь', Icon: Footprints },
  hands: { label: 'Руки', Icon: Zap },
  accessory: { label: 'Аксессуар', Icon: Gem } };

/* ── Skill display name mapping ── */
const SKILL_DISPLAY: Record<string, { label: string; color: string }> = {
  writing: { label: 'Поэзия', color: '#f59e0b' },      // amber-500
  coding: { label: 'Взлом', color: 'var(--cyber-cyan)' },         // cyan-400
  empathy: { label: 'Эмпатия', color: '#f472b6' },      // pink-400
  persuasion: { label: 'Улица', color: '#a78bfa' },     // violet-400
  intuition: { label: 'Храбрость', color: '#fb923c' },  // orange-400
  logic: { label: 'Интеллект', color: '#60a5fa' },      // blue-400
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export function CharacterProfilePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const {
    karma,
    energy,
    stress,
    skills,
    equippedItems,
    progression,
    credits,
    visitedNodes,
    inventory,
    npcRelations,
    collectedPoems,
    quests,
    timeOfDay } = useCharacterProfilePanelState();
  const { level, xp, xpToNextLevel, currentAct } = progression;
  const isLowEnergy = energy < 25;
  const isHighStress = stress > 70;

  // Completed quests count
  const completedQuests = quests.filter((q) => q.status === 'completed').length;

  // Keyboard handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С' || e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.PANEL }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

          <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-3xl mx-3 sm:mx-4"
            {...dialogProps}
          >
            <Card
              className="border backdrop-blur-md overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(15,23,42,0.94) 50%, rgba(2,6,23,0.96) 100%)',
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
                boxShadow: '0 0 30px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.05)' }}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-cyan-400/60" />
                  <h2 {...titleProps} className="text-base font-semibold text-slate-100 tracking-wide font-mono">
                    ПРОФИЛЬ ПЕРСОНАЖА
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 font-mono hidden sm:block">[C] закрыть</span>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleClose}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                    aria-label="Закрыть"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <CardContent className="p-0">
                {/* ── Two-column layout on desktop, stacked on mobile ── */}
                <div className="flex flex-col md:flex-row">

                  {/* ── LEFT COLUMN ── */}
                  <div className="flex-1 p-4 sm:p-5 space-y-5 border-b md:border-b-0 md:border-r border-slate-800/40">

                    {/* ── Biography ── */}
                    <BiographySection
                      karma={karma}
                      skills={skills as unknown as Record<string, number>}
                      currentAct={currentAct}
                      collectedPoems={collectedPoems}
                      npcRelations={npcRelations}
                    />

                    {/* ── Radar Chart ── */}
                    <div className="w-48 h-48 mx-auto">
                      <StatRadarChart skills={skills as unknown as Record<string, number>} />
                    </div>

                    {/* ── Character Header ── */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <motion.div
                        initial={{ x: -15, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 shrink-0 overflow-hidden"
                        style={{
                          borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.35)',
                          boxShadow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.15), 0 0 32px rgb(var(--cyber-cyan-rgb) / 0.05), inset 0 0 12px rgb(var(--cyber-cyan-rgb) / 0.05)',
                          background: 'radial-gradient(ellipse at center, rgb(var(--cyber-cyan-rgb) / 0.08) 0%, transparent 70%)' }}
                      >
                        <PlayerPortrait />
                      </motion.div>

                      {/* Name + title */}
                      <div className="flex flex-col min-w-0 pt-1">
                        <h3
                          className="text-lg font-bold text-slate-100 tracking-wide leading-tight"
                          style={{ textShadow: '0 0 10px rgb(var(--cyber-cyan-rgb) / 0.2)' }}
                        >
                          Владимир Лебедев
                        </h3>
                        <span className="text-[11px] text-cyan-400/70 font-mono mt-0.5">
                          Поэт между сменами
                        </span>
                        {/* Level + Act inline */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold font-mono"
                            style={{
                              borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
                              background: 'rgb(var(--cyber-cyan-rgb) / 0.08)',
                              color: 'var(--cyber-cyan)',
                              textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.4)' }}
                          >
                            <ChevronUp className="size-2.5" />
                            УР {level}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            АКТ {currentAct}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── XP Progress ── */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Опыт</span>
                        <span className="text-[10px] text-slate-500 font-mono tabular-nums">{xp}/{xpToNextLevel} XP</span>
                      </div>
                      <CyberStatBar
                        value={xp}
                        max={xpToNextLevel}
                        color="linear-gradient(90deg, #0e7490, var(--cyber-cyan))"
                        glowColor="rgb(var(--cyber-cyan-rgb) / 0.3)"
                        showSegments={false}
                      />
                    </div>

                    {/* ── Core Stats ── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="size-3 text-cyan-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Статусы</span>
                      </div>

                      {/* Karma */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${karmaColor(karma)}`}>Карма</span>
                          <span
                            className={`text-xs font-bold font-mono ml-auto ${karmaColor(karma)}`}
                            style={{ textShadow: `0 0 6px ${karmaStroke(karma)}40` }}
                          >
                            {karma}
                          </span>
                        </div>
                        <CyberStatBar
                          value={karma}
                          color={`linear-gradient(90deg, ${karmaStroke(karma)}80, ${karmaStroke(karma)})`}
                          glowColor={`${karmaStroke(karma)}40`}
                          showSegments={false}
                        />
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{karmaLabelFull(karma)}</span>
                      </div>

                      {/* Energy */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className={`size-3.5 ${isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}`} />
                          <span className={`text-xs ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`}>Энергия</span>
                          <span className={`text-xs font-mono ml-auto ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`}>
                            {energy}
                          </span>
                        </div>
                        <CyberStatBar
                          value={energy}
                          color={isLowEnergy
                            ? 'linear-gradient(90deg, #9f1239, #f43f5e)'
                            : 'linear-gradient(90deg, #059669, #34d399)'}
                          glowColor={isLowEnergy ? 'rgba(244,63,94,0.3)' : 'rgba(52,211,153,0.3)'}
                        />
                        {isLowEnergy && (
                          <span className="text-[9px] text-rose-400/70 font-mono mt-0.5 block">
                            ⚠ Низкая энергия
                          </span>
                        )}
                      </div>

                      {/* Stress */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className={`size-3.5 ${isHighStress ? 'text-rose-400' : 'text-amber-400'}`} />
                          <span className={`text-xs ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`}>Стресс</span>
                          <span className={`text-xs font-mono ml-auto ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`}>
                            {stress}
                          </span>
                        </div>
                        <CyberStatBar
                          value={stress}
                          color={isHighStress
                            ? 'linear-gradient(90deg, #9f1239, #f43f5e)'
                            : 'linear-gradient(90deg, #b45309, #f59e0b)'}
                          glowColor={isHighStress ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'}
                        />
                        {isHighStress && (
                          <span className="text-[9px] text-rose-400/70 font-mono mt-0.5 block">
                            ⚠ Высокий стресс
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Karma Alignment ── */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border"
                      style={{
                        background: karmaBg(karma),
                        borderColor: `${karmaStroke(karma)}25` }}
                    >
                      <KarmaAlignmentIndicator karma={karma} />
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-semibold ${karmaColor(karma)}`}
                          style={{ textShadow: `0 0 8px ${karmaStroke(karma)}40` }}>
                          {karmaLabelFull(karma)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono leading-tight">
                          {karma >= KARMA_HIGH_THRESHOLD
                            ? 'Ваши поступки несут свет другим'
                            : karma <= KARMA_LOW_THRESHOLD
                              ? 'Тьма притягивает — но выбор за вами'
                              : 'Равновесие — путь между светом и тьмой'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div className="flex-1 p-4 sm:p-5 space-y-5">

                    {/* ── Skills Section ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Star className="size-3 text-cyan-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Навыки</span>
                        <button
                          onClick={() => {
                            onClose();
                            setTimeout(() => {
                              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT' }));
                            }, 100);
                          }}
                          className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono transition-all hover:bg-cyan-950/40"
                          style={{
                            borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
                            color: 'rgb(var(--cyber-cyan-rgb) / 0.6)' }}
                        >
                          <Sparkles className="size-2.5" />
                          Дерево [T]
                        </button>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(SKILL_DISPLAY).map(([key, { label, color }]) => (
                          <SkillBar
                            key={key}
                            value={skills[key as keyof typeof skills] ?? 0}
                            color={color}
                            label={label}
                          />
                        ))}
                      </div>
                      {/* Skill points indicator */}
                      {progression.skillPoints > 0 && (
                        <div
                          className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded border"
                          style={{
                            borderColor: 'rgba(251,191,36,0.3)',
                            background: 'rgba(251,191,36,0.08)' }}
                        >
                          <Sparkles className="size-3 text-amber-400" />
                          <span className="text-[10px] text-amber-300 font-mono">
                            {progression.skillPoints} очков навыка доступно!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── Skill Tree Mini-Preview ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="size-3 text-cyan-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Дерево навыков</span>
                      </div>
                      <SkillTreeMiniPreview skills={skills as unknown as Record<string, number>} unlockedSkills={progression.unlockedSkills} />
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)' }} />

                    {/* ── Paper-Doll Equipment Display ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Shield className="size-3 text-amber-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Экипировка</span>
                      </div>
                      <PaperDollEquipment equippedItems={equippedItems} />
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)' }} />

                    {/* ── Karma Meter + Faction Disposition ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <BookOpen className="size-3 text-pink-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Отношения и карма</span>
                      </div>
                      <KarmaMeterWithDisposition karma={karma} npcRelations={npcRelations} />
                      {npcRelations.length > 0 && (
                        <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1"
                          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}
                        >
                          {npcRelations.map((rel) => (
                            <NpcRelationBar key={rel.npcId} npcId={rel.npcId} value={rel.value} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)' }} />

                    {/* ── Perks & Traits Section ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Brain className="size-3 text-amber-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Черты</span>
                        {progression.perkPoints > 0 && (
                          <span className="ml-auto text-[9px] text-amber-400 font-mono" style={{ textShadow: '0 0 6px rgba(251,191,36,0.3)' }}>
                            +{progression.perkPoints} очков
                          </span>
                        )}
                      </div>
                      {progression.unlockedPerks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {progression.unlockedPerks.map((perkId) => {
                            const perkDef = PERKS_MAP[perkId];
                            if (!perkDef) return null;
                            const catMeta = PERK_CATEGORY_META[perkDef.category];
                            return (
                              <div
                                key={perkId}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono"
                                style={{
                                  borderColor: `${catMeta?.color ?? 'var(--cyber-cyan)'}30`,
                                  background: `${catMeta?.color ?? 'var(--cyber-cyan)'}08`,
                                  color: catMeta?.color ?? 'var(--cyber-cyan)',
                                  boxShadow: `0 0 8px ${catMeta?.color ?? 'var(--cyber-cyan)'}10` }}
                                title={perkDef.description}
                              >
                                <span>{perkDef.icon}</span>
                                <span className="truncate max-w-[80px]">{perkDef.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Черты ещё не открыты</span>
                      )}
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)' }} />

                    {/* ── Resources ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Coins className="size-3 text-amber-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Ресурсы</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <LifetimeStat
                          icon={<Coins className="size-3 text-amber-400/60" />}
                          label="Кредиты"
                          value={`${credits ?? 0}₽`}
                        />
                        <LifetimeStat
                          icon={<Sparkles className="size-3 text-amber-400/60" />}
                          label="Очки черт"
                          value={String(progression.perkPoints ?? 0)}
                        />
                        <LifetimeStat
                          icon={<Flame className="size-3 text-emerald-400/60" />}
                          label="Очки навыков"
                          value={String(progression.skillPoints ?? 0)}
                        />
                        <LifetimeStat
                          icon={<Swords className="size-3 text-rose-400/60" />}
                          label="Акт"
                          value={String(currentAct)}
                        />
                      </div>
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)' }} />

                    {/* ── Lifetime Stats ── */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Trophy className="size-3 text-amber-500/40" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Статистика</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <LifetimeStat
                          icon={<BookOpen className="size-3 text-amber-400/60" />}
                          label="Стихи"
                          value={`${collectedPoems.length}/${TOTAL_POEMS}`}
                        />
                        <LifetimeStat
                          icon={<Trophy className="size-3 text-emerald-400/60" />}
                          label="Задания"
                          value={String(completedQuests)}
                        />
                        <LifetimeStat
                          icon={<Package className="size-3 text-cyan-400/60" />}
                          label="Предметы"
                          value={String(inventory.length)}
                        />
                        <LifetimeStat
                          icon={<Footprints className="size-3 text-violet-400/60" />}
                          label="Сцены"
                          value={String(visitedNodes.length)}
                        />
                        <LifetimeStat
                          icon={<Wind className="size-3 text-sky-400/60" />}
                          label="Черты"
                          value={`${progression.unlockedPerks?.length ?? 0}/${Object.keys(PERKS_MAP).length}`}
                        />
                        <LifetimeStat
                          icon={<Brain className="size-3 text-fuchsia-400/60" />}
                          label="Навыки"
                          value={`${Object.values(skills).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Footer ── */}
                <div
                  className="h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.1), transparent)' }}
                />
                <div className="flex items-center justify-between px-5 py-2">
                  <span className="text-[9px] text-slate-600 font-mono">volodka://profile</span>
                  <span className="text-[9px] text-slate-600 font-mono tabular-nums">
                    {Math.floor(timeOfDay).toString().padStart(2, '0')}:{((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Lifetime stat mini-card ── */
function LifetimeStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-800/30"
      style={{ background: 'rgba(15,23,42,0.4)' }}
    >
      {icon}
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] text-slate-500 font-mono uppercase">{label}</span>
        <span className="text-xs text-slate-200 font-mono font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  );
}
