
/* ─── Volodka RPG – Interaction Highlight ───
 *  When the player presses E on an interactive object, this component
 *  renders a brief bright glow effect at the object's position.
 *  The glow fades over ~1 second, giving clear visual feedback.
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { BackSide, BoxGeometry, FrontSide, Group, Mesh, MeshBasicMaterial, Object3D, PointLight, SpotLight } from 'three';
import { eventBus } from '@/engine/EventBus';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';

interface ActiveHighlight {
  timeRemaining: number;
  position: [number, number, number];
  size: [number, number, number];
}

interface SlotResources {
  group: Group;
  innerMesh: Mesh;
  outerMesh: Mesh;
  light: PointLight;
  spotLight: SpotLight;
  innerMat: MeshBasicMaterial;
  outerMat: MeshBasicMaterial;
  innerGeo: BoxGeometry;
  outerGeo: BoxGeometry;
}

const MAX_HIGHLIGHTS = 12;
const HIGHLIGHT_DURATION = 1.15;
const HIGHLIGHT_MAX_OPACITY = 0.48;
const HIGHLIGHT_GLOW_INTENSITY = 2.4;
// AAA filmi: warm amber glow — not cheap neon, but lived-in memory glow
const HIGHLIGHT_COLOR = '#ffdc9a';

function createSlot(): SlotResources {
  const innerGeo = new BoxGeometry(1, 1, 1);
  const outerGeo = new BoxGeometry(1, 1, 1);

  const innerMat = new MeshBasicMaterial({
    color: HIGHLIGHT_COLOR,
    transparent: true,
    opacity: 0,
    side: FrontSide,
    depthWrite: false,
  });
  const outerMat = new MeshBasicMaterial({
    color: HIGHLIGHT_COLOR,
    transparent: true,
    opacity: 0,
    side: BackSide,
    depthWrite: false,
  });

  const innerMesh = new Mesh(innerGeo, innerMat);
  const outerMesh = new Mesh(outerGeo, outerMat);

  const light = new PointLight(HIGHLIGHT_COLOR, 0, 4, 2);
  light.position.set(0, 0.5, 0);

  const spotLight = new SpotLight(HIGHLIGHT_COLOR, 0, 5, 0.52, 0.85, 1);
  spotLight.position.set(0, 2.5, 0.2);
  const spotTarget = new Object3D();
  spotTarget.position.set(0, 0, 0);
  spotLight.target = spotTarget;

  const group = new Group();
  group.add(innerMesh);
  group.add(outerMesh);
  group.add(light);
  group.add(spotLight);
  group.add(spotTarget);
  group.visible = false;

  return {
    group,
    innerMesh,
    outerMesh,
    light,
    spotLight,
    innerMat,
    outerMat,
    innerGeo,
    outerGeo,
  };
}

function applyHighlightLayout(slot: SlotResources, size: [number, number, number]) {
  const [w, h, d] = size;
  const centerY = h / 2;

  slot.innerMesh.position.set(0, centerY, 0);
  slot.innerMesh.scale.set(w + 0.06, h + 0.06, d + 0.06);

  slot.outerMesh.position.set(0, centerY, 0);
  slot.outerMesh.scale.set(w + 0.12, h + 0.12, d + 0.12);

  slot.light.position.set(0, centerY, 0);
  slot.light.distance = Math.max(w, d) + 4;
  slot.spotLight.position.set(0, centerY + Math.max(h, 1.2), 0.15);
  slot.spotLight.target.position.set(0, centerY, 0);
}

function disposeSlot(slot: SlotResources) {
  slot.light.removeFromParent();
  slot.spotLight.removeFromParent();
  slot.spotLight.target.removeFromParent();
  slot.light.dispose();
  slot.spotLight.dispose();

  slot.innerGeo.dispose();
  slot.outerGeo.dispose();
  slot.innerMat.dispose();
  slot.outerMat.dispose();
}

/**
 * Renders a brief 3D glow effect on interacted objects.
 * Listens for 'object:highlight' events from the EventBus.
 */
export function InteractionHighlight() {
  const highlightsRef = useRef<(ActiveHighlight | null)[]>(
    Array.from({ length: MAX_HIGHLIGHTS }, () => null),
  );

  const slots = useMemo(
    () => Array.from({ length: MAX_HIGHLIGHTS }, () => createSlot()),
    [],
  );
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useSceneEnterEffect(() => {
    highlightsRef.current.fill(null);
    for (const slot of slotsRef.current) {
      slot.group.visible = false;
      slot.innerMat.opacity = 0;
      slot.outerMat.opacity = 0;
      slot.light.intensity = 0;
      slot.spotLight.intensity = 0;
    }
  });

  useEffect(() => {
    const slotList = slots;
    return () => {
      slotList.forEach(disposeSlot);
    };
  }, [slots]);

  useEffect(() => {
    const spawnHighlight = (position: [number, number, number], size: [number, number, number]) => {
      const highlights = highlightsRef.current;
      let slotIndex = highlights.findIndex((h) => h === null);

      if (slotIndex === -1) {
        let oldestTime = Infinity;
        for (let i = 0; i < highlights.length; i++) {
          const h = highlights[i];
          if (h && h.timeRemaining < oldestTime) {
            oldestTime = h.timeRemaining;
            slotIndex = i;
          }
        }
        if (slotIndex === -1) return;
      }

      highlights[slotIndex] = {
        timeRemaining: HIGHLIGHT_DURATION,
        position,
        size,
      };

      const slot = slots[slotIndex];
      slot.group.position.set(...position);
      applyHighlightLayout(slot, size);
      slot.group.visible = true;
    };

    const unsub = eventBus.on('object:highlight', ({ position, size }) => {
      spawnHighlight(position, size);
    });

    return unsub;
  }, [slots]);

  useFrameTick('interaction', ({ delta }) => {
    const dt = Math.min(delta, 0.05);
    const highlights = highlightsRef.current;

    for (let i = 0; i < MAX_HIGHLIGHTS; i++) {
      const highlight = highlights[i];
      const slot = slots[i];

      if (!highlight) {
        slot.group.visible = false;
        continue;
      }

      highlight.timeRemaining -= dt;

      if (highlight.timeRemaining <= 0) {
        highlights[i] = null;
        slot.group.visible = false;
        slot.innerMat.opacity = 0;
        slot.outerMat.opacity = 0;
        slot.light.intensity = 0;
        slot.spotLight.intensity = 0;
        continue;
      }

      const progress = 1 - highlight.timeRemaining / HIGHLIGHT_DURATION;
      const opacity = HIGHLIGHT_MAX_OPACITY * (1 - progress);
      const glowIntensity = HIGHLIGHT_GLOW_INTENSITY * (1 - progress);
      const scalePulse = 1 + Math.sin(progress * Math.PI) * 0.06;

      if (opacity <= 0.01) {
        slot.group.visible = false;
        continue;
      }

      slot.group.visible = true;
      const [w, h, d] = highlight.size;

      slot.innerMesh.scale.set(
        (w + 0.06) * scalePulse,
        (h + 0.06) * scalePulse,
        (d + 0.06) * scalePulse,
      );
      slot.innerMat.opacity = opacity * 0.7;
      slot.outerMat.opacity = opacity * 0.12;
      slot.light.intensity = glowIntensity;
      slot.spotLight.intensity = glowIntensity * 0.85;
    }
  });

  return (
    <group>
      {slots.map((slot, index) => (
        <primitive key={index} object={slot.group} />
      ))}
    </group>
  );
}
