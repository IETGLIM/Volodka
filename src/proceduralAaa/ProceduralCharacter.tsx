/**
 * Pillar 2 — ProceduralCharacter: less mannequin — harmonic face, clothing shells,
 * eye/mouth cavities, hair cap, non-plastic skin, FABRIK walk + idle breathe.
 */

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  createChain,
  createWalkState,
  solveFabrik,
  updateWalkCycle,
  updateIdleBreathe,
  raycastGroundY,
  type IkChain,
  type WalkCycleState,
} from './ProceduralFabrikIk';
import { getProceduralAaaParams, onProceduralAaaParamsChange } from './params';
import { generateDynamicTexturesSync } from './DynamicTextureGenerator';

const SKIN_VERT = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

/**
 * Beer-law SSS + pore noise + cheek flush — less plastic skin.
 */
const SKIN_FRAG = /* glsl */ `
uniform vec3 uSkinColor;
uniform float uScatter;
uniform vec3 uLightDir;
uniform float uSpectrum;
uniform float uTime;
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying vec3 vLocalPos;

float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float ndl = max(0.0, dot(N, L));

  float wrap = (ndl + uScatter) / (1.0 + uScatter);
  wrap = clamp(wrap, 0.0, 1.0);

  float thickness = 1.0 / max(0.18, abs(dot(N, L)));
  float beer = exp(-0.62 * thickness * (1.0 - uScatter));
  vec3 scatterColor = vec3(0.78, 0.22, 0.16) * beer * uScatter;

  // Micro pore / freckle break-up (kills plastic sheen)
  float pores = hash31(floor(vLocalPos * 48.0)) * 0.06;
  float flush = pow(max(0.0, N.y * 0.4 + 0.2), 2.0) * 0.08;
  vec3 skin = uSkinColor * (1.0 - pores) + vec3(0.12, 0.03, 0.02) * flush;

  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 3.2);
  // Soft sheen, not chrome
  vec3 col = skin * wrap + scatterColor + fresnel * vec3(0.06, 0.05, 0.045);
  col *= 1.0 + uSpectrum * 0.06 * sin(uTime * 8.0);

  col = col / (col + vec3(1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

const CLOTH_FRAG = /* glsl */ `
uniform vec3 uClothColor;
uniform sampler2D uAlbedo;
uniform sampler2D uRough;
uniform float uTime;
uniform float uSpectrum;
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
  vec3 N = normalize(vNormalW);
  vec2 uv = vec2(vLocalPos.x * 2.2 + vLocalPos.z * 1.1, vLocalPos.y * 2.5) * 0.5 + 0.5;
  vec3 tex = texture2D(uAlbedo, uv).rgb;
  float rough = texture2D(uRough, uv).r;
  vec3 L = normalize(vec3(0.35, 0.9, 0.2));
  float ndl = max(0.12, dot(N, L));
  vec3 col = mix(uClothColor, tex, 0.55) * ndl;
  col *= 0.85 + rough * 0.25;
  col *= 1.0 + uSpectrum * 0.05;
  col = col / (col + vec3(1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

function createSkinMaterial(scatter: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SKIN_VERT,
    fragmentShader: SKIN_FRAG,
    uniforms: {
      uSkinColor: { value: new THREE.Color('#c99574') },
      uScatter: { value: scatter },
      uLightDir: { value: new THREE.Vector3(0.4, 0.9, 0.2).normalize() },
      uSpectrum: { value: 0 },
      uTime: { value: 0 },
    },
  });
}

function createClothMaterial(color: string, seed: number): THREE.ShaderMaterial {
  const maps = generateDynamicTexturesSync('concrete', 512, seed + 77);
  return new THREE.ShaderMaterial({
    vertexShader: SKIN_VERT,
    fragmentShader: CLOTH_FRAG,
    uniforms: {
      uClothColor: { value: new THREE.Color(color) },
      uAlbedo: { value: maps.albedo },
      uRough: { value: maps.roughness },
      uTime: { value: 0 },
      uSpectrum: { value: 0 },
    },
  });
}

