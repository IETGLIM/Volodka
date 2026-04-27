/**
 * Единая шкала поста для обхода: креатив, карма, стресс (см. `CameraEffects`, `ExplorationPostFX`).
 * Держит формулы в одном месте, чтобы не разъезжались Bloom/шум при правках баланса.
 */

const clamp01 = (n: number) => Math.max(0, Math.min(100, n)) / 100;

/** Bloom в `CameraEffects` (когда нет `deferPostProcessing` у `ExplorationPostFX`). */
export function explorationBloomIntensityFromPlayer(creativity: number, karma: number): number {
  const c = clamp01(creativity);
  const k = clamp01(karma);
  return 1.15 + c * 0.75 + (k - 0.5) * 0.08;
}

/** Смещение хроматической аберрации; компонент сам оборачивает в `THREE.Vector2`. */
export function explorationChromaOffsetFromStress(stress: number, panicMode: boolean): { x: number; y: number } {
  const s = Math.max(0, Math.min(100, stress));
  const p = panicMode ? 0.002 : 0;
  const base = s * 0.0008;
  return { x: base + p, y: base + p };
}

/** Сцены с «кибер» грейдом поста (Blade Runner / Matrix / дежурный неон). */
export const EXPLORATION_CYBER_GRADE_SCENE_IDS = [
  'volodka_room',
  'blue_pit',
  'district',
  'mvd',
] as const;

export type ExplorationCyberGradeSceneId = (typeof EXPLORATION_CYBER_GRADE_SCENE_IDS)[number];

export function isExplorationCyberGradeScene(
  sceneId: string,
): sceneId is ExplorationCyberGradeSceneId {
  return (EXPLORATION_CYBER_GRADE_SCENE_IDS as readonly string[]).includes(sceneId);
}
