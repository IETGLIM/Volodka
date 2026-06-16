import type { SceneId } from '@/shared/types/game';
import type { CameraWaypointData } from '@/shared/types/camera';
import { SCENE_CONFIG } from '@/config/scenes';
import { resolveSceneSpawn } from '@/engine/scene/sceneTransition';
import type { CutsceneDef } from '@/data/cutscenes';

type Vec3 = [number, number, number];

function addVec3(base: Vec3, offset: Vec3): Vec3 {
  return [base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]];
}

function offsetWaypoint(spawn: Vec3, wp: CameraWaypointData): CameraWaypointData {
  return {
    position: addVec3(spawn, wp.position),
    lookAt: addVec3(spawn, wp.lookAt),
    fov: wp.fov,
    duration: wp.duration,
    controlPoint: wp.controlPoint ? addVec3(spawn, wp.controlPoint) : undefined,
  };
}

/** Scene used to resolve spawn-offset cutscene waypoints. */
export function resolveCutsceneAnchorSceneId(
  cutscene: CutsceneDef,
  playbackSceneId: SceneId,
): SceneId {
  return cutscene.anchorSceneId ?? playbackSceneId;
}

/** World-space camera waypoints for the active scene spawn. */
export function resolveCutsceneWaypoints(
  cutscene: CutsceneDef,
  playbackSceneId: SceneId,
): CameraWaypointData[] {
  if (cutscene.waypointSpace !== 'spawn_offset') {
    return cutscene.waypoints;
  }

  const anchorSceneId = resolveCutsceneAnchorSceneId(cutscene, playbackSceneId);
  if (!SCENE_CONFIG[anchorSceneId]) {
    return cutscene.waypoints;
  }

  const spawn = resolveSceneSpawn(anchorSceneId);
  return cutscene.waypoints.map((wp) => offsetWaypoint(spawn, wp));
}
