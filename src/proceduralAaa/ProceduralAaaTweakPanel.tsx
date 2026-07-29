/**
 * Inspector-style tweak panel (Leva substitute) — all major knobs + Generate button.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DEFAULT_PROCEDURAL_AAA_PARAMS,
  getProceduralAaaParams,
  onProceduralAaaParamsChange,
  resetProceduralAaaParams,
  setProceduralAaaParams,
  type ProceduralAaaParams,
  type TextureResolutionTier,
} from './params';
import { generateProceduralAaaScene } from './ProceduralAaaManager';

const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 72,
  right: 12,
  width: 300,
  maxHeight: '78vh',
  overflowY: 'auto',
  zIndex: 99990,
  background: 'rgba(12, 14, 22, 0.92)',
  border: '1px solid rgba(120, 140, 200, 0.35)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#d8dff5',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 11,
  boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 6 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ opacity: 0.7 }}>{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}

export function ProceduralAaaTweakPanel({ startOpen = false }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [params, setParams] = useState<ProceduralAaaParams>(getProceduralAaaParams);

  useEffect(() => onProceduralAaaParamsChange(setParams), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F4') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open || typeof document === 'undefined') return null;

  const patch = (p: Partial<ProceduralAaaParams>) => setProceduralAaaParams(p);

  return createPortal(
    <div style={PANEL_STYLE} role="dialog" aria-label="Procedural AAA tweaks">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Procedural AAA</strong>
        <button type="button" onClick={() => setOpen(false)} style={{ cursor: 'pointer' }}>
          ×
        </button>
      </div>
      <p style={{ margin: '0 0 8px', opacity: 0.75, lineHeight: 1.35 }}>
        F4 toggle · textures 1024 default / Ultra 2048 only when affordable
      </p>
      <button
        type="button"
        onClick={() => generateProceduralAaaScene()}
        style={{
          width: '100%',
          marginBottom: 8,
          padding: '8px 10px',
          background: '#3a5cff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Generate procedural AAA scene
      </button>
      <button
        type="button"
        onClick={() => resetProceduralAaaParams()}
        style={{
          width: '100%',
          marginBottom: 10,
          padding: '6px 10px',
          background: 'transparent',
          color: '#aab',
          border: '1px solid #445',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Reset defaults
      </button>

      <Slider label="seed" value={params.seed} min={1} max={9999} step={1} onChange={(v) => patch({ seed: v })} />
      <Slider label="sdfResolution" value={params.sdfResolution} min={24} max={64} step={1} onChange={(v) => patch({ sdfResolution: v })} />
      <Slider label="sdfSmoothK" value={params.sdfSmoothK} min={0.2} max={3} step={0.05} onChange={(v) => patch({ sdfSmoothK: v })} />
      <Slider label="terrainAmp" value={params.terrainAmp} min={0.2} max={4} step={0.05} onChange={(v) => patch({ terrainAmp: v })} />
      <Slider label="buildingDensity" value={params.buildingDensity} min={0} max={1} step={0.01} onChange={(v) => patch({ buildingDensity: v })} />
      <Slider label="rockDensity" value={params.rockDensity} min={0} max={1} step={0.01} onChange={(v) => patch({ rockDensity: v })} />
      <Slider label="ruinDensity" value={params.ruinDensity} min={0} max={1} step={0.01} onChange={(v) => patch({ ruinDensity: v })} />
      <Slider label="perlinDisplace" value={params.perlinDisplace} min={0} max={0.8} step={0.01} onChange={(v) => patch({ perlinDisplace: v })} />

      <label style={{ display: 'block', marginBottom: 8 }}>
        textureSize
        <select
          value={params.textureSize}
          onChange={(e) => patch({ textureSize: Number(e.target.value) as TextureResolutionTier })}
          style={{ width: '100%', marginTop: 4 }}
        >
          <option value={512}>512</option>
          <option value={1024}>1024 (default)</option>
          <option value={2048}>2048 (Ultra)</option>
        </select>
      </label>

      <Slider label="parallaxLayers" value={params.parallaxLayers} min={4} max={24} step={1} onChange={(v) => patch({ parallaxLayers: v })} />
      <Slider label="parallaxScale" value={params.parallaxScale} min={0} max={0.12} step={0.001} onChange={(v) => patch({ parallaxScale: v })} />
      <Slider label="anisotropy" value={params.anisotropyStrength} min={0} max={1} step={0.01} onChange={(v) => patch({ anisotropyStrength: v })} />
      <Slider label="wear" value={params.wearAmount} min={0} max={1} step={0.01} onChange={(v) => patch({ wearAmount: v })} />
      <Slider label="dirt" value={params.dirtAmount} min={0} max={1} step={0.01} onChange={(v) => patch({ dirtAmount: v })} />
      <Slider label="rainWash" value={params.rainWash} min={0} max={1} step={0.01} onChange={(v) => patch({ rainWash: v })} />
      <Slider label="skinScatter" value={params.skinScatter} min={0} max={1} step={0.01} onChange={(v) => patch({ skinScatter: v })} />
      <Slider label="walkSpeed" value={params.walkSpeed} min={0.2} max={3} step={0.05} onChange={(v) => patch({ walkSpeed: v })} />
      <Slider label="ikStepHeight" value={params.ikStepHeight} min={0} max={0.35} step={0.01} onChange={(v) => patch({ ikStepHeight: v })} />
      <Slider label="fogDensity" value={params.fogDensity} min={0.005} max={0.08} step={0.001} onChange={(v) => patch({ fogDensity: v })} />
      <Slider label="volumetricRays" value={params.volumetricRays} min={0} max={1} step={0.01} onChange={(v) => patch({ volumetricRays: v })} />
      <Slider label="autoLut" value={params.autoLutStrength} min={0} max={1} step={0.01} onChange={(v) => patch({ autoLutStrength: v })} />
      <Slider label="audioGain" value={params.audioGain} min={0} max={1} step={0.01} onChange={(v) => patch({ audioGain: v })} />
      <Slider label="spectrumFlicker" value={params.spectrumFlicker} min={0} max={1} step={0.01} onChange={(v) => patch({ spectrumFlicker: v })} />
      <Slider label="characterScale" value={params.characterScale} min={0.5} max={1.5} step={0.01} onChange={(v) => patch({ characterScale: v })} />

      <p style={{ marginTop: 8, opacity: 0.55, fontSize: 10 }}>
        Defaults seed={DEFAULT_PROCEDURAL_AAA_PARAMS.seed}
      </p>
    </div>,
    document.body,
  );
}
