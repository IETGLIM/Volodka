/**
 * Legacy RPM slot registry — kept for asset path compatibility and manual imports.
 * **Primary visuals:** procedural avatars in `proceduralNpcAvatarCatalog.ts`
 * (no Ready Player Me account or network access required).
 *
 * Hero / NPC public URLs prefer ASSET_MANIFEST (single source) via helpers below.
 */

import { getAssetLod0Url, resolveCharacterManifestId } from '@/config/assetManifest';
import {
  getPlayerVolodkaManifestUrls,
  getPlayerVolodkaModelUrl,
} from '@/config/playerModelUrl';

const RPM_NPCS = 'assets-source/ai3dgen/npcs';
const MODELS = '/models';

/** Prefer ASSET_MANIFEST LOD0; fall back to conventional /models/npcs path. */
function npcPublicUrl(registryId: string, manifestId?: string): string {
  if (manifestId) {
    const explicit = getAssetLod0Url(manifestId);
    if (explicit) return explicit;
  }
  const resolved = resolveCharacterManifestId(registryId);
  const fromManifest = getAssetLod0Url(resolved);
  if (fromManifest) return fromManifest;
  const fileBase = registryId.replace(/^npc_/, '');
  return `${MODELS}/npcs/${fileBase}.glb`;
}

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
    publicUrl: getPlayerVolodkaModelUrl(),
    defaultScale: 1,
    wire: { kind: 'hero', manifestId: 'player_volodka' },
  },
  {
    id: 'npc_zarema',
    title: 'Зарема',
    description: 'Woman 50+, headscarf, warm caring neighbor from the communal flat',
    sourceRelativePath: `${RPM_NPCS}/npc_zarema.glb`,
    npcId: 'zarema',
    publicUrl: npcPublicUrl('zarema', 'npc_zarema'),
    defaultScale: 0.95,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_alina',
    title: 'Солныш (Алина)',
    description: 'Blonde, blue eyes, 33 — childhood friend, designer, wife of Lyonya',
    sourceRelativePath: `${RPM_NPCS}/npc_alina.glb`,
    npcId: 'solnysh',
    publicUrl: npcPublicUrl('solnysh'),
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
    publicUrl: npcPublicUrl('albert', 'npc_albert'),
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_barista',
    title: 'Бариста',
    description: 'Café barista with visible cyber prosthetic arm',
    sourceRelativePath: `${RPM_NPCS}/npc_barista.glb`,
    npcId: 'cafe_barista',
    publicUrl: npcPublicUrl('cafe_barista', 'npc_cafe_barista'),
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_alexander',
    title: 'Александр',
    description: 'IT guild leader — suit, badge, tired corporate calm',
    sourceRelativePath: `${RPM_NPCS}/npc_alexander.glb`,
    npcId: 'office_alexander',
    publicUrl: npcPublicUrl('office_alexander'),
    defaultScale: 1.05,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_dmitry',
    title: 'Дмитрий',
    description: 'Thin, nervous senior developer, rolled sleeves',
    sourceRelativePath: `${RPM_NPCS}/npc_dmitry.glb`,
    npcId: 'office_dmitry',
    publicUrl: npcPublicUrl('office_dmitry'),
    defaultScale: 1.1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_maria',
    title: 'Виктория',
    description: 'Dark hair, winter eyes — mysterious stranger (registry id maria)',
    sourceRelativePath: `${RPM_NPCS}/npc_maria.glb`,
    npcId: 'maria',
    publicUrl: npcPublicUrl('maria'),
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
    publicUrl: npcPublicUrl('chk_ru'),
    defaultScale: 1.05,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_based',
    title: 'Басед (ЧК)',
    description: 'CHK Tolpa — sysadmin, portwine keeper, broad build',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_based.glb`,
    npcId: 'chk_based',
    publicUrl: npcPublicUrl('chk_based'),
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_smert',
    title: 'Смерть (ЧК)',
    description: 'CHK Tolpa — accountant-philosopher, glasses, slim',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_smert.glb`,
    npcId: 'chk_smert',
    publicUrl: npcPublicUrl('chk_smert'),
    defaultScale: 0.95,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_stalker',
    title: 'Сталкер (ЧК)',
    description: 'CHK Tolpa — security scout, scarf, forest guide',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_stalker.glb`,
    npcId: 'chk_stalker',
    publicUrl: npcPublicUrl('chk_stalker'),
    defaultScale: 1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_elis',
    title: 'Элис (ЧК)',
    description: 'CHK Tolpa — QA bard with guitar, slim',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_elis.glb`,
    npcId: 'chk_elis',
    publicUrl: npcPublicUrl('chk_elis'),
    defaultScale: 0.92,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_chk_ritka',
    title: 'Ритка (ЧК)',
    description: 'CHK Tolpa — junior tester, pier bard, guitar',
    sourceRelativePath: `${RPM_NPCS}/npc_chk_ritka.glb`,
    npcId: 'chk_ritka',
    publicUrl: npcPublicUrl('chk_ritka'),
    defaultScale: 0.9,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_maxim',
    title: 'Максим',
    description: 'Resistance leader — factory worker with combat implants, heavy build',
    sourceRelativePath: `${RPM_NPCS}/npc_maxim.glb`,
    npcId: 'maxim',
    publicUrl: npcPublicUrl('maxim'),
    defaultScale: 1.1,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_anya',
    title: 'Аня',
    description: 'Resistance hacker — slim, glasses, network ops',
    sourceRelativePath: `${RPM_NPCS}/npc_anya.glb`,
    npcId: 'anya',
    publicUrl: npcPublicUrl('anya'),
    defaultScale: 0.9,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_zheka',
    title: 'Жека',
    description: 'Old factory hacker — hat, knows pre-Collapse secrets',
    sourceRelativePath: `${RPM_NPCS}/npc_zheka.glb`,
    npcId: 'zeka',
    publicUrl: npcPublicUrl('zeka'),
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
    publicUrl: npcPublicUrl('baba_zina'),
    defaultScale: 0.88,
    wire: { kind: 'npc' },
  },
  {
    id: 'npc_trofim',
    title: 'Трофим',
    description: 'Old fisherman on pier #3, former factory watchman',
    sourceRelativePath: `${RPM_NPCS}/npc_trofim.glb`,
    npcId: 'fisherman_trofim',
    publicUrl: npcPublicUrl('trofim'),
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
    publicUrl: npcPublicUrl('kate'),
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

/** Hero LOD chain — derived from ASSET_MANIFEST.player_volodka. */
export const RPM_HERO_LOD_URLS: readonly string[] = getPlayerVolodkaManifestUrls();
