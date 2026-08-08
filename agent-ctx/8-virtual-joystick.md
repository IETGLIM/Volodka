# Task 8: Virtual Joystick for Mobile Touch Controls

## Files Created

1. **`src/hooks/useVirtualJoystick.ts`** — Joystick state hook + module-level reactive store
   - `joystickStore`: module-level singleton with `getState()`, `set()`, `reset()`, `subscribe()`
   - `useVirtualJoystick()`: React hook for reactive state (UI re-renders on change)
   - Zero re-render path for engine: import `joystickStore` directly, call `getState()` in useFrame

2. **`src/components/game/VirtualJoystick.tsx`** — Visual joystick component
   - Floating circle (140px outer ring) on bottom-left of screen
   - Inner thumb (56px) follows finger within circular boundary
   - Dead zone (4px), pointer capture for reliable tracking
   - Multi-touch safe: tracks only one pointer ID
   - CSS transition spring-back on release (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
   - Cyberpunk aesthetic: cyan glass morphism, radial gradients, backdrop blur
   - Subtle pulse glow animation (respects `prefers-reduced-motion`)
   - Haptic feedback on touch (Vibration API)
   - Reset on blur/visibility change (matches ExplorationMobileHud pattern)
   - z-index 42 (UI_LAYERS.MOBILE_CONTROLS)
   - Hidden on desktop via `useTouchDevice()`
   - Direct DOM manipulation for zero-lag thumb during drag
   - ARIA labels in Russian (matches game locale)

3. **`src/engine/player/virtualJoystickBridge.ts`** — Engine integration bridge
   - Subscribes to `joystickStore` changes
   - Maps joystick X/Y → `sharedVirtualControlsRef.current` (forward/backward/left/right/moveMagnitude)
   - Y-axis inversion: screen-up → forward, screen-down → backward
   - Analog magnitude support: partial deflection = slower movement
   - Respects `areSharedVirtualControlsWritable()` gate (overlay lock, scene transitions)
   - `startVirtualJoystickBridge()` / `stopVirtualJoystickBridge()` lifecycle

## Files Modified

4. **`src/components/game/orchestrator/OrchestratorGameplaySections.tsx`**
   - Added imports: VirtualJoystick, startVirtualJoystickBridge, stopVirtualJoystickBridge
   - Added `GameplayVirtualJoystick` memo component (starts/stops bridge on mount/unmount)
   - Gated on `isMobile` + `isExplorationHudProfile(profile)` (same as D-pad)

5. **`src/components/game/orchestrator/OrchestratorGameplayLayer.tsx`**
   - Added `GameplayVirtualJoystick` import and rendered it in the gameplay tree

6. **`src/components/game/ExplorationMobileHud.tsx`**
   - Added `dpadOwnedAxesRef` to track which axes the D-pad currently/recently owned
   - Modified `syncMovementControls` to only zero axes the D-pad owns (not joystick axes)
   - Modified `bindPointerControl` to register axis ownership
   - Modified `releasePointerControl` to defer axis ownership release via rAF
   - Modified `resetAllControls` to clear dpadOwnedAxesRef
   - **Purpose**: Prevents D-pad sync from wiping joystick input when user presses jump while dragging joystick

## Architecture

```
Touch finger → VirtualJoystick (pointer events)
  → joystickStore.set(x, y, active)
    → virtualJoystickBridge subscriber
      → sharedVirtualControlsRef.current (VirtualControls)
        → sampleHeldVirtualControls() in useFrame
          → resolveMovementIntent() merges keyboard + virtual
            → runMainPlayerMovement() applies velocity
```

The joystick coexists with the existing D-pad: the D-pad manages jump/run/interact/action buttons while the joystick provides analog directional input. An axis ownership system prevents the two input sources from conflicting.
