/**
 * Плавное позиционирование игрока в 3D-интро без спама в Zustand каждый кадр.
 * Пишет `IntroCutsceneCinematicDirector`, читает `PhysicsPlayer` при `phase === 'intro_cutscene'`.
 */
export type IntroCutscenePlayerPose = {
  x: number;
  y: number;
  z: number;
  rotation: number;
  /** м/с по XZ — для синхронизации walk/run GLB */
  horizontalSpeed: number;
};

const bridge = { current: null as IntroCutscenePlayerPose | null };

export function setIntroCutscenePlayerPose(pose: IntroCutscenePlayerPose | null): void {
  bridge.current = pose;
}

export function getIntroCutscenePlayerPose(): IntroCutscenePlayerPose | null {
  return bridge.current;
}
