/**
 * Парсинг и очистка JSON ответа LLM для диалогов (сервер + при необходимости клиент).
 */

import { jsonrepair } from 'jsonrepair';
import type { DialogueResponse, PlayerDialogueChoice } from './ai-types';

/** Таймаут вызова модели в маршруте ai-dialogue (мс). */
export const AI_DIALOGUE_SDK_TIMEOUT_MS = 9_000;

export function withAbortTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`AI dialogue: timeout after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/** Убирает markdown-ограждения ```json ... ``` и лишний текст вокруг. */
export function stripMarkdownFromModelJson(raw: string): string {
  let t = raw.trim();
  const fenced = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```\s*$/i;
  const m = t.match(fenced);
  if (m) return m[1].trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '');
    t = t.replace(/\s*```\s*$/i, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return t.slice(start, end + 1).trim();
  }
  return t;
}

function normalizeDialogueResponse(parsed: Record<string, unknown>): DialogueResponse | null {
  if (!parsed.npcResponse || !Array.isArray(parsed.playerChoices)) {
    return null;
  }

  let npcResponse = String(parsed.npcResponse);

  if (npcResponse.startsWith('{')) {
    try {
      const inner = JSON.parse(npcResponse) as Record<string, unknown>;
      if (inner.npcResponse && typeof inner.npcResponse === 'string') {
        return {
          npcResponse: String(inner.npcResponse),
          playerChoices: Array.isArray(inner.playerChoices)
            ? (inner.playerChoices as PlayerDialogueChoice[]).slice(0, 3).map((c) => ({
                text: String(c.text),
                mood: String(c.mood ?? 'нейтрально'),
              }))
            : (parsed.playerChoices as PlayerDialogueChoice[]).slice(0, 3).map((c) => ({
                text: String(c.text),
                mood: String(c.mood ?? 'нейтрально'),
              })),
          relationshipHint: String(inner.relationshipHint ?? parsed.relationshipHint ?? 'без изменений'),
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    npcResponse,
    playerChoices: (parsed.playerChoices as PlayerDialogueChoice[]).slice(0, 3).map((c) => ({
      text: String(c.text),
      mood: String(c.mood ?? 'нейтрально'),
    })),
    relationshipHint: String(parsed.relationshipHint ?? 'без изменений'),
  };
}

function parseJsonLenientObject(raw: string): Record<string, unknown> | null {
  const cleaned = stripMarkdownFromModelJson(raw);
  try {
    const v = JSON.parse(cleaned);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    try {
      const repaired = jsonrepair(cleaned);
      const v = JSON.parse(repaired);
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Разбор сырой строки от модели → DialogueResponse или запасной объект из первых символов.
 */
export function parseDialogueFromModelRaw(raw: string): DialogueResponse {
  if (!raw?.trim()) {
    return {
      npcResponse: '…',
      playerChoices: [
        { text: 'Продолжить разговор', mood: 'спокойно' },
        { text: 'Закончить диалог', mood: 'устало' },
      ],
      relationshipHint: 'без изменений',
    };
  }

  const parsed = parseJsonLenientObject(raw);
  if (parsed) {
    const result = normalizeDialogueResponse(parsed);
    if (result) return result;
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const again = parseJsonLenientObject(jsonMatch[0]);
    if (again) {
      const result = normalizeDialogueResponse(again);
      if (result) return result;
    }
  }

  return {
    npcResponse: raw.slice(0, 300),
    playerChoices: [
      { text: 'Продолжить разговор', mood: 'спокойно' },
      { text: 'Закончить диалог', mood: 'устало' },
    ],
    relationshipHint: 'без изменений',
  };
}
