/** Legacy NPC ids → canonical registry ids (save/backward compatibility). */
export const NPC_ID_ALIASES: Readonly<Record<string, string>> = {
  vera: 'solnysh',
  npc_solnysh: 'solnysh',
  nina: 'kate',
  npc_maria: 'maria',
  npc_barista: 'cafe_barista',
  npc_albert: 'albert',
  npc_zarema: 'zarema',
  npc_colleague: 'office_colleague',
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
};

export function resolveCanonicalNpcId(npcId: string): string {
  return NPC_ID_ALIASES[npcId] ?? npcId;
}
