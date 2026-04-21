import type { MutableRefObject } from 'react';
import type { PlayerControls } from './playerControlsTypes';
import { DEFAULT_PLAYER_CONTROLS } from './playerControlsTypes';

const KEY_MAP: Record<string, keyof PlayerControls> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  Space: 'jump',
  KeyE: 'interact',
  KeyF: 'interact',
  Enter: 'interact',
};

/**
 * DOM keyboard → `PlayerControls` snapshot (no React state).
 * Virtual / touch controls merge at read time via `getMergedControls`.
 */
export class PlayerInputController {
  private readonly controls: PlayerControls = { ...DEFAULT_PLAYER_CONTROLS };
  private interactPressed = false;

  getMergedControls(
    virtualControlsRef?: MutableRefObject<Partial<PlayerControls>>,
  ): PlayerControls {
    const k = { ...this.controls };
    const v = virtualControlsRef?.current;
    if (!v) return k;
    const hasVirt = (Object.keys(v) as (keyof PlayerControls)[]).some((key) => v[key] === true);
    if (!hasVirt) return k;
    return {
      forward: k.forward || !!v.forward,
      backward: k.backward || !!v.backward,
      left: k.left || !!v.left,
      right: k.right || !!v.right,
      run: k.run || !!v.run,
      jump: k.jump || !!v.jump,
      interact: k.interact || !!v.interact,
    };
  }

  resetInteract(): void {
    this.controls.interact = false;
    this.interactPressed = false;
  }

  attachWindow(onInteractPress?: () => void): () => void {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) {
          return;
        }
      }
      const control = KEY_MAP[e.code];
      if (!control) return;
      if (e.repeat && control !== 'interact') return;
      if (control === 'interact') {
        if (!this.interactPressed) {
          this.controls.interact = true;
          this.interactPressed = true;
          if (onInteractPress) {
            try {
              onInteractPress();
            } finally {
              this.controls.interact = false;
            }
          }
        }
      } else {
        this.controls[control] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) {
          return;
        }
      }
      const control = KEY_MAP[e.code];
      if (!control) return;
      if (control === 'interact') {
        this.interactPressed = false;
      }
      this.controls[control] = false;
    };

    const onBlur = () => {
      Object.assign(this.controls, DEFAULT_PLAYER_CONTROLS);
      this.interactPressed = false;
    };

    const keyOpts: AddEventListenerOptions = { passive: true };
    window.addEventListener('keydown', onKeyDown, keyOpts);
    window.addEventListener('keyup', onKeyUp, keyOpts);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown, keyOpts);
      window.removeEventListener('keyup', onKeyUp, keyOpts);
      window.removeEventListener('blur', onBlur);
    };
  }
}
