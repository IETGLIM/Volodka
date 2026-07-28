export const PHOTO_MODE_LABELS = {
  title: 'PHOTO MODE',
  titleNoir: 'NOIR MODE',
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
  controlsSummary: 'Пробел — снимок. N — нуар/неон. P или Escape — выход.',
} as const;

export type PhotoFilterPreset = 'neon' | 'noir';

export const PHOTO_FLASH_DURATION_MS = 200;
export const PHOTO_PREVIEW_DISPLAY_MS = 3000;
export const PHOTO_CORNER_BRACKET_SIZE = 16;
