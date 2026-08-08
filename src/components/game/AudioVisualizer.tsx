'use client';

/** ─── Volodka RPG – Audio Visualizer ─── *
 *
 * Canvas-based audio waveform/frequency visualizer with three modes:
 *   1. Waveform — oscilloscope-style wave
 *   2. Bars    — frequency spectrum equalizer
 *   3. Radial  — circular frequency display
 *
 * Cyberpunk-styled glass panel, bottom-right corner, semi-transparent
 * when unfocused, full opacity on hover.
 *
 * NOTE: 'V' key is already bound to Perks panel in useKeyboardShortcutManager.
 * Toggle visibility via the eye icon button or click the panel header.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Waves, BarChart3, CircleDot, EyeOff } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getAnalyserNode, getAudioData } from '@/engine/audio/audioVisualizerBridge';

/* ─── Types ─── */

type VizMode = 'waveform' | 'bars' | 'radial';

const MODE_LIST: VizMode[] = ['waveform', 'bars', 'radial'];

const MODE_ICONS: Record<VizMode, typeof Waves> = {
  waveform: Waves,
  bars: BarChart3,
  radial: CircleDot,
};

const MODE_LABELS: Record<VizMode, string> = {
  waveform: 'Волна',
  bars: 'Спектр',
  radial: 'Радар',
};

/* ─── Config ─── */

const CANVAS_W_DESKTOP = 280;
const CANVAS_H_DESKTOP = 80;
const CANVAS_W_MOBILE = 200;
const CANVAS_H_MOBILE = 60;

/** Lerp factor for bar smoothing */
const SMOOTH = 0.18;

/** Cyan #00e5ff → emerald #34d399 gradient stops */
const COLOR_START = { r: 0, g: 229, b: 255 };
const COLOR_END = { r: 52, g: 211, b: 153 };

/** Number of bars to render (subset of frequency bins) */
const BAR_COUNT = 48;

/** Number of radial segments */
const RADIAL_SEGMENTS = 64;

/* ─── Helpers ─── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  t: number,
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
): string {
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  return `rgb(${r},${g},${b})`;
}

/** Generate fake reactive data when no AnalyserNode is available. */
function fakeFrequencyData(length: number, time: number): Uint8Array {
  const data = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const freq = i / length;
    const base = Math.max(0, 1 - freq * 1.5) * 120;
    const wave1 = Math.sin(time * 2.3 + i * 0.4) * 30;
    const wave2 = Math.sin(time * 3.7 + i * 0.7) * 20;
    const wave3 = Math.cos(time * 1.1 + i * 0.15) * 15;
    data[i] = Math.min(255, Math.max(0, base + wave1 + wave2 + wave3));
  }
  return data;
}

function fakeWaveformData(length: number, time: number): Float32Array {
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / length;
    data[i] = Math.sin(t * Math.PI * 4 + time * 3) * 0.3
      + Math.sin(t * Math.PI * 7 + time * 5.3) * 0.15
      + Math.sin(t * Math.PI * 11 + time * 2.1) * 0.08;
  }
  return data;
}

/* ─── Component ─── */

export function AudioVisualizer() {
  const musicEnabled = useGameStore((s) => s.musicEnabled);

  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<VizMode>('bars');
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef<Float64Array>(new Float64Array(BAR_COUNT));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef(performance.now());

  /* ─── Detect mobile ─── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ─── Acquire analyser node ─── */
  useEffect(() => {
    if (musicEnabled) {
      analyserRef.current = getAnalyserNode();
    } else {
      analyserRef.current = null;
    }
  }, [musicEnabled]);

  /* ─── Cycle mode ─── */
  const cycleMode = useCallback(() => {
    setMode((prev) => {
      const idx = MODE_LIST.indexOf(prev);
      return MODE_LIST[(idx + 1) % MODE_LIST.length];
    });
    // Reset smoothed data on mode switch for clean transition.
    smoothedRef.current = new Float64Array(BAR_COUNT);
  }, []);

  /* ─── Canvas drawing loop ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = isMobile ? CANVAS_W_MOBILE : CANVAS_W_DESKTOP;
    const h = isMobile ? CANVAS_H_MOBILE : CANVAS_H_DESKTOP;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    let running = true;

    const draw = () => {
      if (!running || !ctx) return;

      const now = (performance.now() - startTimeRef.current) / 1000;
      const analyser = analyserRef.current;

      ctx.clearRect(0, 0, w, h);

      if (mode === 'waveform') {
        drawWaveform(ctx, w, h, analyser, now);
      } else if (mode === 'bars') {
        drawBars(ctx, w, h, analyser, now, smoothedRef.current);
      } else {
        drawRadial(ctx, w, h, analyser, now);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, mode, isMobile]);

  if (!visible) return null;

  const ModeIcon = MODE_ICONS[mode];
  const panelClass = `av-panel av-scanlines av-scan-beam ${hovered ? 'av-focused' : 'av-faded'}`;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[${UI_LAYERS.HUD}] ${panelClass}`}
      style={{ zIndex: UI_LAYERS.HUD }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="region"
      aria-label="Аудиовизуализатор"
    >
      <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-2.5 flex flex-col gap-1.5 select-none">
        {/* Header row: icon + label + mode toggle + visibility toggle */}
        <div className="flex items-center gap-2">
          <Music size={12} className="text-cyan-400/70 flex-shrink-0" />
          <span className="av-mode-label flex-1">Аудио</span>
          <div className="flex items-center gap-1.5">
            <div className="av-mode-dot" />
            <span className="av-mode-label">{MODE_LABELS[mode]}</span>
            <button
              className="av-mode-btn"
              onClick={cycleMode}
              aria-label={`Режим: ${MODE_LABELS[mode]}`}
              title="Сменить режим"
            >
              <ModeIcon size={12} />
            </button>
            <button
              className="av-vis-btn"
              onClick={() => setVisible(false)}
              aria-label="Скрыть визуализатор"
              title="Скрыть"
            >
              <EyeOff size={12} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="av-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

