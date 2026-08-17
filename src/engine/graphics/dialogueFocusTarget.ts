/* ─── Volodka RPG – Dialogue Focus Target (singleton) ───
 *
 *  Module-level mutable singleton that tracks the world-space position of
 *  the NPC the player is currently in dialogue with. Used by the cinematic
 *  DepthOfField post-FX to smoothly transition focus onto the NPC.
 *
 *  React-safe: mutations don't trigger re-renders. Consumers read the value
 *  per-frame inside useFrameTick (cheap polling).
 *
 *  Lifecycle:
 *  - Set when `interaction:state_change` fires with state === Dialogue
 *    (the focus target is the NPC's group.position).
 *  - Cleared when the interaction ends (state === Exit or Idle).
 *  - Automatically cleared on scene transitions (the tracker component
 *    resets it on scene:enter / scene:transition_start).
 */

import { Vector3 } from 'three';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';

/** Read-only snapshot of the current focus target. */
export interface DialogueFocusSnapshot {
  /** Active NPC world position (cloned — safe to read without mutation). Returns null when no dialogue is active. */
  position: Vector3 | null;
  /** Whether a dialogue is currently active (state === Dialogue). */
  active: boolean;
  /** Monotonic counter — bumped every time the target changes. Lets consumers detect changes without deep-equal. */
  revision: number;
}

class DialogueFocusTargetStore {
  private cachedPosition: Vector3 | null = null;
  private active: boolean = false;
  private revision: number = 0;
  private npcId: string | null = null;

  /** Set the active dialogue focus target. Pass null to clear. */
  setActive(npcId: string | null): void {
    if (npcId === this.npcId && npcId !== null) return;
    this.npcId = npcId;
    this.active = npcId !== null;
    if (npcId) {
      const group = getNPCGroup(npcId);
      if (group) {
        if (!this.cachedPosition) this.cachedPosition = new Vector3();
        // World space — NPC roots may sit under scene transform parents.
        group.getWorldPosition(this.cachedPosition);
      } else {
        // NPC group not registered yet — keep position null, but stay active.
        this.cachedPosition = null;
      }
    } else {
      this.cachedPosition = null;
    }
    this.revision++;
  }

  /** Refresh the cached position from the live NPC group. Called per-frame by consumers.
   *  Returns true if the position was successfully refreshed. */
  refresh(): boolean {
    if (!this.active || !this.npcId) return false;
    const group = getNPCGroup(this.npcId);
    if (!group) return false;
    if (!this.cachedPosition) this.cachedPosition = new Vector3();
    group.getWorldPosition(this.cachedPosition);
    return true;
  }

  /** Read the current focus target. The returned Vector3 is a clone — safe to hold. */
  snapshot(): DialogueFocusSnapshot {
    return {
      position: this.cachedPosition ? this.cachedPosition.clone() : null,
      active: this.active,
      revision: this.revision,
    };
  }

  /** Direct read of the cached position (no clone — do NOT mutate).
   *  Returns null when no target is active or position hasn't been resolved yet. */
  peekPosition(): Vector3 | null {
    return this.cachedPosition;
  }

  isActive(): boolean {
    return this.active;
  }

  getNpcId(): string | null {
    return this.npcId;
  }

  /** Reset to inactive state — used on scene transitions. */
  clear(): void {
    if (!this.active && this.npcId === null) return;
    this.npcId = null;
    this.active = false;
    this.cachedPosition = null;
    this.revision++;
  }

  /** Exposed for tests — reset to pristine state. */
  resetForTests(): void {
    this.npcId = null;
    this.active = false;
    this.cachedPosition = null;
    this.revision = 0;
  }
}

/** Module-level singleton. */
export const dialogueFocusTarget = new DialogueFocusTargetStore();
