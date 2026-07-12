import { SCENE_CONFIG } from '@/config/scenes';
import {
  DEFAULT_NPC_PORTRAIT_PRIMARY,
  NPC_RELATION_ALLY_THRESHOLD,
  NPC_RELATION_ENEMY_THRESHOLD,
  RELATION_LEVEL_COLORS,
  type RelationLevel,
} from '@/engine/npcRelationship/npcRelationshipConstants';
import type { NPCRelation, SceneId } from '@/shared/types/game';

export type NpcStateMap = Record<string, { position: [number, number, number]; sceneId: SceneId }>;

export type AffinityVisualStyle = {
  badge: { bg: string; text: string; border: string };
  bar: string;
  text: string;
};

export type RelationFooterCounts = {
  total: number;
  allies: number;
  enemies: number;
};

export function getRelationLevel(value: number): RelationLevel {
  if (value >= NPC_RELATION_ALLY_THRESHOLD) return 'ally';
  if (value <= NPC_RELATION_ENEMY_THRESHOLD) return 'enemy';
  return 'neutral';
}

export function getRelationLevelColors(level: RelationLevel) {
  return RELATION_LEVEL_COLORS[level];
}

export function sortNpcRelationsByValue(relations: readonly NPCRelation[]): NPCRelation[] {
  return [...relations].sort((a, b) => b.value - a.value);
}

export function getNpcSceneName(npcId: string, npcStates: NpcStateMap): string | null {
  const state = npcStates[npcId];
  if (!state) return null;
  return SCENE_CONFIG[state.sceneId]?.name ?? null;
}

export function getAffinityVisualStyle(affinity: number): AffinityVisualStyle {
  if (affinity >= 81) {
    return {
      badge: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
      bar: 'bg-amber-500',
      text: 'text-amber-400',
    };
  }
  if (affinity >= 51) {
    return {
      badge: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      bar: 'bg-emerald-500',
      text: 'text-emerald-400',
    };
  }
  if (affinity >= 11) {
    return {
      badge: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      bar: 'bg-cyan-500',
      text: 'text-cyan-400',
    };
  }
  if (affinity >= -9) {
    return {
      badge: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
      bar: 'bg-slate-500',
      text: 'text-slate-400',
    };
  }
  if (affinity >= -49) {
    return {
      badge: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
      bar: 'bg-orange-500',
      text: 'text-orange-400',
    };
  }
  return {
    badge: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    bar: 'bg-rose-500',
    text: 'text-rose-400',
  };
}

export function formatAffinityValue(affinity: number): string {
  return `${affinity > 0 ? '+' : ''}${affinity}`;
}

export function getAffinityBarPercent(affinity: number): number {
  return ((affinity + 100) / 200) * 100;
}

export function getNpcPortraitPrimaryColor(portraitPrimary?: string): string {
  return portraitPrimary ?? DEFAULT_NPC_PORTRAIT_PRIMARY;
}

export function getRelationFooterCounts(relations: readonly NPCRelation[]): RelationFooterCounts {
  let allies = 0;
  let enemies = 0;
  for (const relation of relations) {
    const level = getRelationLevel(relation.value);
    if (level === 'ally') allies += 1;
    if (level === 'enemy') enemies += 1;
  }
  return { total: relations.length, allies, enemies };
}

export function getCardEnterTransition(index: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0, delay: 0 };
  }
  return { delay: index * 0.06, duration: 0.25 };
}

export function getBarFillTransition(index: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0, delay: 0, ease: 'linear' as const };
  }
  return { duration: 0.6, delay: index * 0.06 + 0.2, ease: 'easeOut' as const };
}

export function getAffinityBarTransition(index: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0, delay: 0, ease: 'linear' as const };
  }
  return { duration: 0.6, delay: index * 0.06 + 0.3, ease: 'easeOut' as const };
}

export function getPanelSlideTransition(reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { type: 'spring' as const, damping: 25, stiffness: 200 };
}

export function getScheduleRevealTransition(reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration: 0.25, ease: 'easeInOut' as const };
}
