/* ─── God ray config + per-scene presets ─── */

export interface GodRayConfig {
  /** Position of the ray origin (light source end) */
  position: [number, number, number];
  /** Top radius (at origin, where light enters) */
  topRadius: number;
  /** Bottom radius (where light hits the floor) */
  bottomRadius: number;
  /** Height of the light shaft */
  height: number;
  /** Ray color */
  color: string;
  /** Base opacity (very low: 0.03–0.08) */
  opacity: number;
  /** Intensity pulsing speed (Hz) */
  pulseSpeed: number;
  /** Pulse amplitude (0–1 fraction of base opacity) */
  pulseAmp: number;
  /** Slow rotation speed (rad/s) */
  rotationSpeed: number;
  /** Initial Y rotation */
  initialRotation: number;
  /** Whether to show dust motes inside the ray */
  dustMotes: boolean;
  /** Number of dust motes */
  dustCount: number;
  /** Dust color */
  dustColor: string;
  /** Dust size range [min, max] */
  dustSizeRange: [number, number];
  /** Tilt angle (radians) — for slanted rays */
  tiltX?: number;
  tiltZ?: number;
}

export const DEFAULT_RAY: GodRayConfig = {
  position: [0, 4, 0],
  topRadius: 0.15,
  bottomRadius: 0.8,
  height: 4,
  color: '#ffffcc',
  opacity: 0.06,
  pulseSpeed: 0.15,
  pulseAmp: 0.3,
  rotationSpeed: 0.02,
  initialRotation: 0,
  dustMotes: true,
  dustCount: 30,
  dustColor: '#ffeeaa',
  dustSizeRange: [0.02, 0.05],
};

/* ── Per-scene god ray presets ── */