/** Harmonic face — richer Ylm mix + brow ridge + jaw + nose bump. */
function buildHarmonicFace(radius: number, detail = 32): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, detail, detail);
  const pos = geo.attributes.position!;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const theta = Math.acos(Math.max(-1, Math.min(1, n.y)));
    const phi = Math.atan2(n.z, n.x);
    const y20 = 0.5 * (3 * Math.cos(theta) ** 2 - 1);
    const y21 = Math.sin(theta) * Math.cos(theta) * Math.cos(phi);
    const y22 = Math.sin(theta) ** 2 * Math.cos(2 * phi);
    const y33 = Math.sin(theta) ** 3 * Math.cos(3 * phi);
    // Nose forward bump (positive Z in local face)
    const nose = Math.exp(-((phi) ** 2) * 8) * Math.exp(-((theta - 1.15) ** 2) * 14) * 0.055;
    // Brow ridge
    const brow = Math.exp(-((theta - 0.85) ** 2) * 40) * (0.02 + 0.015 * Math.cos(phi * 2));
    // Jaw widen
    const jaw = Math.max(0, -Math.cos(theta)) * 0.03 * (1 + 0.3 * Math.cos(2 * phi));
    // Cheek
    const cheek = y22 * 0.035 + y21 * 0.02;
    const disp = y20 * 0.028 + cheek + y33 * 0.012 + nose + brow + jaw;
    v.addScaledVector(n, disp);
    // Eye socket cavities (push inward)
    const eyeL = Math.hypot(phi + 0.38, theta - 1.05);
    const eyeR = Math.hypot(phi - 0.38, theta - 1.05);
    if (eyeL < 0.22) v.addScaledVector(n, -0.035 * (1 - eyeL / 0.22));
    if (eyeR < 0.22) v.addScaledVector(n, -0.035 * (1 - eyeR / 0.22));
    // Mouth cavity
    const mouth = Math.hypot(phi, theta - 1.55);
    if (mouth < 0.18 && n.z > 0.2) v.addScaledVector(n, -0.028 * (1 - mouth / 0.18));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Flattened hemisphere hair cap. */
