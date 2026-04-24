// ============================================
// ENGINE INDEX — Единый экспорт всех систем
// ============================================

export {
  eventBus,
  type EventBusEvent,
  type EventMap,
  type EventHandler,
  type StatBusId,
  type SfxBusType,
} from './EventBus';
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
} from './ConsequencesSystem';
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
} from './DialogueEngine';

// New engine systems
export {
  sceneManager,
  SCENE_VISUALS,
  type SceneVisualConfig,
} from './SceneManager';
export {
  coreLoop,
  type CoreLoopState,
  type CoreLoopContext,
} from './CoreLoop';
export {
  poemMechanics,
  type PoemInsight,
  type PoemDialogueUnlock,
  type PoemAtmosphereEffect,
} from './PoemMechanics';
export {
  statsEngine,
  type DerivedEffects,
  type StatChangeResult,
} from './StatsEngine';

export {
  SceneStreamingCoordinator,
  getSceneStreamingCoordinator,
  startSceneStreamingCoordinator,
  disposeSceneStreamingCoordinator,
  type SceneStreamingCoordinatorApi,
  type StreamingPrefetchReason,
  type StreamingDebugSnapshot,
  type GetStreamingProfile,
} from './streaming/SceneStreamingCoordinator';
