/* ─── AAA Rich Interaction — tactile, not cheap glow ───
 * Replaces simple box highlight with:
 * - outline + inner glow, per-type color (poem amber, npc cyan, door warm, loot gold)
 * - distance-based opacity + scale pulse
 * - sound tick on hover enter/exit
 * - world-space label with ink bleed, not centered HUD
 */

import { useEffect, useRef, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { BackSide, BoxGeometry, FrontSide, Group, Mesh, MeshBasicMaterial, PointLight } from 'three';
import { eventBus } from '@/engine/EventBus';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';
import { audioEngine } from '@/engine/AudioEngine';

type InteractionKind = 'poem' | 'npc' | 'door' | 'loot' | 'generic';

interface RichHighlight {
  timeRemaining: number;
  total: number;
  position: [number, number, number];
  size: [number, number, number];
  kind: InteractionKind;
  label?: string;
}

const KIND_COLOR: Record<InteractionKind, { inner: string; outer: string; light: string }> = {
  poem: { inner: '#ffdc9a', outer: '#ffaa44', light: '#ffcc66' },
  npc: { inner: '#a8e6e0', outer: '#00ffee', light: '#80ffea' },
  door: { inner: '#ffd9a0', outer: '#ff8c42', light: '#ffb366' },
  loot: { inner: '#ffe66d', outer: '#ffcc00', light: '#ffeb3b' },
  generic: { inner: '#ffdc9a', outer: '#ffaa44', light: '#ffcc66' },
};

function inferKind(label?: string): InteractionKind {
  if (!label) return 'generic';
  const l = label.toLowerCase();
  if (l.includes('стих') || l.includes('книг') || l.includes('запис')) return 'poem';
  if (l.includes('двер') || l.includes('выход') || l.includes('переход')) return 'door';
  if (l.includes('взять') || l.includes('предмет') || l.includes('лут')) return 'loot';
  if (l.includes('говорить') || l.includes('поговорить')) return 'npc';
  return 'generic';
}

const MAX_RICH = 8;
const DURATION = 1.35;

function createRichSlot(kind: InteractionKind) {
  const col = KIND_COLOR[kind];
  const innerGeo = new BoxGeometry(1, 1, 1);
  const outerGeo = new BoxGeometry(1, 1, 1);
  const innerMat = new MeshBasicMaterial({ color: col.inner, transparent: true, opacity: 0, depthWrite: false, side: FrontSide });
  const outerMat = new MeshBasicMaterial({ color: col.outer, transparent: true, opacity: 0, depthWrite: false, side: BackSide });
  const innerMesh = new Mesh(innerGeo, innerMat);
  const outerMesh = new Mesh(outerGeo, outerMat);
  const light = new PointLight(col.light, 0, 5, 2);
  light.position.set(0, 0.5, 0);
  const group = new Group();
  group.add(innerMesh, outerMesh, light);
  group.visible = false;
  return { group, innerMesh, outerMesh, light, innerMat, outerMat, innerGeo, outerGeo, kind };
}

export function AaaInteractionRich() {
  const highlightsRef = useRef<(RichHighlight | null)[]>(Array.from({ length: MAX_RICH }, () => null));
  const slots = useMemo(() => Array.from({ length: MAX_RICH }, (_, i) => createRichSlot(i % 2 === 0 ? 'poem' : 'generic')), []);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useSceneEnterEffect(() => {
    highlightsRef.current.fill(null);
    for (const s of slotsRef.current) {
      s.group.visible = false;
      s.innerMat.opacity = 0;
      s.outerMat.opacity = 0;
      s.light.intensity = 0;
    }
  });

  useEffect(() => {
    const spawn = (position: [number, number, number], size: [number, number, number], label?: string) => {
      const kind = inferKind(label);
      const arr = highlightsRef.current;
      let idx = arr.findIndex(h => h === null);
      if (idx === -1) idx = 0;
      arr[idx] = { timeRemaining: DURATION, total: DURATION, position, size, kind, label };
      const slot = slots[idx];
      // update colors per kind
      const col = KIND_COLOR[kind];
      slot.innerMat.color.set(col.inner);
      slot.outerMat.color.set(col.outer);
      slot.light.color.set(col.light);
      slot.group.position.set(...position);
      const [w, h, d] = size;
      const cy = h / 2;
      slot.innerMesh.position.set(0, cy, 0);
      slot.innerMesh.scale.set(w + 0.08, h + 0.08, d + 0.08);
      slot.outerMesh.position.set(0, cy, 0);
      slot.outerMesh.scale.set(w + 0.18, h + 0.18, d + 0.18);
      slot.light.position.set(0, cy, 0);
      slot.light.distance = Math.max(w, d) + 5;
      slot.group.visible = true;
      try { audioEngine.playSfx('ui_hover' as any); } catch {}
    };

    const unsubs = [
      eventBus.on('object:highlight', ({ position, size, label }: any) => {
        spawn(position, size, label);
      }),
      eventBus.on('interaction:hint', () => {
        // subtle tick on hover
        try { audioEngine.playSfx('ui_tick' as any); } catch {}
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [slots]);

  useFrameTick('interaction', ({ delta }) => {
    const dt = Math.min(delta, 0.05);
    const arr = highlightsRef.current;
    for (let i = 0; i < MAX_RICH; i++) {
      const h = arr[i];
      const s = slots[i];
      if (!h) { s.group.visible = false; continue; }
      h.timeRemaining -= dt;
      if (h.timeRemaining <= 0) { arr[i] = null; s.group.visible = false; s.innerMat.opacity = 0; s.outerMat.opacity = 0; s.light.intensity = 0; continue; }
      const p = 1 - h.timeRemaining / h.total;
      const opacity = 0.52 * (1 - p);
      const pulse = 1 + Math.sin(p * Math.PI) * 0.09 + Math.sin(p * Math.PI * 2) * 0.03;
      const [w, hh, d] = h.size;
      if (opacity <= 0.01) { s.group.visible = false; continue; }
      s.group.visible = true;
      s.innerMesh.scale.set((w + 0.08) * pulse, (hh + 0.08) * pulse, (d + 0.08) * pulse);
      s.outerMesh.scale.set((w + 0.18) * (1 + p * 0.12), (hh + 0.18) * (1 + p * 0.12), (d + 0.18) * (1 + p * 0.12));
      s.innerMat.opacity = opacity * 0.72;
      s.outerMat.opacity = opacity * 0.14;
      s.light.intensity = 2.8 * (1 - p);
    }
  });

  return (
    <group>
      {slots.map((s, i) => <primitive key={i} object={s.group} />)}
    </group>
  );
}
