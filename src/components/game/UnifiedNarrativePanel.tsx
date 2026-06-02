'use client';

/* ─── Volodka RPG – Unified Narrative Panel ───
 * A single cohesive interface for ALL narrative content:
 * - NPC dialogues
 * - Story narration
 * - Object examinations
 * - Environmental descriptions
 * 
 * Instead of scattered popups, everything flows in one continuous
 * "story feed" that maintains context and narrative continuity.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  Zap,
  Shield,
  Skull,
  Circle,
  Clock,
  FastForward,
  History,
  Eye,
  MessageCircle,
  User,
  Package,
  Ghost,
  ScrollText,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { STORY_NODES } from '@/data/storyNodes';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useTypewriter } from '@/hooks/useTypewriter';
import { applyEffects } from '@/shared/utils/applyEffects';
import type {
  DialogueChoice,
  StoryEffect,
  PlayerSkills,
  TrainablePlayerSkill,
  NPCRelation,
} from '@/shared/types/game';

/* ══════════════════════════════════════════════════════════════
   SVG NPC PORTRAITS — stylized line art
   ══════════════════════════════════════════════════════════════ */

const NPC_PORTRAIT_COLORS: Record<string, { primary: string; glow: string; accent: string; bg: string }> = {
  albert: { primary: '#8b9dc3', glow: 'rgba(139,157,195,0.4)', accent: '#6b7db3', bg: 'rgba(139,157,195,0.1)' },
  zarema: { primary: '#e8a87c', glow: 'rgba(232,168,124,0.4)', accent: '#d4896a', bg: 'rgba(232,168,124,0.1)' },
  maria: { primary: '#c77dba', glow: 'rgba(199,125,186,0.4)', accent: '#a85d99', bg: 'rgba(199,125,186,0.1)' },
  office_dmitry: { primary: '#7dad7a', glow: 'rgba(125,173,122,0.4)', accent: '#5d8d5a', bg: 'rgba(125,173,122,0.1)' },
  office_alexander: { primary: '#6b8fc4', glow: 'rgba(107,143,196,0.4)', accent: '#4a6fa4', bg: 'rgba(107,143,196,0.1)' },
  office_colleague: { primary: '#a0926b', glow: 'rgba(160,146,107,0.4)', accent: '#80724b', bg: 'rgba(160,146,107,0.1)' },
  cafe_barista: { primary: '#c4956a', glow: 'rgba(196,149,106,0.4)', accent: '#a4754a', bg: 'rgba(196,149,106,0.1)' },
};

