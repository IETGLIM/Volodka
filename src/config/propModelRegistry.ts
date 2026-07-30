/* ─── Volodka RPG – interactable prop GLB registry (CC0 Kenney + AI3DGen props) ─── */

import {
  getAi3dgenPropStub,
  getShippedAi3dgenPropStubs,
  type Ai3dgenPropStub,
} from './ai3dgenPropRegistry';
import { POLYHAVEN_MODELS } from './polyhavenAssets';

export type PropModelLicense = 'CC0' | 'AI3DGen-Free' | 'AI3DGen-Pro';

export interface PropModelDefinition {
  id: string;
  url: string;
  /** Real-world target size in metres (W×H×D). Runtime auto-scales the GLB to match. */
  targetSizeM?: [number, number, number];
  /** Extra multiplier after targetSizeM fit (character / art tweaks). */
  scale?: number;
  /** Which bound axis drives uniform scale when targetSizeM is set. */
  fitAxis?: 'height' | 'width' | 'depth' | 'maxHorizontal' | 'maxExtent';
  rotation?: [number, number, number];
  /** Local offset from trigger zone origin (metres) */
  offset?: [number, number, number];
  license: PropModelLicense;
  source: string;
  sourceUrl: string;
}

const AI3DGEN_SOURCE_URL = 'https://www.ai3dgen.com/ru/image-to-3d-model-free';

function ai3dgenStubToPropDefinition(stub: Ai3dgenPropStub): PropModelDefinition {
  return {
    id: stub.propModelId,
    url: stub.url,
    targetSizeM: stub.targetSizeM,
    scale: stub.scale,
    fitAxis: stub.fitAxis,
    license: stub.license,
    source: `AI3DGen — ${stub.catalogId}`,
    sourceUrl: AI3DGEN_SOURCE_URL,
  };
}

const PROPS = '/models/props';
const CITYKIT = `${PROPS}/citykit`;
const KENNEY_CITY_URL = 'https://kenney.nl/assets/city-kit-roads';
const KENNEY_FURNITURE_URL = 'https://kenney.nl/assets/furniture-kit';
const POLYHAVEN_URL = 'https://polyhaven.com';

