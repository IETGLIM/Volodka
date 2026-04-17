'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useCallback, useRef, useState } from 'react';

const LS_KEY = 'volodka_exploration_stats';

function readStatsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).get('exploreStats') === '1') return true;
    return window.localStorage.getItem(LS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Опциональный оверлей FPS / draw calls / triangles для профилирования 3D.
 * Включение: `?exploreStats=1` в URL или `localStorage.setItem('volodka_exploration_stats','1')`.
 */
export function ExplorationFrameStats() {
  const gl = useThree((s) => s.gl);
  const [text, setText] = useState('');
  const accRef = useRef({ frames: 0, time: 0 });
  const tickRef = useRef(0);

  const sample = useCallback(() => {
    const info = gl.info.render;
    setText(
      `FPS ${tickRef.current.toFixed(0)} | calls ${info.calls} | tris ${info.triangles}\n` +
        `localStorage '${LS_KEY}'=1 или ?exploreStats=1`,
    );
  }, [gl]);

  useFrame((_, dt) => {
    accRef.current.frames += 1;
    accRef.current.time += dt;
    if (accRef.current.time < 0.5) return;
    tickRef.current = accRef.current.frames / accRef.current.time;
    accRef.current.frames = 0;
    accRef.current.time = 0;
    sample();
  });

  return (
    <Html prepend fullscreen style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 8, left: 8, width: 'min(92vw, 22rem)' }}>
        <pre
          style={{
            margin: 0,
            padding: '6px 8px',
            fontSize: 10,
            lineHeight: 1.35,
            fontFamily: 'ui-monospace, monospace',
            color: '#a7f3d0',
            background: 'rgba(0,12,10,0.82)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </pre>
      </div>
    </Html>
  );
}

export function useExplorationFrameStatsEnabled(): boolean {
  const [enabled] = useState(() => readStatsEnabled());
  return enabled;
}
