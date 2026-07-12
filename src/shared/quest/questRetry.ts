import type { QuestDefinition } from '@/shared/types/definitions/quest';

/** Quests are retryable unless explicitly marked `canRetry: false`. */
export function questCanRetry(
  definition: Pick<QuestDefinition, 'canRetry'> | undefined,
): boolean {
  return definition?.canRetry !== false;
}