/* ── NPC Portrait SVG Components ── */
function AlbertPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M25 22 L40 16 L55 22 L58 42 L55 58 L40 64 L25 58 L22 42 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q30 10 40 12 Q50 10 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <rect x="28" y="32" width="10" height="7" rx="1" fill="none" stroke={color} strokeWidth="1.2" />
      <rect x="42" y="32" width="10" height="7" rx="1" fill="none" stroke={color} strokeWidth="1.2" />
      <line x1="38" y1="35" x2="42" y2="35" stroke={color} strokeWidth="1" />
      <circle cx="33" cy="35.5" r="1.2" fill={color} opacity="0.7" />
      <circle cx="47" cy="35.5" r="1.2" fill={color} opacity="0.7" />
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M35 52 Q40 55 45 52" fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function ZaremaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M20 28 Q20 10 40 10 Q60 10 60 28 L62 60 Q50 68 40 68 Q30 68 18 60 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M32 36 Q35 33 38 36" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M42 36 Q45 33 48 36" fill="none" stroke={color} strokeWidth="1.3" />
      <circle cx="35" cy="36" r="1" fill={color} opacity="0.8" />
      <circle cx="45" cy="36" r="1" fill={color} opacity="0.8" />
      <path d="M40 40 L39 45 Q40 46 41 45" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M34 50 Q40 55 46 50" fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function MariaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M28 24 L38 18 L42 18 L52 24 L54 42 L50 56 L40 60 L30 56 L26 42 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 28 Q26 12 40 10 Q54 12 54 28 L52 22 Q48 14 40 14 Q32 14 28 22 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M30 34 L38 32 L38 36 L30 36 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 32 L50 34 L50 36 L42 36 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="35" cy="34.5" r="1.5" fill={color} />
      <circle cx="45" cy="34.5" r="1.5" fill={color} />
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M35 52 L45 52" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function DmitryPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 28 Q26 18 40 16 Q54 18 54 28 L56 44 Q56 58 40 62 Q24 58 24 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 26 Q28 14 40 12 Q52 14 54 26" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M30 36 Q34 33 38 36" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 36 Q46 33 50 36" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="35.5" r="1.2" fill={color} opacity="0.6" />
      <circle cx="46" cy="35.5" r="1.2" fill={color} opacity="0.6" />
      <path d="M40 40 L38 46 Q40 48 42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M28 48 Q28 58 40 64 Q52 58 52 48" fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function AlexanderPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 24 L36 16 L44 16 L54 24 L56 40 L54 54 L48 60 L32 60 L26 54 L24 40 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q26 8 40 8 Q54 8 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M29 34 L39 33 L39 35 L29 35 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M41 33 L51 34 L51 35 L41 35 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="34" r="1" fill={color} opacity="0.9" />
      <circle cx="46" cy="34" r="1" fill={color} opacity="0.9" />
      <path d="M40 36 L37 46 L43 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M34 52 L46 52" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function ColleaguePortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M28 24 Q28 18 40 16 Q52 18 52 24 L54 44 Q54 56 40 60 Q26 56 26 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 26 Q22 10 40 8 Q58 10 56 26" fill="none" stroke={color} strokeWidth="1.5" />
      <ellipse cx="33" cy="35" rx="3.5" ry="2.5" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="47" cy="34" rx="3.5" ry="2.5" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="34" cy="35" r="1.2" fill={color} opacity="0.7" />
      <circle cx="48" cy="34" r="1.2" fill={color} opacity="0.7" />
      <path d="M40 38 L39 44 Q40 45 41 44" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M35 50 Q40 48 45 50" fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function BaristaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 26 Q26 16 40 14 Q54 16 54 26 L56 44 Q56 58 40 62 Q24 58 24 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M30 34 Q34 31 38 34" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 34 Q46 31 50 34" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="33.5" r="1.3" fill={color} opacity="0.8" />
      <circle cx="46" cy="33.5" r="1.3" fill={color} opacity="0.8" />
      <path d="M40 38 L39 44 Q40 45 41 44" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M32 50 Q40 56 48 50" fill="none" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

/* ── Portrait renderer by NPC ID ── */
function NPCPortrait({ npcId, size = 'md' }: { npcId: string; size?: 'sm' | 'md' | 'lg' }) {
  const colors = NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista;
  const sizeMap = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-20 h-20' };

  const renderSvg = () => {
    switch (npcId) {
      case 'albert': return <AlbertPortrait color={colors.primary} />;
      case 'zarema': return <ZaremaPortrait color={colors.primary} />;
      case 'maria': return <MariaPortrait color={colors.primary} />;
      case 'office_dmitry': return <DmitryPortrait color={colors.primary} />;
      case 'office_alexander': return <AlexanderPortrait color={colors.primary} />;
      case 'office_colleague': return <ColleaguePortrait color={colors.primary} />;
      case 'cafe_barista': return <BaristaPortrait color={colors.primary} />;
      default: return <AlbertPortrait color={colors.primary} />;
    }
  };

  return (
    <div
      className={`relative ${sizeMap[size]} shrink-0 rounded-xl overflow-hidden`}
      style={{
        border: `1.5px solid ${colors.primary}66`,
        boxShadow: `0 0 12px ${colors.glow}`,
        background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
      }}
    >
      {renderSvg()}
    </div>
  );
}

