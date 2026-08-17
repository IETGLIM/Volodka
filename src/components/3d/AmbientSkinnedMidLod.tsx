
/* ─── Skinned mid-LOD ambient figures (near band) ───
     Distinct Quaternius `_rigs` with idle↔walk blend matched to wander velocity. */

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AnimationAction, AnimationClip, AnimationMixer, Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from 'three';
import type { QuaterniusRigRef } from '@/config/npcComposer/types';
import { NPC_GLTF_TARGET_HEIGHT_M } from '@/config/metricScaleCoherence';
import { resolveQuaterniusStagedRigUrl } from '@/config/quaterniusRigCatalog';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { scheduleGltfPreload, GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';
import { fitCharacterGltf, measureCharacterGltfBounds } from '@/engine/assets/gltfScale';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { deplasticizeCharacterMaterials } from '@/engine/graphics/materials/deplasticizeCharacterMaterials';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { DEFAULT_NPC_LOD, scaleNpcLodThresholds } from '@/engine/lod/distanceLod';
import { disposeSkinnedClone } from '@/engine/three/disposeThreeResources';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

export const MAX_AMBIENT_SKINNED = 8;

/** Distinct staged rigs so near-band crowd is not N× the same mesh. */
const AMBIENT_RIG_POOL: readonly QuaterniusRigRef[] = [
  'male_01',
  'male_02',
  'female_01',
  'male_04',
  'female_02',
  'male_03',
  'male_05',
  'female_03',
];

export interface AmbientCrowdLiveSlot {
  px: number;
  pz: number;
  rotationY: number;
  /** True while wander AI is translating — drives walk weight. */
  walking: boolean;
  active: boolean;
}

interface AmbientSkinnedMidLodProps {
  slotsRef: React.MutableRefObject<AmbientCrowdLiveSlot[]>;
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  tintHex: string;
  maxSkinned?: number;
}

interface FigureActions {
  idle: AnimationAction | null;
  walk: AnimationAction | null;
}

function pickClip(clips: AnimationClip[], pattern: RegExp): AnimationClip | undefined {
  return clips.find((c) => pattern.test(c.name));
}

function AmbientSkinnedFigure({
  rig,
  slotIndex,
  slotsRef,
  livePlayerPositionRef,
  tintHex,
  nearDistance,
}: {
  rig: QuaterniusRigRef;
  slotIndex: number;
  slotsRef: React.MutableRefObject<AmbientCrowdLiveSlot[]>;
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  tintHex: string;
  nearDistance: number;
}) {
  const url = resolveQuaterniusStagedRigUrl(rig);
  const gltf = useGLTF(url, true, true, extendLoader);
  const rootRef = useRef<Group>(null);
  const mixWeightRef = useRef(0);

  const { scene, mixer, actions } = useMemo(() => {
    const clone = cloneSkinnedScene(gltf.scene) as Group;
    deplasticizeCharacterMaterials(clone, {
      envMapIntensity: 0.52,
      minRoughness: 0.6,
      roughnessMul: 1.32,
      maxMetalness: 0.14,
      maxEmissiveIntensity: 0.35,
    });
    const tint = new Color(tintHex);
    clone.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      const sourceMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const nextMats = sourceMats.map((m) => {
        if (!m || !(m as MeshStandardMaterial).isMeshStandardMaterial) return m;
        const std = (m as MeshStandardMaterial).clone();
        std.color.lerp(tint, 0.32 + slotIndex * 0.04);
        // WS16-A: deplasticize organic surfaces on LOD NPCs — upgrade cloned MeshStandardMaterial
        // to MeshPhysicalMaterial with sheen for skin/hair/cloth material names. Non-organic
        // surfaces (eyes, metallics, plastic props) stay as MeshStandardMaterial.
        const matName = (std.name || '').toLowerCase();
        const isOrganic = /skin|face|body|head|hand|arm|leg|flesh|beard|stubble|mouth|hair|cloth|fabric|hoodie|jeans|shirt/.test(matName);
        if (isOrganic && !(std as MeshPhysicalMaterial).isMeshPhysicalMaterial) {
          const physical = new MeshPhysicalMaterial();
          physical.copy(std);
          physical.sheen = 0.35;
          physical.sheenRoughness = 0.5;
          physical.name = std.name;
          std.dispose();
          return physical;
        }
        return std;
      });
      mesh.material = nextMats.length === 1 ? nextMats[0]! : nextMats;
    });

    const bounds = measureCharacterGltfBounds(clone);
    const fit = fitCharacterGltf(bounds, {
      targetHeightM: NPC_GLTF_TARGET_HEIGHT_M,
      heightFactor: 1,
      scaleMultiplier: 0.92,
    });
    clone.scale.setScalar(fit.scale);
    clone.rotation.x = fit.rotX;
    clone.position.y = fit.footY;

    const nextMixer = new AnimationMixer(clone);
    const idleClip =
      pickClip(gltf.animations, /idle|stand|breath|neutral/i) ?? gltf.animations[0];
    const walkClip =
      pickClip(gltf.animations, /walk|walking|locomotion/i)
      ?? pickClip(gltf.animations, /run/i);

    const nextActions: FigureActions = { idle: null, walk: null };
    if (idleClip) {
      const idle = nextMixer.clipAction(idleClip);
      idle.enabled = true;
      idle.setEffectiveWeight(1);
      idle.play();
      idle.time = (slotIndex * 0.73) % Math.max(0.1, idleClip.duration);
      nextActions.idle = idle;
    }
    if (walkClip) {
      const walk = nextMixer.clipAction(walkClip);
      walk.enabled = true;
      walk.setEffectiveWeight(0);
      walk.play();
      walk.time = (slotIndex * 0.41) % Math.max(0.1, walkClip.duration);
      nextActions.walk = walk;
    }

    return { scene: clone, mixer: nextMixer, actions: nextActions };
  }, [gltf.scene, gltf.animations, tintHex, slotIndex]);

  useEffect(() => () => disposeSkinnedClone(scene, mixer), [scene, mixer]);

  useFrameTick('npc', ({ delta }) => {
    const root = rootRef.current;
    if (!root) return;
    const slot = slotsRef.current[slotIndex];
    const player = livePlayerPositionRef.current;
    const dt = Math.min(delta, 0.05);

    if (!slot?.active) {
      root.visible = false;
      return;
    }

    const dist = Math.hypot(slot.px - player.x, slot.pz - player.z);
    const show = dist <= nearDistance;
    root.visible = show;
    if (!show) return;

    root.position.set(slot.px, 0, slot.pz);
    root.rotation.y = slot.rotationY;

    const targetWalk = slot.walking ? 1 : 0;
    mixWeightRef.current += (targetWalk - mixWeightRef.current) * Math.min(1, dt * 5.5);
    const w = mixWeightRef.current;
    if (actions.idle) actions.idle.setEffectiveWeight(1 - w);
    if (actions.walk) actions.walk.setEffectiveWeight(w);
    mixer.update(dt);
  }, { label: `AmbientSkinnedFigure:${rig}` });

  return (
    <group ref={rootRef} visible={false}>
      <primitive object={scene} />
    </group>
  );
}

