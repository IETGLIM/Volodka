
/* ─── Volodka RPG – NPC dialogue overlay (AAA+ v2) ───
   Enhanced with: colored speaker name background, dialogue history,
   auto-advance mode, improved hover preview with effect details,
   better stat change highlighting.
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Zap, Shield, Skull, Circle, Clock, FastForward, History, Eye } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { createInventoryItem } from '@/data/items';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
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

/* ── Albert: Geometric/angular face, glasses, neat hair ── */
function AlbertPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M25 22 L40 16 L55 22 L58 42 L55 58 L40 64 L25 58 L22 42 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q30 10 40 12 Q50 10 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 20 Q32 8 40 10 Q48 8 54 20" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="16" x2="30" y2="22" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="36" y1="14" x2="36" y2="20" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="44" y1="14" x2="44" y2="20" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="50" y1="16" x2="50" y2="22" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <rect x="28" y="32" width="10" height="7" rx="1" fill="none" stroke={color} strokeWidth="1.2" />
      <rect x="42" y="32" width="10" height="7" rx="1" fill="none" stroke={color} strokeWidth="1.2" />
      <line x1="38" y1="35" x2="42" y2="35" stroke={color} strokeWidth="1" />
      <line x1="24" y1="35" x2="28" y2="35" stroke={color} strokeWidth="0.8" />
      <line x1="52" y1="35" x2="56" y2="35" stroke={color} strokeWidth="0.8" />
      <circle cx="33" cy="35.5" r="1.2" fill={color} opacity="0.7" />
      <circle cx="47" cy="35.5" r="1.2" fill={color} opacity="0.7" />
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M35 52 Q40 55 45 52" fill="none" stroke={color} strokeWidth="1" />
      <path d="M32 56 Q40 62 48 56" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/* ── Zarema: Warm soft features, hijab suggestion, kind eyes ── */
function ZaremaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M20 28 Q20 10 40 10 Q60 10 60 28 L62 60 Q50 68 40 68 Q30 68 18 60 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M22 26 Q22 14 40 14 Q58 14 58 26" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <path d="M28 30 Q28 22 40 20 Q52 22 52 30 L52 48 Q52 58 40 60 Q28 58 28 48 Z" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <path d="M32 36 Q35 33 38 36" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M42 36 Q45 33 48 36" fill="none" stroke={color} strokeWidth="1.3" />
      <circle cx="35" cy="36" r="1" fill={color} opacity="0.8" />
      <circle cx="45" cy="36" r="1" fill={color} opacity="0.8" />
      <line x1="31" y1="35" x2="30" y2="33.5" stroke={color} strokeWidth="0.5" />
      <line x1="49" y1="35" x2="50" y2="33.5" stroke={color} strokeWidth="0.5" />
      <path d="M40 40 L39 45 Q40 46 41 45" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M34 50 Q40 55 46 50" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M20 38 Q18 50 22 60" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M60 38 Q62 50 58 60" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
    </svg>
  );
}

/* ── Maria: Sharp features, short hair, intense gaze ── */
function MariaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M28 24 L38 18 L42 18 L52 24 L54 42 L50 56 L40 60 L30 56 L26 42 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 28 Q26 12 40 10 Q54 12 54 28 L52 22 Q48 14 40 14 Q32 14 28 22 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 30 L26 24" stroke={color} strokeWidth="1" />
      <path d="M54 24 L56 30" stroke={color} strokeWidth="1" />
      <path d="M30 34 L38 32 L38 36 L30 36 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 32 L50 34 L50 36 L42 36 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="35" cy="34.5" r="1.5" fill={color} />
      <circle cx="45" cy="34.5" r="1.5" fill={color} />
      <path d="M30 30 L38 28" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M42 28 L50 30" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M35 52 L45 52" stroke={color} strokeWidth="1.2" />
      <path d="M36 52 Q40 54 44 52" fill="none" stroke={color} strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

