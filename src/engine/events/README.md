# Event Bus — Domain Map

Single singleton (`eventBus`) with a flat runtime API. Types live in domain modules under `src/engine/events/`.

## Domains (97 events)

| Domain | Prefix | Events | Primary producers | Primary consumers |
|--------|--------|--------|-------------------|-------------------|
| Audio | `sound:` | 1 | QuickUseBar, PhotoMode | useAudioOrchestrator |
| UI | `ui:`, `toast:`, `game:notification` | 3 | NPC, PoemPowerSystem, UnifiedNotifications | HUD, NotificationToasts |
| Exploration | `exploration:`, `interact:` | 2 | PhysicsPlayer | RainSystem (indirect) |
| Quest | `quest:` | 7 | worldSlice, QuestTracker | QuestNotificationSystem, GuidedStoryManager |
| Player | `player:`, `skill:`, `choice:`, `loot:` | 7 | player slices, applyEffects | HUD, LevelUpEffect |
| Game lifecycle | `game:saved/loaded/reset` | 3 | saveSlice | QuestTracker, AutoSaveIndicator, GuidedStoryManager |
| NPC | `npc:` | 4 | DialogueRenderer, playerQuestRewardsSlice | QuestTracker, useNPCAnimation |
| Interaction | `object:`, `interaction:` | 6 | InteractiveTriggers, PhysicsPlayer | useInteractionOrchestrator, RPGGameCanvas |
| Scene | `scene:`, `canvas:` | 5 | explorationSlice (`scene:request_transition`), RPGGameCanvas | sceneTransition binder, SceneTransitionHandler, useAudioOrchestrator |
| Minigame | `minigame:` | 3 | minigames via `completeMinigame`, MiniGameHub | QuestTracker, MinigameQuestBridge (gameType/success only; never apply `reward` when `rewardsApplied`) |
| FX | `fx:` | 9 | ScreenEffects, CombatSystem | ScreenEffects, ExplorationPostFX |
| Poem | `poem:` | 5 | PoemPowerSystem, worldSlice | QuestTracker, CyberpunkPoemOverlay |
| Camera | `camera:` | 10 | CombatSystem, GameOrchestrator | FollowCamera |
| Intro | `intro:` | 2 | WakeUpSequence | FollowCamera |
| Combat | `combat:` | 11 | CombatSystem | ScreenEffects, useCombatOrchestrator |
| Weather | `weather:` | 3 | useWeatherEffects | RainSystem, SnowSystem, HUD |
| Lore | `lore:` | 1 | uiSlice | EventNotificationPopup |
| Cutscene | `cutscene:` | 2 | GameOrchestrator | CutsceneOverlay |
| Achievement | `achievement:` | 1 | worldSlice | AchievementNotification |
| Crafting | `crafting:`, `item:` | 2 | playerEconomySlice | CraftingDiscoveryToast |
| Photo | `photo:` | 3 | PhotoMode, HUD, GameOrchestrator | PhotoMode, HUD |
| World | `world:`, `schedule:` | 4 | explorationSlice (`schedule:sync_npcs`), useWorldClock, useWorldChunks | scheduleSyncController, useWorldClock |
| Story | `story:` | 4 | GuidedStoryManager | StoryGuidanceHUD, GameOrchestrator |

## Migration pattern (per domain)

1. Types already live in `src/engine/events/<domain>Events.ts`.
2. Add `<DOMAIN>_EVENTS` constant object (see `photoEvents.ts`).
3. Replace string literals in that domain's producers/consumers with constants.
4. No runtime change — same bus, same event names.

## Fully migrated

- **photo** — `PHOTO_EVENTS`, `PHOTO_EMPTY_PAYLOAD` in `photoEvents.ts`

## Ambiguous / related pairs (watch when adding events)

- `combat:heal` vs `player:heal` — combat float vs out-of-combat heal
- `fx:achievement` vs `achievement:unlocked` — screen FX vs store notification
- `poem:cutscene_end` vs `cutscene:overlay_end` — poem overlay vs letterbox overlay
