/**
 * Жёсткие границы визуальной высоты персонажа после uniform (bbox × uniform).
 * Цепочка масштаба: `modelMeta.resolveCharacterMeshUniformScale` + глобальный ÷5 внутри неё.
 *
 * Новый GLB: поправить `GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME` и прогнать
 * `characterScaleAssets.integration.test.ts`.
 */

import { getDefaultPlayerModelPath, rewriteLegacyModelPath } from '@/config/modelUrls';
import { GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME } from '@/data/modelMeta';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';

/**
 * Ориентир «человеческий» рост в метрах для debug / копирайта.
 * Жёсткие границы ниже заданы в **сыром произведении** `bboxVertical × uniform` (три-юниты после uniform на корне),
 * т.к. GLB приходят в разных DCC-единицах; см. `characterScaleAssets.integration.test.ts`.
 */
export const PLAYER_VISUAL_HEIGHT_M = 1.75;

/** Верхняя граница сырого `bbox × uniform` (ловит «гигантов» при полом uniform / таблице). Подогнано под текущий Volodka/NPC. */
export const MAX_CHARACTER_BOUNDING_PRODUCT = 72;

/** Нижняя граница сырого продукта (экстремальный intro+узкая сцена даёт uniform≈0.045 и мелкий bbox). */
export const MIN_CHARACTER_BOUNDING_PRODUCT = 0.004;

/**
 * Имена файлов, для которых не проверяем нижнюю границу (бюст, стилизованный коротыш и т.п.).
 * Верхняя граница (MAX) для них по-прежнему обязательна.
 */
export const GLB_BASE_NAMES_EXEMPT_FROM_MIN_VISUAL_HEIGHT: ReadonlySet<string> = new Set([
  'destiny_2_character_bust.glb',
  'toon_cat_free.glb',
]);

/** Стилизованные / нечеловеческие пропорции — сырой bbox×uniform может быть огромным; MAX не применяем. */
export const GLB_BASE_NAMES_EXEMPT_FROM_MAX_BOUNDING_PRODUCT: ReadonlySet<string> = new Set(['toon_cat_free.glb']);

export function glbBasenameForScaleValidator(modelUrl: string): string {
  const u = rewriteLegacyModelPath(modelUrl.trim());
  const noQuery = u.split('?')[0] ?? u;
  const i = Math.max(noQuery.lastIndexOf('/'), noQuery.lastIndexOf('\\'));
  return noQuery.slice(i + 1).toLowerCase();
}

/** Сырой вертикальный «продукт» для порогов CI (не метры мира 1:1). */
export function estimateCharacterBoundingProduct(bboxVertical: number, uniform: number): number {
  if (!Number.isFinite(bboxVertical) || bboxVertical <= 0) return 0;
  if (!Number.isFinite(uniform) || uniform <= 0) return 0;
  return bboxVertical * uniform;
}

export type CharacterScaleValidationResult =
  | 'ok'
  | { error: string; actualHeightM: number };

/**
 * @param bboxHeight Вертикальный размах AABB (корень или меши) в **исходных единицах GLB** при unit scale на корне.
 * @param uniform Итоговый exploration-uniform из `resolveCharacterMeshUniformScale`.
 */
export function validateCharacterScale(
  modelUrl: string,
  bboxHeight: number,
  uniform: number,
): CharacterScaleValidationResult {
  const product = estimateCharacterBoundingProduct(bboxHeight, uniform);
  if (!Number.isFinite(product) || product <= 0) {
    return {
      error: `некорректный продукт bbox×uniform (bbox=${bboxHeight}, uniform=${uniform})`,
      actualHeightM: product || 0,
    };
  }
  const baseName = glbBasenameForScaleValidator(modelUrl);
  if (
    !GLB_BASE_NAMES_EXEMPT_FROM_MAX_BOUNDING_PRODUCT.has(baseName) &&
    product > MAX_CHARACTER_BOUNDING_PRODUCT
  ) {
    return {
      error: `выше допустимого потолка сырого продукта (${MAX_CHARACTER_BOUNDING_PRODUCT}): ${product.toFixed(3)}`,
      actualHeightM: product,
    };
  }
  if (!GLB_BASE_NAMES_EXEMPT_FROM_MIN_VISUAL_HEIGHT.has(baseName) && product < MIN_CHARACTER_BOUNDING_PRODUCT) {
    return {
      error: `ниже допустимого пола сырого продукта (${MIN_CHARACTER_BOUNDING_PRODUCT}): ${product.toFixed(3)}`,
      actualHeightM: product,
    };
  }
  return 'ok';
}

/** Все URL персонажных GLB из таблицы uniform, NPC и дефолтный путь игрока. */
export function getCharacterModelUrlsForScaleValidator(): string[] {
  const urls = new Set<string>();
  for (const name of Object.keys(GLB_CHARACTER_UNIFORM_BASE_BY_FILENAME)) {
    urls.add(rewriteLegacyModelPath(`/models/${name}`));
  }
  for (const def of Object.values(NPC_DEFINITIONS)) {
    const p = def.modelPath?.trim();
    if (p) urls.add(rewriteLegacyModelPath(p));
  }
  urls.add(rewriteLegacyModelPath(getDefaultPlayerModelPath()));
  return [...urls];
}