/* ── Dmitry: Round face, beard, tired eyes ── */
function DmitryPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 28 Q26 18 40 16 Q54 18 54 28 L56 44 Q56 58 40 62 Q24 58 24 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 26 Q28 14 40 12 Q52 14 54 26" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M28 24 Q30 16 40 14 Q50 16 52 24" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path d="M30 36 Q34 33 38 36" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 36 Q46 33 50 36" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="35.5" r="1.2" fill={color} opacity="0.6" />
      <circle cx="46" cy="35.5" r="1.2" fill={color} opacity="0.6" />
      <path d="M30 37.5 Q34 39 38 37.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M42 37.5 Q46 39 50 37.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M40 40 L38 46 Q40 48 42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M28 48 Q28 58 40 64 Q52 58 52 48" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M30 50 Q30 56 40 60 Q50 56 50 50" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M35 50 Q40 52 45 50" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/* ── Alexander: Hard jawline, slicked hair, cold eyes ── */
function AlexanderPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 24 L36 16 L44 16 L54 24 L56 40 L54 54 L48 60 L32 60 L26 54 L24 40 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q26 8 40 8 Q54 8 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 22 Q28 12 40 10 Q52 12 54 22" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="12" x2="30" y2="20" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="40" y1="10" x2="40" y2="18" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="48" y1="12" x2="50" y2="20" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M29 34 L39 33 L39 35 L29 35 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M41 33 L51 34 L51 35 L41 35 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="34" r="1" fill={color} opacity="0.9" />
      <circle cx="46" cy="34" r="1" fill={color} opacity="0.9" />
      <path d="M29 31 L38 29" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <path d="M42 29 L51 31" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <path d="M40 36 L37 46 L43 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M34 52 L46 52" stroke={color} strokeWidth="1.2" />
      <path d="M36 52 Q40 53 44 52" fill="none" stroke={color} strokeWidth="0.4" opacity="0.3" />
      <path d="M26 48 L32 58" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M54 48 L48 58" stroke={color} strokeWidth="0.6" opacity="0.3" />
    </svg>
  );
}

/* ── Colleague: Nervous expression, messy hair, shifting eyes ── */
function ColleaguePortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M28 24 Q28 18 40 16 Q52 18 52 24 L54 44 Q54 56 40 60 Q26 56 26 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 26 Q22 10 40 8 Q58 10 56 26" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M22 22 L26 16" stroke={color} strokeWidth="1" />
      <path d="M30 12 L28 18" stroke={color} strokeWidth="0.8" />
      <path d="M36 8 L34 14" stroke={color} strokeWidth="0.8" />
      <path d="M44 8 L46 14" stroke={color} strokeWidth="0.8" />
      <path d="M50 12 L52 18" stroke={color} strokeWidth="0.8" />
      <path d="M56 22 L54 16" stroke={color} strokeWidth="1" />
      <ellipse cx="33" cy="35" rx="3.5" ry="2.5" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="47" cy="34" rx="3.5" ry="2.5" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="34" cy="35" r="1.2" fill={color} opacity="0.7" />
      <circle cx="48" cy="34" r="1.2" fill={color} opacity="0.7" />
      <path d="M29 31 Q33 28 37 31" fill="none" stroke={color} strokeWidth="1" />
      <path d="M43 30 Q47 27 51 30" fill="none" stroke={color} strokeWidth="1" />
      <path d="M40 38 L39 44 Q40 45 41 44" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M35 50 Q40 48 45 50" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="55" cy="32" rx="1" ry="2" fill={color} opacity="0.3" />
    </svg>
  );
}

/* ── Barista: Friendly smile, apron, knowing eyes ── */
function BaristaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 26 Q26 16 40 14 Q54 16 54 26 L56 44 Q56 58 40 62 Q24 58 24 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q24 8 40 8 Q56 8 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 22 Q26 12 40 10 Q54 12 54 22" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path d="M30 34 Q34 31 38 34" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 34 Q46 31 50 34" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="33.5" r="1.3" fill={color} opacity="0.8" />
      <circle cx="46" cy="33.5" r="1.3" fill={color} opacity="0.8" />
      <path d="M30 30 Q34 27 38 29" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M42 29 Q46 27 50 30" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M40 38 L39 44 Q40 45 41 44" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M32 50 Q40 56 48 50" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M30 60 L26 68" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <path d="M50 60 L54 68" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <path d="M26 68 L54 68" stroke={color} strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

