import { useEffect } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

export interface VolodkaRoomAnimationRefs {
  fanGroupRef: React.RefObject<THREE.Group | null>;
  ledRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  ledTimeRef: React.MutableRefObject<number>;
  terminalTexRef: React.MutableRefObject<THREE.CanvasTexture | null>;
  zabbixAlertRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  roomDoorRef: React.RefObject<THREE.Group | null>;
  roomWardrobeDoorRef: React.RefObject<THREE.Group | null>;
}

/** Interactive object toggles + desk/room animation tick for Volodka's room. */
export function useVolodkaRoomAnimations(refs: VolodkaRoomAnimationRefs): void {
  useEffect(() => {
    const unsub = eventBus.on('object:interact', (payload) => {
      if (payload.objectId === 'room_door' || payload.objectId === 'room_wardrobe') {
        useGameStore.getState().toggleInteractiveObject(payload.objectId);
      }
    });
    return unsub;
  }, []);

  useFrameTick('misc', ({ delta }) => {
    if (refs.fanGroupRef.current) {
      refs.fanGroupRef.current.rotation.y += delta * 4.0;
    }

    refs.ledTimeRef.current += delta;
    if (refs.ledRef.current) {
      const phase = (refs.ledTimeRef.current * 2) % 1;
      refs.ledRef.current.emissiveIntensity = phase < 0.15 ? 3.0 : 0.3;
    }

    if (refs.terminalTexRef.current) {
      refs.terminalTexRef.current.offset.y += delta * 0.04;
      if (refs.terminalTexRef.current.offset.y > 1.0) {
        refs.terminalTexRef.current.offset.y -= 1.0;
      }
    }
    if (refs.zabbixAlertRef.current) {
      const blink = (refs.ledTimeRef.current * 1.5) % 1;
      refs.zabbixAlertRef.current.emissiveIntensity = blink < 0.5 ? 3.2 : 0.4;
    }

    const states = useGameStore.getState().interactiveObjectStates;

    if (refs.roomDoorRef.current) {
      const doorOpen = states['room_door'] ?? false;
      const targetY = doorOpen ? -Math.PI / 2 : 0;
      refs.roomDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        refs.roomDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    if (refs.roomWardrobeDoorRef.current) {
      const wardrobeOpen = states['room_wardrobe'] ?? false;
      const targetY = wardrobeOpen ? Math.PI / 3 : 0;
      refs.roomWardrobeDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        refs.roomWardrobeDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }
  });
}
