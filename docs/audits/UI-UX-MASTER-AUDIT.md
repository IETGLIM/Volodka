# Volodka — UI/UX Master Audit
## Code-first baseline and production redesign brief

**Baseline:** main commit 8edcd285a6fa3b4b995e57074980740e77b3f89c  
**Status:** audit / architecture review; no visual redesign has been applied by this document  
**Scope:** main menu, boot/loading, exploration HUD, quest guidance, action bars, panels, narrative overlays, responsive presentation, visual QA

---

## 1. Executive assessment

Volodka already has a substantial set of UI components and a functioning presentation architecture. The problem is not simply a lack of widgets. The current challenge is that the interface has accumulated several presentation generations and several parallel ways of communicating the same gameplay information.

The exploration HUD is composed from many independent layers. The orchestrator also mounts notifications, transitions, cutscenes, minigame overlays, effects and action controls. A portion of the old filmic/cyberpunk presentation is gated by the static CLASSIC_UI flag, while a classic WoW-inspired shell is active. This is a useful step toward a visual direction, but it does not yet prove that the entire experience is governed by one coherent information architecture.

**Working diagnosis:** the next redesign should be an information-architecture and state-presentation redesign, not a recolour and not another round of isolated component polishing.

This is a code-first assessment. It does not claim that every mounted component is visible simultaneously, and it does not substitute for reviewing real screenshots and gameplay recordings at the target resolutions. Those are explicit acceptance tasks below.

## 2. Evidence from the current implementation

### 2.1 Exploration HUD is a composition of independent systems

Primary file: src/components/game/hud/ExplorationHUD.tsx

The component imports and composes status, proximity, interaction, environment, stamina, objective, quest-chain, notification and navigation widgets. Examples include SceneTopBarHud, DynamicCrosshair, InteractionDistanceRing, InteractionCooldownRing, ContextualHint, ObjectiveBeacon, NPCProximityIndicator, LootProximityIndicator, QuestObjectiveCard and several environment/FX layers.

The component has conditional gates for photo mode, mobile, examination overlays, game phase and CLASSIC_UI. That means visual output is the result of several independent conditions rather than a single explicit presentation specification for each game state.

**Risk:** regression work becomes local. Fixing one overlap can create a gap or duplicate signal in another game state. A reviewer cannot infer the complete player-facing screen from a single component.

### 2.2 Orchestrator has a second presentation inventory

Primary file: src/components/game/orchestrator/OrchestratorGameplaySections.tsx

The orchestrator separately mounts exploration notifications, general event notifications, level-up effects, floating combat feedback, scene transitions, cutscenes, poem reveals, minigames, achievements, action controls and other shared effects.

Some systems are intentionally consolidated, such as transient toasts, while other layers remain independent because they listen to the EventBus or own their own state. This is valid architecturally, but the product needs a formal screen-state matrix that explains what is allowed to appear in exploration, dialogue, cutscene, combat, minigame, menu and transition states.

The current code comments also reveal a history of repeated removals due to duplication and overlap. That history is valuable evidence that the design needs stronger ownership rules.

### 2.3 Quest guidance differs between desktop and touch

Primary files:
- src/components/game/hud/parts/ActiveQuestMiniTracker.tsx
- src/components/game/hud/parts/QuestObjectiveCard.tsx
- src/components/game/hud/ExplorationHUD.tsx
- src/components/game/orchestrator/OrchestratorGameplaySections.tsx

ExplorationHUD derives a desktop QuestObjectiveCard from useActiveQuestCardData. The orchestrator mounts ActiveQuestMiniTracker only for touch devices. The mobile tracker cycles through active quests every 10 seconds, and its pinnedQuestId is component-local state rather than persisted player preference.

There is also a documentation/comment mismatch: ActiveQuestMiniTracker describes StoryGuidanceHUD as the canonical desktop objective strip, while the orchestrator comments say StoryGuidanceHUD was removed and the desktop objective is shown in QuestObjectiveCard.

**Risk:** player intent and state can differ by device. The same quest-tracking concept has more than one presentation and selection policy, and the comments no longer describe one agreed contract.

**Direction:** create one QuestTrackingViewModel and one explicit trackedQuestId owned by game/save state. Desktop and touch can render different layouts, but they must represent the same selected quest, objective and navigation target. Remove surprise auto-cycling; let the player choose or explicitly opt into cycling.

### 2.4 Action mapping is split across several systems

Primary file: src/components/game/QuickUseBar.tsx

The consumable bar has four assignable slots and uses keyboard digits 6–9 because 1–5 are reserved for poem powers. It also supports drag-and-drop assignment, long press, reordering and persistent save integration.

