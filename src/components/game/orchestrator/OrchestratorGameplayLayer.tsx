import { useMemo } from 'react';
import { useOrchestratorShell } from '@/store/selectors';
import type { SceneBannerPresentation } from '@/engine/world/worldAmbiencePresentation';
import type { OrchestratorRuntime } from './useOrchestratorRuntime';
import type { PanelCloseHandlers } from './useStablePanelClosers';
import type { HudSecondaryPanelOpeners } from './useStableHudPanelOpeners';
import {
  GameplayAmbientExplorationHud,
  GameplayCombatLayer,
  GameplayExamineOverlay,
  GameplayExplorationHud,
  GameplayExplorationNotifications,
  GameplayMinigameLayer,
  GameplayNarrativeOverlay,
  GameplaySceneBanner,
  GameplaySharedEffects,
  GameplayStatsPanel,
  GameplayVirtualJoystick,
  GameplayMobileActionButtons,
  GameplayMinimap,
  GameplayQuickAccessToolbar,
} from './OrchestratorGameplaySections';
import { ContainerLootPanel } from '@/components/game/ContainerLootPanel';
import { InteractionRippleEffect } from '@/components/game/InteractionRippleEffect';
import { SkillCheckDisplay } from '@/components/game/SkillCheckDisplay';
import { FirstMinutesDirector } from '@/components/game/firstMinutes/FirstMinutesDirector';

type Props = {
  gameDataReady: boolean;
  sceneBanner: SceneBannerPresentation | null;
  interaction: OrchestratorRuntime['interaction'];
  panels: Pick<
    OrchestratorRuntime['panels'],
    | 'handleOpenQuests'
    | 'handleOpenInventory'
    | 'handleOpenPoetry'
    | 'handleOpenJournal'
    | 'handleToggleTutorials'
    | 'handleOpenMenu'
  >;
  panelClosers: PanelCloseHandlers;
  hudSecondaryOpeners: HudSecondaryPanelOpeners;
};

function isGameplayMode(mode: string): boolean {
  return mode === 'exploration' || mode === 'cutscene' || mode === 'combat';
}

/** Exploration / cutscene / combat HUD, narrative overlays, minigames. */
export function OrchestratorGameplayLayer({
  gameDataReady,
  sceneBanner,
  interaction,
  panels,
  panelClosers,
  hudSecondaryOpeners,
}: Props) {
  const { mode } = useOrchestratorShell();

  const panelOpeners = useMemo(
    () => ({
      onOpenQuests: panels.handleOpenQuests,
      onOpenInventory: panels.handleOpenInventory,
      onOpenPoetry: panels.handleOpenPoetry,
      onOpenJournal: panels.handleOpenJournal,
      onToggleTutorials: panels.handleToggleTutorials,
      onOpenMenu: panels.handleOpenMenu,
    }),
    [
      panels.handleOpenQuests,
      panels.handleOpenInventory,
      panels.handleOpenPoetry,
      panels.handleOpenJournal,
      panels.handleToggleTutorials,
      panels.handleOpenMenu,
    ],
  );

  if (!isGameplayMode(mode)) return null;

  return (
    <>
      <GameplayExplorationNotifications />
      <GameplaySharedEffects />
      <FirstMinutesDirector />
      <GameplaySceneBanner sceneBanner={sceneBanner} />
      <GameplayAmbientExplorationHud />
      <GameplayExplorationHud
        gameDataReady={gameDataReady}
        panelOpeners={panelOpeners}
        hudSecondaryOpeners={hudSecondaryOpeners}
      />
      <GameplayStatsPanel onClose={panelClosers} />
      {/* Mobile controls: VirtualJoystick (circular) + action buttons only.
          D-pad (GameplayMobileExplorationHud) removed — it overlapped with
          VirtualJoystick causing UI collision. Joystick is the primary control. */}
      <GameplayVirtualJoystick />
      <GameplayMobileActionButtons />
      <GameplayMinimap />
      <GameplayQuickAccessToolbar panelOpeners={panelOpeners} />
      <GameplayNarrativeOverlay />
      <GameplayMinigameLayer
        codebreakerOpen={interaction.codebreakerOpen}
        openstackTerminalOpen={interaction.openstackTerminalOpen}
        bashTerminalOpen={interaction.bashTerminalOpen}
        poetryGameOpen={interaction.poetryGameOpen}
        hackingGameOpen={interaction.hackingGameOpen}
        memoryGameOpen={interaction.memoryGameOpen}
        quizGameOpen={interaction.quizGameOpen}
        rhythmGameOpen={interaction.rhythmGameOpen}
        minigameSetters={interaction.minigameSetters}
      />
      <GameplayCombatLayer />
      <GameplayExamineOverlay
        open={interaction.examineOpen}
        data={interaction.examineData}
        hasLinkedContent={interaction.examineHasLinkedContent}
        onContinue={interaction.handleExamineContinue}
        onReset={interaction.resetExamine}
        onClearPendingTriggerZone={interaction.clearPendingTriggerZone}
      />
      <ContainerLootPanel
        open={interaction.containerLootOpen}
        contents={interaction.containerLootContents}
        lockedKeyId={interaction.containerLootLockedKeyId}
        lootedFlag={interaction.containerLootLootedFlag}
        onClose={interaction.closeContainerLoot}
        onTakeItem={interaction.takeItemFromContainer}
      />
      <InteractionRippleEffect />
      <SkillCheckDisplay />
    </>
  );
}
