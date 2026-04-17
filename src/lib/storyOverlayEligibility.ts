import type { StoryNode } from '@/data/types';

/** Узел `explore_mode` — маркер свободного 3D, без текста в оверлее. */
export function storyNodeShowsStoryOverlay(node: StoryNode | undefined): boolean {
  if (!node || node.id === 'explore_mode') return false;
  return (
    Boolean(node.text?.trim()) ||
    Boolean(node.choices?.length) ||
    Boolean(node.autoNext) ||
    node.type === 'poem_game' ||
    node.type === 'interpretation'
  );
}
