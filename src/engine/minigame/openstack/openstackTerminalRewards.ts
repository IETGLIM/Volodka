import { eventBus } from '@/engine/EventBus';
import type { GameStoreState } from '@/store/types';

type StoreActions = Pick<GameStoreState, 'addSkill' | 'addKarma' | 'addStress' | 'setFlag'>;

export function applyOpenStackSuccess(store: StoreActions): void {
  store.addSkill('coding', 5);
  store.addKarma(3);
  store.setFlag('openstack_terminal_solved', true);
  eventBus.emit('minigame:complete', {
    gameType: 'openstack_terminal',
    success: true,
    reward: [
      { type: 'addSkill' as const, value: 5 },
      { type: 'addKarma' as const, value: 3 },
    ],
  });
}

export function applyOpenStackFailure(store: StoreActions): void {
  store.addStress(3);
  store.setFlag('openstack_terminal_failed', true);
  eventBus.emit('minigame:complete', {
    gameType: 'openstack_terminal',
    success: false,
  });
}
