/** Категория пропа для бюджетирования и LOD */
export type PropCategory = 'furniture' | 'decor' | 'lighting' | 'tech' | 'tableware';

export interface PropDefinition {
  id: string; // 'mug_techsupport'
  category: PropCategory;
  /** Путь относительно public/ или ключ в MODEL_URLS, если пусто — процедурный fallback */
  glbPath?: string;
  /** Оценка VRAM/геометрии для стриминг-бюджетов (0 — неизвестно) */
  estimatedGeometryBytes?: number;
  estimatedTextureBytes?: number;
  /** Если true, не проходит валидацию масштаба (как toon cat) */
  exemptFromScaleValidation?: boolean;
  /** Базовый uniform для модели (до умножения на сцену/комнату), по умолчанию 1 */
  baseUniform?: number;
}
