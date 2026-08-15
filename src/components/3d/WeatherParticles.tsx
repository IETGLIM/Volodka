/* ─── Volodka RPG – Weather & Atmospheric Particle Systems ───
 *  Scene-specific animated particle systems for atmospheric effects:
 *  - Dust motes (volodka_room, library_day)
 *  - Floating embers (abandoned_factory)
 *  Rain/snow are handled by WeatherController → RainSystem/SnowSystem (GPU).
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';
import { getGameSnapshot } from '@/shared/gameBridge/gameActionBridge';

// ═══════════════════════════════════════════════════
//  DUST MOTES — small, slow particles caught in light
//  Session 9: Dust motes now respond to player movement (wake/disturbance)
// ═══════════════════════════════════════════════════

interface DustConfig {
  count: number;
  position: [number, number, number];
  spread: [number, number, number];
  sizeRange: [number, number];
  speed: number;
  color: string;
}

interface DustConfigEnhanced extends DustConfig {
  /** God-ray positions for light-catch interaction (library_day beams) */
  godRayPositions?: [number, number, number][];
  /** How strongly dust brightens when near a god-ray */
  godRayInfluence?: number;
}

const DUST_CONFIGS: Record<string, DustConfigEnhanced> = {
  volodka_room: {
    count: 50,
    position: [0, 1.5, -1],
    spread: [4, 2.5, 5],
    sizeRange: [0.008, 0.02],
    speed: 0.08,
    color: '#aaffaa',
  },
  library_day: {
    count: 80,
    position: [2, 2, -2],
    spread: [8, 3.5, 8],
    sizeRange: [0.008, 0.022],
    speed: 0.06,
    color: '#ffddaa',
    godRayPositions: [[5, 3, 0], [3, 3, -3]],
    godRayInfluence: 2.5,
  },
  volodka_corridor: {
    count: 40,
    position: [0, 1.8, -1],
    spread: [3, 2, 6],
    sizeRange: [0.006, 0.016],
    speed: 0.07,
    color: '#ccbbaa',
  },
  park_day: {
    count: 55,
    position: [0, 2, 0],
    spread: [12, 4, 12],
    sizeRange: [0.006, 0.018],
    speed: 0.05,
    color: '#ddffcc',
  },
  home_evening: {
    count: 35,
    position: [0, 1.5, 0],
    spread: [4, 2, 4],
    sizeRange: [0.006, 0.016],
    speed: 0.04,
    color: '#ffddbb',
  },
  battle: {
    count: 30,
    position: [0, 2, 0],
    spread: [10, 4, 10],
    sizeRange: [0.006, 0.018],
    speed: 0.05,
    color: '#ccbbaa',
  },
  abandoned_factory: {
    count: 25,
    position: [0, 1.5, -4],
    spread: [8, 4, 8],
    sizeRange: [0.006, 0.016],
    speed: 0.04,
    color: '#aa9988',
  },
  // Indoor dust motes: smaller, slower, warmer — subtle atmosphere in enclosed spaces
  solnysh_room: {
    count: 20,
    position: [0, 1.8, 0],
    spread: [3, 2, 3],
    sizeRange: [0.004, 0.012],
    speed: 0.03,
    color: '#ffddbb',
  },
  zarema_albert_room: {
    count: 22,
    position: [0, 1.8, 0],
    spread: [3.5, 2, 3.5],
    sizeRange: [0.004, 0.012],
    speed: 0.03,
    color: '#ffddbb',
  },
  albert_backroom: {
    count: 18,
    position: [0.5, 1.6, 0],
    spread: [2.5, 1.8, 2.5],
    sizeRange: [0.004, 0.012],
    speed: 0.025,
    color: '#eeddaa',
  },
  zarema_room: {
    count: 18,
    position: [0, 1.6, 0],
    spread: [3, 1.8, 3],
    sizeRange: [0.004, 0.012],
    speed: 0.025,
    color: '#eeddaa',
  },
  office_day: {
    count: 15,
    position: [2, 2.2, 0],
    spread: [6, 2.5, 5],
    sizeRange: [0.003, 0.01],
    speed: 0.02,
    color: '#dde8f0',
  },
  factory_basement: {
    count: 20,
    position: [0, 1.5, -3],
    spread: [5, 2.5, 5],
    sizeRange: [0.005, 0.014],
    speed: 0.03,
    color: '#99ccaa',
  },
  underground_bunker: {
    count: 12,
    position: [0, 1.5, -2],
    spread: [4, 2, 4],
    sizeRange: [0.004, 0.012],
    speed: 0.02,
    color: '#88ccaa',
  },
  guild_mainframe: {
    count: 10,
    position: [0, 2, 0],
    spread: [5, 2.5, 5],
    sizeRange: [0.003, 0.01],
    speed: 0.02,
    color: '#aaddff',
  },
  river_pier: {
    count: 25,
    position: [0, 2, -1],
    spread: [10, 3, 6],
    sizeRange: [0.005, 0.015],
    speed: 0.04,
    color: '#ffddaa',
  },
  pier_evening: {
    count: 22,
    position: [0, 2, -1],
    spread: [10, 3, 6],
    sizeRange: [0.005, 0.015],
    speed: 0.04,
    color: '#ffddaa',
  },
  library_basement: {
    count: 18,
    position: [0, 1.5, 0],
    spread: [4, 2, 4],
    sizeRange: [0.004, 0.012],
    speed: 0.025,
    color: '#ddccaa',
  },
  chk_forest_zorge: {
    count: 20,
    position: [0, 1.5, 0],
    spread: [10, 3, 10],
    sizeRange: [0.004, 0.014],
    speed: 0.04,
    color: '#ddffcc',
  },
  chk_campfire_night: {
    count: 15,
    position: [0, 1.5, -0.5],
    spread: [6, 2.5, 6],
    sizeRange: [0.005, 0.015],
    speed: 0.035,
    color: '#ffddaa',
  },
};

