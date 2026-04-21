'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { setExplorationCameraOrbitYawRad } from '@/lib/explorationCameraOrbitBridge';
import { useGamePhaseStore } from '@/store/gamePhaseStore';

const INTRO_CAMERA_R3F_PRIORITY = 55;

/**
 * Заготовка вводной кат-сцены: камера смотрит на стол с двумя плоскостями-«мониторами».
 * Текстуры и анимации GLTF добавятся позже; орбита камеры обхода синхронизируется с look-at.
 */
export function IntroCutsceneCinematicDirector() {
  const phase = useGamePhaseStore((s) => s.phase);
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 1.05, -1.2));
  const camTarget = useRef(new THREE.Vector3(0.35, 2.05, 2.35));

  useFrame(() => {
    if (phase !== 'intro_cutscene') return;

    camera.position.lerp(camTarget.current, 0.06);
    camera.lookAt(lookAt.current);
    const dx = camera.position.x - lookAt.current.x;
    const dz = camera.position.z - lookAt.current.z;
    setExplorationCameraOrbitYawRad(Math.atan2(dx, dz));
  }, INTRO_CAMERA_R3F_PRIORITY);

  if (phase !== 'intro_cutscene') return null;

  return (
    <group name="IntroCutscenePlaceholders">
      {/* Левый «монитор» — позже: текстура Grafana/Zabbix */}
      <mesh position={[-0.42, 1.18, -1.75]} rotation={[0, 0.08, 0]}>
        <planeGeometry args={[0.55, 0.34]} />
        <meshBasicMaterial color="#052a12" />
      </mesh>
      {/* Правый «монитор» — позже: терминал / логи */}
      <mesh position={[0.42, 1.18, -1.75]} rotation={[0, -0.06, 0]}>
        <planeGeometry args={[0.55, 0.34]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
    </group>
  );
}
