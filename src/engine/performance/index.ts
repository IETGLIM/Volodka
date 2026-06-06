export {
  LOADING_MARKS,
  markAppStart,
  markOrchestratorMount,
  markGameDataReady,
  markCanvasMounted,
  markFirstFrame,
  getLoadingTimelineSnapshot,
  getFirstScenePlayableMs,
  type LoadingTimelineSnapshot,
} from './LoadingTimeline';

export {
  evaluateRuntimeBudgets,
  publishRuntimeBudgetCheck,
  getRuntimeBudgetSnapshot,
  type BudgetViolation,
  type BudgetSeverity,
  type RuntimeBudgetSnapshot,
} from './RuntimeBudgetMonitor';

export {
  PERFORMANCE_BUDGETS,
  getDrawCallBudget,
  getDrawCallWarnThreshold,
  getActiveFpsBudget,
  isWeakLaptopProfile,
} from '@/config/performanceBudgets';
