// ============================================
// STATS ENGINE — Психологическая система статов
// ============================================
// Управляет взаимосвязями между статами:
// - Стресс влияет: самооценка (-), стабильность (-), креативность (+ при низком, - при высоком)
// - Низкая самооценка: блокирует диалоговые выборы, меняет реакции NPC
// - Высокий креативность: открывает стиховые выборы, меняет визуальные эффекты
// - Низкая энергия: ограничивает доступные действия
// - Карма: влияет на доступные концовки

import { eventBus, type StatBusId } from './EventBus';
import type { NarrativeTimeOfDay, NPCRelation, PlayerState, PlayerSkills, ChoiceCondition } from '@/data/types';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { matchChoiceCondition, type ConditionMatchContext } from '@/core/conditions/ConditionMatcher';

// ============================================
// ТИПЫ
// ============================================

export interface DerivedEffects {
  /** Blocked choice reasons */
  blockedChoices: Array<{ reason: string; condition: string }>;
  /** Available new actions */
  availableActions: string[];
  /** Visual effects to apply */
  visualEffects: string[];
  /** Narrative hints */
  narrativeHints: string[];
  /** Whether stress is causing negative side effects */
  stressPenalty: boolean;
  /** Whether creativity is giving bonuses */
  creativityBonus: boolean;
  /** Whether self-esteem is too low for social interactions */
  sociallyBlocked: boolean;
  /** Energy level category */
  energyLevel: 'exhausted' | 'tired' | 'normal' | 'energized';
}

export interface StatChangeResult {
  stat: StatBusId;
  oldValue: number;
  newValue: number;
  delta: number;
  derivedEffects: DerivedEffects;
}

// ============================================
// STATS ENGINE CLASS
// ============================================

class StatsEngineClass {
  /** Process a stat change and get derived effects */
  processStatChange(
    stat: StatBusId,
    delta: number,
    currentState: PlayerState
  ): StatChangeResult {
    const oldValue = this.getStatValue(stat, currentState);
    const newValue = Math.max(0, Math.min(stat === 'energy' ? MAX_PLAYER_ENERGY : 100, oldValue + delta));

    const derivedEffects = this.getDerivedEffects({
      ...currentState,
      [stat as keyof PlayerState]: newValue,
    } as PlayerState);

    // Emit event
    eventBus.emit('stat:changed', {
      stat,
      oldValue,
      newValue,
      delta,
    });

    // Check stress thresholds
    if (stat === 'stress') {
      if (newValue >= 100 && oldValue < 100) {
        eventBus.emit('stress:threshold', { level: 100, stress: newValue });
      } else if (newValue >= 75 && oldValue < 75) {
        eventBus.emit('stress:threshold', { level: 75, stress: newValue });
      } else if (newValue >= 50 && oldValue < 50) {
        eventBus.emit('stress:threshold', { level: 50, stress: newValue });
      } else if (newValue >= 25 && oldValue < 25) {
        eventBus.emit('stress:threshold', { level: 25, stress: newValue });
      }
    }

    return {
      stat,
      oldValue,
      newValue,
      delta,
      derivedEffects,
    };
  }

