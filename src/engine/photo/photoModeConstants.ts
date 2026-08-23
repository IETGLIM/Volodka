export const PHOTO_MODE_LABELS = {
  title: 'ФОТОРЕЖИМ',
  titleNoir: 'РЕЖИМ НУАР',
  dialogLabel: 'Режим фото',
  unknownScene: 'Неизвестная сцена',
  captureHintKey: 'SPACE',
  captureHint: 'снимок',
  exitHintKey: 'P',
  exitHintAlt: 'ESC',
  exitHint: 'выход',
  filterHintKey: 'N',
  filterHintNeon: 'неон',
  filterHintNoir: 'нуар',
  captureAction: 'Сделать снимок',
  exitAction: 'Выйти из режима фото',
  previewAlt: 'Предпросмотр снимка экрана',
  captureSuccess: 'Скриншот сохранён!',
  captureFailed: 'Не удалось сохранить снимок. Проверьте доступ к canvas.',
  entered: 'Режим фото включён',
  exited: 'Режим фото выключен',
  noirOn: 'Фильтр нуар',
  noirOff: 'Фильтр неон',
  controlsSummary: 'Пробел — снимок. N — фильтр. F — рамка. P или Escape — выход.',
  downloadAction: 'Скачать снимок',
  shareAction: 'Поделиться',
  downloadSuccess: 'Снимок скачан',
  shareSuccess: 'Снимок отправлен',
  shareUnavailable: 'Шеринг недоступен — снимок скачан',
  galleryTitle: 'Галерея сессии',
  galleryEmpty: 'Пока нет снимков',
  gallerySelect: 'Открыть снимок из галереи',
  galleryExportBatch: 'Скачать все',
  galleryExportBatchSuccess: 'Галерея скачана',
  galleryExportBatchPartial: 'Часть снимков скачана',
  galleryExportBatchFailed: 'Не удалось скачать галерею',
  frameHintKey: 'F',
  frameHint: 'рамка',
  lightingBoost: 'Освещение усилено',
  lightingNormal: 'Освещение сброшено',
} as const;

/** 5 photo filter presets — Normal, Noir, Cyberpunk Neon, Vintage Film, Dream Bloom */
export type PhotoFilterPreset =
  | 'normal'
  | 'noir'
  | 'cyberpunk_neon'
  | 'vintage_film'
  | 'dream_bloom';

/** Legacy alias — neon → normal for backward compat. */
export type LegacyPhotoFilterPreset = 'neon' | 'noir';

/** Ordered filter cycle for N key. */
export const PHOTO_FILTER_ORDER: PhotoFilterPreset[] = [
  'normal',
  'noir',
  'cyberpunk_neon',
  'vintage_film',
  'dream_bloom',
];

/** Human-readable filter names (Russian). */
export const PHOTO_FILTER_LABELS: Record<PhotoFilterPreset, string> = {
  normal: 'БЕЗ ФИЛЬТРА',
  noir: 'НУАР',
  cyberpunk_neon: 'КИБЕРПАНК НЕОН',
  vintage_film: 'ВИНТАЖНАЯ ПЛЁНКА',
  dream_bloom: 'СНОВИДНОЕ ЦВЕНИЕ',
};

/** CSS filter string applied to the canvas overlay in live view. */
export const PHOTO_FILTER_CSS: Record<PhotoFilterPreset, string> = {
  normal: 'none',
  noir: 'grayscale(1) contrast(1.3) brightness(0.85)',
  cyberpunk_neon: 'saturate(1.5) contrast(1.15) brightness(0.95) hue-rotate(10deg)',
  vintage_film: 'sepia(0.25) contrast(1.1) brightness(1.02) saturate(0.85)',
  dream_bloom: 'saturate(1.35) contrast(0.88) brightness(1.12) blur(0.3px)',
};

/** CSS filter for baking into captured PNG. */
export const PHOTO_FILTER_BAKE_CSS: Record<PhotoFilterPreset, string> = {
  normal: 'none',
  noir: 'grayscale(1) contrast(1.22) brightness(0.9)',
  cyberpunk_neon: 'saturate(1.5) contrast(1.15) brightness(0.95) hue-rotate(10deg)',
  vintage_film: 'sepia(0.3) contrast(1.1) brightness(1.0) saturate(0.8)',
  dream_bloom: 'saturate(1.35) contrast(0.88) brightness(1.12)',
};

/** Decorative frame / border styles. */
export type PhotoFramePreset = 'none' | 'cyberpunk_hud' | 'minimal' | 'letterbox';

export const PHOTO_FRAME_ORDER: PhotoFramePreset[] = [
  'none',
  'cyberpunk_hud',
  'minimal',
  'letterbox',
];

export const PHOTO_FRAME_LABELS: Record<PhotoFramePreset, string> = {
  none: 'БЕЗ РАМКИ',
  cyberpunk_hud: 'КИБЕРПАНК HUD',
  minimal: 'МИНИМАЛЬНАЯ',
  letterbox: 'КИНЕМАТОГРАФ',
};

export const PHOTO_FLASH_DURATION_MS = 200;
export const PHOTO_PREVIEW_DISPLAY_MS = 3000;
export const PHOTO_CORNER_BRACKET_SIZE = 16;
export const PHOTO_GALLERY_STRIP_MAX = 8;
