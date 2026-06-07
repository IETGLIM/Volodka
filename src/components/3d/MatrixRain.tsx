
/* ─── Volodka RPG – MatrixRain Effect ─── */
/* Green cascading characters (Cyrillic + Latin + code symbols)
   Falls like rain as a screen-space overlay using pure CSS animations.
   Always-on during exploration in appropriate scenes, with per-scene
   density / brightness / speed / color presets.
   Also appears during story/text stages (visual-novel mode, cutscene).
   Replaces Canvas2D approach (~1680 fillText/frame) with zero-JS-per-frame
   CSS keyframe animation for massive GPU savings. */

import { useMemo, useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useGamePhase, useMatrixRainOverlayState } from '@/store/selectors';
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Character set: digits, hex, brackets, operators, Greek, Cyrillic, OpenStack/Bash commands */
const CHARS = '0123456789ABCDEF{}[]<>/\\|#$@!αβγδεζηθклмнопрстуфхцчшщъыьэюяsudo_openstack_nova_awk_grep';

/** Classic Matrix green — brighter for distinctness */
const MATRIX_GREEN = '#00ff41';
const HEAD_GREEN = '#aaffcc'; // bright leading char

/** How many columns of rain to render (scales with screen width) */
const COLUMN_WIDTH = 16; // px per column — tighter for more detail

/* ── Per-scene rain presets ── */

export interface MatrixRainPreset {
  /** Maximum number of columns (0 = disabled) */
  maxColumns: number;
  /** Overlay opacity (0–1) */
  opacity: number;
  /** Speed multiplier relative to base */
  speed: number;
  /** Base color for trail characters */
  color: string;
  /** Color for the bright leading char */
  headColor: string;
  /** Characters per column (range [min, max]) */
  charRange: [number, number];
  /** Animation duration range in seconds [min, max] */
  durationRange: [number, number];
  /** Max delay before column starts */
  maxDelay: number;
  /** CSS mix-blend-mode */
  blendMode: string;
  /** Font size in px */
  fontSize: number;
}

const DEFAULT_PRESET: MatrixRainPreset = {
  maxColumns: 120,
  opacity: 0.25,
  speed: 1.0,
  color: MATRIX_GREEN,
  headColor: HEAD_GREEN,
  charRange: [20, 35],
  durationRange: [4, 12],
  maxDelay: 5,
  blendMode: 'screen',
  fontSize: 16,
};

/**
 * Scene-specific rain presets.
 * Scenes NOT listed here default to "no rain" during exploration
 * (rain only appears in cutscene/story-overlay mode).
 */
const SCENE_PRESETS: Record<string, MatrixRainPreset> = {
  /* ── Full Matrix rain: outdoor cyberpunk streets ── */
  street_night: {
    maxColumns: 48,
    opacity: 0.1,
    speed: 1.0,
    color: MATRIX_GREEN,
    headColor: HEAD_GREEN,
    charRange: [20, 35],
    durationRange: [4, 12],
    maxDelay: 5,
    blendMode: 'screen',
    fontSize: 16,
  },
  street_winter: {
    maxColumns: 100,
    opacity: 0.25,
    speed: 0.8,
    color: '#44ee88',
    headColor: '#ccffdd',
    charRange: [18, 30],
    durationRange: [5, 14],
    maxDelay: 6,
    blendMode: 'screen',
    fontSize: 15,
  },

  /* ── Subtle rain: semi-indoor / industrial ── */
  office_day: {
    maxColumns: 30,
    opacity: 0.08,
    speed: 0.6,
    color: '#00aa33',
    headColor: '#66cc88',
    charRange: [10, 18],
    durationRange: [8, 18],
    maxDelay: 10,
    blendMode: 'screen',
    fontSize: 14,
  },
  // abandoned_factory: MatrixRain disabled — CSS overlay + heavy 3D stack caused freezes

  /* ── Very subtle background rain: quiet indoor spaces ── */
  cafe_evening: {
    maxColumns: 15,
    opacity: 0.05,
    speed: 0.5,
    color: '#009930',
    headColor: '#55bb77',
    charRange: [8, 14],
    durationRange: [10, 20],
    maxDelay: 12,
    blendMode: 'screen',
    fontSize: 13,
  },
  library_day: {
    maxColumns: 12,
    opacity: 0.04,
    speed: 0.4,
    color: '#008830',
    headColor: '#44aa66',
    charRange: [8, 12],
    durationRange: [12, 22],
    maxDelay: 15,
    blendMode: 'screen',
    fontSize: 13,
  },

  /* ── No rain: private indoor spaces (excluded from map = disabled) ── */
  // volodka_room, home_evening — no preset → maxColumns: 0

  /* ── Light rain from above: rooftop ── */
  rooftop_edge: {
    maxColumns: 50,
    opacity: 0.15,
    speed: 1.2,
    color: '#22ee66',
    headColor: '#aaffcc',
    charRange: [15, 25],
    durationRange: [3, 8],
    maxDelay: 4,
    blendMode: 'screen',
    fontSize: 15,
  },

  /* ── Heavy psychedelic rain: dream world ── */
  sleep_dream: {
    maxColumns: 90,
    opacity: 0.2,
    speed: 0.6,
    color: '#00ff88',
    headColor: '#ff88ff',
    charRange: [20, 40],
    durationRange: [5, 14],
    maxDelay: 6,
    blendMode: 'screen',
    fontSize: 18,
    // Color-shifting handled via CSS animation override below
  },
};

