import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createDialogueHistorySlice, type DialogueHistorySlice } from '../slices/dialogueHistorySlice';
import { bindSliceCreator } from './bindSliceCreator';

export const useDialogueHistoryStore = create<DialogueHistorySlice>()(
  subscribeWithSelector(bindSliceCreator(createDialogueHistorySlice)),
);
export function getDialogueHistoryStoreState(): DialogueHistorySlice {
  return useDialogueHistoryStore.getState();
}