function buildHairCap(radius: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const pos = geo.attributes.position!;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.y += 0.02;
    v.multiplyScalar(1.02);
    // Messy strands displace
    const n = v.clone().normalize();
    const wiggle = Math.sin(n.x * 18) * Math.cos(n.z * 14) * 0.012;
    v.addScaledVector(n, wiggle);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export interface ProceduralCharacterProps {
  position?: [number, number, number];
  spectrumRef?: React.MutableRefObject<number>;
  groundMeshesRef?: React.MutableRefObject<THREE.Object3D[]>;
  walking?: boolean;
}

export function ProceduralCharacter({
  position = [0, 0, 2],
  spectrumRef,
  groundMeshesRef,
  walking = true,
}: ProceduralCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const skinMats = useRef<THREE.ShaderMaterial[]>([]);
  const clothMats = useRef<THREE.ShaderMaterial[]>([]);
  const walk = useRef<WalkCycleState>(createWalkState(new THREE.Vector3(...position)));
  const leftChain = useRef<IkChain | null>(null);
  const rightChain = useRef<IkChain | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const paramsRef = useRef(getProceduralAaaParams());
  const breathePhase = useRef(0);

  const faceGeo = useMemo(() => buildHarmonicFace(0.155, 28), []);
  const hairGeo = useMemo(() => buildHairCap(0.168), []);
  const bodyGeo = useMemo(() => new THREE.CapsuleGeometry(0.2, 0.42, 8, 14), []);
  const shirtGeo = useMemo(() => new THREE.CapsuleGeometry(0.225, 0.38, 6, 12), []);
  const pantsGeo = useMemo(() => new THREE.CapsuleGeometry(0.075, 0.32, 4, 8), []);
  const limbGeo = useMemo(() => new THREE.CapsuleGeometry(0.055, 0.32, 4, 8), []);

  const skin = useMemo(() => createSkinMaterial(paramsRef.current.skinScatter), []);
  const cloth = useMemo(() => createClothMaterial('#2a3548', paramsRef.current.seed), []);
  const pantsMat = useMemo(() => createClothMaterial('#1a1e28', paramsRef.current.seed + 3), []);
  const hairMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#1c1410',
      roughness: 0.92,
      metalness: 0.02,
    }),
    [],
  );

  useEffect(() => {
    skinMats.current = [skin];
    clothMats.current = [cloth, pantsMat];
    return onProceduralAaaParamsChange((p) => {
      paramsRef.current = p;
      for (const m of skinMats.current) {
        m.uniforms.uScatter!.value = p.skinScatter;
      }
    });
  }, [skin, cloth, pantsMat]);

  useEffect(() => {
    const hip = new THREE.Vector3(0, 0.95, 0);
    const knee = new THREE.Vector3(-0.12, 0.48, 0);
    const foot = new THREE.Vector3(-0.12, 0.02, 0.02);
    leftChain.current = createChain([hip.clone(), knee, foot]);
    rightChain.current = createChain([
      hip.clone().setX(0.12),
      knee.clone().setX(0.12),
      foot.clone().setX(0.12),
    ]);
  }, []);

  useFrameTick('misc', (ctx) => {
    const g = groupRef.current;
    if (!g) return;
    const p = paramsRef.current;
    const delta = ctx.delta;
    const t = performance.now() * 0.001;
    const spectrum = spectrumRef?.current ?? 0;

    for (const m of skinMats.current) {
      m.uniforms.uTime!.value = t;
      m.uniforms.uSpectrum!.value = spectrum;
    }
    for (const m of clothMats.current) {
      m.uniforms.uTime!.value = t;
      m.uniforms.uSpectrum!.value = spectrum;
    }

    // Idle breathe always
    breathePhase.current = updateIdleBreathe(breathePhase.current, delta);
    const breath = 1 + Math.sin(breathePhase.current) * 0.018;
    if (torsoRef.current) {
      torsoRef.current.scale.set(breath, 1 + Math.sin(breathePhase.current) * 0.012, breath);
    }

    const meshes = groundMeshesRef?.current ?? [];
    const origin = g.position;
    const gyL = raycastGroundY(
      raycaster,
      origin.clone().add(new THREE.Vector3(-0.18, 1.2, 0)),
      meshes,
      0,
    );
    const gyR = raycastGroundY(
      raycaster,
      origin.clone().add(new THREE.Vector3(0.18, 1.2, 0)),
      meshes,
      0,
    );

    if (walking) {
      updateWalkCycle(
        walk.current,
        delta,
        p,
        new THREE.Vector3(0, 0, -1),
        gyL,
        gyR,
      );

      if (leftChain.current) {
        leftChain.current.joints[0]!.set(-0.12, 0.95, 0);
        solveFabrik(leftChain.current, walk.current.leftTarget.clone().sub(origin), 10);
        const mid = leftChain.current.joints[1]!;
        const tip = leftChain.current.joints[2]!;
        if (leftLegRef.current) {
          leftLegRef.current.position.copy(mid);
          leftLegRef.current.lookAt(tip.clone().add(origin));
        }
      }
      if (rightChain.current) {
        rightChain.current.joints[0]!.set(0.12, 0.95, 0);
        solveFabrik(rightChain.current, walk.current.rightTarget.clone().sub(origin), 10);
        const mid = rightChain.current.joints[1]!;
        const tip = rightChain.current.joints[2]!;
        if (rightLegRef.current) {
          rightLegRef.current.position.copy(mid);
          rightLegRef.current.lookAt(tip.clone().add(origin));
        }
      }

      const swing = Math.sin(walk.current.phase) * 0.4;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing;

      // Grounded hip: average foot contact, small bob
      const groundY = (gyL + gyR) * 0.5;
      g.position.y = groundY + walk.current.hip.y - 0.95;
    } else {
      g.position.y = (gyL + gyR) * 0.5;
    }

    g.scale.setScalar(p.characterScale);
  }, { priority: 25, label: 'proceduralAaa/character' });

  return (
    <group ref={groupRef} position={position} name="ProceduralCharacter">
      {/* Skin torso under clothing */}
      <mesh geometry={bodyGeo} position={[0, 1.05, 0]} material={skin} castShadow />
      {/* Clothing shell */}
      <mesh ref={torsoRef} geometry={shirtGeo} position={[0, 1.08, 0]} material={cloth} castShadow />
      {/* Head + harmonic face */}
      <mesh geometry={faceGeo} position={[0, 1.55, 0]} material={skin} castShadow />
      {/* Hair cap */}
      <mesh geometry={hairGeo} position={[0, 1.58, 0]} material={hairMat} castShadow />
      {/* Eye dark cavities + sclera dots */}
      <mesh position={[-0.055, 1.575, 0.125]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.85} />
      </mesh>
      <mesh position={[0.055, 1.575, 0.125]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.85} />
      </mesh>
      <mesh position={[-0.055, 1.575, 0.145]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#d8dde8" roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[0.055, 1.575, 0.145]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#d8dde8" roughness={0.25} metalness={0.05} />
      </mesh>
      {/* Mouth cavity */}
      <mesh position={[0, 1.48, 0.13]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.055, 0.018, 0.03]} />
        <meshStandardMaterial color="#1a1012" roughness={0.9} />
      </mesh>
      {/* Legs with pants shells */}
      <mesh ref={leftLegRef} geometry={pantsGeo} position={[-0.12, 0.45, 0]} material={pantsMat} castShadow />
      <mesh ref={rightLegRef} geometry={pantsGeo} position={[0.12, 0.45, 0]} material={pantsMat} castShadow />
      {/* Arms */}
      <mesh ref={leftArmRef} geometry={limbGeo} position={[-0.3, 1.12, 0]} rotation={[0, 0, 0.22]} material={skin} castShadow />
      <mesh ref={rightArmRef} geometry={limbGeo} position={[0.3, 1.12, 0]} rotation={[0, 0, -0.22]} material={skin} castShadow />
      {/* Boots */}
      <mesh position={[-0.12, 0.06, 0.02]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.16]} />
        <meshStandardMaterial color="#151820" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.12, 0.06, 0.02]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.16]} />
        <meshStandardMaterial color="#151820" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}
