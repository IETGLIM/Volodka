/** Player HUD notification categories — shared by store and engine bridge. */

export type NotificationType = 'karma' | 'skill' | 'energy' | 'stress' | 'poem' | 'quest';

export interface GameNotification {
  id: string;
  type: NotificationType;
  text: string;
  timestamp: number;
}
