/* ─── Expansion quest / exploration item stubs (QUEST_ITEM_DEFINITIONS) ─── */

import type { InventoryItem } from '@/shared/types/game';

type QuestItemDef = {
  id: string;
  name: string;
  description: string;
  category: InventoryItem['category'];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
};

export const EXPANSION_ITEM_STUBS: Record<string, QuestItemDef> = {
  father_photo: {
    id: 'father_photo',
    name: 'Фотография отца',
    description: 'Пожелтевший снимок. На обороте — дата и адрес, которого больше нет на карте.',
    category: 'quest',
    rarity: 'rare',
  },
  soviet_poster: {
    id: 'soviet_poster',
    name: 'Советский плакат',
    description: 'Под плакатом — слой старой краски и чужой почерк.',
    category: 'quest',
    rarity: 'uncommon',
  },
  mystery_flash_drive: {
    id: 'mystery_flash_drive',
    name: 'Загадочная флешка',
    description: 'Без маркировки. Внутри — один зашифрованный файл.',
    category: 'quest',
    rarity: 'uncommon',
  },
  banned_corrected_book: {
    id: 'banned_corrected_book',
    name: 'Исправленная книга',
    description: 'Текст перечёркнут гильдейской правкой; между строк — оригинал.',
    category: 'quest',
    rarity: 'rare',
  },
  encrypted_zarema_archive: {
    id: 'encrypted_zarema_archive',
    name: 'Архив Заремы',
    description: 'Зашифрованный пакет свидетельств. Ключ — в доверии.',
    category: 'quest',
    rarity: 'rare',
  },
  vault_keycard_poetic: {
    id: 'vault_keycard_poetic',
    name: 'Поэтический ключ-карта',
    description: 'Пропуск в хранилище. Строка на магнитной полосе читается как рифма.',
    category: 'quest',
    rarity: 'rare',
  },
  manifest_draft_copy: {
    id: 'manifest_draft_copy',
    name: 'Черновик манифеста',
    description: 'Набросок Альберта. Каждая правка — спор с системой.',
    category: 'quest',
    rarity: 'uncommon',
  },
  node_coords_paper: {
    id: 'node_coords_paper',
    name: 'Координаты узла',
    description: 'Записка с координатами скрытого серверного узла.',
    category: 'quest',
    rarity: 'uncommon',
  },
  monument_names_list: {
    id: 'monument_names_list',
    name: 'Список имён',
    description: 'Имена тех, кого стёрли из реестра, но не из памяти.',
    category: 'quest',
    rarity: 'rare',
  },
  guild_infiltration_journal: {
    id: 'guild_infiltration_journal',
    name: 'Журнал проникновения',
    description: 'Записи о маршрутах внутри гильдии. Почерк дрожит.',
    category: 'quest',
    rarity: 'rare',
  },
  archive7_chip: {
    id: 'archive7_chip',
    name: 'Чип Архива-7',
    description: 'Микросхема с фрагментом запретного архива.',
    category: 'quest',
    rarity: 'legendary',
  },
  sealed_relay_envelope: {
    id: 'sealed_relay_envelope',
    name: 'Запечатанный конверт',
    description: 'Без маркировки. Бариста сказал: только ногами, не через Slack.',
    category: 'quest',
    rarity: 'common',
  },

  /* ── Milestone-80 dialogue effects (addItem) ── */

  last_poem_letter: {
    id: 'last_poem_letter',
    name: 'Письмо умирающего поэта',
    description:
      'Жёлтый лист, сложенный вчетверо. Почерк дрожит — рука, что писала, уже почти не держала перо. Адресат — Елена. Автор просил не читать. Но если прочтёшь — уже не передашь нетронутым.',
    category: 'quest',
    rarity: 'legendary',
  },
  network_token: {
    id: 'network_token',
    name: 'Сетевой жетон',
    description:
      'Физический токен доступа к закрытому узлу Сети. Маленький, металлический, с гравировкой частоты. Передаётся из рук в руки — никогда через Slack. Каждый — одноразовый, как и доверие.',
    category: 'quest',
    rarity: 'uncommon',
  },

  /* ── Side-quest item_collected targets (act3_expanded / act4_expanded / sideQuests) ── */

  grigory_journal: {
    id: 'grigory_journal',
    name: 'Журнал Григория',
    description:
      'Тетрадь инженера с заброшенного завода. Записи чередуются с датами и схемами. На последней странице — пометка карандашом: «Если кто-то найдёт — я в подвале. Не приходи один.»',
    category: 'quest',
    rarity: 'rare',
  },
  bunker_recording_device: {
    id: 'bunker_recording_device',
    name: 'Записывающее устройство бункера',
    description:
      'Довоенный портативный диктофон. Тяжёлый, в металлическом корпусе. Питание от батарей, которых давно нет — но внутри три плёнки с записями, которые ещё можно проиграть.',
    category: 'quest',
    rarity: 'rare',
  },
  memory_fragment: {
    id: 'memory_fragment',
    name: 'Фрагмент памяти',
    description:
      'Кусок оптического носителя размером с ноготь. В нём — фрагмент личности, выгруженный из серверного кластера дата-центра до его блокировки. На свету переливается зелёным — у каждого фрагмента свой цвет.',
    category: 'quest',
    rarity: 'legendary',
  },
  surveillance_data_chip: {
    id: 'surveillance_data_chip',
    name: 'Чип данных слежения',
    description:
      'Микросхема из телекоммуникационного шкафа на окраине промзоны. Внутри — логи перехвата: каждый разговор, каждое сообщение, каждый шёпот города за последние шесть месяцев. Не расшифровать без Катиного декодера.',
    category: 'quest',
    rarity: 'rare',
  },
  key_fragment_1: {
    id: 'key_fragment_1',
    name: 'Фрагмент ключа (1)',
    description:
      'Ржавый кусок металла, когда-то бывший частью ключа. Нащупывается в щелях между бетонными плитами у входа в промзону. Старик на скамье говорил: «Первый — у входа, где все ходят и никто не видит.»',
    category: 'quest',
    rarity: 'uncommon',
  },
  key_fragment_2: {
    id: 'key_fragment_2',
    name: 'Фрагмент ключа (2)',
    description:
      'Второй фрагмент — под обломками старого киоска. Тяжелее первого. На гладкой стороне — буква, стёртая временем. Без остальных — бесполезен. С остальными — дверь, за которой мир до Катастрофы.',
    category: 'quest',
    rarity: 'uncommon',
  },
  key_fragment_3: {
    id: 'key_fragment_3',
    name: 'Фрагмент ключа (3)',
    description:
      'Последний фрагмент. Находится в заброшенной посылочной ячейке — дверь которой заклинило от сырости. Без этого куска остальные два — просто ржавчина. С ним — ключ к подземному убежищу.',
    category: 'quest',
    rarity: 'uncommon',
  },
  banned_book_1: {
    id: 'banned_book_1',
    name: 'Запрещённая книга (I): «Голоса до эфира»',
    description:
      'Тонкий том в кожаном переплёте. Первое издание, 1972 год. Стихи, которые гильдия изъяла из всех архивов. Между строк — пометки карандашом: кто-то читал её вслух, в подвале, при свете свечи. Запах старой бумаги.',
    category: 'quest',
    rarity: 'rare',
  },
  banned_book_2: {
    id: 'banned_book_2',
    name: 'Запрещённая книга (II): «Алгебра молчания»',
    description:
      'Второй том — толще, в тканевой обложке. На форзаце — подпись автора и дата: 1984. Стихи о цензуре, написанные до того, как цензура обрела алгоритмическое лицо. Гильдия изъяла все экземпляры. Все, кроме этого.',
    category: 'quest',
    rarity: 'rare',
  },
  banned_book_3: {
    id: 'banned_book_3',
    name: 'Запрещённая книга (III): «Код пробуждения»',
    description:
      'Третий том — самый тонкий, но самый опасный. Стихи, которые при прочтении вслух запускают короткий скрипт в любом устройстве рядом. Гильдия назвала это «поэтической вредоносной программой». Старый библиотекарь Фёдор хранит её в самом дальнем углу архива, за тремя замками.',
    category: 'quest',
    rarity: 'legendary',
  },
  child_memory_mother: {
    id: 'child_memory_mother',
    name: 'Воспоминание: мать',
    description:
      'Сгусток света в форме женского силуэта. Дитя из Мира Снов помнит: тёплые руки, запах хлеба, колыбельная без слов. Когда берёшь в ладони — звучит тихо, как будто издалека. Это воспоминание можно вернуть ребёнку — или оставить себе.',
    category: 'quest',
    rarity: 'rare',
  },
  child_memory_school: {
    id: 'child_memory_school',
    name: 'Воспоминание: школа',
    description:
      'Светящийся шар с запахом мела и звонком на урок. Дитя из Мира Снов помнит: первый день, чужие лица, страх, который потом станет любовью к знанию. Без этого воспоминания дитя не помнит своего имени.',
    category: 'quest',
    rarity: 'rare',
  },
  child_memory_poems: {
    id: 'child_memory_poems',
    name: 'Воспоминание: стихи',
    description:
      'Самое яркое воспоминание дитя. Свет пульсирует в ритме ямба. Это — мать читала стихи перед сном. Те же стихи, что и сейчас пульсируют в leaking-потоке серверов города. Не совпадение. Связь.',
    category: 'quest',
    rarity: 'legendary',
  },
};
