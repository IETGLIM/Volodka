import type { StateCreator } from 'zustand';
import type { GameStoreState } from '../types';
export function bindSliceCreator<TSlice>(creator: StateCreator<GameStoreState, [], [], TSlice>): StateCreator<TSlice, [], [], TSlice> {
  return (set, get, api) => creator(set as never, get as never, api as never);
}
