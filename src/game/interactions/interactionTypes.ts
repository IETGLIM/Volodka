import type { InteractionContext } from './interactionContext';

export type InteractionKind = 'dialogue' | 'loot' | 'event';

export type Interaction = {
  id: string;
  type: InteractionKind;
  condition?: () => boolean;
  execute: (ctx: InteractionContext) => void;
};