function AmbientSkinnedMidLodInner({
  slotsRef,
  livePlayerPositionRef,
  tintHex,
  maxSkinned = MAX_AMBIENT_SKINNED,
}: AmbientSkinnedMidLodProps) {
  const { preset } = useGraphicsQuality();
  const nearDistance = useMemo(
    () => scaleNpcLodThresholds(DEFAULT_NPC_LOD, preset.lodBias).cullOut,
    [preset.lodBias],
  );
  const rigs = AMBIENT_RIG_POOL.slice(0, Math.max(0, Math.min(MAX_AMBIENT_SKINNED, maxSkinned)));

  return (
    <group>
      {rigs.map((rig, i) => (
        <AmbientSkinnedFigure
          key={rig}
          rig={rig}
          slotIndex={i}
          slotsRef={slotsRef}
          livePlayerPositionRef={livePlayerPositionRef}
          tintHex={tintHex}
          nearDistance={nearDistance}
        />
      ))}
    </group>
  );
}

/** Near-band skinned ambient people; far/low may still use billboard overflow. */
export function AmbientSkinnedMidLod(props: AmbientSkinnedMidLodProps) {
  if (props.maxSkinned === 0) return null;

  return (
    <Suspense fallback={null}>
      <AmbientSkinnedMidLodInner {...props} />
    </Suspense>
  );
}

// Preload only the first few rigs — loading all eight (~12MB+) at PhysicsScene
// mount (still on the menu) competes with the bedroom / Cesium boot path and
// has contributed to WebGL context loss → solid black after New Game.
// Session 9 perf: routed through gltfPreloadScheduler to stagger the sync parses.
for (const rig of AMBIENT_RIG_POOL.slice(0, 3)) {
  const url = resolveQuaterniusStagedRigUrl(rig);
  scheduleGltfPreload(
    url,
    () => useGLTF.preload(url, true, true, extendLoader),
    GltfPreloadPriority.Low,
  );
}
