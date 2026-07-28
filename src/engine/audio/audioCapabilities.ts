/**
 * Runtime Web Audio capability probes + safe fallbacks for mobile / low-end browsers.
 */

export interface AudioCapabilities {
  panner3d: boolean;
  pannerHrtf: boolean;
  pannerAudioParams: boolean;
  stereoPanner: boolean;
  convolver: boolean;
  /** Prefer equalpower over HRTF (mobile / low memory). */
  preferLiteSpatial: boolean;
}

export interface SpatialPannerOptions {
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  listenerPosition?: [number, number, number];
}

export interface SpatialSink {
  input: AudioNode;
  setPosition: (position: [number, number, number]) => void;
  disconnect: () => void;
}

let cachedCaps: AudioCapabilities | null = null;

function isLikelyMobileOrLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory !== undefined && deviceMemory < 4) return true;
  if (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2) return true;
  return false;
}

/** Probe once per session — results cached after first call with a live AudioContext. */
export function probeAudioCapabilities(ctx: AudioContext): AudioCapabilities {
  if (cachedCaps) return cachedCaps;

  let panner3d = false;
  let pannerHrtf = false;
  let pannerAudioParams = false;
  let stereoPanner = false;
  let convolver = false;

  try {
    const panner = ctx.createPanner();
    panner3d = true;
    pannerAudioParams = 'positionX' in panner && panner.positionX !== undefined;
    try {
      panner.panningModel = 'HRTF';
      pannerHrtf = panner.panningModel === 'HRTF';
    } catch {
      pannerHrtf = false;
    }
    try {
      panner.disconnect();
    } catch {
      // ignore
    }
  } catch {
    panner3d = false;
  }

  try {
    const pan = ctx.createStereoPanner();
    stereoPanner = true;
    try {
      pan.disconnect();
    } catch {
      // ignore
    }
  } catch {
    stereoPanner = false;
  }

  try {
    const conv = ctx.createConvolver();
    convolver = true;
    try {
      conv.disconnect();
    } catch {
      // ignore
    }
  } catch {
    convolver = false;
  }

  cachedCaps = {
    panner3d,
    pannerHrtf,
    pannerAudioParams,
    stereoPanner,
    convolver,
    preferLiteSpatial: isLikelyMobileOrLowEnd(),
  };
  return cachedCaps;
}

/** Test-only: reset cached probe between unit tests. */
export function resetAudioCapabilitiesCache(): void {
  cachedCaps = null;
}

