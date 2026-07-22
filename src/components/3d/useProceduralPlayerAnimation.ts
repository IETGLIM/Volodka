import { useRef, useEffect, type MutableRefObject, type RefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';

const STAND_UP_DURATION = 0.8;

// ── Blend-speed constants (frame-rate-independent exponential damping) ──
// 1 - exp(-speed * dt) ≈ time to reach ~63% of target; 3× speed ≈ 95% in 1/speed seconds
const ANIM_BLEND_TO_MOVE = 8;    // ~0.125s to 63%, ~0.2s to 95% — snappy start
const ANIM_BLEND_TO_IDLE = 5;    // ~0.3s to 95% — slightly slower for natural deceleration
const ANIM_BLEND_TO_RUN = 6;     // ~0.17s walk→run
const ANIM_BLEND_TO_AIRBORNE = 10; // fast airborne entry
const ANIM_BLEND_JUMP_VS_FALL = 10; // fast jump↔fall within airborne
const ANIM_BLEND_TO_COMBAT = 8;  // ~0.2s combat entry

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

  // ── Smooth blend weights for locomotion state transitions ──
  // Each ref smoothly transitions between 0 and 1 using exponential damping.
  // The hierarchy: idle ← locomotion (walk/run ↔ combat) ← airborne (jump ↔ fall)
  const locomotionBlendRef = useRef(0);   // 0 = idle, 1 = walk/run/combat
  const runBlendRef = useRef(0);          // 0 = walk, 1 = run (sub-blend within locomotion)
  const airborneBlendRef = useRef(0);     // 0 = grounded, 1 = airborne (jump/fall)
  const jumpBlendRef = useRef(0);         // 0 = fall, 1 = jump (sub-blend within airborne)
  const combatBlendRef = useRef(0);       // 0 = walk/run, 1 = combat (sub-blend within locomotion)

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

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  SEATED INITIALLY — hard-switch pose (before stand-up)      ║
    // ╚══════════════════════════════════════════════════════════════╝
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

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  STAND-UP ANIMATION — eased lerp from seated to upright     ║
    // ╚══════════════════════════════════════════════════════════════╝
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

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  CUTSCENE STATES — hard-switching, externally controlled    ║
    // ║  These return early and do NOT update blend weights so      ║
    // ║  that transitions out of cutscenes stay smooth.             ║
    // ╚══════════════════════════════════════════════════════════════╝

    if (animState === 'sitting') {
      // Seated pose: torso lowered, legs bent forward at hip and knee,
      // arms resting on lap. Subtle breathing + occasional head tilt.
      const breathe = Math.sin(t * 1.6) * 0.012;
      if (torso) {
        torso.position.y = 0.62 + breathe;
        torso.rotation.x = 0.18 + Math.sin(t * 0.9) * 0.015;
      }
      if (head) {
        head.rotation.x = 0.08 + Math.sin(t * 0.7) * 0.025;
        head.rotation.y = Math.sin(t * 0.4) * 0.04;
      }
      if (leftArm) {
        leftArm.rotation.x = -0.35 + Math.sin(t * 0.6) * 0.03;
        leftArm.rotation.z = 0.22;
      }
      if (rightArm) {
        rightArm.rotation.x = -0.32 + Math.sin(t * 0.6 + 0.5) * 0.03;
        rightArm.rotation.z = -0.22;
      }
      if (leftLeg) leftLeg.rotation.x = -1.15;
      if (rightLeg) rightLeg.rotation.x = -1.15;
      return;
    }

    if (animState === 'sleeping') {
      // Lying-down pose: torso horizontal, limbs relaxed. Used during the
      // wake-up cutscene's 'terminal' and 'rise' phases when the player
      // is still in bed. Slow breathing cycle.
      const breathe = Math.sin(t * 0.8) * 0.008;
      if (torso) {
        torso.position.y = 0.18 + breathe;
        torso.rotation.x = 1.45; // nearly horizontal (lying on back)
      }
      if (head) {
        head.rotation.x = -0.05;
        head.rotation.z = Math.sin(t * 0.3) * 0.02;
      }
      if (leftArm) {
        leftArm.rotation.x = 0.15 + Math.sin(t * 0.5) * 0.02;
        leftArm.rotation.z = 0.08;
      }
      if (rightArm) {
        rightArm.rotation.x = 0.12 + Math.sin(t * 0.5 + 0.4) * 0.02;
        rightArm.rotation.z = -0.08;
      }
      if (leftLeg) leftLeg.rotation.x = 0.05;
      if (rightLeg) rightLeg.rotation.x = 0.05;
      return;
    }

    if (animState === 'talking') {
      // Standing talking: idle base + conversational hand gestures.
      const gesture = Math.sin(t * 2.4);
      if (torso) {
        torso.position.y = 1.05 + Math.sin(t * 1.8) * 0.01;
        torso.rotation.x = 0.04 + Math.sin(t * 1.2) * 0.015;
        torso.rotation.y = Math.sin(t * 0.6) * 0.03;
      }
      if (head) {
        head.rotation.x = 0.02 + Math.sin(t * 1.5) * 0.02;
        head.rotation.y = Math.sin(t * 0.5) * 0.05;
      }
      if (leftArm) {
        leftArm.rotation.x = -0.25 + gesture * 0.18;
        leftArm.rotation.z = 0.22;
      }
      if (rightArm) {
        rightArm.rotation.x = -0.35 - gesture * 0.22;
        rightArm.rotation.z = -0.18;
      }
      if (leftLeg) leftLeg.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      return;
    }

    if (animState === 'working') {
      // Typing/working: torso leaned forward, arms extended to keyboard.
      const typeCycle = Math.sin(t * 8.0);
      if (torso) {
        torso.position.y = 1.0 + Math.sin(t * 1.8) * 0.008;
        torso.rotation.x = 0.22;
      }
      if (head) {
        head.rotation.x = 0.18 + Math.sin(t * 0.9) * 0.02;
      }
      if (leftArm) {
        leftArm.rotation.x = -0.85 + typeCycle * 0.05;
        leftArm.rotation.z = 0.32;
      }
      if (rightArm) {
        rightArm.rotation.x = -0.88 - typeCycle * 0.05;
        rightArm.rotation.z = -0.32;
      }
      if (leftLeg) leftLeg.rotation.x = -0.15;
      if (rightLeg) rightLeg.rotation.x = -0.15;
      return;
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  LOCOMOTION BLENDING SYSTEM                                 ║
    // ║  Smoothly blends between idle ↔ walk ↔ run ↔ combat ↔      ║
    // ║  airborne (jump ↔ fall) using hierarchical blend weights.   ║
    // ║                                                             ║
    // ║  Blend hierarchy:                                           ║
    // ║    grounded = idle ← locomotion (walk/run ↔ combat)         ║
    // ║    final    = grounded ← airborne (jump ↔ fall)             ║
    // ║                                                             ║
    // ║  All oscillation timing (t) is continuous — no phase reset  ║
    // ║  on state change.                                           ║
    // ╚══════════════════════════════════════════════════════════════╝

    // ── Determine target blend values from current animState ──
    const isMoving = animState === 'walk' || animState === 'run' || animState === 'combat';
    const isRunning = animState === 'run';
    const isAirborne = animState === 'jump' || animState === 'fall';
    const isJumping = animState === 'jump';
    const isCombat = animState === 'combat';

    const targetLocomotion = isMoving ? 1 : 0;
    const targetRun = isRunning ? 1 : 0;
    const targetAirborne = isAirborne ? 1 : 0;
    const targetJump = isJumping ? 1 : 0;
    const targetCombat = isCombat ? 1 : 0;

    // ── Exponential damping: frame-rate-independent interpolation ──
    const blendT = (speed: number) => 1 - Math.exp(-speed * dt);

    // Locomotion: slower deceleration (to idle), snappier acceleration (to move)
    const locomotionSpeed = targetLocomotion > locomotionBlendRef.current
      ? ANIM_BLEND_TO_MOVE
      : ANIM_BLEND_TO_IDLE;
    locomotionBlendRef.current = THREE.MathUtils.lerp(
      locomotionBlendRef.current, targetLocomotion, blendT(locomotionSpeed)
    );

    runBlendRef.current = THREE.MathUtils.lerp(
      runBlendRef.current, targetRun, blendT(ANIM_BLEND_TO_RUN)
    );

    airborneBlendRef.current = THREE.MathUtils.lerp(
      airborneBlendRef.current, targetAirborne, blendT(ANIM_BLEND_TO_AIRBORNE)
    );

    jumpBlendRef.current = THREE.MathUtils.lerp(
      jumpBlendRef.current, targetJump, blendT(ANIM_BLEND_JUMP_VS_FALL)
    );

    combatBlendRef.current = THREE.MathUtils.lerp(
      combatBlendRef.current, targetCombat, blendT(ANIM_BLEND_TO_COMBAT)
    );

    // Clamp to [0, 1] for safety
    const locomotion = Math.max(0, Math.min(1, locomotionBlendRef.current));
    const run = Math.max(0, Math.min(1, runBlendRef.current));
    const airborne = Math.max(0, Math.min(1, airborneBlendRef.current));
    const jump = Math.max(0, Math.min(1, jumpBlendRef.current));
    const combat = Math.max(0, Math.min(1, combatBlendRef.current));

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  COMPUTE PER-STATE POSE VALUES                              ║
    // ║  Each state's oscillating values are computed with the       ║
    // ║  same continuous time `t` — no phase reset on transitions.  ║
    // ╚══════════════════════════════════════════════════════════════╝

    // ── IDLE pose (breathing + gentle sway) ──
    const idleTorsoPosY = 1.05 + Math.sin(t * 2.0) * 0.012;
    const idleTorsoRotX = 0.06 + Math.sin(t * 1.5) * 0.018;
    const idleHeadRotX = 0.04 + Math.sin(t * 1.2) * 0.025;
    const idleHeadRotZ = Math.sin(t * 0.8) * 0.03;
    const idleLeftArmRotX = Math.sin(t * 1.0) * 0.06;
    const idleLeftArmRotZ = 0.12 + Math.sin(t * 0.7) * 0.04;
    const idleRightArmRotX = Math.sin(t * 1.0 + 0.5) * 0.06;
    const idleRightArmRotZ = -0.12 - Math.sin(t * 0.7 + 0.3) * 0.04;
    const idleLeftLegRotX = Math.sin(t * 0.6) * 0.02;
    const idleRightLegRotX = Math.sin(t * 0.6 + Math.PI) * 0.02;

    // ── WALK pose ──
    const walkSpeed = 8;
    const walkArmSwing = 0.4;
    const walkLegSwing = 0.4;
    const walkBobAmount = 0.018;

    const walkTorsoPosY = 1.05 + Math.abs(Math.sin(t * walkSpeed)) * walkBobAmount;
    const walkTorsoRotX = 0.06 + Math.sin(t * walkSpeed * 0.5) * 0.015;
    const walkLeftArmRotX = Math.sin(t * walkSpeed) * walkArmSwing;
    const walkLeftArmRotZ = 0.12 + Math.sin(t * walkSpeed) * 0.03;
    const walkRightArmRotX = -Math.sin(t * walkSpeed) * walkArmSwing;
    const walkRightArmRotZ = -0.12 - Math.sin(t * walkSpeed) * 0.03;
    const walkLeftLegRotX = -Math.sin(t * walkSpeed) * walkLegSwing;
    const walkRightLegRotX = Math.sin(t * walkSpeed) * walkLegSwing;
    const walkHeadRotX = Math.sin(t * walkSpeed) * 0.02;
    const walkHeadRotZ = Math.sin(t * walkSpeed * 0.5) * 0.015;

    // ── RUN pose ──
    const runSpeed = 12;
    const runArmSwing = 0.65;
    const runLegSwing = 0.6;
    const runBobAmount = 0.022;

    const runTorsoPosY = 1.05 + Math.abs(Math.sin(t * runSpeed)) * runBobAmount;
    const runTorsoRotX = 0.12 + Math.sin(t * runSpeed * 0.5) * 0.02;
    const runLeftArmRotX = Math.sin(t * runSpeed) * runArmSwing;
    const runLeftArmRotZ = 0.18 + Math.sin(t * runSpeed) * 0.05;
    const runRightArmRotX = -Math.sin(t * runSpeed) * runArmSwing;
    const runRightArmRotZ = -0.18 - Math.sin(t * runSpeed) * 0.05;
    const runLeftLegRotX = -Math.sin(t * runSpeed) * runLegSwing;
    const runRightLegRotX = Math.sin(t * runSpeed) * runLegSwing;
    const runHeadRotX = 0.05 + Math.sin(t * runSpeed) * 0.03;
    const runHeadRotZ = Math.sin(t * runSpeed * 0.5) * 0.01;

    // ── COMBAT pose ──
    const combatSpeed = 10;

    const combatTorsoPosY = 1.05 + Math.sin(t * combatSpeed) * 0.008;
    const combatTorsoRotX = 0.1 + Math.sin(t * combatSpeed * 0.5) * 0.04;
    const combatLeftArmRotX = -0.85 + Math.sin(t * combatSpeed) * 0.25;
    const combatLeftArmRotZ = 0.35;
    const combatRightArmRotX = -0.55 + Math.sin(t * combatSpeed + Math.PI) * 0.2;
    const combatRightArmRotZ = -0.25;
    const combatLeftLegRotX = Math.sin(t * combatSpeed * 0.5) * 0.08;
    const combatRightLegRotX = -Math.sin(t * combatSpeed * 0.5) * 0.08;
    const combatHeadRotX = 0.08 + Math.sin(t * 3) * 0.04;
    const combatHeadRotZ = Math.sin(t * 2) * 0.02;

    // ── JUMP pose (airborne ascending) ──
    const jumpTorsoPosY = 1.05 + 0.04; // slightly elevated
    const jumpTorsoRotX = -0.08;       // slight lean back
    const jumpLeftArmRotX = -0.35;     // arms raised up
    const jumpLeftArmRotZ = 0.15;
    const jumpRightArmRotX = -0.35;
    const jumpRightArmRotZ = -0.15;
    const jumpLeftLegRotX = -0.45;     // legs tucked
    const jumpRightLegRotX = -0.45 * 0.85;
    const jumpHeadRotX = -0.05;
    const jumpHeadRotZ = 0;

    // ── FALL pose (airborne descending) ──
    const fallTorsoPosY = 1.05;
    const fallTorsoRotX = 0.1;         // slight lean forward
    const fallLeftArmRotX = 0.15;      // arms slightly out
    const fallLeftArmRotZ = 0.15;
    const fallRightArmRotX = 0.15;
    const fallRightArmRotZ = -0.15;
    const fallLeftLegRotX = -0.15;     // legs slightly extended
    const fallRightLegRotX = -0.15 * 0.85;
    const fallHeadRotX = 0.08;
    const fallHeadRotZ = 0;

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  HIERARCHICAL BLENDING                                      ║
    // ║                                                             ║
    // ║  Layer 1: walk ↔ run (runBlend)                             ║
    // ║  Layer 2: walk/run ↔ combat (combatBlend)                   ║
    // ║  Layer 3: idle ↔ locomotion (locomotionBlend)               ║
    // ║  Layer 4: jump ↔ fall (jumpBlend)                           ║
    // ║  Layer 5: grounded ↔ airborne (airborneBlend) — FINAL       ║
    // ╚══════════════════════════════════════════════════════════════╝

    // ── Layer 1: Blend walk ↔ run ──
    const wrTorsoPosY = walkTorsoPosY + run * (runTorsoPosY - walkTorsoPosY);
    const wrTorsoRotX = walkTorsoRotX + run * (runTorsoRotX - walkTorsoRotX);
    const wrLeftArmRotX = walkLeftArmRotX + run * (runLeftArmRotX - walkLeftArmRotX);
    const wrLeftArmRotZ = walkLeftArmRotZ + run * (runLeftArmRotZ - walkLeftArmRotZ);
    const wrRightArmRotX = walkRightArmRotX + run * (runRightArmRotX - walkRightArmRotX);
    const wrRightArmRotZ = walkRightArmRotZ + run * (runRightArmRotZ - walkRightArmRotZ);
    const wrLeftLegRotX = walkLeftLegRotX + run * (runLeftLegRotX - walkLeftLegRotX);
    const wrRightLegRotX = walkRightLegRotX + run * (runRightLegRotX - walkRightLegRotX);
    const wrHeadRotX = walkHeadRotX + run * (runHeadRotX - walkHeadRotX);
    const wrHeadRotZ = walkHeadRotZ + run * (runHeadRotZ - walkHeadRotZ);

    // ── Layer 2: Blend walk/run ↔ combat ──
    const locTorsoPosY = wrTorsoPosY + combat * (combatTorsoPosY - wrTorsoPosY);
    const locTorsoRotX = wrTorsoRotX + combat * (combatTorsoRotX - wrTorsoRotX);
    const locLeftArmRotX = wrLeftArmRotX + combat * (combatLeftArmRotX - wrLeftArmRotX);
    const locLeftArmRotZ = wrLeftArmRotZ + combat * (combatLeftArmRotZ - wrLeftArmRotZ);
    const locRightArmRotX = wrRightArmRotX + combat * (combatRightArmRotX - wrRightArmRotX);
    const locRightArmRotZ = wrRightArmRotZ + combat * (combatRightArmRotZ - wrRightArmRotZ);
    const locLeftLegRotX = wrLeftLegRotX + combat * (combatLeftLegRotX - wrLeftLegRotX);
    const locRightLegRotX = wrRightLegRotX + combat * (combatRightLegRotX - wrRightLegRotX);
    const locHeadRotX = wrHeadRotX + combat * (combatHeadRotX - wrHeadRotX);
    const locHeadRotZ = wrHeadRotZ + combat * (combatHeadRotZ - wrHeadRotZ);

    // ── Layer 3: Blend idle ↔ locomotion ──
    const gndTorsoPosY = idleTorsoPosY + locomotion * (locTorsoPosY - idleTorsoPosY);
    const gndTorsoRotX = idleTorsoRotX + locomotion * (locTorsoRotX - idleTorsoRotX);
    const gndLeftArmRotX = idleLeftArmRotX + locomotion * (locLeftArmRotX - idleLeftArmRotX);
    const gndLeftArmRotZ = idleLeftArmRotZ + locomotion * (locLeftArmRotZ - idleLeftArmRotZ);
    const gndRightArmRotX = idleRightArmRotX + locomotion * (locRightArmRotX - idleRightArmRotX);
    const gndRightArmRotZ = idleRightArmRotZ + locomotion * (locRightArmRotZ - idleRightArmRotZ);
    const gndLeftLegRotX = idleLeftLegRotX + locomotion * (locLeftLegRotX - idleLeftLegRotX);
    const gndRightLegRotX = idleRightLegRotX + locomotion * (locRightLegRotX - idleRightLegRotX);
    const gndHeadRotX = idleHeadRotX + locomotion * (locHeadRotX - idleHeadRotX);
    const gndHeadRotZ = idleHeadRotZ + locomotion * (locHeadRotZ - idleHeadRotZ);

    // ── Layer 4: Blend jump ↔ fall ──
    const airTorsoPosY = fallTorsoPosY + jump * (jumpTorsoPosY - fallTorsoPosY);
    const airTorsoRotX = fallTorsoRotX + jump * (jumpTorsoRotX - fallTorsoRotX);
    const airLeftArmRotX = fallLeftArmRotX + jump * (jumpLeftArmRotX - fallLeftArmRotX);
    const airLeftArmRotZ = fallLeftArmRotZ + jump * (jumpLeftArmRotZ - fallLeftArmRotZ);
    const airRightArmRotX = fallRightArmRotX + jump * (jumpRightArmRotX - fallRightArmRotX);
    const airRightArmRotZ = fallRightArmRotZ + jump * (jumpRightArmRotZ - fallRightArmRotZ);
    const airLeftLegRotX = fallLeftLegRotX + jump * (jumpLeftLegRotX - fallLeftLegRotX);
    const airRightLegRotX = fallRightLegRotX + jump * (jumpRightLegRotX - fallRightLegRotX);
    const airHeadRotX = fallHeadRotX + jump * (jumpHeadRotX - fallHeadRotX);
    const airHeadRotZ = fallHeadRotZ + jump * (jumpHeadRotZ - fallHeadRotZ);

    // ── Layer 5: Blend grounded ↔ airborne (FINAL) ──
    const fTorsoPosY = gndTorsoPosY + airborne * (airTorsoPosY - gndTorsoPosY);
    const fTorsoRotX = gndTorsoRotX + airborne * (airTorsoRotX - gndTorsoRotX);
    const fLeftArmRotX = gndLeftArmRotX + airborne * (airLeftArmRotX - gndLeftArmRotX);
    const fLeftArmRotZ = gndLeftArmRotZ + airborne * (airLeftArmRotZ - gndLeftArmRotZ);
    const fRightArmRotX = gndRightArmRotX + airborne * (airRightArmRotX - gndRightArmRotX);
    const fRightArmRotZ = gndRightArmRotZ + airborne * (airRightArmRotZ - gndRightArmRotZ);
    const fLeftLegRotX = gndLeftLegRotX + airborne * (airLeftLegRotX - gndLeftLegRotX);
    const fRightLegRotX = gndRightLegRotX + airborne * (airRightLegRotX - gndRightLegRotX);
    const fHeadRotX = gndHeadRotX + airborne * (airHeadRotX - gndHeadRotX);
    const fHeadRotZ = gndHeadRotZ + airborne * (airHeadRotZ - gndHeadRotZ);

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  APPLY FINAL BLENDED VALUES TO BODY PARTS                   ║
    // ╚══════════════════════════════════════════════════════════════╝

    if (torso) {
      torso.position.y = fTorsoPosY;
      torso.rotation.x = fTorsoRotX;
      torso.rotation.y = 0; // Reset cutscene-only property (talking sets this)
    }
    if (head) {
      head.rotation.x = fHeadRotX;
      head.rotation.z = fHeadRotZ;
      head.rotation.y = 0; // Reset cutscene-only property (talking sets this)
    }
    if (leftArm) {
      leftArm.rotation.x = fLeftArmRotX;
      leftArm.rotation.z = fLeftArmRotZ;
    }
    if (rightArm) {
      rightArm.rotation.x = fRightArmRotX;
      rightArm.rotation.z = fRightArmRotZ;
    }
    if (leftLeg) leftLeg.rotation.x = fLeftLegRotX;
    if (rightLeg) rightLeg.rotation.x = fRightLegRotX;
  });
}
