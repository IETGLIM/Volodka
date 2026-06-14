import { useSyncExternalStore } from 'react';
import type { NotificationPoolStore, PoolEntryBase } from '@/hooks/useNotificationPool';

export function useNotificationPool<T extends PoolEntryBase>(store: NotificationPoolStore<T>): readonly T[] {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