/* ── Emotion detection from text ── */
function detectEmotion(text: string): 'calm' | 'angry' | 'sad' | 'happy' | 'mysterious' {
  if (text.includes('!') && (text.includes('ненави') || text.includes('боюсь') || text.includes('не могу'))) return 'angry';
  if (text.includes('...') && (text.includes('устал') || text.includes('потер') || text.includes('одинок'))) return 'sad';
  if (text.includes('!') && (text.includes('рад') || text.includes('найдём') || text.includes('обещаю'))) return 'happy';
  if (text.includes('?') && text.length > 100) return 'mysterious';
  return 'calm';
}

const EMOTION_BORDER: Record<string, string> = {
  calm: 'border-slate-500/50',
  angry: 'border-red-500/70',
  sad: 'border-blue-500/60',
  happy: 'border-amber-500/60',
  mysterious: 'border-violet-500/60',
};

/* ── Relationship indicator ── */
function getRelationLevel(npcId: string, relations: NPCRelation[]): 'ally' | 'neutral' | 'enemy' {
  const rel = relations.find((r) => r.npcId === npcId);
  if (!rel) return 'neutral';
  if (rel.value >= 65) return 'ally';
  if (rel.value <= 30) return 'enemy';
  return 'neutral';
}

const RELATION_GLOW: Record<string, { color: string; shadow: string }> = {
  ally: { color: '#34d399', shadow: '0 0 8px rgba(52,211,153,0.4)' },
  neutral: { color: '#22d3ee', shadow: '0 0 8px rgba(34,211,238,0.4)' },
  enemy: { color: '#fb7185', shadow: '0 0 8px rgba(251,113,133,0.4)' },
};

/* ── Skill check ── */
function performSkillCheck(skill: TrainablePlayerSkill, difficulty: number, playerSkills: PlayerSkills): boolean {
  return (playerSkills[skill] ?? 0) >= difficulty;
}

/* ── Condition check for dialogue choices ── */
function checkDialogueCondition(
  condition: DialogueChoice['condition'],
  playerState: { karma: number; skills: PlayerSkills; flags: Record<string, boolean>; progression: { currentAct: number } },
  npcRelations: NPCRelation[],
  npcId?: string,
  timeOfDay?: number,
): {
  pass: boolean;
  skillCheckResult?: { skill: TrainablePlayerSkill; difficulty: number; success: boolean };
  skillCheckNeeded?: { skill: TrainablePlayerSkill; needed: number; current: number };
  relationNeeded?: { needed: number; current: number };
  actNeeded?: { needed: number; current: number };
} {
  if (!condition) return { pass: true };
  if (condition.requiredAct !== undefined && playerState.progression.currentAct < condition.requiredAct) {
    return { pass: false, actNeeded: { needed: condition.requiredAct, current: playerState.progression.currentAct } };
  }
  if (timeOfDay !== undefined) {
    if (condition.minTimeOfDay !== undefined && timeOfDay < condition.minTimeOfDay) return { pass: false };
    if (condition.maxTimeOfDay !== undefined && timeOfDay > condition.maxTimeOfDay) return { pass: false };
  }
  if (condition.minKarma !== undefined && playerState.karma < condition.minKarma) return { pass: false };
  if (condition.maxKarma !== undefined && playerState.karma > condition.maxKarma) return { pass: false };
  if (condition.flag && !playerState.flags[condition.flag]) return { pass: false };
  if (condition.minNpcRelation !== undefined && npcId) {
    const rel = npcRelations.find((r) => r.npcId === npcId);
    const currentRel = rel?.value ?? 50;
    if (currentRel < condition.minNpcRelation) {
      return { pass: false, relationNeeded: { needed: condition.minNpcRelation, current: currentRel } };
    }
  }
  if (condition.minSkill) {
    for (const [skill, needed] of Object.entries(condition.minSkill)) {
      const current = playerState.skills[skill as TrainablePlayerSkill] ?? 0;
      if (current < (needed as number)) {
        return { pass: false, skillCheckNeeded: { skill: skill as TrainablePlayerSkill, needed: needed as number, current } };
      }
    }
  }
  if (condition.minSkillCheck) {
    const { skill, difficulty } = condition.minSkillCheck;
    const success = performSkillCheck(skill, difficulty, playerState.skills);
    return { pass: success, skillCheckResult: { skill, difficulty, success } };
  }
  return { pass: true };
}

