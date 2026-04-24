"use client";

import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PHYSICS_CONSTANTS } from '@/engine/physics/constants';
import { PlayerInputController } from '@/engine/input/InputController';
import type { PlayerControls } from '@/engine/input/playerControlsTypes';

export { PHYSICS_CONSTANTS };
export type { PlayerControls };

export interface UsePlayerControlsOptions {
  onInteractPress?: () => void;
  virtualControlsRef?: MutableRefObject<Partial<PlayerControls>>;
}

export function usePlayerControls(options?: UsePlayerControlsOptions) {
  const controllerRef = useRef<PlayerInputController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = new PlayerInputController();
  }
  const onInteractPress = options?.onInteractPress;
  const onInteractPressRef = useRef(onInteractPress);
  const virtualControlsRef = options?.virtualControlsRef;

  useEffect(() => {
    onInteractPressRef.current = onInteractPress;
  }, [onInteractPress]);

  const getControls = useCallback(() => {
    return controllerRef.current!.getMergedControls(virtualControlsRef);
  }, [virtualControlsRef]);

  const resetInteract = useCallback(() => {
    controllerRef.current?.resetInteract();
  }, []);

  useEffect(() => {
    const ctrl = controllerRef.current!;
    return ctrl.attachWindow(() => {
      onInteractPressRef.current?.();
    });
  }, []);

  return {
    getControls,
    resetInteract,
  };
}

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

export default usePlayerControls;
