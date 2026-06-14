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
  /** Uniform scale applied at spawn */
  scale?: number;
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
    scale: stub.scale,
    license: stub.license,
    source: `AI3DGen — ${stub.catalogId}`,
    sourceUrl: AI3DGEN_SOURCE_URL,
  };
}

const PROPS = '/models/props';

/** Kenney Furniture Kit (CC0) — converted OBJ→GLB via obj2gltf for web use.
 *
 *  SCALE: the source GLBs are NOT metre-scale. Measured raw bounding boxes
 *  (scripts/inspect-glb-bounds.mjs): desk 7.34×3.84×3.92, door 4.86×10.10,
 *  window 10.0×12.9, wardrobe 8.0×7.9, laptop 2.64×1.62. The scales below
 *  bring each prop to real-world size against the 1.75 m player capsule. */
export const PROP_MODEL_REGISTRY: Record<string, PropModelDefinition> = {
  kenney_desk: {
    id: 'kenney_desk',
    url: `${PROPS}/desk.glb`,
    scale: 0.2, // → 1.47 × 0.77 × 0.78 m
    offset: [0, 0, 0],
    license: 'CC0',
    source: 'Kenney Furniture Kit — desk',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_bookshelf: {
    id: 'kenney_bookshelf',
    url: `${PROPS}/bookshelf.glb`,
    scale: 0.25, // → 1.0 × 2.13 × 0.63 m
    license: 'CC0',
    source: 'Kenney Furniture Kit — bookcaseClosed',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_window: {
    id: 'kenney_window',
    url: `${PROPS}/window.glb`,
    scale: 0.15, // → 1.5 × 1.94 m wall segment
    license: 'CC0',
    source: 'Kenney Furniture Kit — wallWindow',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_door: {
    id: 'kenney_door',
    url: `${PROPS}/door.glb`,
    scale: 0.21, // → 1.02 × 2.12 m
    license: 'CC0',
    source: 'Kenney Furniture Kit — doorway',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_door_open: {
    id: 'kenney_door_open',
    url: `${PROPS}/door_open.glb`,
    scale: 0.21, // → 1.02 × 2.12 m
    license: 'CC0',
    source: 'Kenney Furniture Kit — doorwayOpen',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_wardrobe: {
    id: 'kenney_wardrobe',
    url: `${PROPS}/wardrobe.glb`,
    scale: 0.25, // → 2.0 × 1.98 × 0.63 m
    license: 'CC0',
    source: 'Kenney Furniture Kit — bookcaseClosedWide',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_terminal: {
    id: 'kenney_terminal',
    url: `${PROPS}/terminal.glb`,
    scale: 0.13, // laptop → 0.34 × 0.21 × 0.31 m
    license: 'CC0',
    source: 'Kenney Furniture Kit — laptop',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
  },
  kenney_bed: {
    id: 'kenney_bed',
    url: `${PROPS}/bed.glb`,
    scale: 0.18, // → 1.03 × 0.68 × 2.03 m
    license: 'CC0',
    source: 'Kenney Furniture Kit — bedSingle',
    sourceUrl: 'https://opengameart.org/content/furniture-kit',
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
