/**
 * Ready Player Me NPC pipeline — 20 story avatars.
 * Source drops: assets-source/ai3dgen/npcs/npc_*.glb
 * Import: npm run assets:rpm-import -- --id npc_albert --file path.glb
 *
 * Supersedes Khronos/Quaternius CC0 placeholders when RPM files are present.
 * Generator: https://readyplayer.me/ (user account required — not downloaded by CI).
 */

const RPM_NPCS = 'assets-source/ai3dgen/npcs';
const MODELS = '/models';

export type RpmNpcWireKind = 'hero' | 'npc';

export interface RpmNpcCatalogEntry {
  /** Catalog id — matches source filename without extension (npc_albert). */
  id: string;
  title: string;
  /** Visual brief for RPM avatar creation + Blender cleanup. */
  description: string;
  sourceRelativePath: string;
  /** Canonical id in npcModelRegistry / npc definitions (maria, solnysh, kate, …). */
  npcId: string;
  publicUrl: string;
  defaultScale?: number;
  wire: { kind: RpmNpcWireKind; manifestId?: string };
  /** Story alias note (Victoria→maria, Solnysh→alina source, Katya→kate). */
  aliasNote?: string;
}

/** All 20 RPM NPC slots — wired even before files land on disk. */
export const RPM_NPC_CATALOG: readonly RpmNpcCatalogEntry[] = [
  {
    id: 'npc_volodka',
    title: 'Володя (герой)',
    description: 'Thin build, glasses, tired cyberpunk poet — hero player mesh',
    sourceRelativePath: `${RPM_NPCS}/npc_volodka.glb`,
    npcId: 'player_volodka',
    publicUrl: `${MODELS}/characters/volodka/volodka_lod0.glb`,
    defaultScale: 1,
    wire: { kind: 'hero', manifestId: 'player_volodka' },
  },
  {
    id: 'npc_zarema',
    title: 'Зарема',
    description: 'Woman 50+, headscarf, warm caring neighbor from the communal flat',
    sourceRelativePath: `${RPM_NPCS}/npc_zarema.glb`,
    npcId: 'zarema',
    publicUrl: `${MODELS}/npcs/zarema.glb`,
    defaultScale: 0.95,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_alina',
    title: 'Солныш (Алина)',
    description: 'Blonde, blue eyes, 33 — childhood friend, designer, wife of Lyonya',
    sourceRelativePath: `${RPM_NPCS}/npc_alina.glb`,
    npcId: 'solnysh',
    publicUrl: `${MODELS}/npcs/solnysh.glb`,
    defaultScale: 0.92,
    wire: { kind: 'npc' },
    aliasNote: 'Source npc_alina.glb → registry id solnysh',
  },
  {
    id: 'npc_albert',
    title: 'Альберт',
    description: 'Bearded philosopher, café regular, glasses and cardigan',
    sourceRelativePath: `${RPM_NPCS}/npc_albert.glb`,
    npcId: 'albert',
    publicUrl: `${MODELS}/npcs/albert.glb`,
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_barista',
    title: 'Бариста',
    description: 'Café barista with visible cyber prosthetic arm',
    sourceRelativePath: `${RPM_NPCS}/npc_barista.glb`,
    npcId: 'cafe_barista',
    publicUrl: `${MODELS}/npcs/cafe_barista.glb`,
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_alexander',
    title: 'Александр',
    description: 'IT guild leader — suit, badge, tired corporate calm',
    sourceRelativePath: `${RPM_NPCS}/npc_alexander.glb`,
    npcId: 'office_alexander',
    publicUrl: `${MODELS}/npcs/office_alexander.glb`,
    defaultScale: 1.05,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_dmitry',
    title: 'Дмитрий',
    description: 'Thin, nervous senior developer, rolled sleeves',
    sourceRelativePath: `${RPM_NPCS}/npc_dmitry.glb`,
    npcId: 'office_dmitry',
    publicUrl: `${MODELS}/npcs/office_dmitry.glb`,
    defaultScale: 1.1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_maria',
    title: 'Виктория',
    description: 'Dark hair, winter eyes — mysterious stranger (registry id maria)',
    sourceRelativePath: `${RPM_NPCS}/npc_maria.glb`,
    npcId: 'maria',
    publicUrl: `${MODELS}/npcs/maria.glb`,
    defaultScale: 0.8,
    wire: { kind: 'npc' },
    aliasNote: 'Story name Victoria → registry id maria',
  },
  {
    id: 'npc_chk_ru',
    title: 'Ру (ЧК)',
    description: 'CHK Tolpa — lead architect, hat, heavy metal organizer',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_ru.glb`,
    npcId: 'chk_ru',
    publicUrl: `${MODELS}/npcs/chk_ru.glb`,
    defaultScale: 1.05,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_based',
    title: 'Басед (ЧК)',
    description: 'CHK Tolpa — sysadmin, portwine keeper, broad build',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_based.glb`,
    npcId: 'chk_based',
    publicUrl: `${MODELS}/npcs/chk_based.glb`,
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_smert',
    title: 'Смерть (ЧК)',
    description: 'CHK Tolpa — accountant-philosopher, glasses, slim',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_smert.glb`,
    npcId: 'chk_smert',
    publicUrl: `${MODELS}/npcs/chk_smert.glb`,
    defaultScale: 0.95,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_stalker',
    title: 'Сталкер (ЧК)',
    description: 'CHK Tolpa — security scout, scarf, forest guide',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_stalker.glb`,
    npcId: 'chk_stalker',
    publicUrl: `${MODELS}/npcs/chk_stalker.glb`,
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_elis',
    title: 'Элис (ЧК)',
    description: 'CHK Tolpa — QA bard with guitar, slim',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_elis.glb`,
    npcId: 'chk_elis',
    publicUrl: `${MODELS}/npcs/chk_elis.glb`,
    defaultScale: 0.92,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_ritka',
    title: 'Ритка (ЧК)',
    description: 'CHK Tolpa — junior tester, pier bard, guitar',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_ritka.glb`,
    npcId: 'chk_ritka',
    publicUrl: `${MODELS}/npcs/chk_ritka.glb`,
    defaultScale: 0.9,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_maxim',
    title: 'Максим',
    description: 'Resistance leader — factory worker with combat implants, heavy build',
    sourceRelativePath: `${RPM_NPCS}/npc_maxim.glb`,
    npcId: 'maxim',
    publicUrl: `${MODELS}/npcs/maxim.glb`,
    defaultScale: 1.1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_anya',
    title: 'Аня',
    description: 'Resistance hacker — slim, glasses, network ops',
    sourceRelativePath: `${RPM_NPCS}/npc_anya.glb`,
    npcId: 'anya',
    publicUrl: `${MODELS}/npcs/anya.glb`,
    defaultScale: 0.9,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_zheka',
    title: 'Жека',
    description: 'Old factory hacker — hat, knows pre-Collapse secrets',
    sourceRelativePath: `${RPM_NPCS}/npc_zheka.glb`,
    npcId: 'zeka',
    publicUrl: `${MODELS}/npcs/zeka.glb`,
    defaultScale: 1,
    wire: { kind: 'npc' },
    aliasNote: 'Source npc_zheka.glb → registry id zeka',
  },
  {
    id: 'npc_baba_zina',
    title: 'Баба Зина',
    description: 'Eighty-year-old factory solderer, keeper of Zarya-M',
    sourceRelativePath: `${RPM_NPCS}/npc_baba_zina.glb`,
    npcId: 'baba_zina',
    publicUrl: `${MODELS}/npcs/baba_zina.glb`,
    defaultScale: 0.88,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_trofim',
    title: 'Трофим',
    description: 'Old fisherman on pier #3, former factory watchman',
    sourceRelativePath: `${RPM_NPCS}/npc_trofim.glb`,
    npcId: 'fisherman_trofim',
    publicUrl: `${MODELS}/npcs/trofim.glb`,
    defaultScale: 1,
    wire: { kind: 'npc' },
    aliasNote: 'Registry id fisherman_trofim → public trofim.glb',
  },
  {
    id: 'npc_katya',
    title: 'Катя',
    description: 'Librarian — glasses, quiet, keeper of forbidden books',
    sourceRelativePath: `${RPM_NPCS}/npc_katya.glb`,
    npcId: 'kate',
    publicUrl: `${MODELS}/npcs/kate.glb`,
    defaultScale: 0.9,
    wire: { kind: 'npc' },
    aliasNote: 'Source npc_katya.glb → registry id kate',
  },
] as const;

export function getRpmNpcSpec(catalogId: string): RpmNpcCatalogEntry | undefined {
  return RPM_NPC_CATALOG.find((entry) => entry.id === catalogId);
}

export function getRpmNpcByRegistryId(npcId: string): RpmNpcCatalogEntry | undefined {
  return RPM_NPC_CATALOG.find((entry) => entry.npcId === npcId);
}

export function getRpmPublicUrls(): string[] {
  return RPM_NPC_CATALOG.map((entry) => entry.publicUrl);
}

export function listRpmNpcCatalogIds(): string[] {
  return RPM_NPC_CATALOG.map((entry) => entry.id);
}

/** Hero LOD chain — interim copies from single RPM export until Blender LOD pass. */
export const RPM_HERO_LOD_URLS: readonly string[] = [
  `${MODELS}/characters/volodka/volodka_lod0.glb`,
  `${MODELS}/characters/volodka/volodka_lod1.glb`,
  `${MODELS}/characters/volodka/volodka_lod2.glb`,
  `${MODELS}/characters/volodka/volodka_lod0.draco.glb`,
  `${MODELS}/characters/volodka/volodka_lod0.meshopt.glb`,
];