/* ─── Drawing functions ─── */

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  analyser: AnalyserNode | null,
  time: number,
) {
  let data: Float32Array;
  if (analyser) {
    const raw = getAudioData(analyser, 'waveform');
    data = raw instanceof Float32Array ? raw : new Float32Array(raw.length);
  } else {
    data = fakeWaveformData(256, time);
  }

  const midY = h / 2;
  const step = w / data.length;

  ctx.beginPath();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
  ctx.shadowBlur = 6;

  for (let i = 0; i < data.length; i++) {
    const x = i * step;
    const y = midY + data[i] * midY * 0.85;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Faint fill below waveform
  ctx.lineTo(w, midY);
  ctx.lineTo(0, midY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
  ctx.shadowBlur = 0;
  ctx.fill();
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  analyser: AnalyserNode | null,
  time: number,
  smoothed: Float64Array,
) {
  let freqData: Uint8Array;
  if (analyser) {
    const raw = getAudioData(analyser, 'bars');
    freqData = raw instanceof Uint8Array ? raw : new Uint8Array(raw.length);
  } else {
    freqData = fakeFrequencyData(128, time);
  }

  const binStep = Math.max(1, Math.floor(freqData.length / BAR_COUNT));
  const gap = 2;
  const barW = Math.max(1, (w - gap * (BAR_COUNT - 1)) / BAR_COUNT);

  for (let i = 0; i < BAR_COUNT; i++) {
    const binIdx = Math.min(i * binStep, freqData.length - 1);
    const target = freqData[binIdx] / 255;
    smoothed[i] = lerp(smoothed[i], target, SMOOTH);

    const val = smoothed[i];
    const barH = Math.max(1, val * (h - 4));
    const x = i * (barW + gap);
    const y = h - barH - 2;

    const t = i / (BAR_COUNT - 1);
    const color = lerpColor(t, COLOR_START, COLOR_END);

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = val > 0.5 ? 4 : 0;
    ctx.fillRect(x, y, barW, barH);
  }
  ctx.shadowBlur = 0;
}

function drawRadial(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  analyser: AnalyserNode | null,
  time: number,
) {
  let freqData: Uint8Array;
  if (analyser) {
    const raw = getAudioData(analyser, 'radial');
    freqData = raw instanceof Uint8Array ? raw : new Uint8Array(raw.length);
  } else {
    freqData = fakeFrequencyData(128, time);
  }

  const cx = w / 2;
  const cy = h / 2;
  const innerR = Math.min(w, h) * 0.18;
  const maxExtent = Math.min(w, h) * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  const segments = RADIAL_SEGMENTS;
  const angleStep = (Math.PI * 2) / segments;
  const binStep = Math.max(1, Math.floor(freqData.length / segments));

  for (let i = 0; i < segments; i++) {
    const binIdx = Math.min(i * binStep, freqData.length - 1);
    const val = freqData[binIdx] / 255;
    const r = innerR + val * (maxExtent - innerR);

    const angle1 = i * angleStep - Math.PI / 2;
    const angle2 = angle1 + angleStep * 0.75;

    const t = i / (segments - 1);
    const color = lerpColor(t, COLOR_START, COLOR_END);

    ctx.beginPath();
    ctx.arc(0, 0, r, angle1, angle2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = val > 0.4 ? 5 : 0;
    ctx.stroke();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 6;
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}