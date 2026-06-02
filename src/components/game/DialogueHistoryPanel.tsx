
/* ─── Volodka RPG – Dialogue History Panel ───
   Two-column layout: NPC list (2/5) + conversation log (3/5).
   Browse past dialogue conversations with NPCs.
   Cyberpunk dark glass morphism with emerald accent (dialogue color).
*/

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageCircle, Search, ChevronRight,
  User, Clock,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { ConversationLogEntry } from '@/store/shared';

/* ══════════════════════════════════════════════════════════════
   SVG NPC PORTRAITS — stylized line art (reused from DialogueRenderer)
   ══════════════════════════════════════════════════════════════ */

const NPC_PORTRAIT_COLORS: Record<string, { primary: string; glow: string; accent: string }> = {
  albert: { primary: '#8b9dc3', glow: 'rgba(139,157,195,0.4)', accent: '#6b7db3' },
  zarema: { primary: '#e8a87c', glow: 'rgba(232,168,124,0.4)', accent: '#d4896a' },
  maria: { primary: '#c77dba', glow: 'rgba(199,125,186,0.4)', accent: '#a85d99' },
  office_dmitry: { primary: '#7dad7a', glow: 'rgba(125,173,122,0.4)', accent: '#5d8d5a' },
  office_alexander: { primary: '#6b8fc4', glow: 'rgba(107,143,196,0.4)', accent: '#4a6fa4' },
  office_colleague: { primary: '#a0926b', glow: 'rgba(160,146,107,0.4)', accent: '#80724b' },
  cafe_barista: { primary: '#c4956a', glow: 'rgba(196,149,106,0.4)', accent: '#a4754a' },
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

/* ── Small portrait renderer by NPC ID ── */
function NPCMiniPortrait({ npcId }: { npcId: string }) {
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
    <div
      className="w-10 h-10 rounded-lg border overflow-hidden shrink-0"
      style={{
        borderColor: `${colors.primary}60`,
        boxShadow: `0 0 8px ${colors.glow}, inset 0 0 4px ${colors.glow}`,
        background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
      }}
    >
      {renderSvg()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimestampFull(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} ${h}:${m}`;
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

/** Determine if a speaker name is the player (vs NPC) */
function isPlayerSpeaker(speaker: string): boolean {
  const lower = speaker.toLowerCase();
  return lower === 'владимир' || lower === 'володька' || lower === 'player' || lower === 'вы';
}

/* ══════════════════════════════════════════════════════════════
   NPC List Item
   ══════════════════════════════════════════════════════════════ */

function NPCListItem({
  npcId,
  name,
  entries,
  isSelected,
  onClick,
}: {
  npcId: string;
  name: string;
  entries: ConversationLogEntry[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = NPC_PORTRAIT_COLORS[npcId];
  const lastEntry = entries[entries.length - 1];
  const lastTime = lastEntry ? formatTimestamp(lastEntry.timestamp) : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-emerald-700/40 bg-emerald-950/20'
          : 'border-transparent hover:border-slate-700/30 hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Mini portrait */}
        <NPCMiniPortrait npcId={npcId} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-medium truncate"
              style={{ color: colors?.primary ?? '#94a3b8' }}
            >
              {name}
            </span>
            {isSelected && (
              <ChevronRight className="size-3 text-emerald-400/50 shrink-0" />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            {/* Last conversation time */}
            {lastTime && (
              <span className="text-[10px] text-slate-500">
                {lastTime}
              </span>
            )}
            {/* Message count badge */}
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-mono font-medium"
              style={{
                background: colors ? `${colors.primary}20` : 'rgba(52,211,153,0.15)',
                color: colors?.primary ?? '#34d399',
                border: `1px solid ${colors ? colors.primary + '30' : 'rgba(52,211,153,0.2)'}`,
              }}
            >
              {entries.length}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   Conversation Entry
   ══════════════════════════════════════════════════════════════ */

function ConversationEntry({
  entry,
  npcId,
  index,
}: {
  entry: ConversationLogEntry;
  npcId: string;
  index: number;
}) {
  const isPlayer = isPlayerSpeaker(entry.speaker);
  const npcColors = NPC_PORTRAIT_COLORS[npcId];

  // Player choices: cyan accent; NPC responses: NPC-specific accent
  const accentColor = isPlayer
    ? '#22d3ee' // cyan-400
    : (npcColors?.primary ?? '#34d399'); // NPC color or emerald fallback

  const accentBg = isPlayer
    ? 'rgba(34,211,238,0.08)'
    : (npcColors ? `${npcColors.primary}12` : 'rgba(52,211,153,0.08)');

  const accentBorder = isPlayer
    ? 'rgba(34,211,238,0.25)'
    : (npcColors ? `${npcColors.primary}30` : 'rgba(52,211,153,0.25)');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="rounded-lg border px-3 py-2"
      style={{
        borderColor: accentBorder,
        background: `linear-gradient(135deg, ${accentBg} 0%, transparent 100%)`,
      }}
    >
      <div className="flex items-start gap-2">
        {/* Speaker indicator */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          {isPlayer ? (
            <User className="size-3.5 shrink-0" style={{ color: accentColor }} />
          ) : (
            <MessageCircle className="size-3.5 shrink-0" style={{ color: accentColor }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-medium" style={{ color: accentColor }}>
              {entry.speaker}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              {formatTimestampFull(entry.timestamp)}
            </span>
          </div>
          <p className="text-xs text-slate-300/80 leading-relaxed">
            {truncateText(entry.text, 80)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

interface DialogueHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function DialogueHistoryPanel({ open, onClose }: DialogueHistoryPanelProps) {
  const conversationLog = useGameStore((s) => s.conversationLog);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Build list of NPCs with conversation history
  const npcList = useMemo(() => {
    const npcIds = Object.keys(conversationLog).filter(
      (id) => conversationLog[id] && conversationLog[id].length > 0,
    );

    // Map to NPC info
    return npcIds
      .map((npcId) => {
        const def = NPC_DEFINITIONS.find((n) => n.id === npcId);
        const name = def?.name ?? npcId;
        const entries = conversationLog[npcId];
        return { npcId, name, entries };
      })
      .filter((item) => {
        // Filter by search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.npcId.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Sort by most recent conversation
        const aLast = a.entries[a.entries.length - 1]?.timestamp ?? 0;
        const bLast = b.entries[b.entries.length - 1]?.timestamp ?? 0;
        return bLast - aLast;
      });
  }, [conversationLog, searchQuery]);

  // Selected NPC's conversation entries
  const selectedEntries = selectedNpcId ? (conversationLog[selectedNpcId] ?? []) : [];

  // Selected NPC definition
  const selectedNpcDef = selectedNpcId ? NPC_DEFINITIONS.find((n) => n.id === selectedNpcId) : null;

  const hasConversations = npcList.length > 0;

  // Keyboard handler: [L] or Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.code === 'KeyL') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Auto-select first NPC when opened
  useEffect(() => {
    if (open && !selectedNpcId && npcList.length > 0) {
      setTimeout(() => {
        setSelectedNpcId(npcList[0].npcId);
      }, 0);
    }
  }, [open, selectedNpcId, npcList]);

  // Reset selection when panel closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedNpcId(null);
        setSearchQuery('');
      }, 0);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[38rem]"
          style={{
            zIndex: UI_LAYERS.PANEL,
            background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
            borderLeft: '1px solid rgba(52,211,153,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(52,211,153,0.08)',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-900/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-slate-100">
                  История диалогов
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 hidden sm:inline">[L] закрыть</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-4 py-2 border-b border-slate-800/40">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
                <Search className="size-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени NPC..."
                  className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Two-column layout */}
            {hasConversations ? (
              <div className="flex flex-1 min-h-0">
                {/* Left: NPC list (2/5) */}
                <div className="w-2/5 border-r border-slate-800/30">
                  <ScrollArea className="h-full">
                    <div className="p-2 flex flex-col gap-1">
                      {npcList.map((item) => (
                        <NPCListItem
                          key={item.npcId}
                          npcId={item.npcId}
                          name={item.name}
                          entries={item.entries}
                          isSelected={selectedNpcId === item.npcId}
                          onClick={() => setSelectedNpcId(item.npcId)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Conversation log (3/5) */}
                <div className="w-3/5">
                  <ScrollArea className="h-full">
                    {selectedNpcId && selectedEntries.length > 0 ? (
                      <div className="p-3">
                        {/* NPC header */}
                        {selectedNpcDef && (
                          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-800/30">
                            <NPCMiniPortrait npcId={selectedNpcId} />
                            <div>
                              <span
                                className="text-sm font-medium"
                                style={{ color: NPC_PORTRAIT_COLORS[selectedNpcId]?.primary ?? '#94a3b8' }}
                              >
                                {selectedNpcDef.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="size-2.5 text-slate-600" />
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {selectedEntries.length} сообщений
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Conversation entries */}
                        <div className="flex flex-col gap-1.5">
                          {selectedEntries.map((entry, i) => (
                            <ConversationEntry
                              key={`${entry.timestamp}-${i}`}
                              entry={entry}
                              npcId={selectedNpcId}
                              index={i}
                            />
                          ))}
                        </div>
                      </div>
                    ) : selectedNpcId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageCircle className="size-8 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">Нет записей разговора</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageCircle className="size-8 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">Выберите NPC</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  <MessageCircle className="size-12 text-slate-700/50 mb-4" />
                  <p className="text-slate-500 text-sm mb-1">Нет записей разговоров</p>
                  <p className="text-slate-600 text-xs max-w-[220px]">
                    Общайтесь с персонажами, чтобы сохранить историю диалогов
                  </p>
                </motion.div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-emerald-900/15 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-mono">
                  volodka://history
                </span>
                {hasConversations && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Object.keys(conversationLog).reduce((sum, id) => sum + (conversationLog[id]?.length ?? 0), 0)} сообщений
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
