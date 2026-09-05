/**
 * Cross-registry narrative kind resolution.
 *
 * Story-узлы и диалоговые узлы живут в разных реестрах (storyNodes /
 * dialogueNodes), но граф повествования сквозной:
 *   - хуки-выборы в приветствиях NPC ведут прямо в story-цепочки
 *     (next: 'aaa_maria_lost_diary_start');
 *   - visitStoryNode-эффекты в диалогах меняют currentNodeId, не меняя kind
 *     открытого оверлея;
 *   - выборы story-узлов могут ссылаться на диалоговые узлы.
 *
 * Если оверлей открыт с чужим kind, рендер ищет узел только в своём реестре,
 * не находит его и показывает игроку ошибку загрузки вместо продолжения
 * истории. Функции ниже восстанавливают корректный kind: синхронно — по уже
 * загруженным кэшам пак-реестра, асинхронно — дозагрузкой паков до находки.
 */

import {
  ensureDialogueNode,
  ensureStoryNode,
  hasDialogueNode,
  hasStoryNode,
} from '@/data/narrative/narrativePackRegistry';

export type NarrativeKindGuess = 'story' | 'dialogue' | null;

/**
 * Синхронная догадка по уже загруженным кэшам пак-реестра.
 * Возвращает 'dialogue' | 'story', только если узел однозначно лежит ровно
 * в одном реестре; null — когда реестры ещё не загружены (пак не подъехал),
 * узел есть в обоих (переопределение) или его нет нигде. null означает
 * «оставь текущий kind — пусть решает асинхронная проверка».
 */
export function guessNarrativeKind(nodeId: string): NarrativeKindGuess {
  const asDialogue = hasDialogueNode(nodeId);
  const asStory = hasStoryNode(nodeId);
  if (asDialogue && !asStory) return 'dialogue';
  if (!asDialogue && asStory) return 'story';
  return null;
}

export interface NarrativeKindResolutionOptions {
  /** Если известно, какой kind запрашивали первым — его пробуем раньше. */
  preferredKind?: 'story' | 'dialogue';
}

/**
 * Асинхронное разрешение, когда синхронная догадка неубедительна: дозагружает
 * паки, пока узел не найдётся в одном из реестров. Возвращает kind найденного
 * узла или null, если узла нет нигде (тогда вызывающий показывает исходную
 * ошибку загрузки). Дорогой путь — только для реально отсутствующих узлов:
 * до этого момента синхронная догадка и кэш-проверки отрабатывают мгновенно.
 */
export async function resolveNarrativeKindByLoading(
  nodeId: string,
  options: NarrativeKindResolutionOptions = {},
): Promise<NarrativeKindGuess> {
  const { preferredKind } = options;
  const attempts: readonly ['story' | 'dialogue', () => Promise<unknown>][] = [
    ['dialogue', () => ensureDialogueNode(nodeId)],
    ['story', () => ensureStoryNode(nodeId)],
  ];
  const ordered = preferredKind === 'story' ? [...attempts].reverse() : attempts;

  for (const [kind, load] of ordered) {
    const found = await load().then(
      () => true,
      () => false,
    );
    if (found) return kind;
  }
  return null;
}
