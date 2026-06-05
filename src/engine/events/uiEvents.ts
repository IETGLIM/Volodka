/** UI overlays, toasts, and generic notifications. */
export interface UiEvents {
  'ui:exploration_message': { text: string };
  'game:notification': { title: string; subtitle?: string; type: 'combat' | 'scene' | 'achievement' | 'quest' | 'info' };
  'toast:add': { id: string; type: 'karma' | 'energy' | 'stress' | 'skill' | 'poem' | 'quest'; message: string; delta?: number; timestamp: number };
}
