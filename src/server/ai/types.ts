// ============================================
// AI TYPES — Объединённые типы для AI-модулей
// ============================================

import type { PlayerState } from '@/shared/types/game';
import type { NPCRelation } from '@/shared/types/game';

// ============================================
// NARRATIVE TYPES
// ============================================

export interface NarrativeRequest {
  currentNodeId: string;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  action: string;
  flags?: Record<string, boolean>;
}

export interface NarrativeResponse {
  narrativeText: string;
  dynamicChoices: Array<{
    text: string;
    suggestedEffect: string;
  }>;
  atmosphereHint: string;
}

export interface AIFallbackNarrative extends NarrativeResponse {
  _fallback: true;
}

export type AINarrativeResult = NarrativeResponse | AIFallbackNarrative;

// ============================================
// DIALOGUE TYPES
// ============================================

export interface DialogueRequest {
  npcId: string;
  npcName: string;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  dialogueHistory: Array<{ speaker: string; text: string }>;
  currentTopic: string;
}

export interface DialogueResponse {
  npcResponse: string;
  playerChoices: Array<{
    text: string;
    mood: string;
  }>;
  relationshipHint: string;
}

export interface AIFallbackDialogue extends DialogueResponse {
  _fallback: true;
}

export type AIDialogueResult = DialogueResponse | AIFallbackDialogue;

// ============================================
// PIPELINE TYPES
// ============================================

export interface PipelineRequest {
  prompt: string;
  context?: string;
  agents?: Array<'gameDesigner' | 'writer' | 'architect' | 'reviewer'>;
  saveToMemory?: boolean;
  memoryImportance?: number;
  memoryTags?: string[];
}

export interface PipelineResponse {
  result: string;
  agentOutputs: Array<{
    agent: string;
    output: string;
  }>;
  memorySaved: boolean;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isFallbackNarrative(result: AINarrativeResult): result is AIFallbackNarrative {
  return '_fallback' in result && result._fallback === true;
}

export function isFallbackDialogue(result: AIDialogueResult): result is AIFallbackDialogue {
  return '_fallback' in result && result._fallback === true;
}
