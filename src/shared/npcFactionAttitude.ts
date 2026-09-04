/* ─── Volodka RPG – отношение фракции NPC к игроку (чистая презентация) ───
 *
 * Превращает агрегированную репутацию фракции (среднее отношение встреченных
 * членов — см. store/selectors/factionReputationSelectors) в «уровень
 * отношения» + русские подписи и реплики-флейвор для диалогового HUD.
 *
 * Чистый модуль shared-слоя: только строки и числа, без импортов движка и
 * стора (границы eslint). Пороги союзника/врага берутся из общих констант
 * npcRelationThresholds, чтобы чип фракции и бар отношения NPC не расходились.
 *
 * Используется: useNpcFactionAttitude (диалоги, v4.8.6).
 */

import {
  NPC_RELATION_ALLY_THRESHOLD,
  NPC_RELATION_ENEMY_THRESHOLD,
} from '@/shared/constants/npcRelationThresholds';

/** Уровни отношения фракции (от лучшего к худшему). */
export type FactionAttitudeTier = 'ally' | 'cordial' | 'neutral' | 'wary' | 'hostile';

/** Порог «расположенности»: выше нейтралитета, но до союзничества. */
export const FACTION_ATTITUDE_CORDIAL_THRESHOLD = 55;

/** Порог «настороженности»: ниже нейтралитета, но до враждебности. */
export const FACTION_ATTITUDE_WARY_THRESHOLD = 45;

/** Русские подписи уровней (чип в шапке диалога). */
export const FACTION_ATTITUDE_TIER_LABELS: Record<FactionAttitudeTier, string> = {
  ally: 'Союзник',
  cordial: 'Расположены',
  neutral: 'Нейтрально',
  wary: 'Настороженно',
  hostile: 'Враждебно',
};

/**
 * Реплика-флейвор над текстом диалога. Показывается только для сильных
 * уровней (ally/hostile) — иначе повторяется на каждом узле и шумит.
 * Формулировки без склонения имени NPC — работают для любого спикера.
 */
export const FACTION_ATTITUDE_LINES: Record<
  Exclude<FactionAttitudeTier, 'neutral'>,
  (factionLabel: string) => string
> = {
  ally: (f) => `Вас здесь знают и доверяют вам — репутация «${f}» говорит за вас.`,
  cordial: (f) => `«${f}» встречает вас тепло — хорошие слухи дошли и сюда.`,
  wary: (f) => `К вам присматриваются — репутация «${f}» настораживает.`,
  hostile: (f) => `Вас здесь не рады видеть — «${f}» знает о вас плохое.`,
};

/** Уровень отношения по среднему значению репутации фракции (0–100). */
export function resolveFactionAttitudeTier(avgRelation: number): FactionAttitudeTier {
  if (avgRelation >= NPC_RELATION_ALLY_THRESHOLD) return 'ally';
  if (avgRelation >= FACTION_ATTITUDE_CORDIAL_THRESHOLD) return 'cordial';
  if (avgRelation <= NPC_RELATION_ENEMY_THRESHOLD) return 'hostile';
  if (avgRelation < FACTION_ATTITUDE_WARY_THRESHOLD) return 'wary';
  return 'neutral';
}

/** Строка-флейвор для уровня (null для нейтрального — реплика не нужна). */
export function factionAttitudeLine(tier: FactionAttitudeTier, factionLabel: string): string | null {
  if (tier === 'neutral') return null;
  return FACTION_ATTITUDE_LINES[tier](factionLabel);
}
