/**
 * Target assets for the AI3DGen image→3D workflow.
 * Generator: https://www.ai3dgen.com/ru/image-to-3d-model-free
 *
 * Free tier exports OBJ (no textures); Pro adds GLB + PBR.
 * After download: npm run assets:ai3dgen-import -- --id <catalog-id> --file <path>
 */

export type Ai3dgenAssetCategory =
  | 'character'
  | 'npc'
  | 'prop'
  | 'item'
  | 'craft'
  | 'quest';

export type Ai3dgenWireTarget =
  | { kind: 'npc'; npcId: string }
  | { kind: 'prop'; propModelId: string; triggerZoneIds?: string[] }
  | { kind: 'manifest'; assetManifestId: string }
  | { kind: 'item_prop'; propModelId: string; itemId: string };

export interface Ai3dgenAssetSpec {
  id: string;
  category: Ai3dgenAssetCategory;
  title: string;
  /** Brief for concept art / reference photo (upload to AI3DGen). */
  imageBrief: string;
  /** Drop raw download here before import (relative to repo root). */
  sourceRelativePath: string;
  /** Final GLB path under public/ (after assets:process). */
  publicUrl: string;
  wire: Ai3dgenWireTarget;
  /** Uniform scale after bounds normalization (tune with inspect-glb-bounds.mjs). */
  defaultScale?: number;
  /** Free = personal use only; Pro required for commercial ship — see AI3DGen ToS. */
  licenseTier: 'free' | 'pro';
}

const AI3DGEN = 'assets-source/ai3dgen';
const MODELS = '/models';