  /** Get derived effects from current state */
  getDerivedEffects(state: PlayerState): DerivedEffects {
    const blockedChoices: Array<{ reason: string; condition: string }> = [];
    const availableActions: string[] = [];
    const visualEffects: string[] = [];
    const narrativeHints: string[] = [];

    // ---- Stress effects ----
    const stressPenalty = state.stress > 50;
    
    if (state.stress > 70) {
      visualEffects.push('red-tint');
      visualEffects.push('glitch-effect');
      narrativeHints.push('Стресс зашкаливает — мысли путаются');
    }
    if (state.stress > 90) {
      visualEffects.push('scanlines');
      blockedChoices.push({ reason: 'Паника мешает мыслить ясно', condition: 'stress > 90' });
    }
    if (state.panicMode) {
      visualEffects.push('intense-glitch');
      visualEffects.push('red-overlay');
      narrativeHints.push('KERNEL PANIC — критический уровень стресса!');
    }

    // ---- Self-esteem effects ----
    const sociallyBlocked = state.selfEsteem < 25;
    
    if (state.selfEsteem < 30) {
      blockedChoices.push({ reason: 'Неуверенность мешает решиться', condition: 'selfEsteem < 30' });
      narrativeHints.push('Самооценка слишком низкая для этого действия');
    }
    if (state.selfEsteem > 60) {
      availableActions.push('bold-dialogue');
      availableActions.push('public-speaking');
    }

    // ---- Creativity effects ----
    const creativityBonus = state.creativity > 50;
    
    if (state.creativity > 70) {
      visualEffects.push('golden-shimmer');
      availableActions.push('poem-choices');
      availableActions.push('creative-dialogue');
      narrativeHints.push('Творческий подъём открывает новые горизонты');
    }

    // ---- Stability effects ----
    if (state.stability < 30) {
      visualEffects.push('dark-vignette');
      visualEffects.push('desaturation');
      narrativeHints.push('Нестабильность давит на восприятие');
    }

    // ---- Energy effects ----
    const energyLevel = this.getEnergyLevel(state.energy);
    
    if (energyLevel === 'exhausted') {
      blockedChoices.push({
        reason: 'Нет сил на это действие',
        condition: `energy <= ${Math.ceil(MAX_PLAYER_ENERGY * 0.12)}`,
      });
      narrativeHints.push(
        'Совсем нет сил: в сюжете выберите отдых («сон»), поговорите с NPC на сцене (без траты энергии) или подождите — энергия медленно восстанавливается.',
      );
    }

    if (state.energy <= Math.ceil(MAX_PLAYER_ENERGY * 0.35) && state.energy > Math.ceil(MAX_PLAYER_ENERGY * 0.12)) {
      narrativeHints.push(
        'Энергия на исходе: квесты и фракции — через панели 📋 и ⚔️; IT-терминал 💻 для сюжетных команд. Диалоги с персонажами на локации не расходуют энергию.',
      );
    }

    // ---- Mood effects ----
    if (state.mood < 20) {
      visualEffects.push('cold-tint');
      narrativeHints.push('Настроение на нуле');
    }
    if (state.mood > 70) {
      availableActions.push('optimistic-choices');
    }

    // ---- Karma effects ----
    if (state.karma > 70) {
      availableActions.push('redemption-path');
      narrativeHints.push('Хорошая карма открывает путь к примирению');
    }

    return {
      blockedChoices,
      availableActions,
      visualEffects,
      narrativeHints: [...new Set(narrativeHints)],
      stressPenalty,
      creativityBonus,
      sociallyBlocked,
      energyLevel,
    };
  }

  /** Check if a choice condition is met */
  isChoiceConditionMet(
    condition: ChoiceCondition,
    state: PlayerState,
    flags: Record<string, boolean>,
    inventory: string[],
    npcRelations: NPCRelation[],
    visitedNodes: string[],
    activeQuestIds?: string[],
    completedQuestIds?: string[],
    extras?: { narrativeTimeOfDay?: NarrativeTimeOfDay; equippedItemIds?: string[] },
  ): { met: boolean; reason?: string } {
    const ctx: ConditionMatchContext = {
      playerState: state,
      npcRelations,
      flags,
      inventory,
      visitedNodes,
      skills: state.skills,
      activeQuestIds: activeQuestIds ?? [],
      completedQuestIds: completedQuestIds ?? [],
      narrativeTimeOfDay: extras?.narrativeTimeOfDay,
      equippedItemIds: extras?.equippedItemIds ?? state.equippedItemIds,
    };
    return matchChoiceCondition(condition, ctx);
  }

  /** Get blocked choices based on current state */
  getBlockedChoices(state: PlayerState): Array<{ reason: string; condition: string }> {
    return this.getDerivedEffects(state).blockedChoices;
  }

  /** Get available actions based on current state */
  getAvailableActions(state: PlayerState): string[] {
    return this.getDerivedEffects(state).availableActions;
  }

  // ---- Private helpers ----

  private getStatValue(stat: StatBusId | string | undefined, state: PlayerState): number {
    if (stat == null) return 0;
    if (stat in state) {
      return state[stat as keyof PlayerState] as number;
    }
    if (stat in state.skills) {
      return state.skills[stat as keyof PlayerSkills] as number;
    }
    return 0;
  }

  private getEnergyLevel(energy: number): 'exhausted' | 'tired' | 'normal' | 'energized' {
    const m = MAX_PLAYER_ENERGY;
    if (energy <= Math.max(2, Math.ceil(m * 0.12))) return 'exhausted';
    if (energy <= Math.ceil(m * 0.33)) return 'tired';
    if (energy <= Math.ceil(m * 0.66)) return 'normal';
    return 'energized';
  }
}

// Singleton instance
export const statsEngine = new StatsEngineClass();