/* ── Impact preview for choices ── */
interface ChoiceImpact {
  karma: number;
  energy: number;
  stress: number;
  npcRelation: { npcId: string; value: number } | null;
  skills: { skill: string; value: number }[];
}

function getChoiceImpact(effects: StoryEffect[] | undefined, npcId?: string): ChoiceImpact {
  if (!effects) return { karma: 0, energy: 0, stress: 0, npcRelation: null, skills: [] };
  let karma = 0, energy = 0, stress = 0;
  let npcRelation: ChoiceImpact['npcRelation'] = null;
  const skills: ChoiceImpact['skills'] = [];
  for (const fx of effects) {
    if (fx.type === 'addKarma' && fx.value) karma += fx.value;
    if (fx.type === 'addStat') {
      if (fx.stat === 'energy' && fx.value) energy += fx.value;
      if (fx.stat === 'stress' && fx.value) stress += fx.value;
    }
    if (fx.type === 'addSkill' && fx.skill && fx.value) {
      skills.push({ skill: fx.skill, value: fx.value });
    }
    if (fx.type === 'npcChange' && fx.npcChange?.relation) {
      const targetNpc = fx.npcId || npcId;
      if (targetNpc) npcRelation = { npcId: targetNpc, value: fx.npcChange.relation };
    }
  }
  return { karma, energy, stress, npcRelation, skills };
}

/* ══════════════════════════════════════════════════════════════
   NARRATIVE HISTORY ENTRY — Individual entry in the feed
   ══════════════════════════════════════════════════════════════ */

interface NarrativeHistoryEntryProps {
  speaker?: string;
  speakerId?: string;
  text: string;
  type: 'dialogue' | 'story' | 'examine' | 'player_choice';
  emotion?: 'calm' | 'angry' | 'sad' | 'happy' | 'mysterious';
  icon?: string;
  detailText?: string;
  timestamp: number;
  isLatest: boolean;
}

