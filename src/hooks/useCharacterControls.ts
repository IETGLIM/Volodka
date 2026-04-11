"use client";

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// ============================================
// ХУК ДЛЯ УПРАВЛЕНИЯ ПЕРСОНАЖЕМ (без физики)
// ============================================

interface CharacterControlsOptions {
  speed?: number;
  jumpForce?: number;
  rotationSpeed?: number;
}

interface CharacterState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  isGrounded: boolean;
}

export function useCharacterControls(
  _unused: unknown,
  options: CharacterControlsOptions = {}
) {
  const {
    speed = 4,
    rotationSpeed = 0.1,
  } = options;

  const keys = useRef<CharacterState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    isGrounded: true,
  });

  const movementDirection = useRef(new THREE.Vector3());
  const currentRotation = useRef(0);
  const velocity = useRef(new THREE.Vector3());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.current.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.current.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.current.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.current.moveRight = true;
        break;
      case 'Space':
        keys.current.jump = true;
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.current.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.current.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.current.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.current.moveRight = false;
        break;
      case 'Space':
        keys.current.jump = false;
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    keys,
    currentRotation,
    velocity,
    speed,
    rotationSpeed,
  };
}

// ============================================
// ХУК ДЛЯ УПРАВЛЕНИЯ КАМЕРОЙ (без физики)
// ============================================

interface CameraFollowOptions {
  distance?: number;
  height?: number;
  smoothness?: number;
  maxPitch?: number;
  minPitch?: number;
}

export function useCameraFollow(
  targetRef: React.RefObject<{ getPosition: () => { x: number; y: number; z: number } } | null>,
  options: CameraFollowOptions = {}
) {
  const {
    distance = 5,
    height = 2.5,
    smoothness = 0.1,
    maxPitch = Math.PI / 3,
    minPitch = Math.PI / 6,
  } = options;

  const cameraAngle = useRef({ yaw: 0, pitch: Math.PI / 4 });
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 0 || event.button === 2) {
      isMouseDown.current = true;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isMouseDown.current) return;

    const deltaX = event.clientX - lastMousePosition.current.x;
    const deltaY = event.clientY - lastMousePosition.current.y;

    cameraAngle.current.yaw -= deltaX * 0.005;
    cameraAngle.current.pitch += deltaY * 0.005;

    cameraAngle.current.pitch = Math.max(minPitch, Math.min(maxPitch, cameraAngle.current.pitch));

    lastMousePosition.current = { x: event.clientX, y: event.clientY };
  }, [maxPitch, minPitch]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove, handleContextMenu]);

  return {
    cameraAngle,
    isMouseDown,
  };
}

// ============================================
// ХУК ДЛЯ ПРОВЕРКИ ВЗАИМОДЕЙСТВИЙ
// ============================================

interface InteractionCheckResult {
  type: 'npc' | 'trigger' | 'item' | null;
  targetId: string | null;
  prompt: string | null;
}

export function useInteractionCheck(
  playerPosition: { x: number; y: number; z: number },
  npcs: Array<{ id: string; position: { x: number; y: number; z: number } }>,
  triggers: Array<{ id: string; position: { x: number; y: number; z: number }; promptText?: string }>,
  items: Array<{ id: string; position: { x: number; y: number; z: number } }>,
  interactionRadius: number = 2
): InteractionCheckResult {
  // Проверяем NPC
  for (const npc of npcs) {
    const dx = playerPosition.x - npc.position.x;
    const dz = playerPosition.z - npc.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < interactionRadius) {
      return {
        type: 'npc',
        targetId: npc.id,
        prompt: 'Нажмите E для разговора',
      };
    }
  }

  // Проверяем триггеры
  for (const trigger of triggers) {
    const dx = playerPosition.x - trigger.position.x;
    const dz = playerPosition.z - trigger.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < interactionRadius) {
      return {
        type: 'trigger',
        targetId: trigger.id,
        prompt: trigger.promptText || 'Нажмите E для взаимодействия',
      };
    }
  }

  // Проверяем предметы
  for (const item of items) {
    const dx = playerPosition.x - item.position.x;
    const dz = playerPosition.z - item.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < interactionRadius) {
      return {
        type: 'item',
        targetId: item.id,
        prompt: 'Нажмите E чтобы поднять',
      };
    }
  }

  return {
    type: null,
    targetId: null,
    prompt: null,
  };
}
