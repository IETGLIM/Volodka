/* ─── Quest ↔ minigame bridge data (no React deps — safe for validators) ─── */

import type { MinigameType } from '@/shared/constants/minigames';

export interface QuestMinigameMapping {
  questId: string;
  objectiveId: string;
  minigameType: MinigameType;
  difficulty: number;
  failureText: string;
  successText: string;
}

/** UI copy + launch hints for quests with `minigame_completed` objectives. */
export const QUEST_MINIGAME_MAP: Record<string, QuestMinigameMapping> = {
  incident_scroll_4729: {
    questId: 'incident_scroll_4729',
    objectiveId: 'crack_the_code',
    minigameType: 'codebreaker',
    difficulty: 2,
    failureText: 'Шифр не поддаётся... Нужно попробовать снова.',
    successText: 'Шифр взломан! Инцидент #4729 раскрыт.',
  },
  vault_backup_trial: {
    questId: 'vault_backup_trial',
    objectiveId: 'hack_vault_terminal',
    minigameType: 'bash_terminal',
    difficulty: 3,
    failureText: 'Терминал не отвечает. Попробуй ещё раз.',
    successText: 'Терминал Хранилища взломан!',
  },
  network_initiation: {
    questId: 'network_initiation',
    objectiveId: 'navigate_network',
    minigameType: 'hacking',
    difficulty: 3,
    failureText: 'Сеть не принимает тебя. Докажи свои навыки.',
    successText: 'Сеть признала тебя. Посвящение пройдено.',
  },
  poetry_collection: {
    questId: 'poetry_collection',
    objectiveId: 'enter_poetry_trance',
    minigameType: 'poetry',
    difficulty: 2,
    failureText: 'Стихотворение не сложилось... Попробуй снова.',
    successText: 'Твои стихи пронзают тишину. Поэзия жива!',
  },
  archive_of_forgotten: {
    questId: 'archive_of_forgotten',
    objectiveId: 'unlock_archive',
    minigameType: 'codebreaker',
    difficulty: 3,
    failureText: 'Архив заблокирован... Попробуй снова.',
    successText: 'Архив стихов разблокирован!',
  },
  final_code: {
    questId: 'final_code',
    objectiveId: 'write_freedom_virus',
    minigameType: 'openstack_terminal',
    difficulty: 4,
    failureText: 'Код не компилируется... Нужна ещё попытка.',
    successText: 'Вирус свободы написан!',
  },
  echo_of_vladimir: {
    questId: 'echo_of_vladimir',
    objectiveId: 'unlock_final_poem',
    minigameType: 'poetry',
    difficulty: 3,
    failureText: 'Стихотворение не открывается...',
    successText: 'Финальное стихотворение Владимира раскрыто!',
  },
};
