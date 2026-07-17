/**
 * Intro wake-up sequence as a unified cinematic timeline.
 * One phase per story beat — replaces scattered WakeUpSequence phase logic.
 */

import {
  BED_POSITION,
  CHAIR_POSITION,
  DESK_EXPLORATION_CAM,
  DESK_POSITION,
  STAND_POSITION,
  WAKEUP_CAMERA_START,
  WAKEUP_CAMERA_WAYPOINTS,
  WAKEUP_FALLBACK_MS,
  WAKEUP_PHASE,
  facingYBetween,
} from '@/engine/wakeup/wakeUpCinematic';
import type { CameraWaypointData } from '@/shared/types/camera';
import type { CinematicTimelineDef } from './cinematicTimelineTypes';

function vec3(v: { x: number; y: number; z: number }): [number, number, number] {
  return [v.x, v.y, v.z];
}

function wpToData(wp: (typeof WAKEUP_CAMERA_WAYPOINTS)[number]): CameraWaypointData {
  return {
    position: [wp.position.x, wp.position.y, wp.position.z],
    lookAt: [wp.lookAt.x, wp.lookAt.y, wp.lookAt.z],
    fov: wp.fov,
    duration: wp.duration,
    controlPoint: wp.controlPoint
      ? [wp.controlPoint.x, wp.controlPoint.y, wp.controlPoint.z]
      : undefined,
  };
}

const walkFacing = facingYBetween(STAND_POSITION, DESK_POSITION);
const sitFacing = facingYBetween(DESK_POSITION, CHAIR_POSITION);

export const INTRO_WAKE_TIMELINE: CinematicTimelineDef = {
  id: 'intro_wakeup',
  fallbackMs: WAKEUP_FALLBACK_MS,
  phases: [
    {
      id: 'terminal',
      duration: WAKEUP_PHASE.terminal,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: vec3(BED_POSITION), rotation: [0.55, 0, 0.35], facingY: 0 },
          { t: 1, position: vec3(BED_POSITION), rotation: [0.55, 0, 0.35], facingY: 0 },
        ],
      },
      camera: {
        mode: 'waypoint',
        from: {
          position: [WAKEUP_CAMERA_START.position.x, WAKEUP_CAMERA_START.position.y, WAKEUP_CAMERA_START.position.z],
          lookAt: [WAKEUP_CAMERA_START.lookAt.x, WAKEUP_CAMERA_START.lookAt.y, WAKEUP_CAMERA_START.lookAt.z],
          fov: WAKEUP_CAMERA_START.fov,
          duration: 0,
        },
        to: wpToData(WAKEUP_CAMERA_WAYPOINTS[0]),
      },
      audioCue: 'notify',
      overlay: {
        text: 'Ты просыпаешься от назойливого писка терминала.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'rise',
      duration: WAKEUP_PHASE.rise,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [BED_POSITION.x, 0.42, BED_POSITION.z], rotation: [0.55, 0, 0.35], facingY: 0 },
          { t: 1, position: [BED_POSITION.x, 0.01, BED_POSITION.z], rotation: [0, 0, 0], facingY: 0 },
        ],
      },
      camera: { mode: 'waypoint', to: wpToData(WAKEUP_CAMERA_WAYPOINTS[1]) },
      overlay: {
        text: 'В правом запястье — тянущий спазм. Двенадцать часов за клавиатурой.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'standing',
      duration: WAKEUP_PHASE.standing,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: vec3(BED_POSITION), facingY: Math.PI * 0.85 },
          { t: 1, position: vec3(STAND_POSITION), facingY: walkFacing },
        ],
      },
      camera: { mode: 'waypoint', to: wpToData(WAKEUP_CAMERA_WAYPOINTS[2]) },
      overlay: {
        text: 'Тусклый свет монитора едва прорезает полумрак комнаты.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'walking',
      duration: WAKEUP_PHASE.walking,
      actor: {
        mode: 'in_place',
        clip: 'walk',
        keyframes: [
          { t: 0, position: vec3(STAND_POSITION), facingY: walkFacing },
          { t: 1, position: vec3(DESK_POSITION), facingY: walkFacing },
        ],
      },
      camera: { mode: 'waypoint', to: wpToData(WAKEUP_CAMERA_WAYPOINTS[3]) },
      audioCue: 'footstep',
      overlay: {
        text: 'На столе — полупустая кружка кофе, остывшая пять часов назад.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'sitting',
      duration: WAKEUP_PHASE.sitting,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: vec3(DESK_POSITION), facingY: walkFacing },
          { t: 1, position: vec3(CHAIR_POSITION), facingY: sitFacing },
        ],
      },
      camera: { mode: 'waypoint', to: wpToData(WAKEUP_CAMERA_WAYPOINTS[4]) },
      audioCue: 'ui_open',
      overlay: {
        text: 'На экране — новое сообщение от IT-гильдии.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'settle',
      duration: 0.01,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: vec3(CHAIR_POSITION), facingY: sitFacing },
          { t: 1, position: vec3(CHAIR_POSITION), facingY: sitFacing },
        ],
      },
      camera: { mode: 'waypoint', to: wpToData(WAKEUP_CAMERA_WAYPOINTS[5]) },
    },
    {
      // Phase: monitor — camera pushes in close to the screen.
      // Poem lines appear on the monitor, and a notification pops up:
      // "Скоро синк. Необходимо присутствие."
      id: 'monitor',
      duration: WAKEUP_PHASE.monitor,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: vec3(CHAIR_POSITION), facingY: sitFacing },
          { t: 1, position: vec3(CHAIR_POSITION), facingY: sitFacing },
        ],
      },
      camera: { mode: 'waypoint', to: wpToData(WAKEUP_CAMERA_WAYPOINTS[6]) },
      audioCue: 'notify',
      overlay: {
        text: 'За окном моросит дождь. Город тонет в привычной серости.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'handoff',
      duration: WAKEUP_PHASE.handoff,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: vec3(CHAIR_POSITION), facingY: sitFacing },
          { t: 1, position: vec3(CHAIR_POSITION), facingY: sitFacing },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [DESK_EXPLORATION_CAM.position.x, DESK_EXPLORATION_CAM.position.y, DESK_EXPLORATION_CAM.position.z],
          lookAt: [DESK_EXPLORATION_CAM.lookAt.x, DESK_EXPLORATION_CAM.lookAt.y, DESK_EXPLORATION_CAM.lookAt.z],
          fov: DESK_EXPLORATION_CAM.fov,
          duration: WAKEUP_PHASE.handoff,
        },
      },
      overlay: {
        text: 'Твоё имя — Володька. Сегодня всё изменится.',
        letterboxStyle: 'thin',
        accentColor: '#ffaa55',
      },
    },
  ],
};
