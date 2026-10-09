# Volodka RPG — Deep Analysis Report Part 3

Generated: 2025-07-12
Scope: UI/HUD, Dialogue, Quest, Story, Save/Load, Performance, i18n, Security, Browser Compatibility, Assets

---

## 1. UI/HUD System

### 1.1 Current State

The HUD system is **extremely mature and layered**, comprising:

- **SceneTopBarHud** (`src/components/game/hud/SceneTopBarHud.tsx`) — Unified top-bar cluster with:
  - Scene context chip (top-left: scene type, NPC count, exits)
  - Scrolling data ticker (top-center: quest/poem/time)
  - Karma tier badge, karma ring, level badge, compass, exploration progress (top-right)
  - Session pedometer, play timer, player coordinates (bottom-left)
- **ExplorationHUD** (`src/components/game/hud/ExplorationHUD.tsx`) — Full-viewport diegetic overlay with 25+ sub-components:
  - Crosshair, proximity glow, distance ring, cooldown ring, radar pulse, interactable sparkle
  - Quest direction arrow, objective beacon, NPC proximity indicator, loot proximity indicator
  - Chromatic edge effect (stress/energy reactive), rain screen effect, sprint drain overlay
  - Combat pre-engagement warning, dynamic crosshair, world marker system, immersive guide
  - Quest objective card, quest chain unlock toast, objective complete VFX
  - HUD boot sequence, ambient particles, ambient overlay, vignette
- **Minimap** (`src/components/game/MinimapComponent.tsx`) — Canvas-rendered rotating circular minimap with:
  - NPC disposition dots (green/red/yellow), quest markers, scene exits, breadcrumb trail
  - Radar sweep, quality gating, IntersectionObserver pause, DPR-aware, toggle via M key
- **60+ HUD parts** in `src/components/game/hud/parts/` — DamageFloatSystem, combo counter, buff/debuff tracker, weather icon, achievement popup, environmental effects, etc.
- **Separate panels**: Inventory (virtualized grid, keyboard navigation), Journal (7 tabs), Quest Board (daily/weekly missions with reset timers), Poetry Book (tabs + typewriter), Poetry Composition (minigame), Photo Mode, NPC Relationship, NPC Portrait, Perks, Player Stats, Level Up, Level Up Summary, Quest Accept Dialog, Notification Toasts, Menu (settings, about, save preview, navigation)

### 1.2 Discovered Problems

#### 🔴 Critical

None.

#### 🟠 High

1. **Misspelled Russian text in DamageFloatSystem** — `src/components/game/hud/parts/DamageFloatSystem.tsx`
   - Line 450: `'PROMAX!'` — Should be `'ПРОМАХ!'` (Latin "PROMAX" instead of Russian "ПРОМАХ" = miss)
   - Line 452: `'COПPOTИВЛЕНИЕ'` — Mixed Latin/Cyrillic: Latin "C" (U+0043) and "P" (U+0050) mixed with Cyrillic letters. Should be `'СОПРОТИВЛЕНИЕ'` (pure Cyrillic U+0421, U+041F)
   - These render as garbled text to Russian-speaking players

2. **HUDController uses `scheduleTimeout(fn, 0)` pattern excessively** — `src/components/game/hud/useHUDController.ts`
   - Lines 181-187, 197-199, 209-211, 222-225, 233-237: Multiple `scheduleTimeout(fn, 0)` calls for state transitions like karma/energy/stress pulse and level-up. Each creates a `setTimeout(..., 0)` adding up to 10+ pending timers per stat change.
   - Not a bug, but creates unnecessary microtask overhead.

#### 🟡 Medium

3. **FocusTrap in DialogueHistoryPanel not wrapping content properly** — `src/components/game/dialogue/DialogueHistoryPanel.tsx:189-245`
   - The `<FocusTrap>` wraps the search input and list but the close button (line 201) is rendered outside the FocusTrap, making it unreachable by Tab navigation when the dialog is focused.

4. **No dedicated achievements panel component** — `src/components/game/achievements/` directory does not exist.
   - The HUDProps type (`hudTypes.ts:24`) declares `onOpenAchievements` but no panel exists to render.
   - Achievement data is tracked and saved (saveSchema.ts:249-267) with an achievement popup in the HUD, but there is no full achievement gallery/browsable list.

