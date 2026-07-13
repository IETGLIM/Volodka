import { useEffect, useId, useRef } from 'react';
import type * as THREE from 'three';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

/** Procedural limb animation — same bone group names as Quaternius/Mixamo retarget targets. */
export function useProceduralNpcLimbAnimation(
  groupRef: React.RefObject<THREE.Group | null>,
  animState: NPCAnimationState,
  bodyLeanX = 0.06,
  torsoBaseY = 1.05,
  enabled = true,
) {
  const tickOwner = useId();
  const animTimeRef = useRef(0);
  const animStateRef = useRef(animState);
  /** null = not yet resolved; false = not found (skip future lookups); Group = found */
  const bodyPartsRef = useRef<{
    head: THREE.Group | null | false;
    torso: THREE.Group | null | false;
    leftArm: THREE.Group | null | false;
    rightArm: THREE.Group | null | false;
    leftLeg: THREE.Group | null | false;
    rightLeg: THREE.Group | null | false;
  } | null>(null);

  useEffect(() => {
    animStateRef.current = animState;
  }, [animState]);

  useRegisterNpcFrame(tickOwner, 'procedural', ({ delta }) => {
    if (!groupRef.current || !enabled) return;
    const dt = Math.min(delta, 0.05);
    animTimeRef.current += dt;
    const t = animTimeRef.current;
    const body = groupRef.current;
    const currentAnimState = animStateRef.current;

    if (!bodyPartsRef.current) {
      bodyPartsRef.current = {
        head: body.getObjectByName('head') as THREE.Group | null ?? false,
        torso: body.getObjectByName('torso') as THREE.Group | null ?? false,
        leftArm: body.getObjectByName('leftArm') as THREE.Group | null ?? false,
        rightArm: body.getObjectByName('rightArm') as THREE.Group | null ?? false,
        leftLeg: body.getObjectByName('leftLeg') as THREE.Group | null ?? false,
        rightLeg: body.getObjectByName('rightLeg') as THREE.Group | null ?? false,
      };
    }

    // Extract valid body parts (skip 'false' = not found, skip null = not yet resolved)
    const head = bodyPartsRef.current.head || null;
    const torso = bodyPartsRef.current.torso || null;
    const leftArm = bodyPartsRef.current.leftArm || null;
    const rightArm = bodyPartsRef.current.rightArm || null;
    const leftLeg = bodyPartsRef.current.leftLeg || null;
    const rightLeg = bodyPartsRef.current.rightLeg || null;

    if (currentAnimState === 'walk') {
      const speed = 8;
      if (torso) {
        torso.position.y = torsoBaseY + Math.abs(Math.sin(t * speed)) * 0.018;
        torso.rotation.x = bodyLeanX + Math.sin(t * speed * 0.5) * 0.015;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * speed) * 0.4;
        leftArm.rotation.z = 0.12 + Math.sin(t * speed) * 0.03;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.sin(t * speed) * 0.4;
        rightArm.rotation.z = -0.12 - Math.sin(t * speed) * 0.03;
      }
      if (leftLeg) leftLeg.rotation.x = -Math.sin(t * speed) * 0.4;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * speed) * 0.4;
      if (head) {
        head.rotation.x = Math.sin(t * speed) * 0.02;
        head.rotation.z = Math.sin(t * speed * 0.5) * 0.015;
      }
    } else if (currentAnimState === 'talk' || currentAnimState === 'gesture') {
      const gestureBoost = currentAnimState === 'gesture' ? 1.35 : 1;
      if (torso) {
        torso.position.y = torsoBaseY + Math.sin(t * 2.0) * 0.004;
        torso.rotation.x = bodyLeanX * 0.5 + Math.sin(t * 1.5) * 0.01;
      }
      if (head) {
        head.rotation.x = Math.sin(t * 3.0) * 0.03;
        head.rotation.z = Math.sin(t * 1.8) * 0.02;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * 1.2) * 0.05;
        leftArm.rotation.z = 0.12 + Math.sin(t * 0.7) * 0.02;
      }
      if (rightArm) {
        rightArm.rotation.x = -0.5 + Math.sin(t * 2.5) * 0.2 * gestureBoost;
        rightArm.rotation.z = -0.2 + Math.sin(t * 2.5) * 0.1 * gestureBoost;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * 0.6) * 0.01;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * 0.6 + Math.PI) * 0.01;
    } else if (currentAnimState === 'sit') {
      if (torso) {
        torso.position.y = torsoBaseY - 0.35 + Math.sin(t * 1.5) * 0.003;
        torso.rotation.x = bodyLeanX * 0.3 + 0.25;
      }
      if (head) {
        head.rotation.x = Math.sin(t * 1.0) * 0.015;
        head.rotation.z = Math.sin(t * 0.6) * 0.01;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.55;
        leftArm.rotation.z = 0.2;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.55;
        rightArm.rotation.z = -0.2;
      }
      if (leftLeg) leftLeg.rotation.x = -1.1;
      if (rightLeg) rightLeg.rotation.x = -1.1;
    } else if (currentAnimState === 'work') {
      // Working: leaning forward, arms moving (typing / crafting)
      const workSpeed = 4.5;
      if (torso) {
        torso.position.y = torsoBaseY - 0.08 + Math.sin(t * 1.2) * 0.003;
        torso.rotation.x = bodyLeanX * 0.6 + 0.18 + Math.sin(t * workSpeed * 0.3) * 0.02;
      }
      if (head) {
        head.rotation.x = 0.12 + Math.sin(t * workSpeed * 0.5) * 0.025;
        head.rotation.z = Math.sin(t * 0.7) * 0.01;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.7 + Math.sin(t * workSpeed) * 0.15;
        leftArm.rotation.z = 0.15;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.7 + Math.sin(t * workSpeed + Math.PI * 0.6) * 0.15;
        rightArm.rotation.z = -0.15;
      }
      if (leftLeg) leftLeg.rotation.x = -0.15;
      if (rightLeg) rightLeg.rotation.x = -0.15;
    } else if (currentAnimState === 'sleep') {
      // Sleeping: lying down, slow breathing
      const breathSpeed = 1.2;
      if (torso) {
        torso.position.y = torsoBaseY - 0.7 + Math.sin(t * breathSpeed) * 0.005;
        torso.rotation.x = 0.9 + Math.sin(t * breathSpeed * 0.5) * 0.01;
      }
      if (head) {
        head.rotation.x = 0.3;
        head.rotation.z = Math.sin(t * 0.3) * 0.02;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.2;
        leftArm.rotation.z = 0.4;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.2;
        rightArm.rotation.z = -0.4;
      }
      if (leftLeg) leftLeg.rotation.x = 0.1;
      if (rightLeg) rightLeg.rotation.x = 0.1;
    } else if (currentAnimState === 'listen') {
      if (torso) {
        torso.position.y = torsoBaseY + Math.sin(t * 1.2) * 0.003;
        torso.rotation.x = bodyLeanX + 0.04;
      }
      if (head) {
        head.rotation.x = 0.08 + Math.sin(t * 0.9) * 0.012;
        head.rotation.z = Math.sin(t * 0.5) * 0.008;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.08;
        leftArm.rotation.z = 0.1;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.08;
        rightArm.rotation.z = -0.1;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * 0.4) * 0.008;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * 0.4 + Math.PI) * 0.008;
    } else {
      // idle (default) — gentle sway
      if (torso) {
        torso.position.y = torsoBaseY + Math.sin(t * 2.0) * 0.004;
        torso.rotation.x = bodyLeanX + Math.sin(t * 1.5) * 0.008;
      }
      if (head) {
        head.rotation.x = Math.sin(t * 1.2) * 0.01;
        head.rotation.z = Math.sin(t * 0.8) * 0.015;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * 1.0) * 0.03;
        leftArm.rotation.z = 0.12 + Math.sin(t * 0.7) * 0.02;
      }
      if (rightArm) {
        rightArm.rotation.x = Math.sin(t * 1.0 + 0.5) * 0.03;
        rightArm.rotation.z = -0.12 - Math.sin(t * 0.7 + 0.3) * 0.02;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * 0.6) * 0.01;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * 0.6 + Math.PI) * 0.01;
    }
  }, { enabled });
}
