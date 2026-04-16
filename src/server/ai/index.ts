// ============================================
// AI ORCHESTRATION INDEX
// ============================================
// Единый экспорт для всех AI-модулей.
// Серверная часть — НЕ импортировать на клиенте!

// Types
export type {
  NarrativeRequest,
  NarrativeResponse,
  DialogueRequest,
  DialogueResponse,
  AINarrativeResult,
  AIDialogueResult,
} from './types';

// Context builder
export { buildNarrativeContext, buildDialogueContext } from './context-builder';

// Memory (re-exports from root ai/ directory)
export { clearShortTermMemory, getShortTermMemory, addShortTerm } from '../../../ai/memory/shortTerm';
export { clearLongTermMemory, exportLongTermMemory, importLongTermMemory, getLongTermMemory } from '../../../ai/memory/longTerm';

// Knowledge
export { searchKnowledge, addKnowledge } from '../../../ai/knowledge/knowledgeBase';

// Orchestrator
export { runPipeline } from '../../../ai/orchestrator/runPipeline';