5. **Missing `aria-label` on quest badge in HUD types** — `HUDButton` component uses `tooltip ?? label` but the quest notification count badge (from `useHUDController`) does not pass an explicit `aria-label` when rendered as a badge-only element.

#### 🟢 Low

6. **HUD part files have inconsistent `as any` casts in framer-motion variants** — `DamageFloatSystem.tsx:334, 358, 384, 407` — Multiple `Record<string, any>` and `as any` casts. These bypass TypeScript checks on animation variants.

7. **SceneTopBarHud condition `energy <= 30` vs ExplorationHUD condition `energy < 25`** — The low-energy threshold is inconsistent between components (30 vs 25). This means the status whisper and the StatPulse fire at different energy levels.

### 1.3 Mobile Responsiveness

- **Good**: SceneTopBarHud hides compact widgets (KarmaRing, LevelBadge, CompassIndicator) behind `hidden sm:flex` on mobile (line 92). QuestObjectiveCard is hidden on mobile (`isMobile` gate). Minimap has separate mobile sizing (120px vs 160px).
- **Touch controls**: Virtual joystick (`useVirtualJoystick.ts`) uses a module-level reactive store with touch event handling. `useTouchDevice.ts` detects touch support.
- **Mobile HUD layout**: `hud-mobile-responsive.css` exists. QuickInventoryBar in `src/components/hud/` and ScenePoiCompass for mobile compass.
- **Gap**: No pinch-to-zoom on the minimap canvas. No haptic feedback API usage for mobile interactions.

### 1.4 Potential Improvements

1. Fix the Cyrillic/Latin mixed text bugs (see above)
2. Close button inside FocusTrap in DialogueHistoryPanel
3. Build an achievements gallery panel
4. Unify low-energy threshold across HUD components
5. Consider a HUD element budget — with 25+ simultaneously mounted HUD parts, there is risk of React render overhead
6. Add gamepad navigation support to more panels (currently only combat and exploration have gamepad integration)

---

## 2. Dialogue System

### 2.1 Current State

- **Data layer**: 13 dialogue data files in `src/data/dialogue/` organized by story part (part1 through part5, each with expanded variants), plus milestone, return, and exploration dialogues.
- **Node type**: `DialogueNode` with `speaker`, `speakerId`, `text`, `choices` (each with `text`, `next`, `effects`, optional `condition`). Effects include: `addSkill`, `addStat`, `npcChange`, `showThought`, `visitStoryNode`, `addItem`, `addKarma`, etc.
- **Conditional choices**: Dialogue choices support `condition: { flag: 'met_albert' }` pattern — choices only appear when a game flag is set.
- **Consequences**: Every dialogue choice is logged via `dispatchGameAction({ type: 'player/logChoice' })`. Moral-weighted choices (affecting karma/NPC relations) are additionally logged as moral choices.
- **UI components**: DialogueRelationBar (animated relationship bar with thresholds), DialogueHistoryPanel (searchable log of last 100 entries, color-coded by speaker type), DiceRollDisplay.
- **Choice execution**: `narrativeChoiceExecutor.ts` implements double-click guard via `queueMicrotask`, handles scene transitions, explore hub navigation, and diegetic vs overlay narrative presentation.

### 2.2 Discovered Problems

#### 🟡 Medium

1. **No dialogue tree validation for dead-end nodes** — While story nodes have graph validation (`validateStoryNodeGraph`), dialogue nodes don't have an equivalent runtime check. A dialogue node where all choices lead to `null` (ending conversation) with no explicit "exit" choice could leave the player unable to progress.

2. **Dialogue part2-expanded and part3-expanded not included in data/dialogue/index.ts** — The expanded dialogue files (part2-npcs-expanded.ts, part3-mid-expanded.ts, etc.) ARE imported (lines 10-14 of index.ts), so this is actually fine. No issue.

#### 🟢 Low

3. **DialogueHistoryPanel FocusTrap scope** — Mentioned in section 1.2.

4. **No dialogue branching visualization** — There's no debug/developer tool to visualize the dialogue tree graph. For a project with 13+ dialogue files and hundreds of nodes, this would aid content authoring.

