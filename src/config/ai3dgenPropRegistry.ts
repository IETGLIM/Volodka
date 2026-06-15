/** AI3DGen prop stubs — merged into propModelRegistry when `shipped: true`. */

export type Ai3dgenPropLicense = 'AI3DGen-Free' | 'AI3DGen-Pro';

export interface Ai3dgenPropStub {
  catalogId: string;
  propModelId: string;
  url: string;
  scale?: number;
  license: Ai3dgenPropLicense;
  /** Set true after import + assets:validate — avoids 404s before files exist. */
  shipped?: boolean;
}

export const AI3DGEN_PROP_STUBS: Ai3dgenPropStub[] = [
  {
    catalogId: 'craft_digital_amulet',
    propModelId: 'ai3dgen_digital_amulet',
    url: '/models/props/digital_amulet.glb',
    scale: 0.35,
    license: 'AI3DGen-Pro',
    shipped: true,
  },
  {
    catalogId: 'craft_poetic_compiler',
    propModelId: 'ai3dgen_poetic_compiler',
    url: '/models/props/poetic_compiler.glb',
    scale: 0.4,
    license: 'AI3DGen-Pro',
    shipped: true,
  },
  {
    catalogId: 'craft_neural_filter',
    propModelId: 'ai3dgen_neural_filter',
    url: '/models/props/neural_filter.glb',
    scale: 0.25,
    license: 'AI3DGen-Pro',
    shipped: true,
  },
  {
    catalogId: 'quest_encrypted_scroll',
    propModelId: 'ai3dgen_encrypted_scroll',
    url: '/models/props/encrypted_scroll.glb',
    scale: 0.3,
    license: 'AI3DGen-Pro',
    shipped: true,
  },
  {
    catalogId: 'quest_server_fragment',
    propModelId: 'ai3dgen_server_fragment',
    url: '/models/props/server_fragment.glb',
    scale: 0.45,
    license: 'AI3DGen-Pro',
    shipped: true,
  },
];

export function getAi3dgenPropStub(propModelId: string): Ai3dgenPropStub | undefined {
  return AI3DGEN_PROP_STUBS.find((stub) => stub.propModelId === propModelId);
}

export function getShippedAi3dgenPropStubs(): Ai3dgenPropStub[] {
  return AI3DGEN_PROP_STUBS.filter((stub) => stub.shipped === true);
}

export function getAi3dgenPropUrls(): string[] {
  return getShippedAi3dgenPropStubs().map((stub) => stub.url);
}
