/**
 * Серверные утилиты AI-диалога (таймаут SDK, парс JSON).
 * Маршрут: `src/app/api/ai-dialogue/route.ts`.
 */

export {
  AI_DIALOGUE_SDK_TIMEOUT_MS,
  withAbortTimeout,
  stripMarkdownFromModelJson,
  parseDialogueFromModelRaw,
} from '@/lib/ai-dialogue-json';
