/* ─── Volodka RPG – Shared NPC Portrait Component ─── */
/* Stylized SVG line-art portraits for all NPCs.
 * Three size variants: mini (w-10), default (w-14/w-16), large (w-16/w-20 with animation).
 * Extracted from DialogueRenderer, NPCRelationshipPanel, DialogueHistoryPanel
 * to eliminate ~400 lines of duplicated SVG portrait code. */

import { motion } from 'framer-motion';

/* ─── Color palette per NPC ─── */

export interface NPCPortraitColors {
  primary: string;
  glow: string;
  accent: string;
  bg: string;
}

export const NPC_PORTRAIT_COLORS: Record<string, NPCPortraitColors> = {
  albert: { primary: '#8b9dc3', glow: 'rgba(139,157,195,0.4)', accent: '#6b7db3', bg: 'rgba(139,157,195,0.1)' },
  zarema: { primary: '#e8a87c', glow: 'rgba(232,168,124,0.4)', accent: '#d4896a', bg: 'rgba(232,168,124,0.1)' },
  maria: { primary: '#c77dba', glow: 'rgba(199,125,186,0.4)', accent: '#a85d99', bg: 'rgba(199,125,186,0.1)' },
  office_dmitry: { primary: '#7dad7a', glow: 'rgba(125,173,122,0.4)', accent: '#5d8d5a', bg: 'rgba(125,173,122,0.1)' },
  office_alexander: { primary: '#6b8fc4', glow: 'rgba(107,143,196,0.4)', accent: '#4a6fa4', bg: 'rgba(107,143,196,0.1)' },
  office_colleague: { primary: '#a0926b', glow: 'rgba(160,146,107,0.4)', accent: '#80724b', bg: 'rgba(160,146,107,0.1)' },
  cafe_barista: { primary: '#c4956a', glow: 'rgba(196,149,106,0.4)', accent: '#a4754a', bg: 'rgba(196,149,106,0.1)' },
};

/* ── SVG Portrait sub-components ── */

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

/* ── SVG renderer by NPC ID ── */

function renderNpcSvg(npcId: string, color: string) {
  switch (npcId) {
    case 'albert': return <AlbertPortrait color={color} />;
    case 'zarema': return <ZaremaPortrait color={color} />;
    case 'maria': return <MariaPortrait color={color} />;
    case 'office_dmitry': return <DmitryPortrait color={color} />;
    case 'office_alexander': return <AlexanderPortrait color={color} />;
    case 'office_colleague': return <ColleaguePortrait color={color} />;
    case 'cafe_barista': return <BaristaPortrait color={color} />;
    default: return <AlbertPortrait color={color} />;
  }
}

/* ── Main NPCPortrait component ── */

export type NPCPortraitSize = 'mini' | 'default' | 'large';

export interface NPCPortraitProps {
  npcId: string;
  /** Size variant: mini=w-10, default=w-14/w-16, large=w-16/w-20 with animation + corner brackets */
  size?: NPCPortraitSize;
  /** Additional CSS class names */
  className?: string;
}

export function NPCPortrait({ npcId, size = 'default', className }: NPCPortraitProps) {
  const colors = NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista;
  const svg = renderNpcSvg(npcId, colors.primary);

  if (size === 'large') {
    return (
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`portrait-frame relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 ${className ?? ''}`}
      >
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            border: `1.5px solid ${colors.primary}66`,
            boxShadow: `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}`,
            animation: 'portrait-frame-pulse 3s ease-in-out infinite',
          }}
        />
        <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t border-l" style={{ borderColor: `${colors.primary}55` }} />
        <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t border-r" style={{ borderColor: `${colors.primary}55` }} />
        <div className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b border-l" style={{ borderColor: `${colors.primary}55` }} />
        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b border-r" style={{ borderColor: `${colors.primary}55` }} />
        <div
          className="w-full h-full rounded-xl overflow-hidden"
          style={{ background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)` }}
        >
          {svg}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)' }}
          />
        </div>
      </motion.div>
    );
  }

  if (size === 'mini') {
    return (
      <div
        className={`w-10 h-10 rounded-lg border overflow-hidden shrink-0 ${className ?? ''}`}
        style={{
          borderColor: `${colors.primary}60`,
          boxShadow: `0 0 8px ${colors.glow}, inset 0 0 4px ${colors.glow}`,
          background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
        }}
      >
        {svg}
      </div>
    );
  }

  // default size
  return (
    <div
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 shrink-0 overflow-hidden ${className ?? ''}`}
      style={{
        borderColor: `${colors.primary}88`,
        boxShadow: `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}, inset 0 0 8px ${colors.glow}`,
        background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
      }}
    >
      {svg}
    </div>
  );
}
