/**
 * Canonical NPC ids are short registry keys in ALL_NPC_DEFINITIONS (e.g. `kate`, `maria`).
 * Legacy `npc_*` asset/source ids and old save keys map here — do not use them in new content.
 */
export const NPC_ID_ALIASES: Readonly<Record<string, string>> = {
  vera: 'solnysh',
  npc_solnysh: 'solnysh',
  nina: 'kate',
  npc_maria: 'maria',
  npc_barista: 'cafe_barista',
  npc_albert: 'albert',
  npc_zarema: 'zarema',
  npc_colleague: 'office_colleague',
  dmitry: 'office_dmitry',
  npc_dmitry: 'office_dmitry',
  npc_chk_stalker: 'chk_stalker',
  npc_trofim: 'fisherman_trofim',
  npc_baba_zina: 'baba_zina',
  npc_zheka: 'zeka',
  npc_maxim: 'maxim',
  npc_anya: 'anya',
  npc_sergey: 'sergey',
  npc_katya: 'kate',
  npc_alina: 'solnysh',
  npc_viktoria: 'maria',
  npc_marat_echo: 'marat_echo',
  npc_guild_defector: 'guild_defector',
  npc_street_poet: 'street_poet',
  npc_resistance_fighter: 'maxim',
};

const loggedUnknownNpcIds = new Set<string>();

export function resolveCanonicalNpcId(npcId: string): string {
  return NPC_ID_ALIASES[npcId] ?? npcId;
}

/** Boundary helper — prefer at loaders, quest handlers, and dialogue entry points. */
export const resolveNpcId = resolveCanonicalNpcId;

/** Dev-only: warn once when an id is neither canonical nor a known alias key. */
export function warnUnknownNpcId(npcId: string, isKnownCanonical: boolean): void {
  if (!import.meta.env?.DEV || !npcId || isKnownCanonical) return;
  if (npcId in NPC_ID_ALIASES) return;
  if (loggedUnknownNpcIds.has(npcId)) return;
  loggedUnknownNpcIds.add(npcId);
  console.warn(`[NPC] unknown id "${npcId}" — not in registry or NPC_ID_ALIASES`);
}

/** Test hook — clear deduped dev warnings between cases. */
export function resetNpcIdWarningsForTests(): void {
  loggedUnknownNpcIds.clear();
}