### 2.3 Potential Improvements

1. Add dialogue graph validation (similar to story node validation) to catch dead-end branches
2. Add a dialogue tree visualizer for development
3. Consider adding dialogue timing/speed settings (some players may want faster text)

---

## 3. Quest System

### 3.1 Current State

- **Data**: 11 quest data files covering acts 1–7, side quests, phase 5 side quests, Solnysh quests, AAA expansion quests, expansion stubs, and expansion hub quests. Plus CHK (ЧК Толпа) quests.
- **Engine**: `questPresentation.ts`, `questTimeLimits.ts`, `questCompletionFeedback.ts`, `questAcceptDialogConstants.ts`, `questAcceptDialogPresentation.ts`, `firstReadingCelebrationContent.ts` — handles quest display, time limits, accept dialog presentation, and celebration content.
- **Dependencies**: Quest dependency resolution in `src/shared/quest/questDependencies.ts` with failed-quest bypass logic (`questFailureBypass.ts`). Failed quests with `canRetry: false` don't permanently lock downstream quests.
- **Retry system**: `src/shared/quest/questRetry.ts` handles quest retry logic.
- **Tracking hook**: `useQuestTracker.ts` initializes the QuestTracker engine on mount and tears down on unmount, with HMR cleanup support.
- **UI**: Quest Board panel with tabs, mission cards, progress bars, reset timers. Quest Accept Dialog with NPC portrait, objective rows, reward rows. Active Quest Mini Tracker on HUD. Quest Direction Arrow and Objective Beacon for navigation.

### 3.2 Discovered Problems

#### 🟡 Medium

1. **Quest dependency check uses `.find()` on array** — `src/shared/quest/questDependencies.ts:18`
   - `quests.find((q) => q.questId === reqId)` — Linear scan for each prerequisite. For large quest lists this is O(n*m). Not a problem at current scale (~50 quests) but won't scale.

2. **Quest board mission reset timer** — `src/components/game/questBoard/useMissionResetTimer.ts` and `useMissionResetProgress.ts` — These handle daily/weekly mission resets. No issue found, but `acceptedDailyMissions` in the save schema uses `z.array(z.unknown())` (saveSchema.ts:335), which means daily mission data is not validated on load.

#### 🟢 Low

3. **Quest tracker lifecycle** — `useQuestTracker` uses `void preloadGameData().then(...)` which could fail silently if `preloadGameData` rejects. The catch only logs a dev warning (line 25), which is correct behavior for non-critical initialization.

### 3.3 Potential Improvements

1. Validate `acceptedDailyMissions` with a proper Zod schema instead of `z.unknown()`
2. Use a Map for quest lookup instead of array `.find()`
3. Add quest chain visualization in the journal

---

## 4. Content and Story

### 4.1 Current State

- **7-act story structure** plus epilogue, CHK Tolpa expansion, Solnysh storyline, and location-specific storylines (pier, library, factory, resistance)
- **~25 story data files** organized by act with expanded variants, room-expanded content, quiet hour scenes, and side quest storylines
- **Story node registry** built by `buildStoryNodes()` which merges 25+ sources with collision detection in dev mode. Intentional overrides are tracked in `INTENTIONAL_STORY_NODE_OVERRIDES`.
- **Dev-time validation**: Story node graph validation runs on import in dev mode (`src/data/story/index.ts:7-30`), checking for broken `next` references.
- **Narrative pack registry**: Lazy-loading system (`src/data/narrative/narrativePackRegistry.ts`) that loads story/dialogue packs on demand. Bootstrap loads only Act 1 + early NPC dialogue. Remaining packs are prefetched during idle time via `requestIdleCallback`.
- **Expansion content**: Stub files for expansion quests, items, lore, and poems in `src/data/expansion/`
- **CHK Tolpa content**: Separate location with its own NPCs, story nodes (basic + extended), dialogues, quests, trigger zones, and schedules

### 4.2 Discovered Problems

#### 🟡 Medium

1. **Story node collision detection logs warnings but doesn't prevent overwrite** — `buildStoryNodes.ts:85-88` — Later sources silently overwrite earlier nodes when not in the intentional override list. This could mask content bugs where two acts define the same node ID.

