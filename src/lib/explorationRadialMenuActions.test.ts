import { describe, expect, it } from 'vitest';
import { explorationObjectSupportsUse, getExplorationRadialMenuActions } from '@/lib/explorationRadialMenuActions';
import type { InteractiveObjectConfig } from '@/config/scenes';

const volDoor: InteractiveObjectConfig = {
  id: 'volodka_door_corridor',
  type: 'generic',
  position: [0, 0, 0],
};

const volLaptop: InteractiveObjectConfig = {
  id: 'volodka_laptop_work',
  type: 'notebook',
  position: [0, 0, 0],
  itemId: 'note_draft',
};

describe('getExplorationRadialMenuActions', () => {
  it('volodka door: inspect + use, no take without itemId', () => {
    const has = () => false;
    expect(getExplorationRadialMenuActions('volodka_room', volDoor, has)).toEqual(['inspect', 'use']);
  });

  it('volodka laptop with itemId: inspect + take, no use without read/poem', () => {
    const has = () => false;
    expect(getExplorationRadialMenuActions('volodka_room', volLaptop, has)).toEqual(['inspect', 'take']);
  });

  it('adds drop when player already has the item', () => {
    const has = (id: string) => id === 'note_draft';
    expect(getExplorationRadialMenuActions('volodka_room', volLaptop, has)).toEqual(['inspect', 'take', 'drop']);
  });
});

describe('explorationObjectSupportsUse', () => {
  it('true for poem / read flag', () => {
    const book: InteractiveObjectConfig = {
      id: 'room_book',
      type: 'book',
      position: [0, 0, 0],
      poemId: 'poem_01',
      canBeRead: true,
    };
    expect(explorationObjectSupportsUse('kitchen_night', book)).toBe(true);
  });

  it('false for random volodka mesh without handlers', () => {
    const desk: InteractiveObjectConfig = {
      id: 'volodka_desk_main',
      type: 'generic',
      position: [0, 0, 0],
    };
    expect(explorationObjectSupportsUse('volodka_room', desk)).toBe(false);
  });
});
