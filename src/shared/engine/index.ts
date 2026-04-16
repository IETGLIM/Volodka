// ============================================
// SHARED ENGINE INDEX — Единый экспорт всех систем
// ============================================

export {
  eventBus,
  type EventBusEvent,
  type EventMap,
  type EventHandler,
  type EventPayload,
  type PreEmitMiddleware,
  type PostEmitMiddleware,
} from './EventBus';

export {
  ECSWorld,
  world,
  type EntityId,
  type Component,
  type SystemContext,
  type ISystem,
  type SystemPriority,
  type HealthComponent,
  type PositionComponent,
  type DialogueStateComponent,
  type StatsComponent,
  type NPCRelationComponent,
  type InventoryComponent,
  type QuestComponent,
  type TagComponent,
} from '../ecs';

// Re-export engine systems from their original location
// (these remain in /src/engine/ for backward compatibility)
export {
  registerConsequence,
  registerConsequences,
  registerDefaultConsequences,
  evaluateConsequences,
  applyConsequenceEffects,
  initConsequencesSystem,
  resetConsequences,
  type ConsequenceDefinition,
  type ConsequenceEffect,
  type ConsequenceCondition,
  type ConsequenceEvaluationContext,
} from '@/engine/ConsequencesSystem';

export {
  startDialogue,
  endDialogue,
  processDialogueChoice,
  evaluateCondition,
  evaluateAllConditions,
  applyDialogueEffects,
  clearMemory,
  clearAllMemories,
  type DialogueMemory,
  type DialogueContext,
  type DialogueChoiceResult,
} from '@/engine/DialogueEngine';

export {
  sceneManager,
  SCENE_VISUALS,
  type SceneVisualConfig,
} from '@/engine/SceneManager';

export {
  coreLoop,
  type CoreLoopState,
  type CoreLoopContext,
} from '@/engine/CoreLoop';

export {
  poemMechanics,
  type PoemInsight,
  type PoemDialogueUnlock,
  type PoemAtmosphereEffect,
} from '@/engine/PoemMechanics';

export {
  statsEngine,
  type DerivedEffects,
  type StatChangeResult,
} from '@/engine/StatsEngine';
