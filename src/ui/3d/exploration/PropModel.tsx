import type { ReactNode } from 'react';

import { getPropDefinition } from '@/data/propsManifest';

export type PropModelProps = {
  propId: string;
  /** Пока у пропа нет `glbPath` в манифесте — тот же процедурный меш, что ренерит родитель (`VolodkaRoomVisual` и т.п.). */
  children?: ReactNode;
};

/**
 * Скелет загрузки пропа: при появлении `glbPath` — GLB + `baseUniform` + `validatePropGlbScale`.
 * Сейчас все записи в `PROP_DEFINITIONS` без пути → возвращаем `children` без изменений.
 */
export function PropModel({ propId, children }: PropModelProps): ReactNode {
  const def = getPropDefinition(propId);
  if (!def) return null;
  if (!def.glbPath?.trim()) return <>{children}</>;
  // TODO: GLTFLoader, def.baseUniform, validatePropGlbScale
  return null;
}