2. **`ensureNarrativeNodeIds` loads packs sequentially, not in parallel** — `narrativePackRegistry.ts:379-396` — When ensuring multiple node IDs (e.g., on save load for journal display), it uses `Promise.all` over IDs but each ID triggers sequential pack loading internally (pack A loads, check, pack B loads, check...). This is correct to avoid unnecessary loading but could be slow for edge cases.

#### 🟢 Low

3. **Story node `choice.next` pointing to a dialogue-only ID** — `ensureStoryNode` will throw if a story choice references a dialogue-only node ID. The dialogue pack loaders are not checked in the story node resolution path (`ensureStoryNode`, line 344-361). The catch in `prefetchStoryNodes` (line 417) silently ignores this, but the main `ensureStoryNode` throws.

### 4.3 Potential Improvements

1. Make story node collisions throw in production (not just dev) for non-override cases
2. Add a story node graph visualization tool for content authors
3. Consider preloading Act 2 story packs during Act 1 gameplay to eliminate potential load hitch

---

## 5. Save/Load System

### 5.1 Current State

- **Storage**: localStorage-only (no IndexedDB). Keys: `volodka_save` (primary), `volodka_save_backup` (backup), `volodka_save_slot_{0-2}` (manual slots).
- **Two-phase write with rollback**: `writeSaveToLocalStorage()` first backs up the current valid save, writes the new save, then verifies it passes Zod validation. If verification fails, it rolls back to the previous save.
- **Load-time recovery**: `resolveSaveFromStorage()` tries primary → backup → reports both errors. Corrupt keys are never deleted (manual recovery possible).
- **Zod validation schema** (`saveSchema.ts`): Comprehensive schema with 50+ fields, discriminated union for stackable/non-stackable items, bounded numbers, enum validations, scene ID validation against `SCENE_IDS`.
- **Migration system** (`saveMigrations.ts`): Sequential version-based migrations. Currently at version 4 with an empty migration table (all migrations handled by Zod defaults).
- **Save payload**: Automatically derived from Zod schema keys — adding a new field requires only adding it to the schema and its default in `createDefaultPersistedState()`.
- **Guard conditions**: Save is blocked during cutscenes, combat, and NPC interaction (lines 86-98 of saveSlice.ts).
- **Cross-tab sync**: `subscribeSavePresence` uses both `StorageEvent` and internal event bus for same-tab reactivity.

### 5.2 Discovered Problems

#### 🟠 High

1. **localStorage size limit** (~5-10 MB depending on browser) — With the current save schema including arrays of inventory items, quest states, lore entries, conversation logs, thought history, notification history, and achievement progress, large playthroughs could approach the localStorage limit. There is no size-check before writing.
   - File: `src/store/slices/saveStorage.ts:81` (`localStorage.setItem(SAVE_KEY, json)`)
   - A `QuotaExceededError` would be caught by the outer try/catch (line 130), but the error message "Запись сохранения прервана" doesn't tell the player their storage is full.

#### 🟡 Medium

