/* ─── Loot notification imperative API ─── */

import type { TrainablePlayerSkill } from '@/shared/types/game';

export interface LootNotificationEntry {
  id: number;
  type: 'item' | 'skill' | 'karma' | 'poem' | 'combat' | 'xp';
  label: string;
  detail?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

type AddNotifier = (n: Omit<LootNotificationEntry, 'id'>) => void;
let globalAddNotification: AddNotifier | null = null;

export function registerLootNotifier(fn: AddNotifier | null) {
  globalAddNotification = fn;
}

export function pushNotification(n: Omit<LootNotificationEntry, 'id'>) {
  globalAddNotification?.(n);
}

const SKILL_NAMES: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Программирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

export function notifySkillUp(skill: TrainablePlayerSkill, level: number) {
  pushNotification({
    type: 'skill',
    label: SKILL_NAMES[skill],
    detail: `Уровень ${level}`,
  });
}

export function notifyItemReceived(
  name: string,
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary',
) {
  pushNotification({
    type: 'item',
    label: name,
    rarity,
  });
}

export function notifyCombatLoot(
  name: string,
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary',
) {
  pushNotification({
    type: 'combat',
    label: name,
    detail: 'Трофей',
    rarity,
  });
}

export function notifyXpGained(amount: number) {
  pushNotification({
    type: 'xp',
    label: `+${amount} опыта`,
  });
}

export function notifyKarmaChange(value: number) {
  pushNotification({
    type: 'karma',
    label: value > 0 ? `Карма +${value}` : `Карма ${value}`,
  });
}

export function notifyPoemCollected(title: string) {
  pushNotification({
    type: 'poem',
    label: title,
    detail: 'Стихотворение найдено',
  });
}
