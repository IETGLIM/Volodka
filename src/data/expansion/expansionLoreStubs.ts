/* ─── Expansion lore stubs for exploration / dialogue cross-refs ─── */

import type { LoreEntry } from '@/store/gameStore';

function stubLore(
  id: string,
  title: string,
  category: LoreEntry['category'] = 'mysteries',
): LoreEntry {
  return {
    id,
    title,
    category,
    body: 'Запись ещё не полностью расшифрована. Фрагмент сохранён в кодексе — полный текст появится в следующем обновлении контента.',
    sceneId: 'volodka_room',
    rarity: 'uncommon',
    discovered: false,
  };
}

export const EXPANSION_LORE_STUBS: LoreEntry[] = [
  stubLore('lore_soviet_layers', 'Слои советского города', 'history'),
  stubLore('lore_archive_7_hint', 'Намёк на Архив-7', 'mysteries'),
  stubLore('lore_poem_in_code', 'Стих в коде', 'technology'),
  stubLore('lore_factory_underwater', 'Завод под водой', 'history'),
  stubLore('lore_banned_poetry_tapes', 'Запрещённые поэтические кассеты', 'culture'),
  stubLore('lore_frequency_poem', 'Стих-частота', 'technology'),
  stubLore('lore_sculpture_node_function', 'Функция скульптурного узла', 'technology'),
  stubLore('lore_guild_poet_recruitment', 'Вербовка поэтов гильдией', 'factions'),
  stubLore('lore_poetic_protocol', 'Поэтический протокол', 'technology'),
  stubLore('lore_protest_identified_list', 'Список идентифицированных', 'factions'),
  stubLore('lore_city_neural_rain', 'Нейронный дождь города', 'technology'),
  stubLore('lore_chk_network_role', 'Роль сети в ЧК', 'factions'),
  stubLore('lore_monument_shadow_text', 'Тень на обелиске', 'mysteries'),
  stubLore('lore_bus_poetry', 'Поэзия в расписании', 'culture'),
  stubLore('lore_oko_rewrite', 'Перепись «Ока»', 'technology'),
  stubLore('lore_cafe_telegraph', 'Телеграф кафе', 'culture'),
  stubLore('lore_nurse_node', 'Узел медсестры', 'technology'),
  stubLore('lore_zarya_poetry', 'Поэзия Зари-М', 'technology'),
  stubLore('lore_city_awakening', 'Пробуждение города', 'mysteries'),
  stubLore('lore_archive_seven_truth', 'Правда Архива-7', 'mysteries'),
];
