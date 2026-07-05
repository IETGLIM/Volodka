import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildKarmaPoemPanelView } from '@/engine/karmaPoem/karmaPoemPresentation';
import type { KarmaPoemTab } from '@/engine/karmaPoem/karmaPoemPresentation';
import { karmaPoemTelemetry } from '@/engine/karmaPoem/karmaPoemTelemetry';
import { useKarmaPoemInfoPanelState } from '@/store/selectors';
import { useKarmaPoemTabNavigation } from '@/components/game/karmaPoem/useKarmaPoemTabNavigation';

export function useKarmaPoemPanel(open: boolean, onClose: () => void) {
  const panelInput = useKarmaPoemInfoPanelState();
  const [activeTab, setActiveTab] = useState<KarmaPoemTab>('karma');

  const view = useMemo(() => buildKarmaPoemPanelView(panelInput), [panelInput]);

  useEffect(() => {
    if (!open) return;
    karmaPoemTelemetry.track({ action: 'open', tab: activeTab });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [open]);

  const handleTabChange = useCallback((tab: KarmaPoemTab) => {
    setActiveTab(tab);
    karmaPoemTelemetry.track({ action: 'tab_change', tab });
  }, []);

  const handleClose = useCallback(() => {
    karmaPoemTelemetry.track({ action: 'close', tab: activeTab });
    onClose();
  }, [onClose, activeTab]);

  useKarmaPoemTabNavigation(open, activeTab, handleTabChange);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleClose]);

  return {
    view,
    activeTab,
    handleTabChange,
    handleClose,
  };
}
