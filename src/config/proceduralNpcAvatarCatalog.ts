/**
 * Procedural NPC avatars — primary visual identity pipeline (no RPM / external SaaS).
 * All story NPCs render via `NpcComposerModel` (slot recipes in `npcComposer/recipes.ts`).
 * Unknown ids use `GENERIC_NPC_COMPOSE_RECIPE`. Mixamo/Quaternius clips retarget via ghost rig.
 */

export type ProceduralNpcAvatarTier = 'hero' | 'p0' | 'p1';

export interface ProceduralNpcAvatarEntry {
  npcId: string;
  title: string;
  /** Art brief — used for docs, dev panel, future AI3DGen prompts. */
  description: string;
  /** Procedural model switch key (`AlbertModel` → `albert`). */
  modelKey: string;
  tier: ProceduralNpcAvatarTier;
  /** Legacy RPM catalog id when names differ (npc_alina → solnysh). */
  legacyRpmId?: string;
}

export const PROCEDURAL_NPC_AVATAR_CATALOG: readonly ProceduralNpcAvatarEntry[] = [
  {
    npcId: 'player_volodka',
    title: 'Володя',
    description: 'Худой киберпанк-поэт в очках — герой (ProceduralPlayerModel)',
    modelKey: 'volodka',
    tier: 'hero',
    legacyRpmId: 'npc_volodka',
  },
  {
    npcId: 'zarema',
    title: 'Зарема',
    description: 'Женщина 50+, платок, длинное платье, заботливая соседка',
    modelKey: 'zarema',
    tier: 'p0',
    legacyRpmId: 'npc_zarema',
  },
  {
    npcId: 'albert',
    title: 'Альберт',
    description: 'Философ с бородой, очками, твидовым пиджаком и бабочкой',
    modelKey: 'albert',
    tier: 'p0',
    legacyRpmId: 'npc_albert',
  },
  {
    npcId: 'solnysh',
    title: 'Солныш (Алина)',
    description: 'Светлые волосы, дизайнер, детство друга Володьки',
    modelKey: 'vera',
    tier: 'p1',
    legacyRpmId: 'npc_alina',
  },
  {
    npcId: 'cafe_barista',
    title: 'Бариста',
    description: 'Бариста с киберпротезом руки',
    modelKey: 'barista',
    tier: 'p1',
    legacyRpmId: 'npc_barista',
  },
  {
    npcId: 'office_alexander',
    title: 'Александр',
    description: 'Лидер IT-гильдии — костюм, бейдж',
    modelKey: 'alexander',
    tier: 'p1',
    legacyRpmId: 'npc_alexander',
  },
  {
    npcId: 'office_dmitry',
    title: 'Дмитрий',
    description: 'Нервный старший разработчик',
    modelKey: 'dmitry',
    tier: 'p1',
    legacyRpmId: 'npc_dmitry',
  },
  {
    npcId: 'maria',
    title: 'Виктория',
    description: 'Тёмные волосы, загадочная незнакомка',
    modelKey: 'maria',
    tier: 'p1',
    legacyRpmId: 'npc_maria',
  },
  {
    npcId: 'chk_ru',
    title: 'Ру (ЧК)',
    description: 'Архитектор ТОЛПА — шляпа, метал',
    modelKey: 'colleague',
    tier: 'p1',
    legacyRpmId: 'npc_chk_ru',
  },
  {
    npcId: 'chk_based',
    title: 'Басед (ЧК)',
    description: 'Сисадмин ЧК — широкий, портвейн',
    modelKey: 'sergey',
    tier: 'p1',
    legacyRpmId: 'npc_chk_based',
  },
  {
    npcId: 'chk_smert',
    title: 'Смерть (ЧК)',
    description: 'Бухгалтер-философ в очках',
    modelKey: 'vera',
    tier: 'p1',
    legacyRpmId: 'npc_chk_smert',
  },
  {
    npcId: 'chk_stalker',
    title: 'Сталкер (ЧК)',
    description: 'Разведчик леса — шарф, капюшон',
    modelKey: 'lena',
    tier: 'p1',
    legacyRpmId: 'npc_chk_stalker',
  },
  {
    npcId: 'chk_elis',
    title: 'Элис (ЧК)',
    description: 'QA-бард с гитарой',
    modelKey: 'kate',
    tier: 'p1',
    legacyRpmId: 'npc_chk_elis',
  },
  {
    npcId: 'chk_ritka',
    title: 'Ритка (ЧК)',
    description: 'Джуниор-тестировщица, бард пирса с гитарой',
    modelKey: 'ritka',
    tier: 'p1',
    legacyRpmId: 'npc_chk_ritka',
  },
  {
    npcId: 'maxim',
    title: 'Максим',
    description: 'Лидер сопротивления — тяжёлый, импланты',
    modelKey: 'maxim',
    tier: 'p1',
    legacyRpmId: 'npc_maxim',
  },
  {
    npcId: 'anya',
    title: 'Аня',
    description: 'Хакер сопротивления — очки, сеть',
    modelKey: 'anya',
    tier: 'p1',
    legacyRpmId: 'npc_anya',
  },
  {
    npcId: 'zeka',
    title: 'Жека',
    description: 'Старый заводской хакер в шляпе',
    modelKey: 'zeka',
    tier: 'p1',
    legacyRpmId: 'npc_zheka',
  },
  {
    npcId: 'baba_zina',
    title: 'Баба Зина',
    description: '80+ паяльщица «Зари-М» — фартук, паяльник',
    modelKey: 'baba_zina',
    tier: 'p1',
    legacyRpmId: 'npc_baba_zina',
  },
  {
    npcId: 'fisherman_trofim',
    title: 'Трофим',
    description: 'Старый рыбак с удочкой и ведром',
    modelKey: 'trofim',
    tier: 'p1',
    legacyRpmId: 'npc_trofim',
  },
  {
    npcId: 'kate',
    title: 'Катя',
    description: 'Библиотекарь с книгой и круглыми очками',
    modelKey: 'kate',
    tier: 'p1',
    legacyRpmId: 'npc_katya',
  },
] as const;

export function getProceduralNpcAvatar(npcId: string): ProceduralNpcAvatarEntry | undefined {
  return PROCEDURAL_NPC_AVATAR_CATALOG.find((entry) => entry.npcId === npcId);
}

export function listProceduralNpcAvatarIds(): string[] {
  return PROCEDURAL_NPC_AVATAR_CATALOG.map((entry) => entry.npcId);
}
