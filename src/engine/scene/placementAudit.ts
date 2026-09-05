/* ─── Volodka RPG – static audit of model placement vs scene geometry ─── */
/*Verifies that every model-bearing placement (NPC schedule positions, player
 * spawns, exit spawns, trigger-zone props) lands ON a floor, INSIDE scene
 * bounds and NOT embedded in walls/obstacles — for every scene, including
 * variant scenes that inherit schedules from a parent (SCENE_SCHEDULE_PARENT).
 *
 * Used by:
 * - scripts/analyze-model-placement.ts (CLI: exit 1 on HIGH violations)
 * - src/engine/scene/placementAudit.test.ts (vitest gate: 0 HIGH)
 * - runtime: resolveNpcPlacementForScene() applies the same variant overrides
 *   that NPCSystem/InteractiveTriggers use.
 */

import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { SCENE_SCHEDULE_PARENT } from '@/config/sceneInheritance';
import { resolveNpcPlacementForScene } from '@/config/npcVariantPlacementOverrides';
import { NPC_SCHEDULES, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import type { SceneDefinition, ColliderDef } from '@/shared/types/sceneDefinition';
import type { SceneId } from '@/config/sceneIds';

/* ─── geometry helpers (Rapier half-extent convention) ─── */

const EPS = 1e-6;
/** NPC capsule radius used by the runtime (metres). */
export const NPC_RADIUS = 0.32;
/** Height above feet where embedment is checked (head ~1.7m). */
export const BODY_TOP = 1.7;
/** Tolerance for «position.y equals floor top» (metres). */
export const Y_TOL = 0.08;
/** How far outside bounds still counts as «inside» (wall thickness tolerance). */
export const BOUNDS_TOL = 0.05;
/** Beds/sofas/benches (top ≤ 1.35 м) разрешают sleep/rest-размещение поверх. */
export const SLEEP_FURNITURE_TOP_M = 1.35;

interface Cuboid {
  hx: number;
  hy: number;
  hz: number;
  cx: number;
  cy: number;
  cz: number;
  name: string;
}

function toCuboid(c: ColliderDef, name: string): Cuboid {
  const rot = c.rotation ?? 0;
  // Normalize axis-aligned rotations: swap half-extents for ±PI/2.
  const quarter = Math.abs(Math.abs(rot) - Math.PI / 2) < 1e-3;
  const hx = quarter ? c.size[2] : c.size[0];
  const hz = quarter ? c.size[0] : c.size[2];
  return { hx, hy: c.size[1], hz, cx: c.position[0], cy: c.position[1], cz: c.position[2], name };
}

function containsXZ(b: Cuboid, x: number, z: number, margin = 0): boolean {
  return (
    Math.abs(x - b.cx) <= b.hx + margin + EPS &&
    Math.abs(z - b.cz) <= b.hz + margin + EPS
  );
}

function overlapsY(b: Cuboid, yLow: number, yHigh: number): boolean {
  return b.cy - b.hy < yHigh - EPS && b.cy + b.hy > yLow + EPS;
}

/** Floor cuboid covering (x,z) with the highest top surface, if any. */
export function floorTopAt(floors: Cuboid[], x: number, z: number): number | null {
  let top: number | null = null;
  for (const f of floors) {
    if (!containsXZ(f, x, z, 0)) continue;
    const t = f.cy + f.hy;
    if (top === null || t > top) top = t;
  }
  return top;
}

export interface SceneGeo {
  def: SceneDefinition;
  floors: Cuboid[];
  solids: Cuboid[];
  halfW: number;
  halfD: number;
}

export function buildGeo(def: SceneDefinition): SceneGeo {
  return {
    def,
    floors: def.floors.map((f, i) => toCuboid(f, `floor[${i}]`)),
    solids: [
      ...def.walls.map((w, i) => toCuboid(w, `wall[${i}]`)),
      ...def.obstacles.map((o, i) => toCuboid(o, `obstacle[${i}]`)),
    ],
    halfW: def.dimensions[0] / 2,
    halfD: def.dimensions[2] / 2,
  };
}

/* ─── placement sources ─── */

export interface Placement {
  label: string;
  sceneId: SceneId;
  position: readonly [number, number, number];
  kind: 'npc' | 'spawn' | 'prop';
  /** Schedule activity — sleep/rest разрешены на низкой мебели (кровать/диван). */
  activity?: string;
  /** Trigger-zone footprint (W,H,D full extents) when the placement is a prop. */
  propSize?: readonly [number, number, number];
}

export interface PlacementProblem {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  scene: string;
  text: string;
}

/* Runtime resolver живёт в @/config/npcVariantPlacementOverrides (leaf-модуль,
 * чтобы UI-потребители не тянули весь аудит); здесь — реэкспорт для CLI. */
export { resolveNpcPlacementForScene } from '@/config/npcVariantPlacementOverrides';

function collectPlacements(): Placement[] {
  const placements: Placement[] = [];

  /* 1. NPC schedule entries (base + act overrides), expanded to variant scenes
   *    that inherit schedules from the entry's scene. */
  const scenesByScheduleParent = new Map<string, SceneId[]>();
  for (const sid of Object.keys(SCENE_DEFINITIONS) as SceneId[]) {
    const parent = SCENE_SCHEDULE_PARENT[sid as keyof typeof SCENE_SCHEDULE_PARENT];
    if (parent !== undefined) {
      const list = scenesByScheduleParent.get(parent as string) ?? [];
      list.push(sid);
      scenesByScheduleParent.set(parent as string, list);
    }
  }

  const addNpcPlacement = (
    npcId: string,
    entrySceneId: SceneId,
    pos: readonly [number, number, number],
    activity: string,
    source: string,
  ): void => {
    const targets: SceneId[] = [entrySceneId, ...(scenesByScheduleParent.get(entrySceneId) ?? [])];
    for (const target of targets) {
      placements.push({
        label: `NPC ${npcId} (${source})`,
        sceneId: target,
        position: resolveNpcPlacementForScene(target, npcId, pos),
        kind: 'npc',
        activity,
      });
    }
  };

  for (const schedule of NPC_SCHEDULES) {
    for (const entry of schedule.entries) {
      addNpcPlacement(schedule.npcId, entry.sceneId, entry.position, entry.activity, `schedule ${schedule.id}`);
    }
  }
  for (const override of ACT_SCHEDULE_OVERRIDES) {
    for (const entry of override.entries) {
      addNpcPlacement(override.npcId, entry.sceneId, entry.position, entry.activity, `override ${override.id}`);
    }
  }

  /* 2. Player default spawn + exit spawn positions.
   *    NB: exit POSITION — центр дверного проёма (Y=1, внутри стены) — это
   *    interaction-триггер, а не модель; проверяем только spawnPosition. */
  for (const sid of Object.keys(SCENE_DEFINITIONS) as SceneId[]) {
    const def = SCENE_DEFINITIONS[sid];
    placements.push({ label: `defaultSpawn`, sceneId: sid, position: def.defaultSpawn, kind: 'spawn' });
    for (const exit of def.exits) {
      if (SCENE_DEFINITIONS[exit.targetScene]) {
        placements.push({
          label: `spawn из ${exit.id}`,
          sceneId: exit.targetScene,
          position: exit.spawnPosition,
          kind: 'spawn',
        });
      }
    }
  }

  /* 3. Trigger zones with rendered GLB props (position + propOffset). */
  for (const zone of TRIGGER_ZONES) {
    if (!SCENE_DEFINITIONS[zone.sceneId]) continue;
    if (!zone.propModelId) continue;
    const pos: [number, number, number] = [
      zone.position[0] + (zone.propOffset?.[0] ?? 0),
      zone.position[1] + (zone.propOffset?.[1] ?? 0),
      zone.position[2] + (zone.propOffset?.[2] ?? 0),
    ];
    placements.push({
      label: `проп ${zone.propModelId} (зона ${zone.id})`,
      sceneId: zone.sceneId,
      position: pos,
      kind: 'prop',
      propSize: zone.size,
    });
  }

  return placements;
}

/* ─── checks ─── */

export function runPlacementAudit(): { checked: number; problems: PlacementProblem[] } {
  const problems: PlacementProblem[] = [];
  const seen = new Set<string>();
  const pushProblem = (severity: PlacementProblem['severity'], scene: string, text: string): void => {
    const key = `${severity}|${scene}|${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    problems.push({ severity, scene, text });
  };

  let checked = 0;
  for (const p of collectPlacements()) {
    const def = SCENE_DEFINITIONS[p.sceneId];
    if (!def) {
      problems.push({ severity: 'HIGH', scene: String(p.sceneId), text: `${p.label}: сцена не существует` });
      continue;
    }
    checked += 1;
    const geo = buildGeo(def);
    const [x, y, z] = p.position;
    const where = `${p.label} @ [${x}, ${y}, ${z}]`;

    /* bounds */
    if (Math.abs(x) > geo.halfW + BOUNDS_TOL || Math.abs(z) > geo.halfD + BOUNDS_TOL) {
      pushProblem('HIGH', p.sceneId, `${where}: вне габаритов сцены (площадь ${def.dimensions[0]}×${def.dimensions[2]})`);
    }

    /* floor coverage + Y match (skip for wall/ceiling-mounted props). */
    const isPropAboveFloor = p.kind === 'prop' && y > Y_TOL;
    if (!isPropAboveFloor) {
      const top = floorTopAt(geo.floors, x, z);
      if (top === null) {
        pushProblem('HIGH', p.sceneId, `${where}: под точкой нет пола — модель висит в пустоте / провалится`);
      } else if (Math.abs(top - y) > Y_TOL) {
        pushProblem('HIGH', p.sceneId, `${where}: Y=${y} не совпадает с верхом пола ${top.toFixed(3)} — утоплена/парит на ${(y - top).toFixed(3)} м`);
      }
    }

    /* embedment in walls/obstacles (npc + spawn; props skipped — authored).
     * CENTER: origin модели внутри коллайдера — гарантированный клип меша.
     * RADIUS: только капсула (0.32 м) задевает — «вплотную к мебели», ок.
     * sleep/rest на низкой мебели (≤1.35 м) — кровать/диван/скамейка, норма. */
    if (p.kind !== 'prop') {
      const isResting = p.activity === 'sleep' || p.activity === 'rest';
      for (const s of geo.solids) {
        const topY = s.cy + s.hy;
        if (topY <= y + 0.45) continue; // низкий бордюр — не встраивание
        if (!overlapsY(s, y + 0.05, y + BODY_TOP)) continue;
        if (isResting && topY <= SLEEP_FURNITURE_TOP_M) continue;
        const centerInside = containsXZ(s, x, z, 0);
        if (!centerInside && !containsXZ(s, x, z, NPC_RADIUS)) continue;
        const kind = centerInside ? 'центр внутри' : 'капсула задевает';
        pushProblem(
          centerInside ? 'HIGH' : 'MEDIUM',
          p.sceneId,
          `${where}: ${kind} ${s.name} (верх ${topY.toFixed(2)} м) — модель встроена в геометрию`,
        );
      }
    }
  }

  /* doorways must sit inside bounds too */
  for (const sid of Object.keys(SCENE_DEFINITIONS) as SceneId[]) {
    const def = SCENE_DEFINITIONS[sid];
    const halfW = def.dimensions[0] / 2;
    const halfD = def.dimensions[2] / 2;
    for (const d of def.doorways) {
      if (Math.abs(d.position[0]) > halfW + BOUNDS_TOL || Math.abs(d.position[2]) > halfD + BOUNDS_TOL) {
        problems.push({ severity: 'HIGH', scene: sid, text: `дверной проём ${d.id} @ [${d.position}] вне габаритов сцены` });
      }
    }
  }

  return { checked, problems };
}