2. **Migration table is empty despite being at version 4** — `saveMigrations.ts:11-13` — The `MIGRATIONS` record has no entries. This means saves from version 0-3 are "migrated" by simply incrementing `saveVersion` without any actual field transformations. This works because Zod defaults fill in new fields, but it means:
   - No data transformation is possible (e.g., if a field's semantics changed)
   - The migration system is vestigial

3. **`acceptedDailyMissions` saved as `z.array(z.unknown())`** — `saveSchema.ts:335` — No validation of daily mission structure. Corrupt mission data would be loaded silently.

4. **No save data compression** — With conversation logs and thought history growing unbounded, the JSON string could become large. No size limit or pruning.

#### 🟢 Low

5. **`playTimeSeconds` is optional in save payload** — `saveSchema.ts:373` — This means play time could be lost on save/load if not explicitly tracked.

### 5.3 Potential Improvements

1. Add save data size check before write with player-facing "storage full" error
2. Add conversation log and thought history pruning (keep last N entries)
3. Consider migrating to IndexedDB for larger save capacity
4. Add actual migration steps for version transitions
5. Validate `acceptedDailyMissions` with proper schema

---

## 6. Performance and Optimization

### 6.1 Current State

- **Runtime budget monitor** (`RuntimeBudgetMonitor.ts`): Tracks FPS, CPU frame time, physics step time, draw calls per scene, React renders per frame, and Zustand notifications per frame. Emits violations at warn/fail severity levels. Dev-only console warnings for fail-level violations every 5 seconds.
- **GPU resource budget tracker** (`GpuResourceBudgetTracker.ts`): Tracks estimated GPU memory (geometry + texture bytes), geometry count, texture count, and memory drift (leak detection) across scene changes.
- **Dynamic DPR scaling** (`useDynamicDPR.ts`): Ring-buffer FPS measurement → adaptive DPR adjustment with stabilization (consecutive windows required before changing). Prevents DPR oscillation.
- **Device tier detection** (`useDeviceTier.ts`): Uses `navigator.deviceMemory`, `hardwareConcurrency`, `pointer: coarse`, and `connection.saveData` to classify devices as low/medium/high. Controls intro FX, post-processing, and other visual fidelity.
- **Staggered mount** (`useStaggeredMountCount.ts`): Reveals deferred 3D objects one at a time via `requestIdleCallback` to prevent GLB decode stampede on scene enter.
- **Web Worker** (`worldCompute.worker.ts`): Off-main-thread world chunk diff computation. Rapier physics stays on main thread (requirement of @react-three/rapier). Worker client handles lifecycle (create, terminate, revive for React StrictMode).
- **Narrative pack lazy loading**: Bootstrap loads only Act 1. Remaining packs loaded on demand or prefetched during idle via `requestIdleCallback`.
- **Texture caching**: `useSharedTexture` and `useCachedCanvasTexture` provide ref-counted GPU texture sharing across scene remounts with quality-change cleanup.
- **Inventory virtualization**: Uses `@tanstack/react-virtual` for large inventories (threshold: configurable).
- **Minimap IntersectionObserver**: Pauses canvas rAF loop when off-screen.

### 6.2 Discovered Problems

#### 🟡 Medium

1. **Module-level FPS sample array in RuntimeBudgetMonitor** — `RuntimeBudgetMonitor.ts:40` — `const fpsSamples: number[] = []` is module-level, which means it persists across HMR and potentially between page navigation in SPA. The array is bounded by `PERFORMANCE_BUDGETS.fps.sampleFrames` but the initial fill period (first 30 samples) may produce false violation reports.

2. **Worker error handling missing close paren** — `worldCompute.worker.ts:65` — `Unknown worker op: ${String(requestOp)}` is missing the closing paren: should be `${String(requestOp)}`. This would cause a runtime error if an unknown op is sent to the worker.

3. **useDeviceTier uses `navigator.connection.saveData` which is deprecated** — `useDeviceTier.ts:15` — The Network Information API's `saveData` property is deprecated in some browsers. No fallback for browsers that don't support it.

#### 🟢 Low

4. **`useDynamicDPR` buffer is re-allocated on every effect** — `useDynamicDPR.ts:76` — `frameBuffer.current = new Array(capacity)` creates a new array on every mount/re-render cycle. The old array contents are lost, causing a brief measurement gap.

5. **No WebGL context loss handling** — No `webglcontextlost` / `webglcontextrestored` event listeners found. If the browser kills the WebGL context (common on mobile with many tabs), the game would not recover.

### 6.3 Potential Improvements

1. Add WebGL context loss handling
2. Fix the worker error message syntax error
3. Consider profiling React render counts per frame in production (currently dev-only warnings)
4. Add memory pressure API integration for proactive cleanup

---

## 7. Localization / i18n

### 7.1 Current State

- **Single locale**: Russian (`ru`) only. `GameLocale` type is literally `'ru'`.
- **i18n infrastructure**: `src/i18n/index.ts` — Simple key-fallback system: `t(key, fallback) → MESSAGES[locale][key] ?? fallback`.
- **Message file**: `src/i18n/messages/ru.ts` — Contains 44 ambient description strings (cafe, office, park, library, street, home, factory, basement, rooftop, corridor, combat, rain, snow, pier) with label, description, and accessibility variants.
- **UI text**: The vast majority of UI text is hardcoded Russian strings directly in components, NOT using the i18n system. The `t()` function appears to be used only for ambient audio descriptions.

### 7.2 Discovered Problems

#### 🟡 Medium

1. **i18n system is vestigial** — Only 44 ambient strings use the `t()` function. All other UI text (~1000+ strings across HUD, menus, dialogs, inventory, journal, etc.) is hardcoded Russian. Adding a new language would require finding and extracting every hardcoded string.

2. **No string externalization for game content** — Story node text, dialogue text, quest titles/descriptions, item names/descriptions, lore entries — all are Russian strings embedded directly in TypeScript data files.

#### 🟢 Low

3. **`setLocaleForTests` is the only way to change locale** — No runtime locale switching for players.

### 7.3 Potential Improvements

1. If internationalization is ever planned, the scope is massive — 1000+ strings need extraction
2. The i18n infrastructure exists but is essentially unused — either commit to i18n or remove the dead code
3. At minimum, extract all HUD/menu strings to the i18n system for consistency

---

## 8. Security

### 8.1 Current State

- **No XSS vulnerabilities found**: Only one `dangerouslySetInnerHTML` usage in `ScreenEffects.tsx:181-204`, and it injects purely hardcoded CSS keyframe definitions — no user-derived content.
- **No exposed credentials**: The `password`/`secret`/`token` matches found in the codebase are all in game narrative data (lore, story text, dialogue) — in-game fiction, not real credentials.
- **No exposed ports or server endpoints**: The project is a client-side SPA with no API routes or server listeners.
- **Save data validation**: Zod schema validates all loaded save data. Malformed saves are rejected with clear Russian error messages.
- **Input sanitization**: Scene IDs are sanitized via `sanitizeExplorationSceneId()`. NPC states are validated per-field via `validateNpcState()`.

### 8.2 Discovered Problems

#### 🟢 Low

1. **`eval()` or `Function()` usage** — None found. Good.
2. **No Content Security Policy headers** — Not configured in Vite config. Since this is a client-side game loaded from a server, CSP headers should be set at the deployment level (Vercel/Netlify/etc.).
3. **`robots.txt` exists** at `public/robots.txt` — Good practice for a deployed game.

### 8.3 Potential Improvements

1. Add CSP headers in deployment configuration
2. Consider adding `integrity` attributes to loaded WASM files (draco, rapier, basis) for SRI protection

---

## 9. Browser Compatibility

### 9.1 Current State

- **`requestIdleCallback` usage**: Used in 10 files for idle-time work scheduling (narrative pack prefetching, staggered GLB mounting, NPC portrait generation, Mixamo clip loading). All usages have `setTimeout` fallbacks.
- **Touch support**: `useTouchDevice.ts` detects touch via `'ontouchstart' in window || navigator.maxTouchPoints > 0`. Virtual joystick module for touch input.
- **`devicePixelRatio`**: Used in minimap canvas rendering with fallback `?? 1`.
- **`WebkitBackdropFilter`**: Minimap uses both `backdropFilter` and `WebkitBackdropFilter` for Safari compatibility.
- **`navigator.deviceMemory`**: Used in device tier detection with `??` fallback.
- **`navigator.connection`**: Used (deprecated `saveData` property) with optional chaining.
- **Web Workers**: Used for world chunk computation with `type: 'module'` worker instantiation.
- **`IntersectionObserver`**: Used for minimap rAF pause and likely other visibility-gating.

### 9.2 Discovered Problems

#### 🟡 Medium

1. **No `requestIdleCallback` polyfill** — While all usages have setTimeout fallbacks, the code uses `typeof requestIdleCallback !== 'undefined'` checks. Safari added `requestIdleCallback` only in Safari 17.2 (late 2023). Older Safari versions will use the setTimeout fallback, which is fine but less optimal.

2. **No Safari-specific WebGL workarounds** — Safari has known issues with WebGL power preference handling and certain texture formats. No Safari-specific code paths found.

3. **`navigator.hardwareConcurrency` used without fallback validation** — `useDeviceTier.ts:13` — This API returns `undefined` in some privacy-focused browsers. The `?? 4` fallback handles this, but the value could also be `0` on some systems, which would incorrectly classify as low-tier.

#### 🟢 Low

4. **No `ResizeObserver` polyfill** — `ResizeObserver` is used in inventory grid column detection and likely elsewhere. It's well-supported in modern browsers but lacks a polyfill for very old ones.

5. **No passive event listener optimization** — Some event listeners (e.g., in `useHUDController.ts:260-266` for mousedown/touchstart) don't specify `{ passive: true }` even though they don't call `preventDefault()`. This prevents browser scroll optimization.

### 9.3 Potential Improvements

1. Add `{ passive: true }` to non-cancelling event listeners
2. Consider a `requestIdleCallback` polyfill for older Safari
3. Test and potentially add Safari-specific WebGL workarounds
4. Add `navigator.hardwareConcurrency` zero-value guard

---

## 10. Assets

### 10.1 Current State

- **Total asset size**: ~133.7 MB across 272 files in `public/`
- **HDR environment maps**: 3 files (moonlit_golf_2k.hdr at 6.7 MB, abandoned_parking_1k.hdr at 1.6 MB, lebombo_1k.hdr at 1.5 MB)
- **GLB models**: ~200+ files organized as:
  - Characters: Player (volodka) with LOD 0-2, LOD 0 also in meshopt and draco variants
  - NPCs: ~20 unique NPCs, each with base + LOD 1-2 + meshopt + draco variants (up to 5 files per NPC)
  - NPC rigs: 12 Mixamo rig files (male_01 through male_11, female_01 through female_09)
  - Interiors: 7 scenes (cafe, office, library, rooftop, corridor, basement, pier, factory, forest_clearing, apartment_envelope) in glb + meshopt + draco
  - Props: ~15 unique props + citykit items (bench, campfire, chair, coffee machine, etc.)
  - PolyHaven: ~20 high-quality PBR models (furniture, urban props, gothic elements)
  - Environments: Cafe props with LOD 0-2
  - Animations: 6 Mixamo animation files (idle, walking, sitting, talking, working, sleeping)
  - Vegetation: Pine tree LOD 0
- **Textures**: PolyHaven PBR texture sets (asphalt, concrete, metal, plastered wall, wood floor) at 1K and 2K resolutions in WebP format
- **WASM binaries**: Rapier physics (1.5 MB), Basis universal transcoder, Draco decoder
- **Art assets**: Menu art (boot.webp, hero-bg.webp, portrait-*.webp), icon.svg, og-image.svg
- **Texture management**: `useSharedTexture` (ref-counted GPU texture sharing) and `useCachedCanvasTexture` (ref-counted canvas texture with quality-change cleanup) prevent duplicate texture uploads.

### 10.2 Discovered Problems

#### 🟠 High

1. **Largest HDR is 6.7 MB** — `public/hdri/moonlit_golf_2k.hdr` — This file is loaded at runtime for environment lighting. No evidence of async/lazy loading or progressive resolution. The 2K suffix suggests it's already reduced, but 6.7 MB is still large for initial load.

2. **Duplicate interior models** — `public/models/interiors/cafe_interior.glb` exists alongside `cafe_interior.meshopt.glb` and `cafe_interior.draco.glb`. Same for `corridor.glb` (appears 3 times: plain, meshopt, draco). This is likely intentional (quality tiers) but means 3× storage for each scene.

#### 🟡 Medium

3. **No evidence of texture compression beyond WebP** — Textures are in WebP format which is good, but no BCn/KTX2 compressed textures found. For WebGL, GPU-compressed textures (Basis/KTX2) would reduce VRAM usage and load time.

4. **12 Mixamo rig files at ~800 KB each** — `public/models/npcs/_rigs/` — These are full Mixamo character models used as animation source rigs. They appear to be loaded for animation retargeting. ~9.6 MB total for rigs that are never rendered.

5. **No asset size budget enforcement** — There's no build-time check that prevents adding large assets. The `gpuResourceBaselineBridge.ts` tracks runtime GPU usage but there's no CI/CD check for asset bundle size.

#### 🟢 Low

6. **`public/placeholder.png`** — A single placeholder file exists, suggesting some assets may be unfininshed or using placeholders.

7. **Basis transcoder WASM** — `public/basis/basis_transcoder.wasm` — Present but no evidence of .basis/.ktx2 texture files actually using it. May be dead weight.

### 10.3 Potential Improvements

1. Consider converting HDRIs to a compressed format or lazy-loading them
2. Audit Mixamo rig files — can animation clips be pre-extracted to avoid loading full rigs?
3. Add CI asset size budget checks
4. Consider using KTX2/Basis compressed textures for PBR materials
5. Implement texture streaming (load low-res first, upgrade to high-res when needed)

---

## Bug List (Sorted by Criticality)

### 🔴 Critical

*(None found)*

### 🟠 High

| # | Bug | File | Line(s) |
|---|-----|------|----------|
| 1 | "PROMAX!" — Latin text instead of Russian "ПРОМАХ!" | `src/components/game/hud/parts/DamageFloatSystem.tsx` | 450 |
| 2 | "COПPOTИВЛЕНИЕ" — Mixed Latin/Cyrillic instead of "СОПРОТИВЛЕНИЕ" | `src/components/game/hud/parts/DamageFloatSystem.tsx` | 452 |
| 3 | No localStorage quota check before save — save silently fails on QuotaExceededError | `src/store/slices/saveStorage.ts` | 81 |
| 4 | 6.7 MB HDR loaded without lazy/async strategy | `public/hdri/moonlit_golf_2k.hdr` | — |

### 🟡 Medium

| # | Bug | File | Line(s) |
|---|-----|------|----------|
| 5 | Close button outside FocusTrap in DialogueHistoryPanel | `src/components/game/dialogue/DialogueHistoryPanel.tsx` | 189-245 |
| 6 | No achievements gallery panel despite HUDProps declaring `onOpenAchievements` | `src/components/game/hud/hudTypes.ts:24`, missing `achievements/` dir | — |
| 7 | Worker error message missing closing parenthesis | `src/workers/worldCompute.worker.ts` | 65 |
| 8 | `acceptedDailyMissions` saved as `z.array(z.unknown())` — no validation | `src/shared/validation/saveSchema.ts` | 335 |
| 9 | Inconsistent low-energy thresholds (30 vs 25) across HUD components | `SceneTopBarHud.tsx:43`, `ExplorationHUD.tsx:266` | — |
| 10 | Story node collisions silently overwrite in production | `src/data/story/buildStoryNodes.ts` | 85-88 |
| 11 | No WebGL context loss handling | — | — |
| 12 | i18n system used for only 44/1000+ strings | `src/i18n/messages/ru.ts`, all components | — |

### 🟢 Low

| # | Bug | File | Line(s) |
|---|-----|------|----------|
| 13 | Multiple `as any` casts in framer-motion variants | `DamageFloatSystem.tsx` | 334,358,384,407 |
| 14 | Module-level fpsSamples array not reset on HMR | `RuntimeBudgetMonitor.ts` | 40 |
| 15 | useDynamicDPR buffer re-allocated on every mount | `useDynamicDPR.ts` | 76 |
| 16 | `navigator.hardwareConcurrency` could return 0 | `useDeviceTier.ts` | 13 |
| 17 | Non-passive event listeners prevent scroll optimization | `useHUDController.ts` | 260-266 |
| 18 | Basis transcoder WASM may be unused dead weight | `public/basis/` | — |
| 19 | `placeholder.png` suggests incomplete assets | `public/placeholder.png` | — |

---

## Summary

The Volodka RPG codebase demonstrates **exceptional depth** across all analyzed areas. The HUD system is production-quality with 60+ components, the save system has robust two-phase-write with backup recovery and Zod validation, the narrative system spans 7 acts with lazy-loaded packs, and the performance infrastructure includes frame budgets, GPU tracking, dynamic DPR, device tier detection, and web workers.

**Most impactful issues to fix:**
1. The two Cyrillic/Latin text bugs in DamageFloatSystem (quick fix, high visibility)
2. localStorage quota handling for saves
3. FocusTrap scope in DialogueHistoryPanel
4. Worker error message syntax error
5. WebGL context loss recovery