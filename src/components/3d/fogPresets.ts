/* ─── Volumetric fog config + per-scene presets ─── */

export interface VolumetricFogConfig {
  /** Number of fog planes (5–8 recommended) */
  planeCount: number;
  /** Base color of the fog */
  color: string;
  /** Per-plane opacity (very low: 0.03–0.08) */
  opacity: number;
  /** Horizontal spread (half-width of the fog area) */
  spreadX: number;
  /** Depth spread (half-depth) */
  spreadZ: number;
  /** Height of each fog plane */
  height: number;
  /** Base Y position of the fog layer */
  baseY: number;
  /** Lateral drift speed (m/s) */
  driftSpeed: number;
  /** Vertical pulse amplitude */
  pulseAmp: number;
  /** Vertical pulse frequency (Hz) */
  pulseFreq: number;
  /** Width of each plane */
  planeWidth: number;
}

export const DEFAULT_FOG_CONFIG: VolumetricFogConfig = {
  planeCount: 6,
  color: '#aabbcc',
  opacity: 0.04,
  spreadX: 6,
  spreadZ: 6,
  height: 1.5,
  baseY: 0.5,
  driftSpeed: 0.15,
  pulseAmp: 0.15,
  pulseFreq: 0.12,
  planeWidth: 8,
};

/* ── Per-scene presets ── */

export const FOG_PRESETS: Record<string, Partial<VolumetricFogConfig>> = {
  volodka_room: {
    planeCount: 3,
    color: '#1a2040',
    opacity: 0.025,
    spreadX: 3,
    spreadZ: 3,
    height: 1.0,
    baseY: 0.3,
    driftSpeed: 0.05,
    planeWidth: 5,
  },
  volodka_corridor: {
    planeCount: 5,
    color: '#1a1828',
    opacity: 0.04,
    spreadX: 2,
    spreadZ: 5,
    height: 1.2,
    baseY: 0.4,
    driftSpeed: 0.08,
    planeWidth: 4,
  },
  street_night: {
    planeCount: 3,
    color: '#3a4858',
    opacity: 0.03,
    spreadX: 10,
    spreadZ: 10,
    height: 2.0,
    baseY: 0.2,
    driftSpeed: 0.2,
    planeWidth: 14,
  },
  street_winter: {
    planeCount: 7,
    color: '#406878',  // cyan-tinted winter fog
    opacity: 0.05,
    spreadX: 12,
    spreadZ: 12,
    height: 1.5,
    baseY: 0.15,
    driftSpeed: 0.12,
    planeWidth: 12,
  },
  cafe_evening: {
    planeCount: 3,
    color: '#1a1018',
    opacity: 0.03,
    spreadX: 4,
    spreadZ: 4,
    height: 1.0,
    baseY: 0.5,
    driftSpeed: 0.06,
    planeWidth: 6,
  },
  park_day: {
    planeCount: 5,
    color: '#a0b8a0',
    opacity: 0.03,
    spreadX: 14,
    spreadZ: 14,
    height: 1.2,
    baseY: 0.3,
    driftSpeed: 0.1,
    planeWidth: 16,
  },
  library_day: {
    planeCount: 4,
    color: '#8a7a60',
    opacity: 0.025,
    spreadX: 6,
    spreadZ: 5,
    height: 1.0,
    baseY: 0.4,
    driftSpeed: 0.04,
    planeWidth: 8,
  },
  rooftop_edge: {
    planeCount: 6,  // boosted for cyberpunk atmosphere
    color: '#0a2020',  // cyan/green neon-tinted fog
    opacity: 0.045,
    spreadX: 6,
    spreadZ: 5,
    height: 1.8,
    baseY: 0.2,
    driftSpeed: 0.18,
    planeWidth: 10,
  },
  abandoned_factory: {
    planeCount: 4,
    color: '#0a2018',  // green/cyan cyberpunk industrial tint
    opacity: 0.05,
    spreadX: 10,
    spreadZ: 9,
    height: 2.5,
    baseY: 0.2,
    driftSpeed: 0.1,
    planeWidth: 14,
  },
  battle: {
    planeCount: 6,
    color: '#0a2a0a',
    opacity: 0.05,
    spreadX: 6,
    spreadZ: 6,
    height: 2.0,
    baseY: 0.3,
    driftSpeed: 0.12,
    planeWidth: 10,
  },
  sleep_dream: {
    planeCount: 7,
    color: '#1a0a30',
    opacity: 0.06,
    spreadX: 20,
    spreadZ: 20,
    height: 2.0,
    baseY: 0.2,
    driftSpeed: 0.08,
    planeWidth: 22,
  },
  office_day: {
    planeCount: 3,
    color: '#c0c8d0',
    opacity: 0.02,
    spreadX: 6,
    spreadZ: 5,
    height: 0.8,
    baseY: 0.5,
    driftSpeed: 0.04,
    planeWidth: 8,
  },
  home_evening: {
    planeCount: 3,
    color: '#2a1a0a',
    opacity: 0.025,
    spreadX: 3,
    spreadZ: 3,
    height: 0.8,
    baseY: 0.4,
    driftSpeed: 0.04,
    planeWidth: 5,
  },
  zarema_albert_room: {
    planeCount: 4,
    color: '#1a1408',
    opacity: 0.03,
    spreadX: 3,
    spreadZ: 3,
    height: 1.0,
    baseY: 0.4,
    driftSpeed: 0.06,
    planeWidth: 5,
  },
  chk_forest_zorge: {
    planeCount: 3,
    color: '#142018',
    opacity: 0.035,
    spreadX: 8,
    spreadZ: 8,
    height: 1.2,
    baseY: 0.5,
    driftSpeed: 0.05,
    planeWidth: 12,
  },
};
