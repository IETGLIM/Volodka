import type {
  ComposerAccessoryId,
  ComposerBodyId,
  ComposerBottomId,
  ComposerHairId,
  ComposerHeadId,
  ComposerPropId,
  ComposerTopId,
  QuaterniusRigRef,
} from '@/config/npcComposer/types';

export interface ComposerPartMeta {
  id: string;
  label: string;
  /** Quaternius Ultimate Modular preset this part evokes (CC0). */
  cc0Preset?: string;
  rigFamily: 'male' | 'female';
}

export const COMPOSER_BODY_PARTS: Record<ComposerBodyId, ComposerPartMeta> = {
  slim_female: { id: 'slim_female', label: 'Стройное женское', cc0Preset: 'Casual', rigFamily: 'female' },
  average_female: { id: 'average_female', label: 'Среднее женское', cc0Preset: 'Formal', rigFamily: 'female' },
  elder_female_stooped: { id: 'elder_female_stooped', label: 'Пожилая женщина', cc0Preset: 'Witch', rigFamily: 'female' },
  slim_male: { id: 'slim_male', label: 'Стройное мужское', cc0Preset: 'Casual_Hoodie', rigFamily: 'male' },
  average_male: { id: 'average_male', label: 'Среднее мужское', cc0Preset: 'Casual_2', rigFamily: 'male' },
  heavy_male: { id: 'heavy_male', label: 'Тяжёлое мужское', cc0Preset: 'King', rigFamily: 'male' },
  elder_male: { id: 'elder_male', label: 'Пожилой мужчина', cc0Preset: 'Farmer', rigFamily: 'male' },
};

export const COMPOSER_HEAD_PARTS: Record<ComposerHeadId, ComposerPartMeta> = {
  young_female: { id: 'young_female', label: 'Молодая', rigFamily: 'female' },
  mature_female: { id: 'mature_female', label: 'Зрелая', rigFamily: 'female' },
  elder_female: { id: 'elder_female', label: 'Пожилая', rigFamily: 'female' },
  young_male: { id: 'young_male', label: 'Молодой', rigFamily: 'male' },
  mature_male: { id: 'mature_male', label: 'Зрелый', rigFamily: 'male' },
  bearded_male: { id: 'bearded_male', label: 'Бородатый', rigFamily: 'male' },
  elder_male: { id: 'elder_male', label: 'Старик', rigFamily: 'male' },
};

export const COMPOSER_HAIR_PARTS: Record<ComposerHairId, ComposerPartMeta> = {
  scarf_wrap: { id: 'scarf_wrap', label: 'Платок', cc0Preset: 'Medieval', rigFamily: 'female' },
  bun_gray: { id: 'bun_gray', label: 'Седой пучок', rigFamily: 'female' },
  bun_dark: { id: 'bun_dark', label: 'Тёмный пучок', rigFamily: 'female' },
  ponytail: { id: 'ponytail', label: 'Хвост', rigFamily: 'female' },
  shoulder_length: { id: 'shoulder_length', label: 'До плеч', rigFamily: 'female' },
  short_crop: { id: 'short_crop', label: 'Короткая', rigFamily: 'male' },
  gray_receding: { id: 'gray_receding', label: 'Седые залысины', rigFamily: 'male' },
  beanie: { id: 'beanie', label: 'Шапка', rigFamily: 'male' },
  hood: { id: 'hood', label: 'Капюшон', rigFamily: 'male' },
  cap: { id: 'cap', label: 'Кепка', rigFamily: 'male' },
  bald: { id: 'bald', label: 'Без волос', rigFamily: 'male' },
};

export const COMPOSER_TOP_PARTS: Record<ComposerTopId, ComposerPartMeta> = {
  dress_long: { id: 'dress_long', label: 'Длинное платье', rigFamily: 'female' },
  tweed_jacket: { id: 'tweed_jacket', label: 'Твидовый пиджак', cc0Preset: 'Suit', rigFamily: 'male' },
  hoodie: { id: 'hoodie', label: 'Худи', cc0Preset: 'Casual_Hoodie', rigFamily: 'male' },
  suit: { id: 'suit', label: 'Костюм', cc0Preset: 'Suit', rigFamily: 'male' },
  cardigan: { id: 'cardigan', label: 'Кардиган', rigFamily: 'female' },
  work_coat: { id: 'work_coat', label: 'Рабочий халат', cc0Preset: 'Worker', rigFamily: 'male' },
  apron: { id: 'apron', label: 'Фартук', rigFamily: 'female' },
  barista_uniform: { id: 'barista_uniform', label: 'Фартук бариста', rigFamily: 'male' },
  jacket_casual: { id: 'jacket_casual', label: 'Куртка', cc0Preset: 'Adventurer', rigFamily: 'male' },
  windbreaker: { id: 'windbreaker', label: 'Ветровка', rigFamily: 'male' },
  blouse: { id: 'blouse', label: 'Блуза', rigFamily: 'female' },
};

export const COMPOSER_BOTTOM_PARTS: Record<ComposerBottomId, ComposerPartMeta> = {
  hidden_dress: { id: 'hidden_dress', label: 'Юбка платья', rigFamily: 'female' },
  slacks: { id: 'slacks', label: 'Брюки', rigFamily: 'male' },
  pants_dark: { id: 'pants_dark', label: 'Тёмные брюки', rigFamily: 'male' },
  skirt_a_line: { id: 'skirt_a_line', label: 'А-силуэт', rigFamily: 'female' },
  jeans: { id: 'jeans', label: 'Джинсы', rigFamily: 'male' },
  work_pants: { id: 'work_pants', label: 'Рабочие', rigFamily: 'male' },
};

export const COMPOSER_ACCESSORY_PARTS: Record<ComposerAccessoryId, ComposerPartMeta> = {
  none: { id: 'none', label: '—', rigFamily: 'male' },
  glasses_scholarly: { id: 'glasses_scholarly', label: 'Очки учёного', rigFamily: 'male' },
  glasses_round: { id: 'glasses_round', label: 'Круглые очки', rigFamily: 'female' },
  earring: { id: 'earring', label: 'Серьга', rigFamily: 'female' },
  cyber_arm: { id: 'cyber_arm', label: 'Кибер-рука', rigFamily: 'male' },
  badge: { id: 'badge', label: 'Бейдж', rigFamily: 'male' },
};

export const COMPOSER_PROP_PARTS: Record<ComposerPropId, ComposerPartMeta> = {
  none: { id: 'none', label: '—', rigFamily: 'male' },
  book: { id: 'book', label: 'Книга', rigFamily: 'male' },
  ladle: { id: 'ladle', label: 'Ложка', rigFamily: 'female' },
  guitar: { id: 'guitar', label: 'Гитара', rigFamily: 'female' },
  soldering_iron: { id: 'soldering_iron', label: 'Паяльник', rigFamily: 'female' },
  phone: { id: 'phone', label: 'Телефон', rigFamily: 'female' },
  fishing_rod: { id: 'fishing_rod', label: 'Удочка', rigFamily: 'male' },
  wrench: { id: 'wrench', label: 'Ключ', rigFamily: 'male' },
  coffee_cup: { id: 'coffee_cup', label: 'Чашка', rigFamily: 'male' },
};

/** Default Quaternius rig per body part family — used when baking animation manifests. */
export function defaultRigForBody(body: ComposerBodyId): QuaterniusRigRef {
  const family = COMPOSER_BODY_PARTS[body].rigFamily;
  return family === 'female' ? 'female_01' : 'male_02';
}
