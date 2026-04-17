import { describe, expect, it } from 'vitest';
import { getTriggersForScene, getWorldItemsForScene } from './triggerZones';

describe('getTriggersForScene', () => {
  it('includes kitchen room triggers for zarema_albert_room (shared layout)', () => {
    const zarema = getTriggersForScene('zarema_albert_room');
    expect(zarema.some((t) => t.id === 'trigger_room_table')).toBe(true);
    expect(zarema.some((t) => t.id === 'trigger_kitchen_table')).toBe(true);
  });

  it('does not mix unrelated scenes', () => {
    const kitchen = getTriggersForScene('kitchen_night');
    expect(kitchen.some((t) => t.sceneId === 'cafe_evening')).toBe(false);
  });
});

describe('getWorldItemsForScene', () => {
  it('includes kitchen note for zarema_albert_room', () => {
    const items = getWorldItemsForScene('zarema_albert_room');
    expect(items.some((i) => i.id === 'item_note_kitchen')).toBe(true);
  });
});