/** Kenney Furniture Kit (CC0) — normalized GLBs fitted to metre targets. */
export const PROP_MODEL_REGISTRY: Record<string, PropModelDefinition> = {
  kenney_desk: {
    id: 'kenney_desk',
    url: `${PROPS}/desk.glb`,
    targetSizeM: [1.6, 0.76, 0.75],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — desk',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_bookshelf: {
    id: 'kenney_bookshelf',
    url: `${PROPS}/bookshelf.glb`,
    targetSizeM: [0.85, 1.95, 0.4],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — bookcaseClosed',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_window: {
    id: 'kenney_window',
    url: `${PROPS}/window.glb`,
    targetSizeM: [1.0, 1.29, 0.09],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — wallWindow',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_door: {
    id: 'kenney_door',
    url: `${PROPS}/door.glb`,
    targetSizeM: [1.0, 2.1, 0.24],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — doorway',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_door_open: {
    id: 'kenney_door_open',
    url: `${PROPS}/door_open.glb`,
    targetSizeM: [1.0, 2.1, 0.19],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — doorwayOpen',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_wardrobe: {
    id: 'kenney_wardrobe',
    url: `${PROPS}/wardrobe.glb`,
    targetSizeM: [1.05, 2.05, 0.55],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — bookcaseClosedWide',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_terminal: {
    id: 'kenney_terminal',
    url: `${PROPS}/terminal.glb`,
    targetSizeM: [0.26, 0.16, 0.24],
    license: 'CC0',
    source: 'Kenney Furniture Kit — laptop',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_bed: {
    id: 'kenney_bed',
    url: `${PROPS}/bed.glb`,
    targetSizeM: [0.95, 0.55, 2.05],
    fitAxis: 'depth',
    license: 'CC0',
    source: 'Kenney Furniture Kit — bedSingle',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  // ── Kenney City Kit + Furniture (CC0) — assets-source/ai3dgen/props/ ──
  kenney_city_bench: {
    id: 'kenney_city_bench',
    url: `${CITYKIT}/bench.glb`,
    targetSizeM: [1.8, 0.86, 0.62],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Kenney Furniture Kit — bench',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_lamp_post: {
    id: 'kenney_city_lamp_post',
    url: `${CITYKIT}/lamp_post.glb`,
    targetSizeM: [0.32, 3.0, 0.32],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney City Kit (Roads) — light-square',
    sourceUrl: KENNEY_CITY_URL,
  },
  kenney_city_table_small: {
    id: 'kenney_city_table_small',
    url: `${CITYKIT}/table_small.glb`,
    targetSizeM: [0.72, 0.48, 0.72],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'Kenney Furniture Kit — sideTable',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_chair: {
    id: 'kenney_city_chair',
    url: `${CITYKIT}/chair.glb`,
    targetSizeM: [0.48, 0.92, 0.52],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — chair',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_bookshelf: {
    id: 'kenney_city_bookshelf',
    url: `${CITYKIT}/bookshelf.glb`,
    targetSizeM: [0.85, 1.95, 0.4],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — bookcaseClosed',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_terminal: {
    id: 'kenney_city_terminal',
    url: `${CITYKIT}/terminal.glb`,
    targetSizeM: [0.42, 0.34, 0.18],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Kenney Furniture Kit — computerScreen',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_coffee_machine: {
    id: 'kenney_city_coffee_machine',
    url: `${CITYKIT}/coffee_machine.glb`,
    targetSizeM: [0.32, 0.34, 0.36],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — kitchenCoffeeMachine',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_guitar: {
    id: 'kenney_city_guitar',
    url: `${CITYKIT}/guitar.glb`,
    targetSizeM: [0.42, 1.02, 0.12],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — radio (interim guitar prop)',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_bottle: {
    id: 'kenney_city_bottle',
    url: `${CITYKIT}/bottle.glb`,
    targetSizeM: [0.08, 0.23, 0.08],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney Furniture Kit — tableCoffeeGlass',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_campfire: {
    id: 'kenney_city_campfire',
    url: `${CITYKIT}/campfire.glb`,
    targetSizeM: [1.2, 0.6, 1.0],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'OpenGameArt Low Poly Camping — camp_fire (CC0)',
    sourceUrl: 'https://opengameart.org/content/low-poly-camping-assets',
  },
  // ── Poly Haven CC0 authored set dressing — higher fidelity than procedural fallbacks ──
  polyhaven_road_barrier: {
    id: 'polyhaven_road_barrier',
    url: POLYHAVEN_MODELS.roadBarrier,
    targetSizeM: [2.0, 0.82, 0.52],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — concrete road barrier',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_bench: {
    id: 'polyhaven_bench',
    url: POLYHAVEN_MODELS.bench,
    targetSizeM: [2.05, 0.88, 0.78],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — painted wooden bench',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_street_lamp: {
    id: 'polyhaven_street_lamp',
    url: POLYHAVEN_MODELS.streetLamp,
    targetSizeM: [0.68, 3.2, 0.68],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — street lamp 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_fire_escape: {
    id: 'polyhaven_fire_escape',
    url: POLYHAVEN_MODELS.fireEscape,
    targetSizeM: [2.2, 3.4, 0.55],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — modular fire escape',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_barrel: {
    id: 'polyhaven_barrel',
    url: POLYHAVEN_MODELS.barrel,
    targetSizeM: [0.58, 0.88, 0.58],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — Barrel 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_cardboard_box: {
    id: 'polyhaven_cardboard_box',
    url: POLYHAVEN_MODELS.cardboardBox,
    targetSizeM: [0.72, 0.5, 0.58],
    fitAxis: 'maxExtent',
    license: 'CC0',
    source: 'Poly Haven — cardboard box 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_metal_trash_can: {
    id: 'polyhaven_metal_trash_can',
    url: POLYHAVEN_MODELS.metalTrashCan,
    targetSizeM: [0.48, 0.82, 0.48],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — metal trash can',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_trashbag: {
    id: 'polyhaven_trashbag',
    url: POLYHAVEN_MODELS.trashbag,
    targetSizeM: [0.72, 0.48, 0.62],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'Poly Haven — trashbag',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_wet_floor_sign: {
    id: 'polyhaven_wet_floor_sign',
    url: POLYHAVEN_MODELS.wetFloorSign,
    targetSizeM: [0.42, 0.72, 0.38],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — Wet Floor Sign 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_shutter_door: {
    id: 'polyhaven_shutter_door',
    url: POLYHAVEN_MODELS.shutterDoor,
    targetSizeM: [2.1, 2.6, 0.2],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — rollershutter door',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_shutter_window: {
    id: 'polyhaven_shutter_window',
    url: POLYHAVEN_MODELS.shutterWindow,
    targetSizeM: [1.5, 1.55, 0.18],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — rollershutter window',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_industrial_lamp: {
    id: 'polyhaven_industrial_lamp',
    url: POLYHAVEN_MODELS.industrialLamp,
    targetSizeM: [0.75, 0.58, 0.75],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'Poly Haven — hanging industrial lamp',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_sofa: {
    id: 'polyhaven_sofa',
    url: POLYHAVEN_MODELS.sofa,
    targetSizeM: [2.25, 0.92, 0.98],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — sofa 02',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_arm_chair: {
    id: 'polyhaven_arm_chair',
    url: POLYHAVEN_MODELS.armChair,
    targetSizeM: [0.95, 1.0, 0.95],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'Poly Haven — ArmChair 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_painted_wooden_table: {
    id: 'polyhaven_painted_wooden_table',
    url: POLYHAVEN_MODELS.paintedWoodenTable,
    targetSizeM: [1.55, 0.78, 0.95],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — painted wooden table',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_painted_wooden_cabinet: {
    id: 'polyhaven_painted_wooden_cabinet',
    url: POLYHAVEN_MODELS.paintedWoodenCabinet,
    targetSizeM: [1.15, 1.08, 0.5],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — painted wooden cabinet',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_wooden_bookshelf_worn: {
    id: 'polyhaven_wooden_bookshelf_worn',
    url: POLYHAVEN_MODELS.woodenBookshelfWorn,
    targetSizeM: [1.2, 2.1, 0.45],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — wooden bookshelf worn',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_desk_lamp_arm: {
    id: 'polyhaven_desk_lamp_arm',
    url: POLYHAVEN_MODELS.deskLampArm,
    targetSizeM: [0.42, 0.62, 0.42],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — desk lamp arm 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_cassette_player: {
    id: 'polyhaven_cassette_player',
    url: POLYHAVEN_MODELS.cassettePlayer,
    targetSizeM: [0.26, 0.08, 0.17],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — portable cassette player',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_old_tyre: {
    id: 'polyhaven_old_tyre',
    url: POLYHAVEN_MODELS.oldTyre,
    targetSizeM: [0.68, 0.68, 0.24],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'Poly Haven — old tyre',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_manhole_cover: {
    id: 'polyhaven_manhole_cover',
    url: POLYHAVEN_MODELS.manholeCover,
    targetSizeM: [0.72, 0.04, 0.72],
    fitAxis: 'maxHorizontal',
    license: 'CC0',
    source: 'Poly Haven — water manhole cover',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_wooden_crate: {
    id: 'polyhaven_wooden_crate',
    url: POLYHAVEN_MODELS.woodenCrate,
    targetSizeM: [0.58, 0.58, 0.58],
    fitAxis: 'maxExtent',
    license: 'CC0',
    source: 'Poly Haven — wooden crate 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_utility_box: {
    id: 'polyhaven_utility_box',
    url: POLYHAVEN_MODELS.utilityBox,
    targetSizeM: [0.72, 1.05, 0.42],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — utility box 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_power_box: {
    id: 'polyhaven_power_box',
    url: POLYHAVEN_MODELS.powerBox,
    targetSizeM: [0.58, 0.82, 0.28],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Poly Haven — power box 01',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_exterior_aircon_unit: {
    id: 'polyhaven_exterior_aircon_unit',
    url: POLYHAVEN_MODELS.exteriorAirconUnit,
    targetSizeM: [0.95, 0.78, 0.58],
    fitAxis: 'width',
    license: 'CC0',
    source: 'Poly Haven — exterior aircon unit',
    sourceUrl: POLYHAVEN_URL,
  },
  polyhaven_security_camera: {
    id: 'polyhaven_security_camera',
    url: POLYHAVEN_MODELS.securityCamera,
    targetSizeM: [0.32, 0.22, 0.38],
    fitAxis: 'maxExtent',
    license: 'CC0',
    source: 'Poly Haven — security camera 01',
    sourceUrl: POLYHAVEN_URL,
  },
};

export function getPropModelDefinition(propModelId: string): PropModelDefinition | undefined {
  const kenney = PROP_MODEL_REGISTRY[propModelId];
  if (kenney) return kenney;
  const stub = getAi3dgenPropStub(propModelId);
  if (!stub || stub.shipped !== true) return undefined;
  return ai3dgenStubToPropDefinition(stub);
}

export function getPropModelUrls(): string[] {
  const kenney = Object.values(PROP_MODEL_REGISTRY).map((p) => p.url);
  const ai3dgen = getShippedAi3dgenPropStubs().map((stub) => stub.url);
  return [...kenney, ...ai3dgen];
}
