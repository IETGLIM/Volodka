import { describe, expect, it } from 'vitest';
import {
  explorationRuntimeTriggerSceneIds,
  getTriggersForScene,
  getWorldItemsForScene,
} from './triggerZones';

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

  it('volodka_corridor exposes digetic hub location triggers', () => {
    const corridor = getTriggersForScene('volodka_corridor');
    expect(corridor.some((t) => t.id === 'trigger_corridor_to_room')).toBe(true);
    expect(corridor.some((t) => t.id === 'trigger_corridor_to_home_common')).toBe(true);
    expect(corridor.some((t) => t.id === 'trigger_corridor_to_zarema_room')).toBe(true);
    expect(corridor.some((t) => t.id === 'trigger_corridor_to_blue_pit')).toBe(true);
  });

  it('explorationRuntimeTriggerSceneIds merges zarema with kitchen_night for markers/collisions', () => {
    const ids = explorationRuntimeTriggerSceneIds('zarema_albert_room');
    expect(ids.has('zarema_albert_room')).toBe(true);
    expect(ids.has('kitchen_night')).toBe(true);
    expect(explorationRuntimeTriggerSceneIds('volodka_room').size).toBe(1);
  });
});

describe('getWorldItemsForScene', () => {
  it('includes kitchen note for zarema_albert_room', () => {
    const items = getWorldItemsForScene('zarema_albert_room');
    expect(items.some((i) => i.id === 'item_note_kitchen')).toBe(true);
  });
});
