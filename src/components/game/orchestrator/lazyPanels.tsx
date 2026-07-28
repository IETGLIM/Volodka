import { lazy, memo, Suspense, type ComponentType } from 'react';
import { PanelStackSlot } from './PanelStackContext';
import { usePanelStack } from './usePanelStack';
import { PanelExitProvider } from './PanelExitContext';
import { usePanelKeepAlive } from './usePanelKeepAlive';
import { usePanelMountCleanup } from './usePanelMountCleanup';
import type { NonNullPanelType } from './panelStackReducer';

export const LazyPanelSlot = memo(function LazyPanelSlot({
  panelId,
  Panel,
  open,
  onClose,
  panelProps,
}: {
  panelId?: NonNullPanelType;
  Panel: ComponentType<any>;
  /** Explicit open override; when panelId is set, stack membership is used instead. */
  open?: boolean;
  onClose?: () => void;
  panelProps?: Readonly<Record<string, unknown>>;
}) {
  const { isPanelOpen } = usePanelStack();
  const resolvedOpen = panelId != null ? isPanelOpen(panelId) : open !== false;
  const { mounted, finishExit } = usePanelKeepAlive(resolvedOpen);
  usePanelMountCleanup(panelId, mounted);

  if (!mounted) return null;

  const panel = (
    <PanelExitProvider onExitComplete={finishExit}>
      <Suspense fallback={null}>
        <Panel open={resolvedOpen} onClose={onClose} {...panelProps} />
      </Suspense>
    </PanelExitProvider>
  );

  if (panelId == null) return panel;

  return <PanelStackSlot panelId={panelId}>{panel}</PanelStackSlot>;
});

export const RPGGameCanvas = lazy(
  () => import('@/components/3d/RPGGameCanvas').then((m) => ({ default: m.RPGGameCanvas })),
);

export const LazyQuestsPanel = lazy(() => import('../QuestsPanel').then((m) => ({ default: m.QuestsPanel })));
export const LazyInventory = lazy(() => import('../Inventory').then((m) => ({ default: m.Inventory })));
export const LazyPoetryBook = lazy(() => import('../PoetryBook').then((m) => ({ default: m.PoetryBook })));
export const LazyJournalPanel = lazy(() => import('../JournalPanel').then((m) => ({ default: m.JournalPanel })));
export const LazyRestPanel = lazy(() => import('../RestPanel').then((m) => ({ default: m.RestPanel })));
export const LazySaveSlotManager = lazy(() => import('../SaveSlotManager').then((m) => ({ default: m.SaveSlotManager })));
export const LazyMiniGameHub = lazy(() => import('../MiniGameHub').then((m) => ({ default: m.MiniGameHub })));
export const LazyNPCRelationshipPanel = lazy(() => import('../NPCRelationshipPanel').then((m) => ({ default: m.NPCRelationshipPanel })));
export const LazyCharacterProfilePanel = lazy(() => import('../CharacterProfilePanel').then((m) => ({ default: m.CharacterProfilePanel })));
export const LazyCodexPanel = lazy(() => import('../CodexPanel').then((m) => ({ default: m.CodexPanel })));
export const LazyDialogueHistoryPanel = lazy(() => import('../DialogueHistoryPanel').then((m) => ({ default: m.DialogueHistoryPanel })));
export const LazyAchievementDetailsPanel = lazy(() => import('../AchievementDetailsPanel').then((m) => ({ default: m.AchievementDetailsPanel })));
export const LazySkillTreePanel = lazy(() => import('../SkillTreePanel').then((m) => ({ default: m.SkillTreePanel })));
export const LazyFastTravelPanel = lazy(() => import('../FastTravelPanel').then((m) => ({ default: m.FastTravelPanel })));
export const LazyPerksPanel = lazy(() => import('../PerksPanel').then((m) => ({ default: m.PerksPanel })));
export const LazyQuestBoardPanel = lazy(() => import('../QuestBoardPanel').then((m) => ({ default: m.QuestBoardPanel })));
export const LazyPlayerStatsPanel = lazy(() => import('../PlayerStatsPanel').then((m) => ({ default: m.PlayerStatsPanel })));
export const LazyCraftingPanel = lazy(() => import('../CraftingPanel').then((m) => ({ default: m.CraftingPanel })));
export const LazyTradingPanel = lazy(() => import('../TradingPanel').then((m) => ({ default: m.TradingPanel })));
export const LazyDevPanel = lazy(() => import('../DevPanel').then((m) => ({ default: m.DevPanel })));
export const LazyShortcutsOverlay = lazy(() => import('../ShortcutsOverlay').then((m) => ({ default: m.ShortcutsOverlay })));

export const LazyMenuScreen = lazy(() => import('../MenuScreen').then((m) => ({ default: m.MenuScreen })));
export const LazyIntroScreen = lazy(() => import('../IntroScreen').then((m) => ({ default: m.IntroScreen })));
export const LazyStoryRenderer = lazy(() => import('../StoryRenderer').then((m) => ({ default: m.StoryRenderer })));
export const LazyDialogueRenderer = lazy(() => import('../DialogueRenderer').then((m) => ({ default: m.DialogueRenderer })));
export const LazyCombatUI = lazy(() => import('../CombatUI').then((m) => ({ default: m.CombatUI })));
export const LazySettingsPanel = lazy(() => import('../SettingsPanel').then((m) => ({ default: m.SettingsPanel })));
export const LazyQuestAcceptDialog = lazy(() => import('../QuestAcceptDialog').then((m) => ({ default: m.QuestAcceptDialog })));
export const LazyQuestCompleteDialog = lazy(() => import('../QuestCompleteDialog').then((m) => ({ default: m.QuestCompleteDialog })));
export const LazyKarmaPoemInfoPanel = lazy(() => import('../KarmaPoemInfoPanel').then((m) => ({ default: m.KarmaPoemInfoPanel })));
export const LazyMatrixRainQuote = lazy(() => import('../MatrixRainQuote').then((m) => ({ default: m.MatrixRainQuote })));
export const LazyLevelUpEffect = lazy(() => import('../LevelUpEffect').then((m) => ({ default: m.LevelUpEffect })));
export const LazyPhotoMode = lazy(() => import('../PhotoMode').then((m) => ({ default: m.PhotoMode })));

export const LazyHUD = lazy(() => import('../HUD').then((m) => ({ default: m.HUD })));
export const LazyMiniMap = lazy(() => import('../MiniMap').then((m) => ({ default: m.MiniMap })));
export const LazyQuestNotificationSystem = lazy(() =>
  import('../QuestNotificationSystem').then((m) => ({ default: m.QuestNotificationSystem })),
);
export const LazyStoryGuidanceHUD = lazy(() =>
  import('../StoryGuidanceHUD').then((m) => ({ default: m.StoryGuidanceHUD })),
);