/** Get the preset for a scene, or null if rain is disabled */
function getPresetForScene(sceneId: string): MatrixRainPreset | null {
  return SCENE_PRESETS[sceneId] ?? null;
}

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

interface ColumnData {
  id: number;
  x: number;
  chars: string[];
  duration: number;
  delay: number;
}

/** Build column data for current viewport width and preset */
function buildColumns(width: number, preset: MatrixRainPreset): ColumnData[] {
  const count = Math.min(Math.ceil(width / COLUMN_WIDTH), preset.maxColumns);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: i * COLUMN_WIDTH,
    chars: Array.from(
      { length: preset.charRange[0] + Math.floor(Math.random() * (preset.charRange[1] - preset.charRange[0])) },
      () => randomChar(),
    ),
    duration: preset.durationRange[0] + Math.random() * (preset.durationRange[1] - preset.durationRange[0]),
    delay: Math.random() * preset.maxDelay,
  }));
}

interface MatrixRainProps {
  /** Override scene ID (if not provided, reads from game store) */
  sceneId?: string;
}

export function MatrixRain({ sceneId: sceneIdProp }: MatrixRainProps) {
  const mode = useGamePhase();
  const { showStoryOverlay, sceneId: storeSceneId } = useMatrixRainOverlayState();
  const sceneId = sceneIdProp ?? storeSceneId;
  const { visualLite, effectsScale } = useMobileVisualPerf();

  // ── Determine if rain should show and which preset to use ──
  // FIX: Only show MatrixRain during story overlay if the scene
  // actually has a MatrixRain preset. Prevents MatrixRain from appearing
  // during story/cutscene in indoor scenes (volodka_room, volodka_corridor)
  // where it blocks player control and is visually jarring.
  const isCutsceneOrStory = mode === 'cutscene' || showStoryOverlay;
  const explorationPreset = getPresetForScene(sceneId);
  // During story overlay WITHOUT a scene preset, don't show rain at all
  const enabled = mode === 'cutscene'
    ? explorationPreset !== null  // Cutscene only shows rain if scene has preset
    : showStoryOverlay
      ? explorationPreset !== null  // Story overlay only if scene has preset
      : explorationPreset !== null;  // Exploration: scene preset required

  // Active preset: always use scene preset when available
  const activePreset = useMemo(() => {
    const base = explorationPreset ?? DEFAULT_PRESET;
    if (!explorationPreset) return base;
    const scale = visualLite ? 0.35 : effectsScale < 0.85 ? 0.6 : 1;
    return {
      ...base,
      maxColumns: Math.max(6, Math.floor(base.maxColumns * scale)),
    };
  }, [explorationPreset, visualLite, effectsScale]);

  // SSR-safe: only compute columns on client
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Speed multiplier from EventBus (for minigames/glitch)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  // Track whether a minigame boosted speed so we know the base
  const minigameBoostRef = useRef(false);
  const glitchTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      eventBus.on('minigame:open', ({ gameType }) => {
        if (gameType === 'codebreaker' || gameType === 'openstack_terminal' || gameType === 'bash_terminal' || gameType === 'hacking') {
          setSpeedMultiplier(3.0);
          minigameBoostRef.current = true;
        }
      }),
    );
    unsubs.push(
      eventBus.on('minigame:close', () => {
        setSpeedMultiplier(activePreset.speed);
        minigameBoostRef.current = false;
      }),
    );
    unsubs.push(
      eventBus.on('minigame:complete', () => {
        setSpeedMultiplier(activePreset.speed);
        minigameBoostRef.current = false;
      }),
    );
    unsubs.push(
      eventBus.on('fx:glitch', () => {
        setSpeedMultiplier((prev) => Math.min(prev + 1.5, 5.0));
        const timer = setTimeout(() => {
          glitchTimersRef.current.delete(timer);
          setSpeedMultiplier((prev) => Math.max(prev - 1.5, minigameBoostRef.current ? 3.0 : activePreset.speed));
        }, 600);
        glitchTimersRef.current.add(timer);
      }),
    );

    return () => {
      unsubs.forEach((u) => u());
      for (const timer of glitchTimersRef.current) {
        clearTimeout(timer);
      }
      glitchTimersRef.current.clear();
    };
  }, [activePreset.speed]);

  // Reset speed when preset changes (scene change)
  useEffect(() => {
    if (!minigameBoostRef.current) {
      setSpeedMultiplier(activePreset.speed);
    }
  }, [activePreset.speed]);

  // Build columns when preset changes
  const columns = useMemo<ColumnData[]>(() => {
    if (!mounted) return [];
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    return buildColumns(width, activePreset);
  }, [mounted, activePreset]);

  if (!enabled || !mounted) return null;

  const effectiveSpeed = speedMultiplier;
  const isDreamScene = sceneId === 'sleep_dream' && !isCutsceneOrStory;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        opacity: activePreset.opacity,
        zIndex: UI_LAYERS.GLITCH,
        mixBlendMode: activePreset.blendMode as React.CSSProperties['mixBlendMode'],
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {columns.map((col) => (
        <div
          key={col.id}
          style={{
            position: 'absolute',
            left: col.x,
            top: '-100%',
            animation: isDreamScene
              ? `matrixFallDream ${col.duration / effectiveSpeed}s linear ${col.delay / effectiveSpeed}s infinite`
              : `matrixFall ${col.duration / effectiveSpeed}s linear ${col.delay / effectiveSpeed}s infinite`,
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", "Lucida Console", monospace',
            fontSize: `${activePreset.fontSize}px`,
            lineHeight: `${activePreset.fontSize}px`,
          }}
        >
          {col.chars.map((char, ci) => (
            <div
              key={ci}
              style={{
                color: ci === col.chars.length - 1 ? activePreset.headColor : activePreset.color,
                opacity: ci === col.chars.length - 1 ? 1 : Math.max(0.1, 1 - (col.chars.length - 1 - ci) * 0.06),
                textShadow: ci === col.chars.length - 1
                  ? `0 0 8px ${activePreset.color}`
                  : 'none',
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes matrixFall {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(200vh + 100%)); }
        }
        @keyframes matrixFallDream {
          0% { transform: translateY(0) translateX(0); filter: hue-rotate(0deg); }
          25% { transform: translateY(50vh) translateX(${10 + Math.random() * 20}px); filter: hue-rotate(90deg); }
          50% { transform: translateY(100vh) translateX(${-10 - Math.random() * 15}px); filter: hue-rotate(180deg); }
          75% { transform: translateY(150vh) translateX(${5 + Math.random() * 10}px); filter: hue-rotate(270deg); }
          100% { transform: translateY(calc(200vh + 100%)) translateX(0); filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
