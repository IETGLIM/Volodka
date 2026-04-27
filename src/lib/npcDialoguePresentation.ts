import type { NPCDefinition } from '@/data/rpgTypes';

/** Градиент кружка + цвет имени в шапке `DialogueRenderer` (голограмма без растрового портрета). */
export type NpcDialogueHoloAccent = {
  holoGradientClass: string;
  holoNeonClass: string;
};

const HOLO_BY_NPC_ID: Record<string, NpcDialogueHoloAccent> = {
  zarema_home: { holoGradientClass: 'from-fuchsia-500 to-rose-700', holoNeonClass: 'text-fuchsia-200' },
  maria: { holoGradientClass: 'from-rose-600 to-pink-700', holoNeonClass: 'text-rose-300' },
  kitchen_maria: { holoGradientClass: 'from-rose-600 to-pink-700', holoNeonClass: 'text-rose-300' },
  albert: { holoGradientClass: 'from-amber-600 to-orange-700', holoNeonClass: 'text-amber-300' },
  cafe_barista: { holoGradientClass: 'from-amber-600 to-orange-700', holoNeonClass: 'text-amber-300' },
  office_colleague: { holoGradientClass: 'from-cyan-600 to-blue-700', holoNeonClass: 'text-cyan-300' },
  office_alexander: { holoGradientClass: 'from-cyan-600 to-blue-700', holoNeonClass: 'text-cyan-300' },
  office_dmitry: { holoGradientClass: 'from-cyan-600 to-blue-700', holoNeonClass: 'text-cyan-300' },
  office_artyom: { holoGradientClass: 'from-cyan-600 to-blue-700', holoNeonClass: 'text-cyan-300' },
  office_andrey: { holoGradientClass: 'from-cyan-600 to-blue-700', holoNeonClass: 'text-cyan-300' },
  office_boss: { holoGradientClass: 'from-slate-600 to-slate-800', holoNeonClass: 'text-slate-200' },
  dream_lillian: { holoGradientClass: 'from-purple-600 to-violet-700', holoNeonClass: 'text-purple-300' },
  park_elder: { holoGradientClass: 'from-emerald-600 to-green-700', holoNeonClass: 'text-emerald-300' },
  vs_slice_albert: { holoGradientClass: 'from-amber-600 to-orange-700', holoNeonClass: 'text-amber-300' },
  vs_slice_coworker: { holoGradientClass: 'from-cyan-600 to-blue-700', holoNeonClass: 'text-cyan-300' },
  cafe_visitor: { holoGradientClass: 'from-violet-600 to-indigo-700', holoNeonClass: 'text-violet-200' },
};

const HOLO_FALLBACK: NpcDialogueHoloAccent = {
  holoGradientClass: 'from-slate-600 to-slate-700',
  holoNeonClass: 'text-slate-300',
};

function holoAccentForNpcId(npcId: string): NpcDialogueHoloAccent {
  return HOLO_BY_NPC_ID[npcId] ?? HOLO_FALLBACK;
}

/** Первая буква/цифра для монограммы (пропускает эмодзи в начале `name`). */
export function npcDialogueInitial(name: string): string {
  const m = name.match(/[\p{L}\p{N}]/u);
  return m ? m[0]!.toUpperCase() : '?';
}

export type NpcDialoguePresentation = NpcDialogueHoloAccent & {
  npcRole: string;
  portraitUrl?: string;
};

/**
 * Единая шапка диалога: роль (подпись), опциональный растровый портрет (`public/…`), иначе — голограмма (инициал + акцент).
 * Растровый путь — только под `public/` (например `/images/npc/zarema.png`).
 */
export function getNpcDialoguePresentation(def: NPCDefinition): NpcDialoguePresentation {
  const accent = holoAccentForNpcId(def.id);
  const role = def.dialogueRole?.trim();
  return {
    ...accent,
    npcRole: role && role.length > 0 ? role : 'Собеседник',
    portraitUrl: def.dialoguePortraitUrl?.trim() || undefined,
  };
}
