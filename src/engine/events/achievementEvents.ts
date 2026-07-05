/** Achievement unlock notifications — worldSlice, AchievementNotification. */
export interface AchievementEvents {
  'achievement:unlocked': {
    achievementId: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    soundEffect?: string;
    accessibilityAnnounce: string;
  };
}
