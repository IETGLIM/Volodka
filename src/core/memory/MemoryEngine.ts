import type { Memory, MemoryEmotion, MemoryType } from './types';
import { useMemoryStore } from './memoryStore';

type InteractionMemorySpec = {
  type: MemoryType;
  title: string;
  description: string;
  emotion?: MemoryEmotion;
  intensity?: number;
  tags: string[];
  relatedEntityId?: string;
  persistent?: boolean;
};

const INTERACTION_MEMORIES: Partial<Record<string, InteractionMemorySpec>> = {
  npc_intro: {
    type: 'event',
    title: 'Порог разговора',
    description: 'Ты остановился у зоны, где воздух уже помнит чужие разговоры — и нажал «вход» в диалог.',
    emotion: 'neutral',
    intensity: 0.45,
    tags: ['met_npc', 'exploration', 'zarema_home', 'interaction'],
    relatedEntityId: 'zarema_home',
    persistent: true,
  },
  quest_zarema_hearth: {
    type: 'emotion',
    title: 'Тёплый угол',
    description: 'Ты отметил уютный угол комнаты — не флаг, а ощущение, что тишина здесь не пустая.',
    emotion: 'happy',
    intensity: 0.55,
    tags: ['hearth', 'exploration', 'zarema_room', 'interaction'],
    relatedEntityId: 'zarema_albert_room',
    persistent: true,
  },
};

function pushMemory(partial: Omit<Memory, 'timestamp'> & { timestamp?: number }): void {
  useMemoryStore.getState().addMemory({
    ...partial,
    timestamp: partial.timestamp ?? Date.now(),
  });
}

/** Снимок значимого из id взаимодействия (не каждый клик — upsert по id). */
export function rememberInteraction(interactionId: string): void {
  const spec = INTERACTION_MEMORIES[interactionId];
  if (!spec) return;
  pushMemory({
    id: `interaction:${interactionId}`,
    type: spec.type,
    title: spec.title,
    description: spec.description,
    relatedEntityId: spec.relatedEntityId,
    emotion: spec.emotion,
    intensity: spec.intensity,
    tags: spec.tags,
    persistent: spec.persistent,
    timestamp: Date.now(),
  });
}

/**
 * Нарративная отметка диалога. `dialogueId` — id дерева / узла; `relatedEntityId` обычно npcId.
 * `phase`: открытие сессии или её завершение (разные id, чтобы не дублировать смысл).
 */
export function rememberDialogue(
  dialogueId: string,
  emotion: MemoryEmotion | undefined,
  relatedEntityId: string | undefined,
  phase: 'open' | 'close',
): void {
  const em = emotion ?? 'neutral';
  if (phase === 'open') {
    pushMemory({
      id: `dialogue:open:${relatedEntityId ?? 'unknown'}:${dialogueId}`,
      type: 'dialogue',
      title: 'Разговор начат',
      description: `Открыта ветка «${dialogueId}». Ты слушаешь — и отвечаешь.`,
      emotion: em,
      intensity: 0.35,
      tags: ['dialogue', 'session', dialogueId],
      relatedEntityId,
      persistent: false,
      timestamp: Date.now(),
    });
    return;
  }
  pushMemory({
    id: `dialogue:close:${relatedEntityId ?? 'unknown'}:${dialogueId}`,
    type: 'dialogue',
    title: 'Разговор завершён',
    description: `Ты закрыл линию «${dialogueId}» — смысл остаётся в памяти дольше, чем окно.`,
    emotion: em,
    intensity: 0.5,
    tags: ['dialogue', 'resolved', dialogueId],
    relatedEntityId,
    persistent: true,
    timestamp: Date.now(),
  });
}

export function rememberCoreQuestStarted(questId: string, title: string, description: string): void {
  pushMemory({
    id: `quest:started:${questId}`,
    type: 'event',
    title: `Квест: ${title}`,
    description,
    emotion: 'neutral',
    intensity: 0.5,
    tags: ['quest', 'started', questId],
    persistent: false,
    timestamp: Date.now(),
  });
}

export function rememberCoreQuestCompleted(
  questId: string,
  title: string,
  description: string,
  emotion: MemoryEmotion = 'neutral',
): void {
  pushMemory({
    id: `quest:completed:${questId}`,
    type: 'event',
    title: `Квест завершён: ${title}`,
    description,
    emotion,
    intensity: 0.65,
    tags: ['quest', 'completed', questId],
    persistent: true,
    timestamp: Date.now(),
  });
}

export function rememberExplorationQuestCompleted(questId: string, title: string, description: string): void {
  pushMemory({
    id: `quest:legacy:${questId}:completed`,
    type: 'event',
    title,
    description,
    emotion: 'happy',
    intensity: 0.55,
    tags: ['quest', 'completed', questId, 'exploration'],
    persistent: true,
    timestamp: Date.now(),
  });
}
