
/* ─── Volodka RPG – Interaction Highlight ───
 *  When the player presses E on an interactive object, this component
 *  renders a brief bright glow effect at the object's position.
 *  The glow fades over ~1 second, giving clear visual feedback.
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';

interface ActiveHighlight {
  timeRemaining: number;
  position: [number, number, number];
  size: [number, number, number];
}

interface SlotResources {
  group: THREE.Group;
  innerMesh: THREE.Mesh;
  outerMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  light: THREE.PointLight;
  innerMat: THREE.MeshBasicMaterial;
  outerMat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
  innerGeo: THREE.BoxGeometry;
  outerGeo: THREE.BoxGeometry;
  ringGeo: THREE.RingGeometry;
}

const MAX_HIGHLIGHTS = 12;
const HIGHLIGHT_DURATION = 1.0;
const HIGHLIGHT_MAX_OPACITY = 0.45;
const HIGHLIGHT_GLOW_INTENSITY = 2.5;
const HIGHLIGHT_COLOR = '#00ffee';

function createSlot(): SlotResources {
  const innerGeo = new THREE.BoxGeometry(1, 1, 1);
  const outerGeo = new THREE.BoxGeometry(1, 1, 1);
  const ringGeo = new THREE.RingGeometry(0.4, 0.75, 32);

  const innerMat = new THREE.MeshBasicMaterial({
    color: HIGHLIGHT_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  const outerMat = new THREE.MeshBasicMaterial({
    color: HIGHLIGHT_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: HIGHLIGHT_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.02;

  const light = new THREE.PointLight(HIGHLIGHT_COLOR, 0, 4, 2);
  light.position.set(0, 0.5, 0);

  const group = new THREE.Group();
  group.add(innerMesh);
  group.add(outerMesh);
  group.add(ringMesh);
  group.add(light);
  group.visible = false;

  return {
    group,
    innerMesh,
    outerMesh,
    ringMesh,
    light,
    innerMat,
    outerMat,
    ringMat,
    innerGeo,
    outerGeo,
    ringGeo,
  };
}

function configureRingGeometry(slot: SlotResources, size: [number, number, number]) {
  const maxDim = Math.min(Math.max(size[0], size[2]), 1.2);
  const innerR = Math.max(maxDim / 2 - 0.08, 0.28);
  const outerR = Math.min(maxDim / 2 + 0.12, 0.48);
  slot.ringGeo.dispose();
  slot.ringGeo = new THREE.RingGeometry(innerR, outerR, 32);
  slot.ringMesh.geometry = slot.ringGeo;
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
}

function disposeSlot(slot: SlotResources) {
  slot.innerGeo.dispose();
  slot.outerGeo.dispose();
  slot.ringGeo.dispose();
  slot.innerMat.dispose();
  slot.outerMat.dispose();
  slot.ringMat.dispose();
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
      configureRingGeometry(slot, size);
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
        slot.ringMat.opacity = 0;
        slot.light.intensity = 0;
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
      slot.ringMat.opacity = opacity * 0.5;
      slot.light.intensity = glowIntensity;
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
