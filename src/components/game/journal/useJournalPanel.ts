import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { journalTelemetry } from '@/engine/journal/journalTelemetry';
import {
  useAddLoreEntry,
  useJournalShell,
  useSetJournalOpen,
  useSetJournalTab,
} from '@/store/selectors';
import type { JournalTab } from '@/store/gameStore';

export function useJournalPanel(
  openProp: boolean | undefined,
  onCloseProp?: () => void,
) {
  const { journalOpen: storeJournalOpen, journalTab } = useJournalShell();
  const journalOpen = openProp ?? storeJournalOpen;
  const setJournalTab = useSetJournalTab();
  const setJournalOpen = useSetJournalOpen();
  const addLoreEntry = useAddLoreEntry();
  const loreInitializedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (loreInitializedRef.current) return;
    loreInitializedRef.current = true;
    for (const entry of INITIAL_LORE_ENTRIES) {
      addLoreEntry(entry);
    }
  }, [addLoreEntry]);

  useEffect(() => {
    if (!journalOpen) return;
    journalTelemetry.track({ action: 'open' });
  }, [journalOpen]);

  const handleClose = useCallback(() => {
    onCloseProp?.();
    setJournalOpen(false);
  }, [onCloseProp, setJournalOpen]);

  const handleTabChange = useCallback(
    (tab: JournalTab) => {
      setJournalTab(tab);
      journalTelemetry.track({ action: 'tab_change', tab });
    },
    [setJournalTab],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      journalTelemetry.track({ action: 'search', queryLength: value.trim().length, tab: journalTab });
    }
  }, [journalTab]);

  useEffect(() => {
    setSearchQuery('');
  }, [journalTab]);

  useEffect(() => {
    if (!journalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [journalOpen, handleClose]);

  return {
    journalOpen,
    journalTab,
    searchQuery,
    setSearchQuery: handleSearchChange,
    handleClose,
    handleTabChange,
  };
}