/** Priority catalog — extend as art drops land. */
export const AI3DGEN_ASSET_CATALOG: Ai3dgenAssetSpec[] = [
  // ── Hero character ──
  {
    id: 'character_volodka',
    category: 'character',
    title: 'Володя (герой)',
    imageBrief: 'Cyberpunk poet, hoodie, tired eyes, single full-body T-pose, plain background',
    sourceRelativePath: `${AI3DGEN}/characters/volodka.glb`,
    publicUrl: `${MODELS}/characters/volodka/volodka_lod0.glb`,
    wire: { kind: 'manifest', assetManifestId: 'player_volodka' },
    licenseTier: 'pro',
  },
  // ── Story NPCs (Act I) ──
  {
    id: 'npc_albert',
    category: 'npc',
    title: 'Альберт',
    imageBrief: 'Middle-aged mentor, glasses, cardigan, kind face, full body neutral pose',
    sourceRelativePath: `${AI3DGEN}/npcs/albert.glb`,
    publicUrl: `${MODELS}/npcs/albert.glb`,
    wire: { kind: 'npc', npcId: 'albert' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_zarema',
    category: 'npc',
    title: 'Зарема',
    imageBrief: 'Young woman, cyberpunk streetwear, confident stance, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/zarema.glb`,
    publicUrl: `${MODELS}/npcs/zarema.glb`,
    wire: { kind: 'npc', npcId: 'zarema' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_maria',
    category: 'npc',
    title: 'Мария',
    imageBrief: 'Barista / café worker, apron, warm smile, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/maria.glb`,
    publicUrl: `${MODELS}/npcs/maria.glb`,
    wire: { kind: 'npc', npcId: 'maria' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_office_alexander',
    category: 'npc',
    title: 'Александр (офис)',
    imageBrief: 'Corporate office worker, shirt and badge, neutral pose',
    sourceRelativePath: `${AI3DGEN}/npcs/office_alexander.glb`,
    publicUrl: `${MODELS}/npcs/office_alexander.glb`,
    wire: { kind: 'npc', npcId: 'office_alexander' },
    licenseTier: 'pro',
  },
  {
    id: 'npc_office_dmitry',
    category: 'npc',
    title: 'Дмитрий (офис)',
    imageBrief: 'Tired IT lead, rolled sleeves, lanyard, full body neutral pose',
    sourceRelativePath: `${AI3DGEN}/npcs/office_dmitry.glb`,
    publicUrl: `${MODELS}/npcs/office_dmitry.glb`,
    wire: { kind: 'npc', npcId: 'office_dmitry' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_viktor',
    category: 'npc',
    title: 'Виктор',
    imageBrief: 'Streetwise fixer, leather jacket, wary eyes, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/viktor.glb`,
    publicUrl: `${MODELS}/npcs/viktor.glb`,
    wire: { kind: 'npc', npcId: 'viktor' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_kira',
    category: 'npc',
    title: 'Кира',
    imageBrief: 'Hacker courier, neon accents, compact stance, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/kira.glb`,
    publicUrl: `${MODELS}/npcs/kira.glb`,
    wire: { kind: 'npc', npcId: 'kira' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_boris',
    category: 'npc',
    title: 'Борис',
    imageBrief: 'Factory foreman, work coveralls, broad shoulders, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/boris.glb`,
    publicUrl: `${MODELS}/npcs/boris.glb`,
    wire: { kind: 'npc', npcId: 'boris' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_tamara',
    category: 'npc',
    title: 'Тамара',
    imageBrief: 'Night nurse, medical scrubs under coat, gentle posture, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/tamara.glb`,
    publicUrl: `${MODELS}/npcs/tamara.glb`,
    wire: { kind: 'npc', npcId: 'tamara' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  {
    id: 'npc_grisha',
    category: 'npc',
    title: 'Гриша',
    imageBrief: 'Young poet, notebook in hand, layered street clothes, full body',
    sourceRelativePath: `${AI3DGEN}/npcs/grisha.glb`,
    publicUrl: `${MODELS}/npcs/grisha.glb`,
    wire: { kind: 'npc', npcId: 'grisha' },
    defaultScale: 1,
    licenseTier: 'pro',
  },
  // ── Craft / item props ──
  {
    id: 'craft_digital_amulet',
    category: 'craft',
    title: 'Цифровой амулет',
    imageBrief: 'Small glowing cyber amulet, circuit runes, product shot on dark bg',
    sourceRelativePath: `${AI3DGEN}/props/digital_amulet.glb`,
    publicUrl: `${MODELS}/props/digital_amulet.glb`,
    wire: { kind: 'item_prop', propModelId: 'ai3dgen_digital_amulet', itemId: 'digital_amulet' },
    defaultScale: 0.35,
    licenseTier: 'pro',
  },
  {
    id: 'craft_poetic_compiler',
    category: 'craft',
    title: 'Поэтический компилятор',
    imageBrief: 'Pocket cyber device, poetry glyphs + LED, handheld scale',
    sourceRelativePath: `${AI3DGEN}/props/poetic_compiler.glb`,
    publicUrl: `${MODELS}/props/poetic_compiler.glb`,
    wire: { kind: 'item_prop', propModelId: 'ai3dgen_poetic_compiler', itemId: 'poetic_compiler' },
    defaultScale: 0.4,
    licenseTier: 'pro',
  },
  {
    id: 'craft_neural_filter',
    category: 'craft',
    title: 'Нейросетевой фильтр',
    imageBrief: 'Neural implant chip, chrome + cyan glow, macro product view',
    sourceRelativePath: `${AI3DGEN}/props/neural_filter.glb`,
    publicUrl: `${MODELS}/props/neural_filter.glb`,
    wire: { kind: 'item_prop', propModelId: 'ai3dgen_neural_filter', itemId: 'neural_filter' },
    defaultScale: 0.25,
    licenseTier: 'pro',
  },
  // ── Quest interactables ──
  {
    id: 'quest_encrypted_scroll',
    category: 'quest',
    title: 'Зашифрованный свиток',
    imageBrief: 'Holographic scroll, encrypted text, quest macguffin, isolated object',
    sourceRelativePath: `${AI3DGEN}/props/encrypted_scroll.glb`,
    publicUrl: `${MODELS}/props/encrypted_scroll.glb`,
    wire: {
      kind: 'prop',
      propModelId: 'ai3dgen_encrypted_scroll',
      triggerZoneIds: ['volodka_room_desk'],
    },
    defaultScale: 0.3,
    licenseTier: 'pro',
  },
  {
    id: 'quest_server_fragment',
    category: 'quest',
    title: 'Фрагмент сервера',
    imageBrief: 'Broken server blade, sparking wires, cyberpunk salvage part',
    sourceRelativePath: `${AI3DGEN}/props/server_fragment.glb`,
    publicUrl: `${MODELS}/props/server_fragment.glb`,
    wire: { kind: 'prop', propModelId: 'ai3dgen_server_fragment' },
    defaultScale: 0.45,
    licenseTier: 'pro',
  },
];

export function getAi3dgenAssetSpec(catalogId: string): Ai3dgenAssetSpec | undefined {
  return AI3DGEN_ASSET_CATALOG.find((entry) => entry.id === catalogId);
}

export function listAi3dgenCatalogIds(): string[] {
  return AI3DGEN_ASSET_CATALOG.map((entry) => entry.id);
}

/** URLs for validate-gltf-assets once files exist under public/models/. */
export function getAi3dgenPublicUrls(): string[] {
  return AI3DGEN_ASSET_CATALOG.map((entry) => entry.publicUrl);
}