function NarrativeHistoryEntry({
  speaker,
  speakerId,
  text,
  type,
  emotion = 'calm',
  icon,
  detailText,
  timestamp,
  isLatest,
}: NarrativeHistoryEntryProps) {
  const isPlayer = type === 'player_choice';
  const isExamine = type === 'examine';
  const isNarrator = speaker === 'narrator' || speaker === 'Голос';

  // Get NPC colors if available
  const npcColors = speakerId ? NPC_PORTRAIT_COLORS[speakerId] : null;

  // Accent color based on entry type
  const accentColor = isPlayer
    ? '#22d3ee' // cyan for player
    : isExamine
      ? '#fbbf24' // amber for examine
      : npcColors?.primary ?? '#94a3b8';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative mb-3 ${isLatest ? 'ring-1 ring-cyan-500/20 rounded-lg' : ''}`}
    >
      <div
        className="flex gap-3 p-3 rounded-lg"
        style={{
          background: isLatest
            ? `linear-gradient(135deg, ${accentColor}08 0%, transparent 100%)`
            : 'transparent',
        }}
      >
        {/* Portrait / Icon */}
        <div className="shrink-0">
          {isExamine && icon ? (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{
                background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {icon}
            </div>
          ) : isNarrator ? (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700/30">
              <Ghost className="size-5 text-slate-400/60" />
            </div>
          ) : isPlayer ? (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-900/30 border border-cyan-500/30">
              <User className="size-5 text-cyan-400/60" />
            </div>
          ) : speakerId ? (
            <NPCPortrait npcId={speakerId} size="sm" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700/30">
              <MessageCircle className="size-5 text-slate-400/60" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Speaker name + timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-medium"
              style={{ color: accentColor }}
            >
              {isPlayer ? 'Володька' : speaker ?? '???'}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              {formatTime(timestamp)}
            </span>
            {isLatest && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                текущее
              </span>
            )}
          </div>

          {/* Main text */}
          <p className="text-sm text-slate-300/90 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>

          {/* Detail text for examine entries */}
          {isExamine && detailText && (
            <p className="mt-2 text-xs text-slate-400/70 italic leading-relaxed">
              {detailText}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UNIFIED NARRATIVE PANEL — Main component
   ══════════════════════════════════════════════════════════════ */

interface NarrativeEntryRecord {
  speaker?: string;
  speakerId?: string;
  text: string;
  type: 'dialogue' | 'story' | 'examine' | 'player_choice';
  emotion?: 'calm' | 'angry' | 'sad' | 'happy' | 'mysterious';
  icon?: string;
  detailText?: string;
  timestamp: number;
}

export function UnifiedNarrativePanel() {
  const mode = useGameStore((s) => s.mode);
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const playerState = useGameStore((s) => s.playerState);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const setShowStoryOverlay = useGameStore((s) => s.setShowStoryOverlay);
  const setCurrentNodeId = useGameStore((s) => s.setCurrentNodeId);

  // Narrative history (chat-log style)
  const [history, setHistory] = useState<NarrativeEntryRecord[]>([]);
  const [skillCheckBanner, setSkillCheckBanner] = useState<{
    skill: TrainablePlayerSkill;
    success: boolean;
  } | null>(null);

  // Auto-advance mode
  const [autoAdvance, setAutoAdvance] = useState(false);
  const autoAdvanceDelay = 2500;

  // Examine mode state
  const [examineData, setExamineData] = useState<{
    title: string;
    description: string;
    detailText?: string;
    icon?: string;
    triggerZoneId?: string;
    hasLinkedContent?: boolean;
  } | null>(null);

  // Determine what content to show
  const isDialogue = !!DIALOGUE_NODES[currentNodeId];
  const isStory = !!STORY_NODES[currentNodeId];
  const node = useMemo(() => {
    if (isDialogue) return DIALOGUE_NODES[currentNodeId];
    if (isStory) return STORY_NODES[currentNodeId];
    return null;
  }, [currentNodeId, isDialogue, isStory]);

  const isOpen = showStoryOverlay && (!!node || !!examineData);

  // Typewriter effect
  const mainText = examineData?.description ?? node?.text ?? '';
  const { displayed, done, skip } = useTypewriter(mainText, 28);

  // Track applied node effects
  const appliedRef = useRef<string | null>(null);

  // Add entry to history when node changes
  useEffect(() => {
    if (examineData) {
      // Add examine entry
      setHistory((prev) => [
        ...prev,
        {
          speaker: examineData.title,
          text: examineData.description,
          type: 'examine' as const,
          icon: examineData.icon,
          detailText: examineData.detailText,
          timestamp: Date.now(),
        },
      ]);
      appliedRef.current = `examine-${examineData.title}`;
      return;
    }

    if (node && appliedRef.current !== node.id) {
      appliedRef.current = node.id;

      // Add to history
      if (node.speaker && node.text) {
        const npcDef = NPC_DEFINITIONS.find((n) => n.name === node.speaker);
        const speakerId = npcDef?.id ?? node.speaker.toLowerCase().replace(/\s+/g, '_');
        const emotion = detectEmotion(node.text);

        setHistory((prev) => [
          ...prev,
          {
            speaker: node.speaker,
            speakerId,
            text: node.text,
            type: isDialogue ? 'dialogue' : 'story',
            emotion,
            timestamp: Date.now(),
          },
        ]);

        // Emit npc:talked event
        eventBus.emit('npc:talked', { npcId: speakerId, dialogueNodeId: node.id });
      }

      // Apply node effects
      if (node.effects) {
        applyEffects(node.effects);
      }
    }
  }, [node, examineData, isDialogue]);

  // Close narrative
  const handleClose = useCallback(() => {
    audioEngine.playSfx('ui_close');
    setShowStoryOverlay(false);
    setExamineData(null);
  }, [setShowStoryOverlay]);

  // Handle dialogue choice
  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      audioEngine.playSfx('confirm');

      // Check skill before applying effects
      if (choice.condition?.minSkillCheck) {
        const result = performSkillCheck(
          choice.condition.minSkillCheck.skill,
          choice.condition.minSkillCheck.difficulty,
          playerState.skills
        );
        setSkillCheckBanner({ skill: choice.condition.minSkillCheck.skill, success: result });
        setTimeout(() => setSkillCheckBanner(null), 1500);
        if (!result) return;
      }

      // Record player choice in history
      setHistory((prev) => [
        ...prev,
        {
          speaker: 'Володька',
          text: choice.text,
          type: 'player_choice' as const,
          timestamp: Date.now(),
        },
      ]);

      // Apply effects
      if (choice.effects) {
        applyEffects(choice.effects);
      }

      // Advance to next node or close
      if (choice.next === null) {
        setShowStoryOverlay(false);
        setExamineData(null);
      } else {
        setCurrentNodeId(choice.next);
        setExamineData(null);
      }
    },
    [setShowStoryOverlay, setCurrentNodeId, playerState.skills]
  );

  // Continue from examine
  const handleExamineContinue = useCallback(() => {
    if (!examineData?.hasLinkedContent) {
      setExamineData(null);
      return;
    }

    // Find trigger zone and trigger linked content
    audioEngine.playSfx('confirm');
    setExamineData(null);
  }, [examineData]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance || !done || !node || (isDialogue && node.choices?.length === 0)) return;

    const currentNpcDef = NPC_DEFINITIONS.find((n) => n.name === node.speaker);
    const currentNpcId = currentNpcDef?.id ?? '';

    const timer = setTimeout(() => {
      if (isDialogue && node.choices?.length > 0) {
        const availableChoice = node.choices.find((c) => {
          const cond = checkDialogueCondition(c.condition, playerState, npcRelations, currentNpcId, timeOfDay);
          return cond.pass;
        });
        if (availableChoice) handleChoice(availableChoice);
      } else if (isStory) {
        // For story nodes, auto-continue
        if (node.choices?.length === 0) {
          setShowStoryOverlay(false);
        }
      }
    }, autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, [autoAdvance, done, node, playerState, npcRelations, timeOfDay, handleChoice, isDialogue, isStory, setShowStoryOverlay]);

  if (!isOpen) return null;

  // Determine NPC info
  const npcDef = node?.speaker ? NPC_DEFINITIONS.find((n) => n.name === node.speaker) : null;
  const npcId = npcDef?.id ?? '';
  const portraitColors = npcId ? (NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista) : NPC_PORTRAIT_COLORS.cafe_barista;
  const emotion = examineData ? 'calm' : node?.text ? detectEmotion(node.text) : 'calm';
  const emotionBorder = EMOTION_BORDER[emotion] || EMOTION_BORDER.calm;
  const relationLevel = npcId ? getRelationLevel(npcId, npcRelations) : 'neutral';
  const RelationIcon = relationLevel === 'ally' ? Shield : relationLevel === 'enemy' ? Skull : Circle;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 flex items-end sm:items-center justify-center"
        style={{ zIndex: UI_LAYERS.DIALOGUE }}
        onClick={done ? undefined : skip}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-[6%] bg-black/90" />
        <div className="absolute bottom-0 left-0 right-0 h-[6%] bg-black/90" />

        {/* Main panel */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-2xl mx-3 mb-3 sm:mx-auto sm:mb-0"
        >
          <div
            className={`relative border-2 ${emotionBorder} backdrop-blur-md overflow-hidden transition-colors duration-500`}
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
              boxShadow: '0 0 30px rgba(34,211,238,0.08), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
              <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/30">
                volodka://narrative
              </span>
              <div className="flex-1" />

              {/* Auto-advance toggle */}
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  autoAdvance ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Авто-продолжение"
              >
                <FastForward className="size-2.5" />
                Авто
              </button>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="text-slate-500 hover:text-white hover:bg-rose-500/20 rounded p-0.5 transition-colors"
                aria-label="Закрыть"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)' }}
            />

            {/* Content area */}
            <div className="relative z-0 flex flex-col max-h-[70vh]">
              {/* Narrative history (scrollable) */}
              {history.length > 1 && (
                <div className="flex-shrink-0 max-h-32 overflow-y-auto px-4 pt-3 border-b border-slate-800/30">
                  <div className="text-[8px] text-slate-500 font-mono uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="size-2.5" />
                    История
                  </div>
                  {history.slice(0, -1).map((entry, i) => (
                    <NarrativeHistoryEntry
                      key={`history-${i}-${entry.timestamp}`}
                      {...entry}
                      isLatest={false}
                    />
                  ))}
                </div>
              )}

              {/* Current entry */}
              <div className="flex-1 p-4">
                {examineData ? (
                  /* ── Examine Mode ── */
                  <div className="flex flex-col items-center text-center py-4">
                    {/* Object icon */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl mb-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        boxShadow: '0 0 20px rgba(251,191,36,0.1)',
                      }}
                    >
                      {examineData.icon || '🔍'}
                    </motion.div>

                    {/* Title */}
                    <h2
                      className="text-lg font-bold mb-2"
                      style={{ color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.3)' }}
                    >
                      {examineData.title}
                    </h2>

                    {/* Description */}
                    <p className="text-slate-300/90 leading-relaxed max-w-md">
                      {displayed}
                      {!done && (
                        <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-amber-400 animate-pulse" />
                      )}
                    </p>

                    {/* Detail text */}
                    {done && examineData.detailText && (
                      <p className="mt-3 text-sm text-slate-400/70 italic max-w-md">
                        {examineData.detailText}
                      </p>
                    )}

                    {/* Continue button */}
                    {done && examineData.hasLinkedContent && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleExamineContinue}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors"
                      >
                        <ChevronRight className="size-4" />
                        Продолжить
                        <span className="text-xs text-amber-400/60">[E]</span>
                      </motion.button>
                    )}
                  </div>
                ) : node ? (
                  /* ── Dialogue/Story Mode ── */
                  <div>
                    {/* Speaker info */}
                    <div className="flex items-center gap-3 mb-4">
                      {npcId ? (
                        <NPCPortrait npcId={npcId} size="md" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl border-2 border-slate-600/50 flex items-center justify-center text-xl font-bold text-slate-400 bg-slate-800/50 shrink-0">
                          ?
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium text-sm tracking-wide uppercase"
                            style={{ color: portraitColors.primary }}
                          >
                            {node.speaker ?? '???'}
                          </span>
                          {npcId && (
                            <RelationIcon
                              className={`size-3.5 ${
                                relationLevel === 'ally' ? 'text-emerald-400' : relationLevel === 'enemy' ? 'text-red-400' : 'text-slate-400'
                              }`}
                            />
                          )}
                        </div>
                        {emotion !== 'calm' && (
                          <span className="text-[10px] uppercase tracking-widest text-slate-500/50">
                            {emotion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skill check banner */}
                    <AnimatePresence>
                      {skillCheckBanner && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mb-3 px-3 py-2 rounded text-sm font-medium ${
                            skillCheckBanner.success
                              ? 'bg-emerald-900/40 border border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-900/40 border border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {skillCheckBanner.success
                            ? `✓ Проверка пройдена: ${skillCheckBanner.skill}`
                            : `✗ Проверка не пройдена: ${skillCheckBanner.skill}`}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Dialogue text */}
                    <div className="min-h-[60px] mb-4">
                      <p className="text-slate-100 leading-relaxed">
                        {displayed}
                        {!done && (
                          <span
                            className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                            style={{
                              background: 'rgba(34,211,238,0.8)',
                              boxShadow: '0 0 4px rgba(34,211,238,0.6)',
                              animation: 'dialogue-cursor-blink 0.8s step-end infinite',
                            }}
                          />
                        )}
                      </p>
                    </div>

                    {/* Choices */}
                    {done && isDialogue && node.choices && node.choices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-2"
                      >
                        {node.choices.map((choice, i) => {
                          const cond = checkDialogueCondition(choice.condition, playerState, npcRelations, npcId, timeOfDay);
                          const impact = getChoiceImpact(choice.effects, npcId);
                          const hasImpact = impact.karma !== 0 || impact.energy !== 0 || impact.stress !== 0 || impact.npcRelation !== null || impact.skills.length > 0;

                          return (
                            <motion.button
                              key={`${currentNodeId}-choice-${i}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              onClick={() => handleChoice(choice)}
                              disabled={!cond.pass}
                              className={`
                                group relative text-left pl-7 pr-4 py-2.5 border transition-all duration-200 text-sm overflow-hidden rounded-lg
                                ${cond.pass
                                  ? 'border-cyan-800/50 bg-cyan-950/20 hover:bg-cyan-900/30 hover:border-cyan-600/60 text-slate-100 cursor-pointer'
                                  : 'border-slate-700/30 bg-slate-900/10 text-slate-500 cursor-not-allowed opacity-50'
                                }
                              `}
                            >
                              {/* Number badge */}
                              <span
                                className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded ${
                                  cond.pass
                                    ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/20'
                                    : 'bg-slate-800/40 text-slate-500 border border-slate-700/20'
                                }`}
                              >
                                {i + 1}
                              </span>

                              <span className="flex-1">{choice.text}</span>

                              {/* Impact preview */}
                              {hasImpact && cond.pass && (
                                <span className="flex items-center gap-1 ml-2 text-[10px] text-slate-400">
                                  {impact.karma !== 0 && (
                                    <span className={impact.karma > 0 ? 'text-cyan-400' : 'text-rose-400'}>
                                      {impact.karma > 0 ? '+' : ''}{impact.karma}☯
                                    </span>
                                  )}
                                  {impact.npcRelation && (
                                    <span className={impact.npcRelation.value > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                      {impact.npcRelation.value > 0 ? '+' : ''}{impact.npcRelation.value}♥
                                    </span>
                                  )}
                                </span>
                              )}

                              {/* Condition requirement */}
                              {!cond.pass && cond.skillCheckNeeded && (
                                <span className="flex items-center gap-1 ml-2 text-[10px] text-rose-400">
                                  <Zap className="size-3" />
                                  {cond.skillCheckNeeded.skill} {cond.skillCheckNeeded.needed}
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Story choices */}
                    {done && isStory && node.choices && node.choices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-2"
                      >
                        {node.choices.map((choice, i) => (
                          <motion.button
                            key={`${currentNodeId}-story-choice-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => {
                              if (choice.effects) applyEffects(choice.effects);
                              if (choice.next === 'explore_mode' || choice.next === null) {
                                setShowStoryOverlay(false);
                              } else if (choice.next) {
                                setCurrentNodeId(choice.next);
                              }
                            }}
                            className="group relative text-left px-5 py-3 rounded-lg border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center">
                                {i + 1}
                              </span>
                              <span className="flex-1">{choice.text}</span>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    {/* Continue button for story without choices */}
                    {done && isStory && (!node.choices || node.choices.length === 0) && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setShowStoryOverlay(false)}
                        className="flex items-center gap-2 px-5 py-3 rounded-lg border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-slate-100 transition-colors"
                      >
                        <ChevronRight className="size-4" />
                        Продолжить
                      </motion.button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800/30 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-slate-600 font-mono">
                  volodka://narrative
                </span>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <span className="text-[8px] text-slate-500">
                      {history.length} {history.length === 1 ? 'запись' : history.length < 5 ? 'записи' : 'записей'}
                    </span>
                  )}
                  <kbd className="text-[8px] text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-700/30 bg-slate-800/40">
                    ESC
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
