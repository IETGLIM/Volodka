// ============================================
// AI CLIENT — Browser-safe wrapper for AI APIs
// ВОЛОДЬКА — Psychological RPG / Visual Novel
// ============================================
// This module runs on the client side only.
// It wraps fetch calls to the backend API routes
// with queueing, caching, and graceful fallbacks.

import type {
  NarrativeRequest,
  NarrativeResponse,
  DialogueRequest,
  DialogueResponse,
  AINarrativeResult,
  AIDialogueResult,
  AIFallbackNarrative,
  AIFallbackDialogue,
} from './ai-types';

// ============================================
// CONFIGURATION
// ============================================

const API_ENDPOINTS = {
  narrative: '/api/ai-narrative',
  dialogue: '/api/ai-dialogue',
} as const;

const CACHE_TTL_MS = 30_000;          // Cache entries live 30 seconds
const MAX_CACHE_SIZE = 50;             // Max cached responses
const MIN_REQUEST_INTERVAL_MS = 1_500; // Minimum time between requests
const REQUEST_TIMEOUT_MS = 20_000;     // Per-request timeout (narrative)
/** Диалог: короче, чтобы спиннер не висел дольше ~9 с (согласовано с AI_DIALOGUE_SDK_TIMEOUT_MS на сервере). */
const DIALOGUE_FETCH_TIMEOUT_MS = 9_000;

const SESSION_DIALOGUE_PREFIX = 'volodka_ai_dialogue_v1:';

// ============================================
// RESPONSE CACHE
// ============================================

interface CacheEntry<T> {
  response: T;
  timestamp: number;
  key: string;
}

class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private order: string[] = [];

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.store.delete(key);
      this.order = this.order.filter(k => k !== key);
      return null;
    }
    return entry.response as T;
  }

  set<T>(key: string, response: T): void {
    // Evict oldest if at capacity
    while (this.store.size >= MAX_CACHE_SIZE && this.order.length > 0) {
      const oldest = this.order.shift()!;
      this.store.delete(oldest);
    }
    this.store.set(key, { response, timestamp: Date.now(), key });
    this.order.push(key);
  }

  clear(): void {
    this.store.clear();
    this.order = [];
  }

  get size(): number {
    return this.store.size;
  }
}

const cache = new ResponseCache();

// ============================================
// REQUEST QUEUE — Prevents API spam
// ============================================

interface QueuedRequest {
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;

  enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      // Enforce minimum interval between requests
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      if (elapsed < MIN_REQUEST_INTERVAL_MS) {
        await this.sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
      }

      try {
        const result = await item.execute();
        this.lastRequestTime = Date.now();
        item.resolve(result);
      } catch (error) {
        this.lastRequestTime = Date.now();
        item.reject(error);
      }
    }

    this.isProcessing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clear(): void {
    // Reject all pending requests
    for (const item of this.queue) {
      item.reject(new Error('Queue cleared'));
    }
    this.queue = [];
  }

  get pendingCount(): number {
    return this.queue.length;
  }
}

const queue = new RequestQueue();

// ============================================
// CACHE KEY GENERATOR
// ============================================

function generateNarrativeCacheKey(request: NarrativeRequest): string {
  // Use a simplified key based on the action and key stats
  // This avoids caching identical requests while allowing variety
  const { currentNodeId, action, playerState } = request;
  const statSnapshot = `${playerState.mood}-${playerState.stress}-${playerState.panicMode}-${playerState.creativity}-${playerState.selfEsteem}`;
  return `narrative:${currentNodeId}:${action}:${statSnapshot}`;
}

function hashDjb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function generateDialogueCacheKey(request: DialogueRequest): string {
  const { npcId, currentTopic, playerState, dialogueHistory } = request;
  const recent = (dialogueHistory ?? [])
    .slice(-5)
    .map((h) => `${h.speaker}:${h.text.slice(0, 160)}`)
    .join('\n');
  const topic = (currentTopic ?? '').slice(0, 120);
  const digest = hashDjb2(`${topic}\n${recent}`);
  const statSnapshot = `${playerState.mood}-${playerState.stress}-${playerState.creativity}-${playerState.energy}-${playerState.stability}`;
  return `dialogue:${npcId}:${digest}:${statSnapshot}`;
}

function dialogueSessionStorageKey(cacheKey: string): string {
  return `${SESSION_DIALOGUE_PREFIX}${cacheKey}`;
}

