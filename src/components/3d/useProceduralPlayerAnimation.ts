import { useRef, useEffect, type MutableRefObject, type RefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';

const STAND_UP_DURATION = 0.8;

export type ProceduralPlayerModelProps = {
  modelScale: number;
  karmaGlow: string;
  currentAnimRef: MutableRefObject<string>;
  rotationRef: MutableRefObject<number>;
};

export function useProceduralPlayerAnimation(
  groupRef: RefObject<THREE.Group | null>,
  rotationRef: MutableRefObject<number>,
  currentAnimRef: MutableRefObject<string>,
) {
  const animTimeRef = useRef(0);
  const bodyPartsRef = useRef<{
    head: THREE.Group | null;
    torso: THREE.Group | null;
    leftArm: THREE.Group | null;
    rightArm: THREE.Group | null;
    leftLeg: THREE.Group | null;
    rightLeg: THREE.Group | null;
  } | null>(null);

  const standUpPhaseRef = useRef(0);
  const standUpActiveRef = useRef(false);
  const isSeatedInitiallyRef = useRef(true);

  useEffect(() => {
    const unsub = eventBus.on('player:stand_up', () => {
      standUpActiveRef.current = true;
      standUpPhaseRef.current = 0;
      isSeatedInitiallyRef.current = false;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const store = useGameStore.getState();
    // If already in exploration mode on mount, skip seated pose entirely
    if (readGamePhase(store) === 'exploration') {
      if (isSeatedInitiallyRef.current) {
        isSeatedInitiallyRef.current = false;
        standUpPhaseRef.current = 1; // Skip to fully standing
      }
      return;
    }

    if (
      readGamePhase(store) === 'exploration' &&
      isSeatedInitiallyRef.current &&
      !standUpActiveRef.current
    ) {
      standUpActiveRef.current = true;
      standUpPhaseRef.current = 0;
      isSeatedInitiallyRef.current = false;
    }

    const unsub = useGameStore.subscribe((state) => {
      if (readGamePhase(state) === 'exploration' && isSeatedInitiallyRef.current && !standUpActiveRef.current) {
        standUpActiveRef.current = true;
        standUpPhaseRef.current = 0;
        isSeatedInitiallyRef.current = false;
      }
    });
    return unsub;
  }, []);

  useFrameTick('player', ({ delta }) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    groupRef.current.rotation.y = rotationRef.current;

    const animState = currentAnimRef.current;
    animTimeRef.current += dt;

    // Skip stand-up lerp when player already walks — avoids visual "hop" on first keypress
    if (
      standUpActiveRef.current &&
      (animState === 'walk' || animState === 'run')
    ) {
      standUpPhaseRef.current = 1;
      standUpActiveRef.current = false;
    }

    if (standUpActiveRef.current && standUpPhaseRef.current < 1) {
      standUpPhaseRef.current = Math.min(1, standUpPhaseRef.current + dt / STAND_UP_DURATION);
      if (standUpPhaseRef.current >= 1) {
        standUpActiveRef.current = false;
      }
    }

    if (!bodyPartsRef.current) {
      const body = groupRef.current;
      bodyPartsRef.current = {
        head: body.getObjectByName('head') as THREE.Group | null,
        torso: body.getObjectByName('torso') as THREE.Group | null,
        leftArm: body.getObjectByName('leftArm') as THREE.Group | null,
        rightArm: body.getObjectByName('rightArm') as THREE.Group | null,
        leftLeg: body.getObjectByName('leftLeg') as THREE.Group | null,
        rightLeg: body.getObjectByName('rightLeg') as THREE.Group | null,
      };
    }

    const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = bodyPartsRef.current;
    const t = animTimeRef.current;

    if (isSeatedInitiallyRef.current && !standUpActiveRef.current) {
      if (torso) {
        torso.position.y = 0.65;
        torso.rotation.x = 0.35;
      }
      if (head) {
        head.rotation.x = 0.25;
        head.rotation.z = 0;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.5;
        leftArm.rotation.z = 0.3;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.5;
        rightArm.rotation.z = -0.3;
      }
      if (leftLeg) leftLeg.rotation.x = -0.3;
      if (rightLeg) rightLeg.rotation.x = -0.3;
      return;
    }

    if (standUpActiveRef.current) {
      const p = standUpPhaseRef.current;
      const ease = 1 - Math.pow(1 - p, 3);

      if (torso) {
        torso.position.y = 0.65 + ease * 0.40;
        torso.rotation.x = 0.35 - ease * 0.29;
      }
      if (head) {
        head.rotation.x = 0.25 - ease * 0.21;
        head.rotation.z = 0;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.5 - ease * 0.5;
        leftArm.rotation.z = 0.3 - ease * 0.18;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.5 - ease * 0.5;
        rightArm.rotation.z = -0.3 + ease * 0.18;
      }
      if (leftLeg) leftLeg.rotation.x = -0.3 + ease * 0.3;
      if (rightLeg) rightLeg.rotation.x = -0.3 + ease * 0.3;
      return;
    }

    if (animState === 'jump' || animState === 'fall') {
      const airborne = animState === 'jump';
      const legTuck = airborne ? -0.45 : -0.15;
      const armRaise = airborne ? -0.35 : 0.15;

      if (torso) {
        torso.position.y = 1.05 + (airborne ? 0.04 : 0);
        torso.rotation.x = airborne ? -0.08 : 0.1;
      }
      if (leftArm) {
        leftArm.rotation.x = armRaise;
        leftArm.rotation.z = 0.15;
      }
      if (rightArm) {
        rightArm.rotation.x = armRaise;
        rightArm.rotation.z = -0.15;
      }
      if (leftLeg) leftLeg.rotation.x = legTuck;
      if (rightLeg) rightLeg.rotation.x = legTuck * 0.85;
      if (head) head.rotation.x = airborne ? -0.05 : 0.08;
    } else if (animState === 'combat') {
      const speed = 10;
      if (torso) {
        torso.position.y = 1.05 + Math.sin(t * speed) * 0.008;
        torso.rotation.x = 0.1 + Math.sin(t * speed * 0.5) * 0.04;
      }
      if (leftArm) {
        leftArm.rotation.x = -0.85 + Math.sin(t * speed) * 0.25;
        leftArm.rotation.z = 0.35;
      }
      if (rightArm) {
        rightArm.rotation.x = -0.55 + Math.sin(t * speed + Math.PI) * 0.2;
        rightArm.rotation.z = -0.25;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * speed * 0.5) * 0.08;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(t * speed * 0.5) * 0.08;
      if (head) {
        head.rotation.x = 0.08 + Math.sin(t * 3) * 0.04;
        head.rotation.z = Math.sin(t * 2) * 0.02;
      }
    } else if (animState === 'walk') {
      const speed = 8;
      const armSwing = 0.4;
      const legSwing = 0.4;
      const bobAmount = 0.018;

      if (torso) {
        torso.position.y = 1.05 + Math.abs(Math.sin(t * speed)) * bobAmount;
        torso.rotation.x = 0.06 + Math.sin(t * speed * 0.5) * 0.015;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * speed) * armSwing;
        leftArm.rotation.z = 0.12 + Math.sin(t * speed) * 0.03;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.sin(t * speed) * armSwing;
        rightArm.rotation.z = -0.12 - Math.sin(t * speed) * 0.03;
      }
      if (leftLeg) leftLeg.rotation.x = -Math.sin(t * speed) * legSwing;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * speed) * legSwing;
      if (head) {
        head.rotation.x = Math.sin(t * speed) * 0.02;
        head.rotation.z = Math.sin(t * speed * 0.5) * 0.015;
      }
    } else if (animState === 'run') {
      const speed = 12;
      const armSwing = 0.65;
      const legSwing = 0.6;
      const bobAmount = 0.022;

      if (torso) {
        torso.position.y = 1.05 + Math.abs(Math.sin(t * speed)) * bobAmount;
        torso.rotation.x = 0.12 + Math.sin(t * speed * 0.5) * 0.02;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * speed) * armSwing;
        leftArm.rotation.z = 0.18 + Math.sin(t * speed) * 0.05;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.sin(t * speed) * armSwing;
        rightArm.rotation.z = -0.18 - Math.sin(t * speed) * 0.05;
      }
      if (leftLeg) leftLeg.rotation.x = -Math.sin(t * speed) * legSwing;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * speed) * legSwing;
      if (head) {
        head.rotation.x = 0.05 + Math.sin(t * speed) * 0.03;
        head.rotation.z = Math.sin(t * speed * 0.5) * 0.01;
      }
    } else {
      if (torso) {
        torso.position.y = 1.05 + Math.sin(t * 2.0) * 0.012;
        torso.rotation.x = 0.06 + Math.sin(t * 1.5) * 0.018;
      }
      if (head) {
        head.rotation.x = 0.04 + Math.sin(t * 1.2) * 0.025;
        head.rotation.z = Math.sin(t * 0.8) * 0.03;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * 1.0) * 0.06;
        leftArm.rotation.z = 0.12 + Math.sin(t * 0.7) * 0.04;
      }
      if (rightArm) {
        rightArm.rotation.x = Math.sin(t * 1.0 + 0.5) * 0.06;
        rightArm.rotation.z = -0.12 - Math.sin(t * 0.7 + 0.3) * 0.04;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * 0.6) * 0.02;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * 0.6 + Math.PI) * 0.02;
    }
  });
}