/* ── Portrait renderer by NPC ID ── */
function NPCPortrait({ npcId }: { npcId: string }) {
  const colors = NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista;

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
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="portrait-frame relative w-16 h-16 sm:w-20 sm:h-20 shrink-0"
    >
      {/* Decorative frame border with pulse animation */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          border: `1.5px solid ${colors.primary}66`,
          boxShadow: `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}`,
          animation: 'portrait-frame-pulse 3s ease-in-out infinite',
        }}
      />
      {/* Corner brackets */}
      <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t border-l" style={{ borderColor: `${colors.primary}55` }} />
      <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t border-r" style={{ borderColor: `${colors.primary}55` }} />
      <div className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b border-l" style={{ borderColor: `${colors.primary}55` }} />
      <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b border-r" style={{ borderColor: `${colors.primary}55` }} />
      {/* Portrait content */}
      <div
        className="w-full h-full rounded-xl overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
        }}
      >
        {renderSvg()}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>
    </motion.div>
  );
}

/* ── Emotion detection from text ── */
function detectEmotion(text: string): 'calm' | 'angry' | 'sad' | 'happy' {
  if (text.includes('!') && (text.includes('ненави') || text.includes('боюсь') || text.includes('не могу'))) return 'angry';
  if (text.includes('...') && (text.includes('устал') || text.includes('потер') || text.includes('одинок') || text.includes('плачет'))) return 'sad';
  if (text.includes('!') && (text.includes('рад') || text.includes('найдём') || text.includes('обещаю') || text.includes('спасибо'))) return 'happy';
  return 'calm';
}

const EMOTION_BORDER: Record<string, string> = {
  calm: 'border-slate-500/50',
  angry: 'border-red-500/70',
  sad: 'border-blue-500/60',
  happy: 'border-amber-500/60',
};

/* ── Relationship indicator ── */
function getRelationLevel(npcId: string, relations: NPCRelation[]): 'ally' | 'neutral' | 'enemy' {
  const rel = relations.find((r) => r.npcId === npcId);
  if (!rel) return 'neutral';
  if (rel.value >= 65) return 'ally';
  if (rel.value <= 30) return 'enemy';
  return 'neutral';
}

/* ── Relationship glow color mapping ── */
const RELATION_GLOW: Record<string, { color: string; shadow: string; border: string }> = {
  ally: { color: '#34d399', shadow: '0 0 8px rgba(52,211,153,0.4), 0 0 16px rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.3)' },
  neutral: { color: '#22d3ee', shadow: '0 0 8px rgba(34,211,238,0.4), 0 0 16px rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.3)' },
  enemy: { color: '#fb7185', shadow: '0 0 8px rgba(251,113,133,0.4), 0 0 16px rgba(251,113,133,0.2)', border: 'rgba(251,113,133,0.3)' },
};

/* ── Typewriter hook ── */
import { useTypewriter } from '@/hooks/useTypewriter';

/* ── Apply effects ── */
import { applyEffects } from '@/shared/utils/applyEffects';

/* ── Skill check ── */
function performSkillCheck(skill: TrainablePlayerSkill, difficulty: number, playerSkills: PlayerSkills): boolean {
  return (playerSkills[skill] ?? 0) >= difficulty;
}

/* ── Condition check ── */
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

/* ── Impact preview ── */
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
   DIALOGUE HISTORY — tracks previous lines for scrolling
   ══════════════════════════════════════════════════════════════ */
interface HistoryLine {
  speaker: string;
  text: string;
  timestamp: number;
}