function readDialogueFromSession(cacheKey: string): DialogueResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(dialogueSessionStorageKey(cacheKey));
    if (!raw) return null;
    const data = JSON.parse(raw) as DialogueResponse;
    if (!data.npcResponse || !Array.isArray(data.playerChoices)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeDialogueToSession(cacheKey: string, data: DialogueResponse): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(dialogueSessionStorageKey(cacheKey), JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}

function clearDialogueSessionStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(SESSION_DIALOGUE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ============================================
// FETCH WITH TIMEOUT
// ============================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// FALLBACK CONTENT (when AI is unavailable)
// ============================================

function getNarrativeFallback(request: NarrativeRequest): AIFallbackNarrative {
  const { playerState, action } = request;
  const mood = playerState.mood;
  const stress = playerState.stress;

  let narrativeText: string;
  let atmosphereHint: string;

  if (playerState.panicMode || stress >= 90) {
    narrativeText = 'Мир раскалывается на фрагменты. Знакомые очертания плывут, как битые пиксели. Володька не может собраться с мыслями.';
    atmosphereHint = 'хаос';
  } else if (mood < 25) {
    narrativeText = 'Тишина давит со всех сторон. Володька стоит неподвижно, чувствуя, как пустота заполняет его изнутри. Холодный воздух обжигает.';
    atmosphereHint = 'пустота';
  } else if (mood > 75) {
    narrativeText = 'Тёплое чувство шевелится в груди — может, надежда? Свет фонаря ложится на снег золотыми узорами. Мир не так плох.';
    atmosphereHint = 'надежда';
  } else if (action.toLowerCase().includes('стих') || action.toLowerCase().includes('писать')) {
    narrativeText = 'Слова складываются сами, словно кто-то диктует изнутри. Творчество — единственное тепло в холодном мире Володьки.';
    atmosphereHint = 'вдохновение';
  } else {
    narrativeText = 'Мир тихо отзывается на действия Володьки. Ничего не меняется резко — но что-то сдвигается внутри, глубоко.';
    atmosphereHint = 'ожидание';
  }

  return {
    narrativeText,
    dynamicChoices: [
      { text: 'Продолжить путь', suggestedEffect: 'mood+5, energy-1' },
      { text: 'Остановиться и подумать', suggestedEffect: 'stability+5, introspection+2' },
      { text: 'Записать мысль', suggestedEffect: 'creativity+5, writing+2' },
    ],
    atmosphereHint,
    _fallback: true,
  };
}

function getDialogueFallback(request: DialogueRequest): AIFallbackDialogue {
  const { npcId, npcName, playerState } = request;
  const mood = playerState.mood;

  const fallbackResponses: Record<string, string> = {
    zarema: 'Володька, ты в порядке? Давай хоть чай попьём, а?',
    albert: 'Хм. Если хочешь поговорить — я тут.',
    dream_lillian: 'Твоё молчание... оно звучит громче слов.',
    cafe_barista: 'Заказать что-нибудь по меню или просто посидеть у стойки?',
    pit_timur: 'Ритм держу. На сет заглянешь?',
  };

  const npcResponse = fallbackResponses[npcId]
    ?? `${npcName} смотрит на тебя выжидающе.`;

  return {
    npcResponse,
    playerChoices: mood > 50
      ? [
          { text: 'Всё нормально, спасибо', mood: 'уверенно' },
          { text: 'На самом деле, мне не очень...', mood: 'честно' },
          { text: 'Помолчи немного, хорошо?', mood: 'тихо' },
        ]
      : [
          { text: 'Да...', mood: 'апатично' },
          { text: 'Мне нужно идти', mood: 'избегающе' },
        ],
    relationshipHint: 'без изменений',
    _fallback: true,
  };
}

// ============================================
// PUBLIC API — generateNarrativeReaction()
// ============================================

/**
 * Generate a narrative reaction to a player action.
 * Uses the AI backend when available, falls back gracefully.
 *
 * @param request - Narrative request with current game state and player action
 * @returns Narrative response (may be a fallback if AI is unavailable)
 */
export async function generateNarrativeReaction(
  request: NarrativeRequest,
): Promise<AINarrativeResult> {
  // Check cache first
  const cacheKey = generateNarrativeCacheKey(request);
  const cached = cache.get<NarrativeResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  // Queue the actual request
  return queue.enqueue(async (): Promise<AINarrativeResult> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.narrative, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        console.warn(
          `[AI Client] Narrative API returned ${response.status}, using fallback`,
        );
        return getNarrativeFallback(request);
      }

      const data = await response.json() as NarrativeResponse;

      // Validate minimal structure
      if (!data.narrativeText || !Array.isArray(data.dynamicChoices)) {
        console.warn('[AI Client] Invalid narrative response structure, using fallback');
        return getNarrativeFallback(request);
      }

      // Cache the valid response
      cache.set(cacheKey, data);

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[AI Client] Narrative request failed: ${msg}, using fallback`);
      return getNarrativeFallback(request);
    }
  });
}

// ============================================
// PUBLIC API — generateDialogueResponse()
// ============================================

/**
 * Generate an NPC dialogue response based on current context.
 * Uses the AI backend when available, falls back gracefully.
 *
 * @param request - Dialogue request with NPC info and conversation history
 * @returns Dialogue response (may be a fallback if AI is unavailable)
 */
export async function generateDialogueResponse(
  request: DialogueRequest,
): Promise<AIDialogueResult> {
  const cacheKey = generateDialogueCacheKey(request);

  const fromSession = readDialogueFromSession(cacheKey);
  if (fromSession) {
    return fromSession;
  }

  const cached = cache.get<DialogueResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  return queue.enqueue(async (): Promise<AIDialogueResult> => {
    try {
      const response = await fetchWithTimeout(
        API_ENDPOINTS.dialogue,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        },
        DIALOGUE_FETCH_TIMEOUT_MS,
      );

      if (!response.ok) {
        console.warn(
          `[AI Client] Dialogue API returned ${response.status}, using fallback`,
        );
        return getDialogueFallback(request);
      }

      const data = await response.json() as DialogueResponse;

      if (!data.npcResponse || !Array.isArray(data.playerChoices)) {
        console.warn('[AI Client] Invalid dialogue response structure, using fallback');
        return getDialogueFallback(request);
      }

      cache.set(cacheKey, data);
      writeDialogueToSession(cacheKey, data);

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[AI Client] Dialogue request failed: ${msg}, using fallback`);
      return getDialogueFallback(request);
    }
  });
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Clear the AI response cache.
 * Useful when the player loads a save or starts a new game.
 */
export function clearAICache(): void {
  cache.clear();
  clearDialogueSessionStorage();
}

/**
 * Clear all pending requests in the queue.
 * Useful during scene transitions.
 */
export function clearAIQueue(): void {
  queue.clear();
}

/**
 * Get current cache and queue stats for debugging.
 */
export function getAIStats(): { cacheSize: number; pendingRequests: number } {
  return {
    cacheSize: cache.size,
    pendingRequests: queue.pendingCount,
  };
}
