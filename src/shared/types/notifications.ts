/** Player HUD notification categories — shared by store and engine bridge. */

export type NotificationType = 'karma' | 'skill' | 'energy' | 'stress' | 'poem' | 'quest' | 'crafting' | 'achievement' | 'lore' | 'system' | 'warning';

export interface GameNotification {
  id: string;
  type: NotificationType;
  text: string;
  timestamp: number;
}
