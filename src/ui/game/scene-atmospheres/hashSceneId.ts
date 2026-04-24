/** Детерминированный seed из id сцены (для визуальных PRNG без React-хуков). */
export function hashSceneId(sceneId: string): number {
  let h = 0;
  for (let i = 0; i < sceneId.length; i++) {
    h = (h * 31 + sceneId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
