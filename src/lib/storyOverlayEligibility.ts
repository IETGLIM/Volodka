import type { StoryNode } from '@/data/types';

/** Пустой хаб `explore_mode` без текста/выборов — без оверлея; см. `explore_hub_welcome` для вступления. */
export function storyNodeShowsStoryOverlay(node: StoryNode | undefined): boolean {
  if (!node) return false;
  return (
    Boolean(node.text?.trim()) ||
    Boolean(node.choices?.length) ||
    Boolean(node.autoNext) ||
    node.type === 'poem_game' ||
    node.type === 'interpretation'
  );
}
