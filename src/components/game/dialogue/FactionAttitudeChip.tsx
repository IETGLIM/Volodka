'use client';

/* ─── Volodka RPG – чип отношения фракции в шапке диалога (v4.8.6) ───
 *
 * Компактная метка рядом с именем NPC: «фракция · уровень отношения».
 * Цветовая кодировка как у бара отношения (emerald/amber/red), чтобы
 * игрок читал их согласованно. Тултип поясняет, откуда отношение:
 * среднее по знакомым членам фракции.
 */

import { Users } from 'lucide-react';
import type { FactionAttitudeTier } from '@/shared/npcFactionAttitude';

interface FactionAttitudeChipProps {
  factionLabel: string;
  tierLabel: string;
  tier: FactionAttitudeTier;
  metCount: number;
}

interface TierVisual {
  color: string;
  border: string;
  bg: string;
}

function getTierVisual(tier: FactionAttitudeTier): TierVisual {
  switch (tier) {
    case 'ally':
      return { color: 'rgb(110, 231, 183)', border: 'rgba(16, 185, 129, 0.45)', bg: 'rgba(6, 78, 59, 0.35)' };
    case 'cordial':
      return { color: 'rgb(190, 242, 100)', border: 'rgba(132, 204, 22, 0.4)', bg: 'rgba(58, 69, 10, 0.3)' };
    case 'neutral':
      return { color: 'rgb(203, 213, 225)', border: 'rgba(148, 163, 184, 0.35)', bg: 'rgba(30, 41, 59, 0.4)' };
    case 'wary':
      return { color: 'rgb(252, 211, 77)', border: 'rgba(245, 158, 11, 0.45)', bg: 'rgba(69, 47, 6, 0.35)' };
    case 'hostile':
      return { color: 'rgb(252, 165, 165)', border: 'rgba(239, 68, 68, 0.5)', bg: 'rgba(76, 5, 25, 0.4)' };
  }
}

/** Чип «фракция · отношение» — монтируется в шапку DiegeticDialogueHud. */
export function FactionAttitudeChip({ factionLabel, tierLabel, tier, metCount }: FactionAttitudeChipProps) {
  const visual = getTierVisual(tier);
  const hint =
    metCount > 0
      ? `Отношение фракции «${factionLabel}» — среднее по ${metCount} знакомым членам: ${tierLabel.toLowerCase()}.`
      : `Члены фракции «${factionLabel}» вам пока не знакомы — отношение нейтральное.`;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 align-middle"
      style={{
        border: `1px solid ${visual.border}`,
        background: visual.bg,
        color: visual.color,
      }}
      title={hint}
      data-testid="faction-attitude-chip"
    >
      <Users className="size-2.5 shrink-0" aria-hidden="true" />
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] leading-none whitespace-nowrap">
        {factionLabel}
      </span>
      <span className="font-mono text-[9px] leading-none whitespace-nowrap opacity-80">
        · {tierLabel}
      </span>
    </span>
  );
}
