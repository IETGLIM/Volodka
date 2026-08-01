/* ─── Volodka RPG – Small NPC relation badge for dialogue speaker name ───
 *  Inline colored dot + Russian label placed next to the speaker name.
 *  Uses npcAffinity (-100 to +100) from the game store.
 */

import type { CSSProperties } from 'react';
import { useGameSelector } from '@/store/selectors/hooks';

/* ── Affinity tiers ── */
interface AffinityTier {
  min: number;
  color: string;      // dot background-color
  label: string;      // Russian label text
  textColor: string;  // CSS color value
}

const TIERS: AffinityTier[] = [
  { min: 30,  color: '#22c55e', label: 'ПРЕДАННЫЙ',   textColor: '#22c55e' },
  { min: 10,  color: '#06b6d4', label: 'ДРУЖЕЛЮБНЫЙ', textColor: '#06b6d4' },
  { min: -10, color: '#a1a1aa', label: 'НЕЙТРАЛЬНЫЙ', textColor: '#a1a1aa' },
  { min: -30, color: '#f97316', label: 'НАПРЯЖЁННЫЙ', textColor: '#f97316' },
  { min: -100, color: '#ef4444', label: 'ВРАЖДЕБНЫЙ', textColor: '#ef4444' },
];

/** List of non-NPC speaker keywords to exclude */
const NON_NPC_SPEAKERS = new Set([
  'нарратор',
  'голос',
  'внутренний голос',
  'мысль',
  'система',
]);

function getTier(value: number): AffinityTier {
  for (const t of TIERS) {
    if (value >= t.min) return t;
  }
  return TIERS[TIERS.length - 1];
}

/** Whether a speaker name is a non-NPC narrator / system voice */
function isNpcSpeaker(speakerName: string): boolean {
  const lower = speakerName.toLowerCase().trim();
  return !NON_NPC_SPEAKERS.has(lower) && lower.length > 0;
}

interface NpcRelationBadgeProps {
  npcId: string;
  speakerName: string;
}

/**
 * Tiny inline badge: 3px dot + 9px monospace Russian label.
 * Shows numeric affinity on hover via title attribute.
 * Returns null for narrator / system speakers.
 */
export function NpcRelationBadge({ npcId, speakerName }: NpcRelationBadgeProps) {
  const affinity = useGameSelector((s) => s.npcAffinity[npcId] ?? 0);

  // Don't render for non-NPC speakers
  if (!isNpcSpeaker(speakerName)) return null;

  const tier = getTier(affinity);

  return (
    <span
      className="inline-flex items-center gap-1 ml-2 align-middle"
      title={`${speakerName}: ${affinity > 0 ? '+' : ''}${affinity}`}
    >
      <span
        className="shrink-0 rounded-full"
        style={{ width: 3, height: 3, backgroundColor: tier.color } as CSSProperties}
        aria-hidden="true"
      />
      <span
        className="font-mono leading-none"
        style={{ fontSize: 9, color: tier.textColor } as CSSProperties}
      >
        {tier.label}
      </span>
    </span>
  );
}