This is capable, but players need one discoverable control map covering movement, interaction, poem powers, consumables, dodge, combat, journal, inventory, quest tracking and menu actions. The audit has not established that this full mapping is explained consistently in menus, tooltips, controller/touch layouts and the pause screen.

**Direction:** define a platform-aware InputAction registry. Every action gets a canonical action ID, default keyboard mapping, optional remapping, touch affordance and contextual availability. UI labels must be generated from that registry instead of independently hardcoding key hints.

### 2.5 Menu and in-game panels still carry multiple visual languages

Primary files:
- src/components/game/menu/MenuScreenPanel.tsx
- src/components/game/PanelWrapper.tsx
- src/components/game/orchestrator/PanelStackContext.tsx
- src/shared/constants/uiTheme.ts

MenuScreenPanel has a distinct editorial / notebook-style title treatment and atmospheric background. PanelWrapper documents a terminal-style header, coloured dots, glow border and backdrop blur. The active theme is selected by CLASSIC_UI = true in uiTheme.ts, which is a build-time flag.

These can coexist only when the visual grammar is deliberate. At present, the codebase contains language from the notebook, terminal/cyberpunk and WoW-classic generations. This is a design-governance problem, not just a CSS problem.

**Direction:** one design system with controlled variants. Menus may have a cinematic identity, but panel geometry, typography, surface materials, spacing, interaction feedback, focus behaviour and iconography should be shared. A variant must be intentional and documented, not a legacy style that happens to remain in a component.

### 2.6 Warm legacy tokens need a semantic inventory

The last UI palette pass remapped several legacy amber aliases to cold steel. However, the source still contains warm-toned semantic values in some components, such as weekly quest accents and certain type/difficulty palettes. Menu copy/comments also retain an older warm-paper / lantern description.

Not every warm hue is automatically wrong: danger, success, rarity or a world-state category can require distinct semantic colours. But decorative warm glow and warm UI surfaces should not return by accident.

**Direction:** define semantic tokens separately from decorative tokens. UI chrome uses graphite, steel, ice-blue and cold neutral text. Red/green/violet may remain for clearly defined status semantics. Any warm token must have a named semantic reason and pass the design review.

## 3. Target experience

Volodka should not be a dashboard placed over a 3D world. It should feel like a crafted single-player RPG whose interface supports both systemic play and intimate narrative scenes.

Design principles:

1. **One source of truth per information item.** A quest objective, location name, interaction prompt or status warning must not be independently repeated by competing widgets.
2. **State-aware density.** Exploration is quiet and world-led. Dialogue is cinematic and character-led. Combat is fast and legible. Inventory and journal are deliberate, readable workspaces.
3. **Persistent player intent.** Tracked quests, remapped controls, text scale, subtitles and accessibility preferences survive scene changes and reloads.
4. **Readable at a glance.** Primary action, player state and objective are obvious without reading a wall of labels.
5. **Narrative immersion is protected.** Nonessential checklists, debug badges, notification stacks and decorative effects disappear during emotional beats.
6. **Keyboard, mouse and touch are first-class.** Mobile is not a squeezed desktop layout; it has a deliberately authored information hierarchy.
7. **Cold visual identity.** Graphite / gunmetal / slate / ice-blue, restrained violet for mystery, cool neutral type. Glow is used sparingly and only to clarify interaction.

## 4. Target screen-state architecture

Create and maintain a screen-state matrix before changing component mounts.

| State | Primary UI | Suppressed UI |
|---|---|---|
| Main menu | title, continue/new game, settings/about, save preview | gameplay HUD, quest trackers, combat controls |
| Boot/loading | one progress story, clear recovery/retry | repeated percentage labels, redundant spinners |
| Exploration | compact player status, one objective tracker, contextual interaction, compact action bar | duplicate guidance, nonessential feed, permanent debug/status clutter |
| Examine/interact | focused examine panel, clear next action, world remains legible | objective checklist and competing contextual hints |
| Dialogue/story | speaker identity, readable text, choices, relationship/context only when meaningful | quest checklist, unrelated notifications, combat widgets |
| Cutscene | cinematic framing, subtitles, skip/hold controls | standard HUD and unrelated notifications |
| Combat | health/status, target, abilities/cooldowns, combat feedback | journal-like exploration guidance |
| Inventory/character | one coherent RPG workspace with tabs and clear selected-item details | competing floating HUD hints |
| Journal/quests | quest log, tracked objective, story history and discovered lore | world-navigation clutter |
| Minigame | self-contained game surface and one clear exit affordance | most gameplay HUD systems |

This is the intended contract, not a claim that the current implementation already conforms.

## 5. Work packages, in order

### UI-01 — Runtime screen inventory
- Capture the actual visible component tree for each state listed above.
- Record which conditions mount each widget: device class, game phase, narrative profile, combat, menu, examine, overlays and accessibility settings.
- Identify duplicate information and elements with no active producer/consumer.
- Produce a component ownership map and screen-state matrix.

