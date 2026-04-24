import type { PropDefinition } from '@/data/propsTypes';

import {
  validateCharacterScale,
  type CharacterScaleValidationResult,
} from '@/lib/characterScaleValidator';

type PropScaleValidationOutcome =
  | CharacterScaleValidationResult
  | 'skipped-procedural'
  | 'skipped-exempt';

/**
 * Та же цепочка, что у персонажей (`validateCharacterScale`), но для пропов из манифеста:
 * без `glbPath` — процедурный fallback, не валидируем; при `exemptFromScaleValidation` — пропуск.
 */
export function validatePropGlbScale(
  def: PropDefinition,
  resolvedModelUrl: string,
  bboxVertical: number,
  effectiveUniform: number,
): PropScaleValidationOutcome {
  if (!def.glbPath?.trim()) return 'skipped-procedural';
  if (def.exemptFromScaleValidation) return 'skipped-exempt';
  return validateCharacterScale(resolvedModelUrl, bboxVertical, effectiveUniform);
}
