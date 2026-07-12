import {
  Code2,
  Handshake,
  Heart,
  Lightbulb,
  PenTool,
  Swords,
  type LucideIcon,
} from 'lucide-react';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { PLAYER_STATS_DISPLAY_SKILLS } from '@/engine/playerStats/playerStatsPanelConstants';

export const PLAYER_STATS_SKILL_ICONS: Record<
  (typeof PLAYER_STATS_DISPLAY_SKILLS)[number],
  LucideIcon
> = {
  logic: Swords,
  coding: Code2,
  empathy: Heart,
  persuasion: Handshake,
  intuition: Lightbulb,
  writing: PenTool,
};

export function resolvePlayerStatsSkillIcon(skill: TrainablePlayerSkill): LucideIcon {
  return PLAYER_STATS_SKILL_ICONS[skill as keyof typeof PLAYER_STATS_SKILL_ICONS] ?? Swords;
}
