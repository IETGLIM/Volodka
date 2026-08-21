import { devWarn } from '@/shared/utils/devLog';
/* ─── Volodka RPG – Dynamic AI NPC Chat via FreeRouter API ─── */
/* Client-side utility that generates dynamic Russian NPC responses
 * using the FreeRouter chat completions endpoint.
 *
 * Features:
 *  - System prompt establishes NPC character and game world
 *  - 60-second response cache to avoid duplicate API calls
 *  - Fallback Russian response on API failure
 *  - Conversation history support for multi-turn dialogue
 */

const API_BASE = 'https://freerouter.eu.cc/v1/chat/completions';
const API_KEY = 'fr-7ENQDdDCXYthX7kBLqwJSzrpxeOfINEi';
const DEFAULT_MODEL = 'qwen3.8-max';
const CACHE_TTL_MS = 60_000;

/* ─── Types ─── */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface FreeRouterChatParams {
  npcName: string;
  npcPersonality: string;
  playerQuestion: string;
  conversationHistory?: ChatMessage[];
  model?: string;
}

/* ─── Response cache ─── */

const responseCache = new Map<string, { response: string; timestamp: number }>();

function getCacheKey(npcName: string, playerQuestion: string): string {
  return `${npcName}::${playerQuestion}`;
}

function getCachedResponse(npcName: string, playerQuestion: string): string | null {
  const key = getCacheKey(npcName, playerQuestion);
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.response;
}

function setCachedResponse(npcName: string, playerQuestion: string, response: string): void {
  responseCache.set(getCacheKey(npcName, playerQuestion), {
    response,
    timestamp: Date.now(),
  });
}

/* ─── Fallback responses (Russian) ─── */

const FALLBACK_RESPONSES = [
  'Хм, интересная мысль... Давай обсудим это позже.',
  'Я сейчас думаю над другим. Извини.',
  'Не сейчас. У меня дела.',
  'Интересно... Но я не могу сейчас об этом говорить.',
  'Мне нужно время, чтобы всё обдумать.',
];

function getFallbackResponse(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

/* ─── System prompt builder ─── */

function buildSystemPrompt(npcName: string, npcPersonality: string): string {
  return `Ты — персонаж по имени ${npcName} из мира Володки, атмосферной русскоязычной RPG.

Твоя характериитика: ${npcPersonality}

Правила:
1. Отвечай ТОЛЬКО на русском языке.
2. Оставайся в образе — не выходи из персонажа.
3. Отвечай кратко (1-3 предложения), как в диалоге игры.
4. Отражай свою личность и текущее настроение в ответе.
5. Не упоминай, что ты ИИ или языковая модель.
6. Мир — постсоветская киберпанк-атмосфера с элементами магии и загадок.
7. Используй естественно-разговорный русский язык, без формальностей.`;
}

/* ─── API call ─── */

export async function generateNpcResponse(params: FreeRouterChatParams): Promise<string> {
  const { npcName, npcPersonality, playerQuestion, conversationHistory = [], model = DEFAULT_MODEL } = params;

  // Check cache first
  const cached = getCachedResponse(npcName, playerQuestion);
  if (cached) return cached;

  const systemPrompt = buildSystemPrompt(npcName, npcPersonality);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: playerQuestion },
  ];

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      devWarn(`[freeRouterAiChat] API returned ${response.status}`);
      return getFallbackResponse();
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      devWarn('[freeRouterAiChat] Unexpected API response structure');
      return getFallbackResponse();
    }

    // Strip any <think>...</think> blocks that some models produce
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const final = cleaned || content.trim();

    // Cache the successful response
    setCachedResponse(npcName, playerQuestion, final);

    return final;
  } catch (err) {
    devWarn('[freeRouterAiChat] API call failed:', err);
    return getFallbackResponse();
  }
}

/** Clear the response cache (useful when starting a new game session) */
export function clearAiChatCache(): void {
  responseCache.clear();
}