export function computeDistanceGain(
  position: [number, number, number],
  listener: [number, number, number],
  refDistance: number,
  maxDistance: number,
  rolloffFactor: number,
): number {
  const dx = position[0] - listener[0];
  const dy = position[1] - listener[1];
  const dz = position[2] - listener[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (distance >= maxDistance) return 0;
  return refDistance / (refDistance + rolloffFactor * Math.max(0, distance - refDistance));
}

/** Stereo pan from XZ offset — fallback when PannerNode is unavailable. */
export function computeStereoPan(
  position: [number, number, number],
  listener: [number, number, number],
  panRadius = 12,
): number {
  const dx = position[0] - listener[0];
  if (panRadius <= 0) return 0;
  return Math.max(-1, Math.min(1, dx / panRadius));
}

export function setPannerPosition(
  panner: PannerNode,
  ctx: AudioContext,
  x: number,
  y: number,
  z: number,
): void {
  const now = ctx.currentTime;
  if ('positionX' in panner && panner.positionX) {
    panner.positionX.setValueAtTime(x, now);
    panner.positionY.setValueAtTime(y, now);
    panner.positionZ.setValueAtTime(z, now);
    return;
  }
  const legacy = panner as PannerNode & { setPosition?: (x: number, y: number, z: number) => void };
  legacy.setPosition?.(x, y, z);
}

function configurePanner(panner: PannerNode, caps: AudioCapabilities): void {
  const useHrtf = caps.pannerHrtf && !caps.preferLiteSpatial;
  try {
    panner.panningModel = useHrtf ? 'HRTF' : 'equalpower';
  } catch {
    try {
      panner.panningModel = 'equalpower';
    } catch {
      // ignore — browser picks default
    }
  }
  try {
    panner.distanceModel = 'inverse';
  } catch {
    // ignore
  }
}

/**
 * Connect a source bus to the destination with best-effort 3D/spatial positioning.
 * Falls back: PannerNode → StereoPanner → distance-scaled dry gain.
 */
export function connectSpatialSource(
  ctx: AudioContext,
  destination: AudioNode,
  position: [number, number, number],
  options?: SpatialPannerOptions,
): SpatialSink {
  const caps = probeAudioCapabilities(ctx);
  const listener = options?.listenerPosition ?? [0, 0, 0];
  const refDistance = options?.refDistance ?? 1;
  const maxDistance = options?.maxDistance ?? 30;
  const rolloffFactor = options?.rolloffFactor ?? 1;
  const distanceGain = computeDistanceGain(
    position,
    listener,
    refDistance,
    maxDistance,
    rolloffFactor,
  );

  if (caps.panner3d) {
    try {
      const panner = ctx.createPanner();
      configurePanner(panner, caps);
      setPannerPosition(panner, ctx, position[0], position[1], position[2]);
      panner.refDistance = refDistance;
      panner.maxDistance = maxDistance;
      panner.rolloffFactor = rolloffFactor;
      panner.coneInnerAngle = options?.coneInnerAngle ?? 360;
      panner.coneOuterAngle = options?.coneOuterAngle ?? 360;
      panner.coneOuterGain = options?.coneOuterGain ?? 0;
      panner.connect(destination);

      return {
        input: panner,
        setPosition: (pos) => setPannerPosition(panner, ctx, pos[0], pos[1], pos[2]),
        disconnect: () => {
          try {
            panner.disconnect();
          } catch {
            // ignore
          }
        },
      };
    } catch {
      // fall through to stereo / dry
    }
  }

  if (caps.stereoPanner) {
    try {
      const panner = ctx.createStereoPanner();
      const pan = computeStereoPan(position, listener);
      panner.pan.setValueAtTime(pan, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(distanceGain, ctx.currentTime);
      panner.connect(gain);
      gain.connect(destination);

      return {
        input: panner,
        setPosition: (pos) => {
          const t = ctx.currentTime;
          panner.pan.setValueAtTime(computeStereoPan(pos, listener), t);
          gain.gain.setValueAtTime(
            computeDistanceGain(pos, listener, refDistance, maxDistance, rolloffFactor),
            t,
          );
        },
        disconnect: () => {
          try {
            panner.disconnect();
          } catch {
            // ignore
          }
          try {
            gain.disconnect();
          } catch {
            // ignore
          }
        },
      };
    } catch {
      // fall through
    }
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(distanceGain, ctx.currentTime);
  gain.connect(destination);

  return {
    input: gain,
    setPosition: (pos) => {
      gain.gain.setValueAtTime(
        computeDistanceGain(pos, listener, refDistance, maxDistance, rolloffFactor),
        ctx.currentTime,
      );
    },
    disconnect: () => {
      try {
        gain.disconnect();
      } catch {
        // ignore
      }
    },
  };
}

/** Route `source` → destination with animated stereo pan, or dry fallback. */
export function connectWithStereoPan(
  ctx: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  panStart: number,
  panEnd: number,
  startTime: number,
  duration: number,
): void {
  const caps = probeAudioCapabilities(ctx);
  if (caps.stereoPanner) {
    try {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(panStart, startTime);
      panner.pan.linearRampToValueAtTime(panEnd, startTime + duration);
      source.connect(panner);
      panner.connect(destination);
      return;
    } catch {
      // fall through
    }
  }

  source.connect(destination);
}

/** Create convolver when supported; returns null on mobile browsers that reject large IRs. */
export function tryCreateConvolver(ctx: AudioContext, buffer: AudioBuffer): ConvolverNode | null {
  if (!probeAudioCapabilities(ctx).convolver) return null;
  try {
    const convolver = ctx.createConvolver();
    convolver.buffer = buffer;
    return convolver;
  } catch {
    return null;
  }
}
