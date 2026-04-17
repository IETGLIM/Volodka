/**
 * Жанры процедурной атмосферной музыки (Web Audio, без семплов).
 * «brutal_heavy» — стилизация под экстремальный метал (удар+шум+диссонанс), не запись инструментов.
 */

export type AtmosphereGenre = 'ambient' | 'chiptune_8bit' | 'brutal_heavy';

/** Сцена → жанр; всё, чего нет в таблице, считается ambient. */
const SCENE_GENRE: Partial<Record<string, AtmosphereGenre>> = {
  // 8-bit / chiptune — быт, квартира, «пиксельная» ностальгия
  kitchen_night: 'chiptune_8bit',
  kitchen_dawn: 'chiptune_8bit',
  home_morning: 'chiptune_8bit',
  home_evening: 'chiptune_8bit',
  blue_pit: 'chiptune_8bit',
  library: 'chiptune_8bit',

  // Brutal / heavy — давление, клуб, бой, индустрия
  battle: 'brutal_heavy',
  underground_club: 'brutal_heavy',
  abandoned_factory: 'brutal_heavy',

  // Ambient — пространство, ночь, терапия, галерея, офис как «дрон»
  dream: 'ambient',
  memorial_park: 'ambient',
  psychologist_office: 'ambient',
  street_night: 'ambient',
  street_winter: 'ambient',
  rooftop_night: 'ambient',
  train_station: 'ambient',
  old_library: 'ambient',
  gallery_opening: 'ambient',
  cafe_evening: 'ambient',
  office_morning: 'ambient',
  server_room: 'ambient',
};

export function getAtmosphereGenreForScene(sceneId: string): AtmosphereGenre {
  return SCENE_GENRE[sceneId] ?? 'ambient';
}