export const GODRAY_PRESETS: Record<string, GodRayConfig[]> = {
  volodka_room: [
    {
      ...DEFAULT_RAY,
      position: [1.5, 2.5, -3.0],
      topRadius: 0.1,
      bottomRadius: 0.4,
      height: 2.5,
      color: '#00ff66',
      opacity: 0.04,
      pulseSpeed: 0.2,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 15,
      dustColor: '#88ff99',
      initialRotation: 0,
    },
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.3,
      height: 2.5,
      color: '#ffaa55',
      opacity: 0.03,
      pulseSpeed: 0.1,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 10,
      dustColor: '#ffcc88',
      initialRotation: Math.PI / 4,
    },
  ],
  volodka_corridor: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, -2],
      topRadius: 0.1,
      bottomRadius: 0.5,
      height: 2.5,
      color: '#ffcc66',
      opacity: 0.04,
      pulseSpeed: 0.25,
      pulseAmp: 0.5, // flickering overhead ray
      rotationSpeed: 0.03,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffdd88',
      initialRotation: 0,
    },
  ],
  street_night: [
    {
      ...DEFAULT_RAY,
      position: [4, 6, -3],
      topRadius: 0.05,
      bottomRadius: 0.6,
      height: 6,
      color: '#6666ff',
      opacity: 0.03,
      pulseSpeed: 0.1,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 25,
      dustColor: '#8888ff',
      initialRotation: 0.5,
    },
  ],
  street_winter: [
    {
      ...DEFAULT_RAY,
      position: [3, 8, 2],
      topRadius: 0.2,
      bottomRadius: 1.2,
      height: 8,
      color: '#ffffee',
      opacity: 0.05,
      pulseSpeed: 0.08,
      rotationSpeed: 0.02,
      dustMotes: true,
      dustCount: 40,
      dustColor: '#ffffdd',
      initialRotation: 0,
    },
    {
      ...DEFAULT_RAY,
      position: [-5, 7, -4],
      topRadius: 0.15,
      bottomRadius: 0.9,
      height: 7,
      color: '#ffffdd',
      opacity: 0.04,
      pulseSpeed: 0.1,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 25,
      dustColor: '#ffeecc',
      initialRotation: 1.2,
    },
  ],
  cafe_evening: [
    {
      ...DEFAULT_RAY,
      position: [-3, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.35,
      height: 2.5,
      color: '#4488ff',
      opacity: 0.04,
      pulseSpeed: 0.12,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 12,
      dustColor: '#88aaff',
      initialRotation: 0,
    },
  ],
  park_day: [
    {
      ...DEFAULT_RAY,
      position: [-4, 8, -3],
      topRadius: 0.15,
      bottomRadius: 1.0,
      height: 8,
      color: '#ffffcc',
      opacity: 0.05,
      pulseSpeed: 0.08,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 35,
      dustColor: '#ffeeaa',
      initialRotation: 0.3,
    },
    {
      ...DEFAULT_RAY,
      position: [5, 7, 4],
      topRadius: 0.1,
      bottomRadius: 0.7,
      height: 7,
      color: '#ffffdd',
      opacity: 0.04,
      pulseSpeed: 0.1,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 25,
      dustColor: '#ffddaa',
      initialRotation: 2.0,
    },
  ],
  library_day: [
    {
      ...DEFAULT_RAY,
      position: [5, 3, 0],
      topRadius: 0.12,
      bottomRadius: 0.6,
      height: 3,
      color: '#ffffcc',
      opacity: 0.05,
      pulseSpeed: 0.06,
      rotationSpeed: 0.008,
      dustMotes: true,
      dustCount: 30,
      dustColor: '#ffeeaa',
      initialRotation: 0,
      tiltX: -0.15,
    },
    {
      ...DEFAULT_RAY,
      position: [3, 3, -3],
      topRadius: 0.1,
      bottomRadius: 0.5,
      height: 3,
      color: '#ffffbb',
      opacity: 0.04,
      pulseSpeed: 0.08,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffdd99',
      initialRotation: 0.5,
      tiltX: -0.1,
    },
  ],
  rooftop_edge: [
    {
      ...DEFAULT_RAY,
      position: [-2, 6, -1],
      topRadius: 0.3,
      bottomRadius: 1.5,
      height: 6,
      color: '#ffcc88',
      opacity: 0.07,
      pulseSpeed: 0.1,
      pulseAmp: 0.4,
      rotationSpeed: 0.02,
      dustMotes: true,
      dustCount: 50,
      dustColor: '#ffddaa',
      initialRotation: 0,
    },
  ],
  abandoned_factory: [
    {
      ...DEFAULT_RAY,
      position: [3, 5, -2],
      topRadius: 0.15,
      bottomRadius: 1.0,
      height: 5,
      color: '#ffcc66',
      opacity: 0.05,
      pulseSpeed: 0.15,
      pulseAmp: 0.35,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 18,
      dustColor: '#ffbb55',
      initialRotation: 0,
    },
    {
      ...DEFAULT_RAY,
      position: [-4, 4, 3],
      topRadius: 0.1,
      bottomRadius: 0.7,
      height: 4,
      color: '#ffaa44',
      opacity: 0.04,
      pulseSpeed: 0.2,
      pulseAmp: 0.4,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 12,
      dustColor: '#ffcc66',
      initialRotation: 1.5,
    },
  ],
  battle: [
    {
      ...DEFAULT_RAY,
      position: [0, 5, 0],
      topRadius: 0.2,
      bottomRadius: 1.0,
      height: 5,
      color: '#00ff44',
      opacity: 0.04,
      pulseSpeed: 0.3,
      pulseAmp: 0.5,
      rotationSpeed: 0.05,
      dustMotes: true,
      dustCount: 40,
      dustColor: '#44ff66',
      initialRotation: 0,
    },
  ],
  sleep_dream: [
    {
      ...DEFAULT_RAY,
      position: [0, 6, 0],
      topRadius: 0.25,
      bottomRadius: 1.2,
      height: 6,
      color: '#aa66ff',
      opacity: 0.05,
      pulseSpeed: 0.05,
      pulseAmp: 0.4,
      rotationSpeed: 0.03,
      dustMotes: true,
      dustCount: 30,
      dustColor: '#cc88ff',
      initialRotation: 0,
    },
  ],
  office_day: [
    {
      ...DEFAULT_RAY,
      position: [3, 3, 0],
      topRadius: 0.1,
      bottomRadius: 0.4,
      height: 3,
      color: '#eeeeff',
      opacity: 0.03,
      pulseSpeed: 0.2,
      pulseAmp: 0.6, // fluorescent flickering
      rotationSpeed: 0.005,
      dustMotes: true,
      dustCount: 15,
      dustColor: '#ddeeff',
      initialRotation: 0,
    },
  ],
  home_evening: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.35,
      height: 2.5,
      color: '#ffaa44',
      opacity: 0.035,
      pulseSpeed: 0.1,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 12,
      dustColor: '#ffcc88',
      initialRotation: 0,
    },
  ],
  zarema_albert_room: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, -1],
      topRadius: 0.08,
      bottomRadius: 0.3,
      height: 2.5,
      color: '#ffcc88',
      opacity: 0.03,
      pulseSpeed: 0.08,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 10,
      dustColor: '#ffddaa',
      initialRotation: 0,
    },
  ],
  chk_forest_zorge: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.8, 0],
      topRadius: 0.05,
      bottomRadius: 0.55,
      height: 3.2,
      color: '#ff8833',
      opacity: 0.07,
      pulseSpeed: 0.35,
      pulseAmp: 0.45,
      rotationSpeed: 0.008,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffaa55',
      initialRotation: 0,
    },
  ],
};
