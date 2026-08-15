import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MeshBasicMaterial, SphereGeometry } from 'three';
import { eventBus } from '@/engine/EventBus';
import type { TriggerZone } from '@/data/triggerZones';
import {
  MAX_PARTICLES,
  resetParticleInstanceMatrices,
  type ParticleData,
  type ZoneProximityRuntime,
} from '@/engine/interaction/interactiveTriggerProximity';
import { ProximityGodRay } from '../ProximityGodRay';

/** Single trigger zone — proximity tick runs in InteractiveTriggers parent */
export function TriggerZoneComponent({
  zone,
  runtime,
  unregisterPrompt,
}: {
  zone: TriggerZone;
  runtime: ZoneProximityRuntime;
  unregisterPrompt: (id: string) => void;
}) {
  const outlineFlashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const particleGeo = useMemo(() => new SphereGeometry(0.06, 4, 4), []);
  const particleMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#44ffff',
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    runtime.particleInstanceRef.current = null;
  }, [runtime]);

  useEffect(() => {
    const geo = particleGeo;
    const mat = particleMat;
    return () => {
      runtime.particlesRef.current = [];
      const mesh = runtime.particleInstanceRef.current;
      if (mesh) {
        resetParticleInstanceMatrices(mesh);
      }
      geo.dispose();
      mat.dispose();
    };
  }, [particleGeo, particleMat, runtime]);

  const spawnParticles = useCallback(() => {
    const newParticles: ParticleData[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / MAX_PARTICLES;
      newParticles.push({
        position: [0, zone.size[1] / 2, 0],
        velocity: [
          Math.cos(angle) * (1.5 + Math.random()),
          2 + Math.random() * 2,
          Math.sin(angle) * (1.5 + Math.random()),
        ],
        life: 0,
      });
    }
    runtime.particlesRef.current = [...runtime.particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);

    const mesh = runtime.particleInstanceRef.current;
    if (mesh) {
      resetParticleInstanceMatrices(mesh);
    }
  }, [runtime, zone.size]);

  useEffect(() => {
    const onObjectInteract = (payload: { triggerZoneId?: string }) => {
      if (payload.triggerZoneId !== zone.id) return;
      spawnParticles();
      runtime.outlineFlashRef.current = true;
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
      outlineFlashTimer.current = setTimeout(() => {
        runtime.outlineFlashRef.current = false;
      }, 200);
    };

    const onHighlight = (payload: { triggerZoneId?: string }) => {
      if (payload.triggerZoneId !== zone.id) return;
      spawnParticles();
    };

    const unsubInteract = eventBus.on('object:interact', onObjectInteract);
    const unsubHighlight = eventBus.on('object:highlight', onHighlight);
    return () => {
      unsubInteract();
      unsubHighlight();
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
    };
  }, [zone.id, spawnParticles, runtime]);

  useEffect(() => {
    return () => {
      unregisterPrompt(zone.id);
    };
  }, [zone.id, unregisterPrompt]);

  return (
    <group position={zone.position}>
      <ProximityGodRay
        activeRef={runtime.zoneGlowActiveRef}
        color="#88eeff"
        colorRef={runtime.zoneColorRef}
        beamHeight={Math.max(zone.size[1] + 1.6, 2.2)}
        baseY={Math.max(zone.size[1] * 0.2, 0.35)}
        proximityRef={runtime.proximityRef}
        flashRef={runtime.outlineFlashRef}
        pulsePhaseRef={runtime.pulsePhaseRef}
        staticHighlightRef={runtime.poemStaticHighlightRef}
      />

      <instancedMesh
        ref={(node) => {
          runtime.particleInstanceRef.current = node;
        }}
        args={[particleGeo, particleMat, MAX_PARTICLES]}
        frustumCulled={false}
      />
    </group>
  );
}