**Acceptance:** every visible element has a named purpose, owner, source of data and suppression rule.

### UI-02 — Player information architecture
- Define player status, objective, interaction hint, navigation, action bar and notification ownership.
- Replace competing quest selection with one persisted trackedQuestId.
- Define what changes between desktop and touch while preserving shared player intent.
- Define what appears during combat, dialogue and cutscenes.

**Acceptance:** the same game state communicates the same information consistently on desktop and mobile.

### UI-03 — Visual system
- Establish tokens for colour, surface, typography, spacing, radius, border, elevation and motion.
- Establish components for buttons, tabs, cards, tooltips, lists, badges, item slots, dialogue choices and modal shells.
- Define icon rules and remove redundant neon/glow treatments.
- Preserve the established cold UI direction.

**Acceptance:** every main screen uses the same design primitives; exceptions are documented art direction, not accidental legacy CSS.

### UI-04 — Navigation, controls and accessibility
- Build a canonical action registry for keyboard/mouse and touch.
- Add remapping only after defaults are consistent and discoverable.
- Check focus order, focus return, modal traps, Escape/back behaviour and screen-reader labels.
- Support UI scale, readable subtitles and reduced motion.
- Verify minimum text sizes and colour contrast.

**Acceptance:** no keyboard dead ends, lost focus, overlapping controls or undiscoverable essential actions.

### UI-05 — First playable slice implementation
Implement in this order:
1. Main menu and new-game transition.
2. Exploration HUD in Volodka's room.
3. Examine / interact treatment.
4. Dialogue / cinematic choices.
5. Pause and core panels.
6. Corridor and kitchen continuation.
7. Touch layouts for the same states.

Do not redesign all panels at once. Use the room-to-corridor-to-kitchen slice as the acceptance environment.

### UI-06 — Visual QA and regression
Add visual baselines for actual gameplay, not just the main menu:
- desktop 1920×1080 and 1366×768;
- compact desktop 1280×720;
- mobile 390×844 and 360×800;
- tablet 768×1024;
- browser zoom 100% and 125%;
- exploration, examine, dialogue, inventory, journal, pause and combat.

The existing visual smoke test currently snapshots the menu. The new browser CI covers boot and WebGL canvas startup, but the full in-game visual state matrix still needs coverage.

**Acceptance:** screenshot differences are reviewed intentionally; no clipped, overlapping or inaccessible controls at supported viewports.

## 6. Priority register

| Priority | Finding | Required decision |
|---|---|---|
| P0 | No single documented screen-state contract | Define what is visible in every gameplay state |
| P0 | Desktop and touch quest tracking use different components and policies | One persisted quest selection model |
| P0 | Several presentation generations coexist | Establish one design system and controlled variants |
| P1 | Input actions are distributed across feature components | Canonical action registry and input map |
| P1 | Current visual regression baseline is mostly menu-focused | Add gameplay-state screenshots |
| P1 | Warm legacy colours and decorative effects remain in semantic palettes | Inventory and approve every remaining warm UI token |
| P2 | Motion and decorative effects need consistent restraint | Motion tokens and reduced-motion review |

## 7. Non-goals

- Do not replace the entire UI in one giant PR.
- Do not delete functional panels merely because the HUD should be quieter.
- Do not copy World of Warcraft or The Witcher pixel-for-pixel.
- Do not change world lighting when the task is UI colour.
- Do not add another floating objective, compass or help hint to solve a layout problem.
- Do not treat a passing build as evidence of visual quality.

## 8. Production definition

The UI is production-ready only when:
- every game state has an approved screen specification;
- one source owns each repeated data signal;
- the same intent and state persist across devices and scenes;
- all essential controls are discoverable and accessible;
- dialogues and cutscenes are free from unrelated HUD noise;
- screenshots pass at the supported viewport matrix;
- visual and interaction regressions are part of CI;
- there are no blocking focus, input, clipping, overlap or readability defects.

---

## Source files reviewed

- src/components/game/hud/ExplorationHUD.tsx
- src/components/game/hud/SceneTopBarHud.tsx
- src/components/game/hud/parts/ActiveQuestMiniTracker.tsx
- src/components/game/hud/parts/QuestObjectiveCard.tsx
- src/components/game/orchestrator/OrchestratorGameplaySections.tsx
- src/components/game/QuickUseBar.tsx
- src/components/game/PanelWrapper.tsx
- src/components/game/orchestrator/PanelStackContext.tsx
- src/components/game/menu/MenuScreenPanel.tsx
- src/shared/constants/uiTheme.ts
- e2e/visual-smoke.spec.ts
- e2e/smoke.spec.ts
