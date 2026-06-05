# Store Selectors

Centralized Zustand selectors and React hooks for `useGameStore`.

## When to use what

### Plain `useGameStore(selector)` — primitives only

Use for **scalar** values: `mode`, `karma`, `stress`, `currentSceneId`, `timeOfDay`.

Zustand compares with `Object.is`. No extra memoization needed.

```ts
const mode = useGameStore((s) => s.mode);
```

Or use `useGamePrimitive` from this module (same behavior, documents intent).

### `useGameSelector` — objects and arrays

Use when the selector returns an **object or array**, including:

- Store slices: `playerState`, `quests`, `inventory`, `npcRelations`
- **Derived** values: `.filter()`, `.map()`, `{ hp, maxHp }` composites
- **Multi-field** picks from one or more slices

Wraps `useShallow` so a new reference with the same shallow values does not re-render.

```ts
import { useGameSelector } from '@/store/selectors';

const vitals = useGameSelector((s) => ({
  energy: s.playerState.energy,
  stress: s.playerState.stress,
}));
```

### Named hooks — preferred in components

Prefer exported hooks (`useQuests`, `useFollowCameraState`, `useActiveQuests`) over inline selectors. They encode the memoization strategy once.

### Imperative getters — `getX()` / `selectX()`

For engine code and event handlers outside React:

- `selectQuests()`, `selectPlayerState()` — read current store reference
- `getActiveQuests()`, `getQuestsByType()` — derived getters with reference-keyed memo cache

## Adding a new selector

1. **Primitive** → `useGamePrimitive` in the matching `*Selectors.ts` file
2. **Store array/object** → `useGameSelector` hook
3. **Derived array/object** → `useGameSelector` with transform, or `memoizeBySourceRef` for `getX()` helpers
4. **Multi-slice bundle** → `compositeSelectors.ts`
5. **Stable store actions** → `actionSelectors.ts` (`useSetMode`, `useSaveGame`, …)
6. Re-export from `index.ts`

## Composite hooks (hot paths)

| Hook | Used by |
|------|---------|
| `useOrchestratorOverlay` | GameOrchestrator |
| `useHUDExploration` / `useHUDPlayerVitals` | HUD |
| `useInteractionOverlay` | InteractiveTriggers |
| `useFollowCameraState` | FollowCamera |
| `useDialogueContext` | DialogueRenderer |
| `useStoryContext` | StoryRenderer |
| `useStatusEffectsContext` | StatusEffectsBar, PlayerStatsPanel |
| `useMiniMapState` | MiniMap |
| `useWeatherEffectsInput` | useWeatherEffects |
| `useJournalShell` | JournalPanel |
