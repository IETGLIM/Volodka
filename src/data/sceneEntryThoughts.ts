/* ─── Scene Entry Thoughts — automatic inner monologue on first visit ─── */

import type { SceneId } from '@/shared/types/game';

/**
 * Mapping of scene IDs to Volodka's inner monologue lines.
 * Shown once per scene (tracked via `visited_thought_{sceneId}` flag).
 */
export const SCENE_ENTRY_THOUGHTS: Partial<Record<SceneId, string>> = {
  volodka_corridor: 'Коридор. Тот самый коридор, где Wi-Fi ловит только у соседской двери...',
  park_day: 'Парк. Деревья — единственные в городе, кто не просит пароль от Wi-Fi.',
  street_night: 'Улица. Дождь, неон, асфальт. Классика киберпанка.',
  cafe_evening: 'Кафе «Нулевой Бит». Здесь пахнет кофе и сломанными обещаниями.',
  library_day: 'Библиотека. Бумажные книги — прошлый век, зато не нужны патчи.',
  rooftop_edge: 'Крыша. Сверху город кажется менее безнадёжным. Почти.',
  river_pier: 'Пирс. Вода отражает неон, как будто ей тоже есть что скрывать.',
  abandoned_factory: 'Заброшенный завод. Здесь даже эхо звучит депрессивно.',
  factory_basement: 'Подвал завода. Пахнет ржавчиной и неудавшимися революциями.',
  chk_forest_zorge: 'Лес. Деревья не спрашивают, кем ты работаешь. Им всё равно.',
  city_square: 'Площадь. Памятник кому-то важному. А мы тут живём.',
  underground_bunker: 'Бункер. Тихо, как в могиле. Только хуже — тут есть Wi-Fi.',
};