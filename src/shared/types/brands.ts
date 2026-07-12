/* ─── Branded ID types (parse-boundary constructors) ─── */

declare const NpcIdBrand: unique symbol;
declare const QuestIdBrand: unique symbol;
declare const PoemIdBrand: unique symbol;
declare const ItemIdBrand: unique symbol;
declare const StoryNodeIdBrand: unique symbol;
declare const DialogueNodeIdBrand: unique symbol;

export type NpcId = string & { readonly [NpcIdBrand]: typeof NpcIdBrand };
export type QuestId = string & { readonly [QuestIdBrand]: typeof QuestIdBrand };
export type PoemId = string & { readonly [PoemIdBrand]: typeof PoemIdBrand };
export type ItemId = string & { readonly [ItemIdBrand]: typeof ItemIdBrand };
export type StoryNodeId = string & { readonly [StoryNodeIdBrand]: typeof StoryNodeIdBrand };
export type DialogueNodeId = string & { readonly [DialogueNodeIdBrand]: typeof DialogueNodeIdBrand };

export function asNpcId(id: string): NpcId {
  return id as NpcId;
}

export function asQuestId(id: string): QuestId {
  return id as QuestId;
}

export function asPoemId(id: string): PoemId {
  return id as PoemId;
}

export function asItemId(id: string): ItemId {
  return id as ItemId;
}

export function asStoryNodeId(id: string): StoryNodeId {
  return id as StoryNodeId;
}

export function asDialogueNodeId(id: string): DialogueNodeId {
  return id as DialogueNodeId;
}
