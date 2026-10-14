/* ─── ZF-пак «Заря-М — четвёртый голос» (v4.48.20, проход 2) ───
 *
 * Вертикальный срез эпизода по мастер-принципу «не рассказывай — создай
 * ситуацию, в которой игрок сам собирает тайну»: три неполных источника
 * (кассета Трофима / релейный блок / фото пультовой) → узел-синтез (≥2
 * источников) → контакт с машиной (мир меняется) → судьба кассеты (4 ветки).
 *
 * Квест — стержень, нанизывающий существующие нити (aaa-механизм, pier echo,
 * исповедь машины), не параллельная ветка. Флаги zf_* — крючки для
 * machine_confession_approach, эпилога и hub-реплик.
 */

import type { QuestDefinition } from '@/shared/types/game';

export const ZARYA_FOURTH_VOICE_QUESTS: QuestDefinition[] = [
  {
    id: 'zarya_fourth_voice',
    title: 'Четвёртая смена',
    description:
      'Трофим говорит: три смены — это люди. А четвёртую никто не назначал, но каждый день в 03:47 где-то на «Хроме-М» что-то включает свет. Три обрывка — кассета без этикетки, релейный блок, циклы которого не сходятся, и фото пультовой с чужим списком — могут сложиться в ответ. Машина, которая тридцать лет считалась списанной, кого-то ждёт. Узнай — кого.',
    act: 4,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Трофим → кассета → релейный блок в подвале → фото пультовой в цехе → свести ≥2 источника → контакт у машины.',
    objectives: [
      {
        id: 'hear_tape',
        description: 'Прослушать кассету без этикетки',
        type: 'flag_set',
        target: 'zf_tape_listened',
        completed: false,
      },
      {
        id: 'examine_relay',
        description: 'Осмотреть релейный блок в подвале',
        type: 'flag_set',
        target: 'zf_relay_examined',
        completed: false,
      },
      {
        id: 'find_archive',
        description: 'Найти фото пультовой со списком дежурств',
        type: 'flag_set',
        target: 'zf_archive_found',
        completed: false,
      },
      {
        id: 'form_hypothesis',
        description: 'Свести источники — сформировать гипотезу',
        type: 'flag_set',
        target: 'zf_hypothesis_formed',
        completed: false,
      },
      {
        id: 'make_contact',
        description: 'Подойти к «Заре-М» с ответом',
        type: 'flag_set',
        target: 'zf_contact_made',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 180 },
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 6 } },
      { type: 'setFlag', flag: 'zf_episode_complete', flagValue: true },
    ],
    questGiverNpcId: 'fisherman_trofim',
    linkedStoryNodeId: 'zf_factory_night_entry',
    linkedStoryNodeIds: [
      'zf_factory_night_entry',
      'zf_trofim_fourth_shift',
      'zf_trofim_evasive',
      'zf_trofim_silence',
      'zf_trofim_tape_offer',
      'zf_tape_bridge_echo',
      'zf_tape_listen',
      'zf_relay_node',
      'zf_archive_node',
      'zf_hypothesis',
      'zf_contact',
      'zf_contact_who',
      'zf_contact_listened',
      'zf_tape_fate',
      'zf_poem_stone_node',
    ],
  },
];
