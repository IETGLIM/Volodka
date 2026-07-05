import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { LOOT_NOTIFICATION_EVENT } from '@/engine/loot/lootNotificationConstants';
import {
  notifyItemReceived,
  pushLootNotification,
} from '@/engine/loot/lootNotificationApi';

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: {
    playSfx: vi.fn(),
  },
}));

import { audioEngine } from '@/engine/AudioEngine';

describe('lootNotificationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits ui:loot_notification on push', () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    pushLootNotification({ type: 'item', label: 'Ключ' });
    expect(emitSpy).toHaveBeenCalledWith(LOOT_NOTIFICATION_EVENT, {
      type: 'item',
      label: 'Ключ',
    });
    expect(audioEngine.playSfx).toHaveBeenCalledWith('notify');
  });

  it('notifyItemReceived forwards rarity', () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    notifyItemReceived('Артефакт', 'legendary');
    expect(emitSpy).toHaveBeenCalledWith(
      LOOT_NOTIFICATION_EVENT,
      expect.objectContaining({ rarity: 'legendary' }),
    );
  });
});