/* ── Component ── */
export function DialogueRenderer() {
  const mode = useGameStore((s) => s.mode);
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const playerState = useGameStore((s) => s.playerState);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const setMode = useGameStore((s) => s.setMode);
  const setShowStoryOverlay = useGameStore((s) => s.setShowStoryOverlay);
  const setCurrentNodeId = useGameStore((s) => s.setCurrentNodeId);

  const [skillCheckBanner, setSkillCheckBanner] = useState<{
    skill: TrainablePlayerSkill;
    success: boolean;
  } | null>(null);

  // ── Dialogue history ──
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Auto-advance mode ──
  const [autoAdvance, setAutoAdvance] = useState(false);
  const autoAdvanceDelay = 2500; // ms

  // ── World Director: dialogue is now an overlay, not a separate mode ──
  // Before: isOpen = mode === 'visual-novel' (requires switching away from exploration)
  // Now: isOpen = showStoryOverlay + has dialogue node (narrative overlay on 3D world)
  const isOpen = showStoryOverlay && !!DIALOGUE_NODES[currentNodeId];
  const node = useMemo(() => DIALOGUE_NODES[currentNodeId], [currentNodeId]);
  const { displayed, done, skip } = useTypewriter(node?.text ?? '', 30);

  // Apply node-level effects on mount
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (node && appliedRef.current !== node.id) {
      appliedRef.current = node.id;

      // Add to history (deferred to avoid sync setState in effect)
      if (node.speaker && node.text) {
        const speaker = node.speaker;
        const text = node.text;
        setTimeout(() => {
          setHistory((prev) => [...prev, { speaker, text, timestamp: Date.now() }]);
        }, 0);
      }

      if (node.speaker) {
        const npcDef = NPC_DEFINITIONS.find((n) => n.name === node.speaker);
        const npcId = npcDef?.id ?? node.speaker.toLowerCase().replace(/\s+/g, '_');
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: node.id });
      }

      if (node.effects) {
        applyEffects(node.effects);
      }
    }
  }, [node]);

  const handleClose = useCallback(() => {
    audioEngine.playSfx('ui_close');
    // ── World Director: close dialogue by hiding overlay, not switching mode ──
    // The player is already in exploration mode — just hide the narrative overlay
    setShowStoryOverlay(false);
  }, [setShowStoryOverlay]);

  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      audioEngine.playSfx('confirm');

      // P5-FIX: Check skill BEFORE applying effects — previously effects were
      // applied unconditionally, meaning a failed skill check still gave rewards.
      if (choice.condition?.minSkillCheck) {
        const result = performSkillCheck(choice.condition.minSkillCheck.skill, choice.condition.minSkillCheck.difficulty, playerState.skills);
        setSkillCheckBanner({ skill: choice.condition.minSkillCheck.skill, success: result });
        if (!result) return; // Failed — do NOT apply effects or advance
        setTimeout(() => setSkillCheckBanner(null), 1500);
      }

      if (choice.effects) {
        applyEffects(choice.effects);
      }

      if (choice.next === null) {
        // ── World Director: end dialogue by hiding overlay ──
        setShowStoryOverlay(false);
      } else {
        setCurrentNodeId(choice.next);
      }
    },
    [setMode, setCurrentNodeId, playerState.skills],
  );

  // ── Auto-advance timer ──
  // P5-FIX: Pass the actual npcId to checkDialogueCondition instead of ''.
  // Previously, minNpcRelation conditions were always failing during auto-advance
  // because the npcId was empty, causing npcRelations.find() to never match.
  useEffect(() => {
    if (!autoAdvance || !done || !node || node.choices.length === 0) return;

    // Resolve the npcId from the current node's speaker for condition checking
    const currentNpcDef = NPC_DEFINITIONS.find((n) => n.name === node.speaker);
    const currentNpcId = currentNpcDef?.id ?? '';

    // Auto-pick first available choice after delay
    const timer = setTimeout(() => {
      const availableChoice = node.choices.find((c) => {
        const cond = checkDialogueCondition(c.condition, playerState, npcRelations, currentNpcId, timeOfDay);
        return cond.pass;
      });
      if (availableChoice) {
        handleChoice(availableChoice);
      }
    }, autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, [autoAdvance, done, node, playerState, npcRelations, timeOfDay, handleChoice]);

  if (!isOpen || !node) return null;

  const npcDef = NPC_DEFINITIONS.find((n) => n.name === node.speaker);
  const npcId = npcDef?.id ?? '';
  const portraitColors = npcId ? (NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista) : NPC_PORTRAIT_COLORS.cafe_barista;
  const emotion = detectEmotion(node.text);
  const emotionBorder = EMOTION_BORDER[emotion] || EMOTION_BORDER.calm;
  const relationLevel = npcId ? getRelationLevel(npcId, npcRelations) : 'neutral';

  const RelationIcon = relationLevel === 'ally' ? Shield : relationLevel === 'enemy' ? Skull : Circle;

  // Speaker name colored background style
  const speakerBgStyle: React.CSSProperties = npcId
    ? {
        background: `linear-gradient(90deg, ${portraitColors.bg} 0%, transparent 100%)`,
        borderLeft: `3px solid ${portraitColors.primary}`,
        paddingLeft: '8px',
      }
    : {};

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
        <div className="absolute top-0 left-0 right-0 h-[8%] bg-black/90" />
        <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black/90" />

        {/* Content panel */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-xl mx-3 mb-3 sm:mx-auto sm:mb-0"
        >
          <div
            className={`relative border-2 ${emotionBorder} backdrop-blur-md overflow-hidden transition-colors duration-500`}
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
              boxShadow: `0 0 30px rgba(34,211,238,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
              <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://dialogue</span>
              <div className="flex-1" />
              {/* Auto-advance toggle */}
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  autoAdvance ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
                title="Авто-продолжение"
              >
                <FastForward className="size-2.5" />
                Авто
              </button>
              {/* History toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  showHistory ? 'bg-amber-900/40 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
                title="История диалога"
              >
                <History className="size-2.5" />
                История
              </button>
              {/* Close button */}
              <button onClick={handleClose} className="text-slate-500 hover:text-white hover:bg-rose-500/20 rounded p-0.5 transition-colors" aria-label="Закрыть">
                <X className="size-3.5" />
              </button>
            </div>

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)' }} />

            {/* Content area */}
            <div className="relative z-0 p-5">
              {/* Dialogue history overlay */}
              <AnimatePresence>
                {showHistory && history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-slate-700/30 bg-black/40 p-3"
                  >
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mb-2">История диалога</div>
                    {history.slice(-10).map((line, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <span className="text-[10px] font-mono text-cyan-400/60">{line.speaker}: </span>
                        <span className="text-[11px] text-slate-400/80">{line.text.length > 80 ? line.text.slice(0, 80) + '...' : line.text}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Speaker portrait + name + relationship */}
              <div className="flex items-center gap-4 mb-4">
                {npcId ? (
                  <NPCPortrait npcId={npcId} />
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-slate-600/50 flex items-center justify-center text-xl font-bold text-slate-400 bg-slate-800/50 shrink-0">?</div>
                )}
                <div className="flex-1 min-w-0">
                  {/* ── Enhanced Speaker Nameplate ── */}
                  <div className="dialogue-nameplate relative mb-0.5">
                    {/* Decorative line before name */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${RELATION_GLOW[relationLevel]?.color ?? '#22d3ee'})`,
                        opacity: 0.5,
                      }}
                    />
                    <div className="flex items-center gap-2" style={{ paddingLeft: '18px', ...speakerBgStyle }}>
                      {/* Corner bracket left */}
                      <span className="text-[8px] leading-none" style={{ color: `${RELATION_GLOW[relationLevel]?.color ?? '#22d3ee'}66` }}>⟨</span>
                      <span
                        className="font-medium text-sm tracking-wide uppercase"
                        style={{
                          color: portraitColors.primary,
                          textShadow: RELATION_GLOW[relationLevel]?.shadow,
                        }}
                      >
                        {node.speaker}
                      </span>
                      {/* Corner bracket right */}
                      <span className="text-[8px] leading-none" style={{ color: `${RELATION_GLOW[relationLevel]?.color ?? '#22d3ee'}66` }}>⟩</span>
                      {npcId && (
                        <span className="flex items-center gap-1" title={relationLevel === 'ally' ? 'Союзник' : relationLevel === 'enemy' ? 'Враг' : 'Нейтрал'}>
                          <RelationIcon className={`size-3.5 ${
                            relationLevel === 'ally' ? 'text-emerald-400' : relationLevel === 'enemy' ? 'text-red-400' : 'text-slate-400'
                          }`} />
                        </span>
                      )}
                    </div>
                    {/* Decorative line after name */}
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-px"
                      style={{
                        background: `linear-gradient(-90deg, transparent, ${RELATION_GLOW[relationLevel]?.color ?? '#22d3ee'})`,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                  {/* Emotion indicator */}
                  <span className={`text-[10px] uppercase tracking-widest ${
                    emotion === 'angry' ? 'text-red-400/70' :
                    emotion === 'sad' ? 'text-blue-400/70' :
                    emotion === 'happy' ? 'text-amber-400/70' :
                    'text-slate-500/50'
                  }`}>
                    {emotion === 'calm' ? '' : emotion === 'angry' ? 'гнев' : emotion === 'sad' ? 'грусть' : 'радость'}
                  </span>
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

              {/* Dialogue text with typewriter + enhanced cursor */}
              <div className="min-h-[60px] mb-4">
                <p className="text-slate-100 leading-relaxed">
                  {displayed}
                  {!done && (
                    <span
                      className="dialogue-cursor inline-block w-0.5 h-4 ml-0.5 align-middle"
                      style={{
                        background: 'rgba(34,211,238,0.8)',
                        boxShadow: '0 0 4px rgba(34,211,238,0.6), 0 0 8px rgba(34,211,238,0.3)',
                        animation: 'dialogue-cursor-blink 0.8s step-end infinite',
                      }}
                    />
                  )}
                </p>
              </div>

              {/* Choices */}
              {done && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2"
                >
                  {node.choices.map((choice, i) => {
                    const cond = checkDialogueCondition(choice.condition, playerState, npcRelations, npcId, timeOfDay);

                    const handleClick = () => {
                      if (!cond.pass) return;

                      if (choice.condition?.minSkillCheck && cond.skillCheckResult) {
                        setSkillCheckBanner(cond.skillCheckResult);
                        if (!cond.skillCheckResult.success) return;
                      }

                      handleChoice(choice);
                    };

                    const impact = getChoiceImpact(choice.effects, npcId);
                    const hasImpact = impact.karma !== 0 || impact.energy !== 0 || impact.stress !== 0 || impact.npcRelation !== null || impact.skills.length > 0;

                    // Keyboard shortcut key (1-9)
                    const shortcutKey = i + 1;

                    return (
                      <motion.button
                        key={`${currentNodeId}-dlg-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.2 }}
                        onClick={handleClick}
                        disabled={!cond.pass}
                        className={`
                          dialogue-choice-btn group relative text-left pl-7 pr-4 py-2.5 border transition-all duration-200 text-sm overflow-hidden
                          ${cond.pass
                            ? 'border-cyan-800/50 bg-cyan-950/20 hover:bg-cyan-900/30 hover:border-cyan-600/60 text-slate-100 cursor-pointer'
                            : 'border-slate-700/30 bg-slate-900/10 text-slate-500 cursor-not-allowed opacity-50'
                          }
                        `}
                        style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                      >
                        {/* Left-side accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5"
                          style={{
                            background: cond.pass
                              ? 'linear-gradient(180deg, rgba(34,211,238,0.6), rgba(34,211,238,0.2))'
                              : 'rgba(100,116,139,0.2)',
                          }}
                        />
                        {/* Number badge */}
                        <span
                          className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center rounded-sm ${
                            cond.pass
                              ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/20'
                              : 'bg-slate-800/40 text-slate-500 border border-slate-600/20'
                          }`}
                        >
                          {shortcutKey}
                        </span>
                        {/* Scan-line sweep on hover */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div
                            className="absolute left-0 right-0 h-3 -top-3 group-hover:top-full"
                            style={{ background: 'linear-gradient(180deg, transparent, rgba(34,211,238,0.08), transparent)', transition: 'top 0.8s ease-in-out' }}
                          />
                        </div>
                        {/* Hover border glow */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            boxShadow: cond.pass ? 'inset 0 0 12px rgba(34,211,238,0.06), 0 0 8px rgba(34,211,238,0.08)' : 'none',
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <ChevronRight className="size-3.5 text-cyan-500/70 group-hover:text-cyan-300 transition-colors shrink-0" />
                          <span className="flex-1">{choice.text}</span>
                          {/* Impact preview badges — show on hover for passable choices */}
                          {cond.pass && hasImpact && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {impact.karma !== 0 && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  impact.karma > 0 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20' : 'text-rose-300 bg-rose-950/40 border border-rose-500/20'
                                }`}>
                                  {impact.karma > 0 ? '+' : ''}{impact.karma}☯
                                </span>
                              )}
                              {impact.energy !== 0 && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  impact.energy > 0 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20' : 'text-rose-300 bg-rose-950/40 border border-rose-500/20'
                                }`}>
                                  {impact.energy > 0 ? '+' : ''}{impact.energy}⚡
                                </span>
                              )}
                              {impact.stress !== 0 && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  impact.stress > 0 ? 'text-rose-300 bg-rose-950/40 border border-rose-500/20' : 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20'
                                }`}>
                                  {impact.stress > 0 ? '+' : ''}{impact.stress}😤
                                </span>
                              )}
                              {impact.skills.map((s, si) => (
                                <span key={si} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950/40 border border-violet-500/20 text-violet-300">
                                  +{s.value} {s.skill}
                                </span>
                              ))}
                              {impact.npcRelation && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  impact.npcRelation.value > 0 ? 'text-amber-300 bg-amber-950/40 border border-amber-500/20' : 'text-rose-300 bg-rose-950/40 border border-rose-500/20'
                                }`}>
                                  {impact.npcRelation.value > 0 ? '+' : ''}{impact.npcRelation.value}👥
                                </span>
                              )}
                            </div>
                          )}
                          {/* Locked condition indicators */}
                          {cond.skillCheckNeeded && (
                            <span className="flex items-center gap-1 text-xs text-rose-400">
                              <Zap className="size-3" />
                              {cond.skillCheckNeeded.skill} {cond.skillCheckNeeded.needed}
                            </span>
                          )}
                          {cond.relationNeeded && (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                              <Shield className="size-3" />
                              Отнош. {cond.relationNeeded.needed}
                            </span>
                          )}
                          {cond.actNeeded && (
                            <span className="flex items-center gap-1 text-xs text-violet-400">
                              <Zap className="size-3" />
                              Акт {cond.actNeeded.needed}
                            </span>
                          )}
                          {/* Keyboard shortcut display */}
                          {cond.pass && shortcutKey <= 9 && (
                            <span className="text-[9px] font-mono text-cyan-500/40 group-hover:text-cyan-400/60 transition-colors shrink-0 ml-1">
                              [{shortcutKey}]
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
            {/* Footer */}
            <div className="px-4 py-1.5 border-t border-cyan-900/15 bg-black/20 flex items-center justify-between">
              <span className="text-[9px] text-slate-600 font-mono">volodka://dialogue</span>
              <div className="flex items-center gap-3">
                {autoAdvance && (
                  <span className="text-[9px] text-cyan-500/60 font-mono flex items-center gap-1">
                    <FastForward className="size-2" />
                    Авто
                  </span>
                )}
                <span className="text-[9px] text-slate-600 font-mono">{node.id}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