export function DustMotes({ sceneId }: { sceneId: string }) {
  const baseConfig = DUST_CONFIGS[sceneId];
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const reducedMotion = useEffectiveReducedMotion();

  const config = useMemo(() => {
    if (!baseConfig) return null;
    return {
      ...baseConfig,
      count: getParticleCount(baseConfig.count, isMobile, visualLite, effectsScale, reducedMotion),
    };
  }, [baseConfig, isMobile, visualLite, effectsScale, reducedMotion]);

  if (!config) return null;
  return <DustSystem config={config} hasGodRays={!!baseConfig.godRayPositions} />;
}

function DustSystem({ config, hasGodRays }: { config: DustConfigEnhanced; hasGodRays?: boolean }) {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const timeRef = useRef(0);
  const brightnessRef = useRef(new Float32Array(config.count).fill(1));

  const { positions, phases, velocities } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
      pos[i3 + 1] = config.position[1] + (Math.random() - 0.5) * config.spread[1];
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];

      pha[i] = Math.random() * Math.PI * 2;

      // Very slow random drift
      vel[i3] = (Math.random() - 0.5) * config.speed;
      vel[i3 + 1] = (Math.random() - 0.5) * config.speed * 0.5;
      vel[i3 + 2] = (Math.random() - 0.5) * config.speed;
    }

    return { positions: pos, phases: pha, velocities: vel };
  }, [config]);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;

    // Player disturbance — read player position from cached snapshot (cheap)
    // Dust motes within 0.8m of the player get pushed away, creating a wake effect
    const pp = getGameSnapshot().exploration.playerPosition;
    const playerX = pp[0];
    const playerZ = pp[2];
    const DISTURB_RADIUS = 0.8;
    const DISTURB_FORCE = 0.4;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Gentle floating in light — sinusoidal drift + slow velocity
      posArray[i3] += (velocities[i3] + Math.sin(t * 0.3 + phase) * 0.002) * delta;
      posArray[i3 + 1] += (velocities[i3 + 1] + Math.sin(t * 0.2 + phase * 1.5) * 0.001) * delta;
      posArray[i3 + 2] += (velocities[i3 + 2] + Math.cos(t * 0.25 + phase * 0.8) * 0.002) * delta;

      // Player wake disturbance
      const dx = posArray[i3] - playerX;
      const dz = posArray[i3 + 2] - playerZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < DISTURB_RADIUS * DISTURB_RADIUS && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const influence = (1 - dist / DISTURB_RADIUS) * DISTURB_FORCE * delta;
        posArray[i3] += (dx / dist) * influence;
        posArray[i3 + 1] += influence * 0.3; // slight upward push
        posArray[i3 + 2] += (dz / dist) * influence;
      }

      // Wrap within bounds
      for (let axis = 0; axis < 3; axis++) {
        const center = config.position[axis];
        const halfSpread = config.spread[axis] / 2;
        if (posArray[i3 + axis] > center + halfSpread) {
          posArray[i3 + axis] = center - halfSpread;
        } else if (posArray[i3 + axis] < center - halfSpread) {
          posArray[i3 + axis] = center + halfSpread;
        }
      }
    }

    posAttr.needsUpdate = true;

    // God-ray interaction: dust motes brighten when near a light beam
    if (hasGodRays && config.godRayPositions && config.godRayInfluence) {
      const rayPositions = config.godRayPositions;
      const influence = config.godRayInfluence;
      const brightnessArr = brightnessRef.current;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let closestDist = Infinity;
        for (const ray of rayPositions) {
          const dx = posArray[i3] - ray[0];
          const dz = posArray[i3 + 2] - ray[2];
          // Distance in XZ plane (god rays are vertical columns)
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < closestDist) closestDist = dist;
        }
        // Brightness increases as particle gets closer to god ray
        const proximityFactor = Math.max(0, 1 - closestDist / influence);
        brightnessArr[i] = 1 + proximityFactor * 2.5;
      }
    }

    // Subtle opacity pulsing to simulate light catching particles
    if (materialRef.current) {
      const basePulse = 0.2 + Math.sin(t * 0.5) * 0.05;
      // In god-ray scenes, overall opacity fluctuates more dynamically
      materialRef.current.opacity = hasGodRays
        ? basePulse + Math.sin(t * 1.2) * 0.04 + Math.sin(t * 0.7) * 0.03
        : basePulse;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={(config.sizeRange[0] + config.sizeRange[1]) / 2}
        transparent
        opacity={0.25}
        depthWrite={false}
        sizeAttenuation
        blending={AdditiveBlending}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════
//  FLOATING EMBERS — glowing particles rising slowly
// ═══════════════════════════════════════════════════

interface EmberConfig {
  count: number;
  position: [number, number, number];
  spread: [number, number, number];
  riseSpeed: number;
  color: string;
}

const EMBER_CONFIGS: Record<string, EmberConfig> = {
  abandoned_factory: {
    count: 40,
    position: [0, 1, -4],
    spread: [8, 5, 8],
    riseSpeed: 0.6,
    color: '#ff6622',
  },
  battle: {
    count: 25,
    position: [0, 0.5, 0],
    spread: [10, 4, 10],
    riseSpeed: 0.5,
    color: '#ff8844',
  },
};

export function EmberParticles({ sceneId }: { sceneId: string }) {
  const baseConfig = EMBER_CONFIGS[sceneId];
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const reducedMotion = useEffectiveReducedMotion();

  const config = useMemo(() => {
    if (!baseConfig) return null;
    return {
      ...baseConfig,
      count: getParticleCount(baseConfig.count, isMobile, visualLite, effectsScale, reducedMotion),
    };
  }, [baseConfig, isMobile, visualLite, effectsScale, reducedMotion]);

  if (!config) return null;
  return <EmberSystem config={config} />;
}

function EmberSystem({ config }: { config: EmberConfig }) {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const timeRef = useRef(0);

  const { positions, phases, sizes: _sizes } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
      pos[i3 + 1] = config.position[1] + Math.random() * config.spread[1];
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];

      pha[i] = Math.random() * Math.PI * 2;
      siz[i] = 0.02 + Math.random() * 0.04;
    }

    return { positions: pos, phases: pha, sizes: siz };
  }, [config]);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Rise upward with drift
      posArray[i3 + 1] += (config.riseSpeed + Math.sin(t * 0.5 + phase) * 0.2) * delta;
      posArray[i3] += Math.sin(t * 0.8 + phase) * 0.05 * delta;
      posArray[i3 + 2] += Math.cos(t * 0.6 + phase * 1.3) * 0.05 * delta;

      // Reset at top
      if (posArray[i3 + 1] > config.position[1] + config.spread[1]) {
        posArray[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
        posArray[i3 + 1] = config.position[1] + Math.random() * 0.5;
        posArray[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];
      }
    }

    posAttr.needsUpdate = true;

    // Ember glow pulsing
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={0.04}
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
        blending={AdditiveBlending}
      />
    </points>
  );
}