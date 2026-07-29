/* ─── Volodka RPG – interactable prop GLB registry (CC0 Kenney + AI3DGen props) ─── */

import {
  getAi3dgenPropStub,
  getShippedAi3dgenPropStubs,
  type Ai3dgenPropStub,
} from './ai3dgenPropRegistry';

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

/** Kenney Furniture Kit (CC0) — metre-scale GLBs (1 unit = 1 m).
 *  targetSizeM matches measured bounds; runtime fit keeps scale ≈ 1. */
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
    license: 'CC0',
    source: 'Kenney Furniture Kit — wallWindow',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_door: {
    id: 'kenney_door',
    url: `${PROPS}/door.glb`,
    targetSizeM: [0.49, 1.01, 0.11],
    license: 'CC0',
    source: 'Kenney Furniture Kit — doorway',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_door_open: {
    id: 'kenney_door_open',
    url: `${PROPS}/door_open.glb`,
    targetSizeM: [0.49, 1.01, 0.09],
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
    targetSizeM: [0.4, 0.47, 0.2],
    license: 'CC0',
    source: 'Kenney Furniture Kit — bench',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_lamp_post: {
    id: 'kenney_city_lamp_post',
    url: `${CITYKIT}/lamp_post.glb`,
    targetSizeM: [0.05, 0.6, 0.24],
    fitAxis: 'height',
    license: 'CC0',
    source: 'Kenney City Kit (Roads) — light-square',
    sourceUrl: KENNEY_CITY_URL,
  },
  kenney_city_table_small: {
    id: 'kenney_city_table_small',
    url: `${CITYKIT}/table_small.glb`,
    targetSizeM: [0.53, 0.38, 0.22],
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
    targetSizeM: [0.4, 0.85, 0.25],
    license: 'CC0',
    source: 'Kenney Furniture Kit — bookcaseClosed',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_terminal: {
    id: 'kenney_city_terminal',
    url: `${CITYKIT}/terminal.glb`,
    targetSizeM: [0.39, 0.29, 0.1],
    license: 'CC0',
    source: 'Kenney Furniture Kit — computerScreen',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_coffee_machine: {
    id: 'kenney_city_coffee_machine',
    url: `${CITYKIT}/coffee_machine.glb`,
    targetSizeM: [0.19, 0.18, 0.24],
    license: 'CC0',
    source: 'Kenney Furniture Kit — kitchenCoffeeMachine',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_guitar: {
    id: 'kenney_city_guitar',
    url: `${CITYKIT}/guitar.glb`,
    targetSizeM: [0.32, 0.23, 0.1],
    license: 'CC0',
    source: 'Kenney Furniture Kit — radio (interim guitar prop)',
    sourceUrl: KENNEY_FURNITURE_URL,
  },
  kenney_city_bottle: {
    id: 'kenney_city_bottle',
    url: `${CITYKIT}/bottle.glb`,
    targetSizeM: [0.66, 0.23, 0.4],
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
