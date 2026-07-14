import { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PanelCloseHandlers } from './useStablePanelClosers';
import {
  LazyPanelSlot,
  LazyQuestsPanel,
  LazyInventory,
  LazyPoetryBook,
  LazyJournalPanel,
  LazyRestPanel,
  LazySaveSlotManager,
  LazyMiniGameHub,
  LazyNPCRelationshipPanel,
  LazyCharacterProfilePanel,
  LazyCodexPanel,
  LazyDialogueHistoryPanel,
  LazyAchievementDetailsPanel,
  LazySkillTreePanel,
  LazyFastTravelPanel,
  LazyPerksPanel,
  LazyQuestBoardPanel,
  LazyPlayerStatsPanel,
  LazyCraftingPanel,
  LazyTradingPanel,
  LazyDevPanel,
  LazyShortcutsOverlay,
  LazyKarmaPoemInfoPanel,
  LazyNotificationHistoryPanel,
  LazySettingsPanel,
} from './lazyPanels';

type PanelCloseProps = {
  onClose: PanelCloseHandlers;
  onOpenPoetryBook: () => void;
};

export const OrchestratorStatsPanel = memo(function OrchestratorStatsPanel({
  onClose,
}: {
  onClose: PanelCloseHandlers;
}) {
  return (
    <LazyPanelSlot
      panelId="stats"
      Panel={LazyPlayerStatsPanel}
      onClose={onClose.stats}
    />
  );
});

export const OrchestratorGameplayPanels = memo(function OrchestratorGameplayPanels({
  onClose,
  onOpenPoetryBook,
}: PanelCloseProps) {
  const inventoryPanelProps = useMemo(
    () => ({ onOpenPoetryBook }),
    [onOpenPoetryBook],
  );

  return (
    <>
      <LazyPanelSlot panelId="quests" Panel={LazyQuestsPanel} onClose={onClose.quests} />
      <ErrorBoundary name="inventory">
        <LazyPanelSlot
          panelId="inventory"
          Panel={LazyInventory}
          onClose={onClose.inventory}
          panelProps={inventoryPanelProps}
        />
      </ErrorBoundary>
      <LazyPanelSlot panelId="poetry" Panel={LazyPoetryBook} onClose={onClose.poetry} />
      <LazyPanelSlot panelId="crafting" Panel={LazyCraftingPanel} onClose={onClose.crafting} />
      <LazyPanelSlot panelId="trading" Panel={LazyTradingPanel} onClose={onClose.trading} />
      <LazyPanelSlot panelId="fastTravel" Panel={LazyFastTravelPanel} onClose={onClose.fastTravel} />
      <LazyPanelSlot panelId="rest" Panel={LazyRestPanel} onClose={onClose.rest} />
      <LazyPanelSlot panelId="journal" Panel={LazyJournalPanel} onClose={onClose.journal} />
    </>
  );
});

export const OrchestratorMenuLayerPanels = memo(function OrchestratorMenuLayerPanels({
  onClose,
}: Pick<PanelCloseProps, 'onClose'>) {
  return (
    <>
      <LazyPanelSlot panelId="settings" Panel={LazySettingsPanel} onClose={onClose.settings} />
      <LazyPanelSlot panelId="saveSlot" Panel={LazySaveSlotManager} onClose={onClose.saveSlot} />
      <LazyPanelSlot panelId="miniGameHub" Panel={LazyMiniGameHub} onClose={onClose.miniGameHub} />
      <LazyPanelSlot panelId="npcRelation" Panel={LazyNPCRelationshipPanel} onClose={onClose.npcRelation} />
      <LazyPanelSlot panelId="characterProfile" Panel={LazyCharacterProfilePanel} onClose={onClose.characterProfile} />
      <LazyPanelSlot panelId="codex" Panel={LazyCodexPanel} onClose={onClose.codex} />
      <LazyPanelSlot panelId="achievements" Panel={LazyAchievementDetailsPanel} onClose={onClose.achievements} />
      <LazyPanelSlot panelId="skillTree" Panel={LazySkillTreePanel} onClose={onClose.skillTree} />
      <LazyPanelSlot panelId="perks" Panel={LazyPerksPanel} onClose={onClose.perks} />
      <LazyPanelSlot panelId="questBoard" Panel={LazyQuestBoardPanel} onClose={onClose.questBoard} />
      <LazyPanelSlot panelId="dialogueHistory" Panel={LazyDialogueHistoryPanel} onClose={onClose.dialogueHistory} />
      <LazyPanelSlot panelId="shortcuts" Panel={LazyShortcutsOverlay} onClose={onClose.shortcuts} />
      <LazyPanelSlot panelId="karmaPoem" Panel={LazyKarmaPoemInfoPanel} onClose={onClose.karmaPoem} />
      <LazyPanelSlot panelId="notificationHistory" Panel={LazyNotificationHistoryPanel} onClose={onClose.notificationHistory} />
    </>
  );
});

export const OrchestratorDevPanel = memo(function OrchestratorDevPanel({
  devToolsArmed,
  devPanelStartOpen,
}: {
  devToolsArmed: boolean;
  devPanelStartOpen: boolean;
}) {
  if (!devToolsArmed) return null;
  return <LazyPanelSlot Panel={LazyDevPanel} panelProps={{ startOpen: devPanelStartOpen }} />;
});

/** All stack-driven panels outside pause menu. */
export const OrchestratorPanelLayer = memo(function OrchestratorPanelLayer({
  showGameplayPanels,
  onClose,
  onOpenPoetryBook,
  devToolsArmed,
  devPanelStartOpen,
}: PanelCloseProps & {
  showGameplayPanels: boolean;
  devToolsArmed: boolean;
  devPanelStartOpen: boolean;
}) {
  return (
    <>
      {showGameplayPanels && (
        <OrchestratorGameplayPanels onClose={onClose} onOpenPoetryBook={onOpenPoetryBook} />
      )}
      <OrchestratorMenuLayerPanels onClose={onClose} />
      <OrchestratorDevPanel devToolsArmed={devToolsArmed} devPanelStartOpen={devPanelStartOpen} />
    </>
  );
});
