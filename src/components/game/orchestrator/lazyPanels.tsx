/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { memo, Suspense, type ComponentType } from 'react';
import { retryLazyDefault } from '@/shared/utils/retryLazy';
import { PanelStackSlot, usePanelStack } from './PanelStackContext';
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

export const RPGGameCanvas = retryLazyDefault(
  () => import('@/components/3d/RPGGameCanvas').then((m) => ({ default: m.RPGGameCanvas })),
  'RPGGameCanvas',
);

export const LazyQuestsPanel = retryLazyDefault(() => import('../QuestsPanel').then((m) => ({ default: m.QuestsPanel })), 'QuestsPanel');
export const LazyInventory = retryLazyDefault(() => import('../Inventory').then((m) => ({ default: m.Inventory })), 'Inventory');
export const LazyPoetryBook = retryLazyDefault(() => import('../PoetryBook').then((m) => ({ default: m.PoetryBook })), 'PoetryBook');
export const LazyJournalPanel = retryLazyDefault(() => import('../JournalPanel').then((m) => ({ default: m.JournalPanel })), 'JournalPanel');
export const LazyRestPanel = retryLazyDefault(() => import('../RestPanel').then((m) => ({ default: m.RestPanel })), 'RestPanel');
export const LazySaveSlotManager = retryLazyDefault(() => import('../SaveSlotManager').then((m) => ({ default: m.SaveSlotManager })), 'SaveSlotManager');
export const LazyMiniGameHub = retryLazyDefault(() => import('../MiniGameHub').then((m) => ({ default: m.MiniGameHub })), 'MiniGameHub');
export const LazyNPCRelationshipPanel = retryLazyDefault(() => import('../NPCRelationshipPanel').then((m) => ({ default: m.NPCRelationshipPanel })), 'NPCRelationshipPanel');
export const LazyCharacterProfilePanel = retryLazyDefault(() => import('../CharacterProfilePanel').then((m) => ({ default: m.CharacterProfilePanel })), 'CharacterProfilePanel');
export const LazyCodexPanel = retryLazyDefault(() => import('../CodexPanel').then((m) => ({ default: m.CodexPanel })), 'CodexPanel');
export const LazyDialogueHistoryPanel = retryLazyDefault(() => import('../DialogueHistoryPanel').then((m) => ({ default: m.DialogueHistoryPanel })), 'DialogueHistoryPanel');
export const LazyAchievementDetailsPanel = retryLazyDefault(() => import('../AchievementDetailsPanel').then((m) => ({ default: m.AchievementDetailsPanel })), 'AchievementDetailsPanel');
export const LazySkillTreePanel = retryLazyDefault(() => import('../SkillTreePanel').then((m) => ({ default: m.SkillTreePanel })), 'SkillTreePanel');
export const LazyFastTravelPanel = retryLazyDefault(() => import('../FastTravelPanel').then((m) => ({ default: m.FastTravelPanel })), 'FastTravelPanel');
export const LazyPerksPanel = retryLazyDefault(() => import('../PerksPanel').then((m) => ({ default: m.PerksPanel })), 'PerksPanel');
export const LazyQuestBoardPanel = retryLazyDefault(() => import('../QuestBoardPanel').then((m) => ({ default: m.QuestBoardPanel })), 'QuestBoardPanel');
export const LazyPlayerStatsPanel = retryLazyDefault(() => import('../PlayerStatsPanel').then((m) => ({ default: m.PlayerStatsPanel })), 'PlayerStatsPanel');
export const LazyCraftingPanel = retryLazyDefault(() => import('../CraftingPanel').then((m) => ({ default: m.CraftingPanel })), 'CraftingPanel');
export const LazyTradingPanel = retryLazyDefault(() => import('../TradingPanel').then((m) => ({ default: m.TradingPanel })), 'TradingPanel');
export const LazyDevPanel = retryLazyDefault(() => import('../DevPanel').then((m) => ({ default: m.DevPanel })), 'DevPanel');
export const LazyShortcutsOverlay = retryLazyDefault(() => import('../ShortcutsOverlay').then((m) => ({ default: m.ShortcutsOverlay })), 'ShortcutsOverlay');

export const LazyMenuScreen = retryLazyDefault(() => import('../MenuScreen').then((m) => ({ default: m.MenuScreen })), 'MenuScreen');
export const LazyIntroScreen = retryLazyDefault(() => import('../IntroScreen').then((m) => ({ default: m.IntroScreen })), 'IntroScreen');
export const LazyStoryRenderer = retryLazyDefault(() => import('../StoryRenderer').then((m) => ({ default: m.StoryRenderer })), 'StoryRenderer');
export const LazyDialogueRenderer = retryLazyDefault(() => import('../DialogueRenderer').then((m) => ({ default: m.DialogueRenderer })), 'DialogueRenderer');
export const LazyCombatUI = retryLazyDefault(() => import('../CombatUI').then((m) => ({ default: m.CombatUI })), 'CombatUI');
export const LazySettingsPanel = retryLazyDefault(() => import('../SettingsPanel').then((m) => ({ default: m.SettingsPanel })), 'SettingsPanel');
export const LazyQuestAcceptDialog = retryLazyDefault(() => import('../QuestAcceptDialog').then((m) => ({ default: m.QuestAcceptDialog })), 'QuestAcceptDialog');
export const LazyQuestCompleteDialog = retryLazyDefault(() => import('../QuestCompleteDialog').then((m) => ({ default: m.QuestCompleteDialog })), 'QuestCompleteDialog');
export const LazyKarmaPoemInfoPanel = retryLazyDefault(() => import('../KarmaPoemInfoPanel').then((m) => ({ default: m.KarmaPoemInfoPanel })), 'KarmaPoemInfoPanel');
export const LazyMatrixRainQuote = retryLazyDefault(() => import('../MatrixRainQuote').then((m) => ({ default: m.MatrixRainQuote })), 'MatrixRainQuote');
export const LazyFirstReadingCelebration = retryLazyDefault(
  () => import('../FirstReadingCelebration').then((m) => ({ default: m.FirstReadingCelebration })),
  'FirstReadingCelebration',
);
export const LazyLevelUpEffect = retryLazyDefault(() => import('../LevelUpEffect').then((m) => ({ default: m.LevelUpEffect })), 'LevelUpEffect');
export const LazyPhotoMode = retryLazyDefault(() => import('../PhotoMode').then((m) => ({ default: m.PhotoMode })), 'PhotoMode');

export const LazyHUD = retryLazyDefault(() => import('../HUD').then((m) => ({ default: m.HUD })), 'HUD');
export const LazyMiniMap = retryLazyDefault(() => import('../MiniMap').then((m) => ({ default: m.MiniMap })), 'MiniMap');
export const LazyQuestNotificationSystem = retryLazyDefault(
  () => import('../QuestNotificationSystem').then((m) => ({ default: m.QuestNotificationSystem })),
  'QuestNotificationSystem',
);
export const LazyStoryGuidanceHUD = retryLazyDefault(
  () => import('../StoryGuidanceHUD').then((m) => ({ default: m.StoryGuidanceHUD })),
  'StoryGuidanceHUD',
);
