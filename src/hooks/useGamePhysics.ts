"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// PHYSICS CONSTANTS
// ============================================

export const PHYSICS_CONSTANTS = {
  // Скорости
  WALK_SPEED: 3.5,
  RUN_SPEED: 6.0,
  
  // Размеры игрока
  PLAYER_HEIGHT: 1.8,
  PLAYER_RADIUS: 0.4,
  
  // Физика
  GRAVITY: -20,
  JUMP_FORCE: 8,
  GROUND_FRICTION: 0.1,
  AIR_FRICTION: 0.05,
  
  // Камера
  CAMERA_DISTANCE: 5,
  CAMERA_HEIGHT: 2,
  CAMERA_SMOOTHING: 0.1,
};

// ============================================
// PLAYER CONTROLS INTERFACE
// ============================================

export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
  interact: boolean;
}

const DEFAULT_CONTROLS: PlayerControls = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  interact: false,
};

// ============================================
// KEY MAPPINGS
// ============================================

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

// ============================================
// usePlayerControls HOOK
// ============================================

export interface UsePlayerControlsOptions {
  /**
   * Вызывается синхронно при первом нажатии клавиши взаимодействия (E / F / Enter).
   * После вызова флаг `interact` сбрасывается внутри хука — опрос через `setInterval` не нужен.
   */
  onInteractPress?: () => void;
}

export function usePlayerControls(options?: UsePlayerControlsOptions) {
  const controlsRef = useRef<PlayerControls>({ ...DEFAULT_CONTROLS });
  const interactPressedRef = useRef(false);
  const onInteractPressRef = useRef(options?.onInteractPress);
  onInteractPressRef.current = options?.onInteractPress;
  const [, forceUpdate] = useState({});

  // Получение текущего состояния контроллов
  const getControls = useCallback(() => {
    return { ...controlsRef.current };
  }, []);

  // Сброс флага взаимодействия
  const resetInteract = useCallback(() => {
    controlsRef.current.interact = false;
    interactPressedRef.current = false;
  }, []);

  // Обработка нажатия клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const control = KEY_MAP[e.code];
      if (control) {
        // Для interact используем флаг, чтобы не срабатывать многократно
        if (control === 'interact') {
          if (!interactPressedRef.current) {
            controlsRef.current[control] = true;
            interactPressedRef.current = true;
            const immediate = onInteractPressRef.current;
            if (immediate) {
              try {
                immediate();
              } finally {
                controlsRef.current.interact = false;
                // interactPressedRef остаётся true до keyup — иначе автоповтор keydown вызовет колбэк снова
              }
            }
            forceUpdate({});
          }
        } else {
          controlsRef.current[control] = true;
          forceUpdate({});
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const control = KEY_MAP[e.code];
      if (control) {
        if (control === 'interact') {
          interactPressedRef.current = false;
        }
        controlsRef.current[control] = false;
        forceUpdate({});
      }
    };

    // Сброс при потере фокуса окна
    const handleBlur = () => {
      controlsRef.current = { ...DEFAULT_CONTROLS };
      interactPressedRef.current = false;
      forceUpdate({});
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    getControls,
    resetInteract,
  };
}

// ============================================
// usePhysicsState HOOK
// ============================================

export interface PhysicsState {
  isGrounded: boolean;
  velocity: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}

export function usePhysicsState() {
  const [state, setState] = useState<PhysicsState>({
    isGrounded: true,
    velocity: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
  });

  const updateState = useCallback((updates: Partial<PhysicsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setVelocity = useCallback((x: number, y: number, z: number) => {
    setState(prev => ({ ...prev, velocity: { x, y, z } }));
  }, []);

  const setPosition = useCallback((x: number, y: number, z: number) => {
    setState(prev => ({ ...prev, position: { x, y, z } }));
  }, []);

  const setGrounded = useCallback((isGrounded: boolean) => {
    setState(prev => ({ ...prev, isGrounded }));
  }, []);

  return {
    state,
    updateState,
    setVelocity,
    setPosition,
    setGrounded,
  };
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default usePlayerControls;
