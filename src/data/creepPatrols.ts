/* ─── Volodka RPG – patrolling creep definitions ───
 *  Visible roaming enemies that replace the old invisible autoTrigger combat
 *  zones. A creep patrols its waypoints; if the player enters its vision cone
 *  it chases, and on contact the existing turn-based combat starts.
 */

import type { SceneId, EnemyType } from '@/shared/types/game';

export interface CreepPatrolDef {
  id: string;
  sceneId: SceneId;
  enemyType: EnemyType;
  /** Display name for aggro toast */
  name: string;
  /** Emissive core color */
  color: string;
  /** XZ waypoints walked in a loop */
  waypoints: Array<[number, number]>;
  /** Patrol movement speed (m/s) */
  patrolSpeed: number;
  /** Chase speed — keep below player run speed so fleeing works */
  chaseSpeed: number;
  /** Vision distance (m) */
  visionRange: number;
  /** Half-angle of the vision cone (radians) */
  visionHalfAngle: number;
  /** Flag required for the creep to spawn */
  requiredFlag?: string;
  /** Minimum act required to spawn */
  requiredAct?: number;
}

export const CREEP_PATROLS: CreepPatrolDef[] = [
  {
    id: 'creep_street_daemon',
    sceneId: 'street_night',
    enemyType: 'system_daemon',
    name: 'Системный Демон',
    color: '#ff3344',
    waypoints: [[-2.5, -5], [2, -2], [2.2, 4], [-2, 6]],
    patrolSpeed: 1.2,
    chaseSpeed: 4.2,
    visionRange: 6,
    visionHalfAngle: 0.65,
  },
  {
    id: 'creep_factory_golem',
    sceneId: 'abandoned_factory',
    enemyType: 'corporate_golem',
    name: 'Корпоративный Голем',
    color: '#ff8822',
    waypoints: [[0, -7], [4, -5], [0, -3], [-4, -5]],
    patrolSpeed: 0.9,
    chaseSpeed: 3.4,
    visionRange: 7,
    visionHalfAngle: 0.55,
  },
  {
    id: 'creep_rooftop_agent',
    sceneId: 'rooftop_edge',
    enemyType: 'shadow_agent',
    name: 'Теневой Агент',
    color: '#aa44ff',
    waypoints: [[3, -2.5], [-3, -2.5], [-3, 1.5], [3, 1.5]],
    patrolSpeed: 1.5,
    chaseSpeed: 4.4,
    visionRange: 5.5,
    visionHalfAngle: 0.7,
  },
  {
    id: 'creep_park_phantom',
    sceneId: 'park_day',
    enemyType: 'data_phantom',
    name: 'Фантом Данных',
    color: '#44ffee',
    waypoints: [[8, 0], [10, 4], [6, 7], [4, 2]],
    patrolSpeed: 1.0,
    chaseSpeed: 3.8,
    visionRange: 6.5,
    visionHalfAngle: 0.8,
  },
  {
    id: 'creep_library_inquisitor',
    sceneId: 'library_day',
    enemyType: 'code_inquisitor',
    name: 'Инквизитор Кода',
    color: '#ffee44',
    waypoints: [[-4, -3], [-6, 1], [-2, 3], [-1, -1]],
    patrolSpeed: 1.1,
    chaseSpeed: 4.0,
    visionRange: 5.5,
    visionHalfAngle: 0.6,
    requiredFlag: 'debug_mode_active',
  },
  {
    id: 'creep_basement_wraith',
    sceneId: 'factory_basement',
    enemyType: 'data_wraith',
    name: 'Призрак Данных',
    color: '#66ffcc',
    waypoints: [[-3.2, -3], [3.2, -3], [3.2, 1.5], [-3.2, 1.5]],
    patrolSpeed: 0.8,
    chaseSpeed: 3.2,
    visionRange: 5.5,
    visionHalfAngle: 0.7,
  },
  {
    id: 'creep_pier_drone',
    sceneId: 'river_pier',
    enemyType: 'censor_drone',
    name: 'Дрон-Цензор',
    color: '#ff5566',
    waypoints: [[-9, 2], [-9, -5], [-4, -6.5], [-5, 1]],
    patrolSpeed: 1.6,
    chaseSpeed: 4.0,
    visionRange: 5,
    visionHalfAngle: 0.55,
    requiredAct: 3,
  },
  {
    id: 'creep_cafe_agent',
    sceneId: 'cafe_evening',
    enemyType: 'shadow_agent',
    name: 'Теневой Агент',
    color: '#aa44ff',
    waypoints: [[4.5, 3], [2.5, 1.5], [4, -0.5]],
    patrolSpeed: 1.0,
    chaseSpeed: 3.6,
    visionRange: 4.5,
    visionHalfAngle: 0.6,
    requiredAct: 2,
  },
];

export function getCreepsForScene(sceneId: SceneId): CreepPatrolDef[] {
  return CREEP_PATROLS.filter((c) => c.sceneId === sceneId);
}
