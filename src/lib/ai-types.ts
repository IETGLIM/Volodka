// ============================================
// SHARED TYPES FOR AI PIPELINE
// ВОЛОДЬКА — narrative psychological RPG (3D exploration)
// ============================================

import type { PlayerState, NPCRelation } from '../data/types';

// ---------- Narrative API Types ----------

export interface NarrativeRequest {
  currentNodeId: string;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  action: string;
}

export interface DynamicChoice {
  text: string;
  suggestedEffect: string;
}

export interface NarrativeResponse {
  narrativeText: string;
  dynamicChoices: DynamicChoice[];
  atmosphereHint: string;
}

// ---------- Dialogue API Types ----------

export interface DialogueLine {
  speaker: 'player' | 'npc';
  text: string;
}

export interface DialogueRequest {
  npcId: string;
  npcName: string;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  dialogueHistory: DialogueLine[];
  currentTopic: string;
}

export interface PlayerDialogueChoice {
  text: string;
  mood: string;
}

export interface DialogueResponse {
  npcResponse: string;
  playerChoices: PlayerDialogueChoice[];
  relationshipHint: string;
}

// ---------- AI Client Error Types ----------

export interface AIFallbackNarrative extends NarrativeResponse {
  _fallback: true;
}

export interface AIFallbackDialogue extends DialogueResponse {
  _fallback: true;
}

export type AINarrativeResult = NarrativeResponse | AIFallbackNarrative;
export type AIDialogueResult = DialogueResponse | AIFallbackDialogue;

export function isFallbackNarrative(result: AINarrativeResult): result is AIFallbackNarrative {
  return '_fallback' in result && result._fallback === true;
}

export function isFallbackDialogue(result: AIDialogueResult): result is AIFallbackDialogue {
  return '_fallback' in result && result._fallback === true;
}
