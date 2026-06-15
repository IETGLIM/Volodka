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
  | 'quest'
  | 'environment'
  | 'interior'
  | 'vegetation';

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
      triggerZoneIds: ['room_desk'],
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
    wire: {
      kind: 'prop',
      propModelId: 'ai3dgen_server_fragment',
      triggerZoneIds: ['office_server_room', 'basement_server_rack'],
    },
    defaultScale: 0.45,
    licenseTier: 'pro',
  },
  // ── Environment / vegetation (scene preload bundles) ──
  {
    id: 'env_cafe_props',
    category: 'environment',
    title: 'Кафе — набор пропсов',
    imageBrief: 'Cyberpunk café clutter: tables, mugs, neon sign, low-poly kit, dark mood',
    sourceRelativePath: `${AI3DGEN}/environments/cafe_props.glb`,
    publicUrl: `${MODELS}/environments/cafe/props_lod0.glb`,
    wire: { kind: 'manifest', assetManifestId: 'env_cafe_props' },
    licenseTier: 'pro',
  },
  {
    id: 'veg_tree_pine',
    category: 'vegetation',
    title: 'Сосна (парк)',
    imageBrief: 'Stylized pine tree, winter cyberpunk park, single hero tree, plain background',
    sourceRelativePath: `${AI3DGEN}/vegetation/pine.glb`,
    publicUrl: `${MODELS}/vegetation/pine/pine_lod0.glb`,
    wire: { kind: 'manifest', assetManifestId: 'veg_tree_pine' },
    defaultScale: 1.2,
    licenseTier: 'pro',
  },
  // ── Quaternius animated NPCs (CC0) — npm run assets:quaternius-import ──
  {
    id: 'quaternius_hero_volodka',
    category: 'character',
    title: 'Володя (Quaternius male_01)',
    imageBrief: 'Quaternius Ultimate Modular Men — Adventurer rig',
    sourceRelativePath: `${AI3DGEN}/npcs/male_01.glb`,
    publicUrl: `${MODELS}/characters/volodka/volodka_lod0.glb`,
    wire: { kind: 'manifest', assetManifestId: 'player_volodka' },
    licenseTier: 'free',
  },
  {
    id: 'quaternius_npc_albert',
    category: 'npc',
    title: 'Альберт (Quaternius male_02)',
    imageBrief: 'Quaternius men pack — Beach rig',
    sourceRelativePath: `${AI3DGEN}/npcs/male_02.glb`,
    publicUrl: `${MODELS}/npcs/albert.glb`,
    wire: { kind: 'npc', npcId: 'albert' },
    licenseTier: 'free',
  },
  {
    id: 'quaternius_npc_zarema',
    category: 'npc',
    title: 'Зарема (Quaternius female_01)',
    imageBrief: 'Quaternius women pack — Adventurer rig',
    sourceRelativePath: `${AI3DGEN}/npcs/female_01.glb`,
    publicUrl: `${MODELS}/npcs/zarema.glb`,
    wire: { kind: 'npc', npcId: 'zarema' },
    licenseTier: 'free',
  },
  {
    id: 'quaternius_npc_maxim',
    category: 'npc',
    title: 'Максим (Quaternius male_09)',
    imageBrief: 'Quaternius men pack — Suit rig',
    sourceRelativePath: `${AI3DGEN}/npcs/male_09.glb`,
    publicUrl: `${MODELS}/npcs/maxim.glb`,
    wire: { kind: 'npc', npcId: 'maxim' },
    licenseTier: 'free',
  },
  {
    id: 'quaternius_npc_kate',
    category: 'npc',
    title: 'Катя (Quaternius female_09)',
    imageBrief: 'Quaternius women pack — Witch rig',
    sourceRelativePath: `${AI3DGEN}/npcs/female_09.glb`,
    publicUrl: `${MODELS}/npcs/kate.glb`,
    wire: { kind: 'npc', npcId: 'kate' },
    licenseTier: 'free',
  },
  // Full 20-slot map: scripts/quaternius-import.mjs → NPC_QUATERNIUS_MAP
  // ── Kenney City Kit props (CC0) — npm run assets:freekit-stage ──
  {
    id: 'prop_city_bench',
    category: 'prop',
    title: 'Скамейка (улица)',
    imageBrief: 'Low-poly park bench, CC0 street furniture',
    sourceRelativePath: `${AI3DGEN}/props/bench.glb`,
    publicUrl: `${MODELS}/props/citykit/bench.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_bench' },
    defaultScale: 0.2,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_lamp_post',
    category: 'prop',
    title: 'Фонарный столб',
    imageBrief: 'Street lamp post, Kenney City Kit Roads',
    sourceRelativePath: `${AI3DGEN}/props/lamp_post.glb`,
    publicUrl: `${MODELS}/props/citykit/lamp_post.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_lamp_post' },
    defaultScale: 0.18,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_table_small',
    category: 'prop',
    title: 'Малый стол',
    imageBrief: 'Side table / café table, Kenney Furniture Kit',
    sourceRelativePath: `${AI3DGEN}/props/table_small.glb`,
    publicUrl: `${MODELS}/props/citykit/table_small.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_table_small' },
    defaultScale: 0.2,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_chair',
    category: 'prop',
    title: 'Стул',
    imageBrief: 'Simple chair, Kenney Furniture Kit',
    sourceRelativePath: `${AI3DGEN}/props/chair.glb`,
    publicUrl: `${MODELS}/props/citykit/chair.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_chair' },
    defaultScale: 0.2,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_bookshelf',
    category: 'prop',
    title: 'Книжный шкаф (city kit)',
    imageBrief: 'Closed bookcase, Kenney Furniture Kit',
    sourceRelativePath: `${AI3DGEN}/props/bookshelf.glb`,
    publicUrl: `${MODELS}/props/citykit/bookshelf.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_bookshelf' },
    defaultScale: 0.25,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_terminal',
    category: 'prop',
    title: 'Терминал / монитор',
    imageBrief: 'Computer screen prop, Kenney Furniture Kit',
    sourceRelativePath: `${AI3DGEN}/props/terminal.glb`,
    publicUrl: `${MODELS}/props/citykit/terminal.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_terminal' },
    defaultScale: 0.15,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_coffee_machine',
    category: 'prop',
    title: 'Кофемашина',
    imageBrief: 'Kitchen coffee machine, Kenney Furniture Kit',
    sourceRelativePath: `${AI3DGEN}/props/coffee_machine.glb`,
    publicUrl: `${MODELS}/props/citykit/coffee_machine.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_coffee_machine' },
    defaultScale: 0.15,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_guitar',
    category: 'prop',
    title: 'Гитара (interim)',
    imageBrief: 'Story guitar prop — interim Kenney radio mesh until dedicated CC0 guitar',
    sourceRelativePath: `${AI3DGEN}/props/guitar.glb`,
    publicUrl: `${MODELS}/props/citykit/guitar.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_guitar' },
    defaultScale: 0.15,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_bottle',
    category: 'prop',
    title: 'Бутылка / стакан',
    imageBrief: 'Coffee glass prop, Kenney Furniture Kit',
    sourceRelativePath: `${AI3DGEN}/props/bottle.glb`,
    publicUrl: `${MODELS}/props/citykit/bottle.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_bottle' },
    defaultScale: 0.15,
    licenseTier: 'free',
  },
  {
    id: 'prop_city_campfire',
    category: 'prop',
    title: 'Костёр (ЧК)',
    imageBrief: 'Campfire for CHK forest scenes, OpenGameArt CC0',
    sourceRelativePath: `${AI3DGEN}/props/campfire.glb`,
    publicUrl: `${MODELS}/props/citykit/campfire.glb`,
    wire: { kind: 'prop', propModelId: 'kenney_city_campfire' },
    defaultScale: 0.25,
    licenseTier: 'free',
  },
  // ── Interior shells (Kenney fallback — Poly Pizza TODO) ──
  {
    id: 'interior_room_bedroom',
    category: 'interior',
    title: 'Спальня — interior shell',
    imageBrief: 'Low-poly bedroom interior room shell',
    sourceRelativePath: `${AI3DGEN}/interiors/room_bedroom.glb`,
    publicUrl: `${MODELS}/interiors/room_bedroom.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_room_bedroom' },
    defaultScale: 0.012,
    licenseTier: 'free',
  },
  {
    id: 'interior_cafe',
    category: 'interior',
    title: 'Кафе — interior shell',
    imageBrief: 'Café interior room shell',
    sourceRelativePath: `${AI3DGEN}/interiors/cafe_interior.glb`,
    publicUrl: `${MODELS}/interiors/cafe_interior.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_cafe' },
    defaultScale: 0.011,
    licenseTier: 'free',
  },
  {
    id: 'interior_office',
    category: 'interior',
    title: 'Офис — interior shell',
    imageBrief: 'Office interior shell',
    sourceRelativePath: `${AI3DGEN}/interiors/office.glb`,
    publicUrl: `${MODELS}/interiors/office.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_office' },
    defaultScale: 0.009,
    licenseTier: 'free',
  },
  {
    id: 'interior_library',
    category: 'interior',
    title: 'Библиотека — interior shell',
    imageBrief: 'Library interior shell',
    sourceRelativePath: `${AI3DGEN}/interiors/library.glb`,
    publicUrl: `${MODELS}/interiors/library.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_library' },
    defaultScale: 0.011,
    licenseTier: 'free',
  },
  {
    id: 'interior_factory',
    category: 'interior',
    title: 'Завод — interior shell',
    imageBrief: 'Factory industrial interior shell',
    sourceRelativePath: `${AI3DGEN}/interiors/factory.glb`,
    publicUrl: `${MODELS}/interiors/factory.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_factory' },
    defaultScale: 0.008,
    licenseTier: 'free',
  },
  {
    id: 'interior_corridor',
    category: 'interior',
    title: 'Коридор — interior shell',
    imageBrief: 'Corridor / hallway shell',
    sourceRelativePath: `${AI3DGEN}/interiors/corridor.glb`,
    publicUrl: `${MODELS}/interiors/corridor.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_corridor' },
    defaultScale: 0.02,
    licenseTier: 'free',
  },
  {
    id: 'interior_rooftop',
    category: 'interior',
    title: 'Крыша — backdrop shell',
    imageBrief: 'Rooftop skyline backdrop shell',
    sourceRelativePath: `${AI3DGEN}/interiors/rooftop.glb`,
    publicUrl: `${MODELS}/interiors/rooftop.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_rooftop' },
    defaultScale: 0.018,
    licenseTier: 'free',
  },
  {
    id: 'interior_basement',
    category: 'interior',
    title: 'Подвал — interior shell',
    imageBrief: 'Basement / underground shell',
    sourceRelativePath: `${AI3DGEN}/interiors/basement.glb`,
    publicUrl: `${MODELS}/interiors/basement.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_basement' },
    defaultScale: 0.025,
    licenseTier: 'free',
  },
  {
    id: 'interior_pier',
    category: 'interior',
    title: 'Причал — ground shell',
    imageBrief: 'Pier / waterfront path shell',
    sourceRelativePath: `${AI3DGEN}/interiors/pier.glb`,
    publicUrl: `${MODELS}/interiors/pier.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_pier' },
    defaultScale: 0.03,
    licenseTier: 'free',
  },
  {
    id: 'interior_forest_clearing',
    category: 'interior',
    title: 'Лесная поляна — shell',
    imageBrief: 'Forest clearing hero tree shell for CHK',
    sourceRelativePath: `${AI3DGEN}/interiors/forest_clearing.glb`,
    publicUrl: `${MODELS}/interiors/forest_clearing.glb`,
    wire: { kind: 'manifest', assetManifestId: 'interior_forest_clearing' },
    defaultScale: 0.04,
    licenseTier: 'free',
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
