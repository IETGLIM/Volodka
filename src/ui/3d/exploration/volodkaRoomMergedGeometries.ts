import { BoxGeometry, BufferAttribute, BufferGeometry, Matrix4 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {
  INTERIOR_REF_DOOR_HEIGHT_M,
  INTERIOR_REF_DOOR_WIDTH_M,
} from '@/lib/explorationInteriorReference';

function ensureUv2(geo: BufferGeometry): void {
  const uv = geo.attributes.uv as BufferAttribute | undefined;
  if (uv && !geo.attributes.uv2) {
    geo.setAttribute('uv2', uv.clone());
  }
}

/** Центрированный бокс → мировая позиция центра. */
function translatedBox(size: [number, number, number], center: [number, number, number]): BufferGeometry {
  const g = new BoxGeometry(size[0], size[1], size[2]);
  ensureUv2(g);
  g.applyMatrix4(new Matrix4().makeTranslation(center[0], center[1], center[2]));
  return g;
}

export type VolodkaRoomMergedDispose = () => void;

/**
 * Статичная оболочка комнаты: один меш на `wallMat`, один на `woodMat`, один на `darkMat`.
 * UV2 для `lightMap`. Пол/ковёр/коридор/пропы остаются отдельными.
 */
export function buildVolodkaRoomMergedShell(params: {
  w: number;
  h: number;
  t: number;
  hd: number;
  dw: number;
  dh: number;
  doorY: number;
  doorFaceZ: number;
  jambW: number;
  jambD: number;
}): {
  wallShell: BufferGeometry;
  woodShell: BufferGeometry;
  darkShell: BufferGeometry;
  dispose: VolodkaRoomMergedDispose;
} {
  const { w, h, t, hd, dw, dh, doorY, doorFaceZ, jambW, jambD } = params;
  const roomDepth = hd * 2;

  const wallParts: BufferGeometry[] = [
    translatedBox([t, h, roomDepth - 0.2], [-w / 2 + t / 2, h / 2, 0]),
    translatedBox([t, h, roomDepth - 0.2], [w / 2 - t / 2, h / 2, 0]),
    translatedBox([w - 0.2, h, t], [0, h / 2, -hd + t / 2]),
    translatedBox([5.9 + t, h, t], [-4.12, h / 2, hd - t / 2]),
    translatedBox([5.9 + t, h, t], [4.12, h / 2, hd - t / 2]),
    translatedBox([w - 0.15, 0.12, roomDepth - 0.15], [0, h - 0.06, 0]),
  ];
  const wallShell = mergeGeometries(wallParts, false);
  if (!wallShell) throw new Error('mergeGeometries: wall shell');

  const doorTop = new BoxGeometry(dw + jambW * 2 + 0.16, 0.12, jambD + 0.04);
  ensureUv2(doorTop);
  doorTop.applyMatrix4(new Matrix4().makeTranslation(0, doorY + dh / 2 + 0.09, doorFaceZ));

  const woodParts: BufferGeometry[] = [
    translatedBox([jambW, dh, jambD], [-(dw / 2 + jambW / 2 + 0.02), doorY, doorFaceZ]),
    translatedBox([jambW, dh, jambD], [dw / 2 + jambW / 2 + 0.02, doorY, doorFaceZ]),
    doorTop,
    translatedBox(
      [INTERIOR_REF_DOOR_WIDTH_M, INTERIOR_REF_DOOR_HEIGHT_M, 0.06],
      [0.05, doorY, hd - t - 0.05],
    ),
  ];
  const woodShell = mergeGeometries(woodParts, false);
  if (!woodShell) throw new Error('mergeGeometries: wood shell');

  const darkParts: BufferGeometry[] = [
    translatedBox([0.09, dh * 0.96, 0.28], [-(dw / 2 + 0.02), doorY, doorFaceZ + 0.06]),
    translatedBox([0.09, dh * 0.96, 0.28], [dw / 2 + 0.02, doorY, doorFaceZ + 0.06]),
  ];
  const darkShell = mergeGeometries(darkParts, false);
  if (!darkShell) throw new Error('mergeGeometries: dark shell');

  const dispose: VolodkaRoomMergedDispose = () => {
    wallParts.forEach((g) => g.dispose());
    woodParts.forEach((g) => g.dispose());
    darkParts.forEach((g) => g.dispose());
    wallShell.dispose();
    woodShell.dispose();
    darkShell.dispose();
  };

  return { wallShell, woodShell, darkShell, dispose };
}
