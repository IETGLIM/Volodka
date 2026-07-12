export type LootNotificationType = 'item' | 'skill' | 'karma' | 'poem' | 'combat' | 'xp';

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type LootNotificationPayload = {
  type: LootNotificationType;
  label: string;
  detail?: string;
  rarity?: LootRarity;
};

export type LootNotificationItem = LootNotificationPayload & {
  id: string;
};
