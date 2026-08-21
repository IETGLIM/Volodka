'use client';

/* ─── Volodka RPG – Clothing Visual Overlay ───
 * Читает visualTag экипированной одежды и рендерит
 * цветные оверлеи на процедурной модели игрока.
 */

import { useMemo } from 'react';
import { DoubleSide } from 'three';
import { useGameSelector } from '@/store/selectors/hooks';
import { getClothingById } from '@/data/clothingCatalog';
import type { EquipmentSlot } from '@/shared/types/definitions/items';

/* ─── Color palette per visualTag ─── */

interface OverlayColor {
  main: string;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
}

/** Визуальная палитра для каждой вещи — постсоветский киберпанк */
const VISUAL_TAG_COLORS: Record<string, OverlayColor> = {
  /* Head */
  head_ushanka_worn:      { main: '#4a3520', emissive: '#2a1a10', emissiveIntensity: 0.08, opacity: 0.75 },
  head_cyber_visor:       { main: '#0a3a4a', emissive: '#00ccdd', emissiveIntensity: 0.35, opacity: 0.55 },
  head_hard_hat:          { main: '#a08818', emissive: '#c8a820', emissiveIntensity: 0.12, opacity: 0.7 },
  head_bandana_neon:      { main: '#8a1144', emissive: '#cc2266', emissiveIntensity: 0.30, opacity: 0.6 },

  /* Body — тёмные куртки/плащи */
  body_worn_jacket:       { main: '#2a2a2e', emissive: '#1a1a20', emissiveIntensity: 0.06, opacity: 0.8 },
  body_it_uniform:        { main: '#2a2a38', emissive: '#1a1a2e', emissiveIntensity: 0.05, opacity: 0.85 },
  body_cyber_coat:        { main: '#1a2a2e', emissive: '#00ccdd', emissiveIntensity: 0.15, opacity: 0.7 },
  body_leather_jacket:    { main: '#3a2820', emissive: '#2a1a10', emissiveIntensity: 0.08, opacity: 0.8 },
  body_worker_overalls:   { main: '#3a3a20', emissive: '#4a4a30', emissiveIntensity: 0.04, opacity: 0.75 },

  /* Legs */
  legs_worn_jeans:        { main: '#2e3545', emissive: '#1a2030', emissiveIntensity: 0.04, opacity: 0.7 },
  legs_cyber_pants:       { main: '#1a2a2e', emissive: '#00ccdd', emissiveIntensity: 0.12, opacity: 0.65 },
  legs_uniform_pants:     { main: '#2a2a38', emissive: '#1a1a2e', emissiveIntensity: 0.05, opacity: 0.8 },
  legs_track_pants:       { main: '#4a5568', emissive: '#6b7280', emissiveIntensity: 0.04, opacity: 0.65 },

  /* Feet */
  feet_worn_boots:        { main: '#3a2820', emissive: '#2a1a10', emissiveIntensity: 0.06, opacity: 0.7 },
  feet_cyber_sneakers:    { main: '#1a1a2e', emissive: '#00ccdd', emissiveIntensity: 0.20, opacity: 0.6 },
  feet_formal_shoes:      { main: '#1a1a1a', emissive: '#0a0a0a', emissiveIntensity: 0.03, opacity: 0.8 },

  /* Hands */
  hands_work_gloves:      { main: '#6a5a30', emissive: '#8a7a40', emissiveIntensity: 0.05, opacity: 0.55 },
  hands_cyber_gloves:     { main: '#1a2a2e', emissive: '#00ccdd', emissiveIntensity: 0.18, opacity: 0.55 },

  /* Accessory — no 3D overlay by default */
  accessory_server_tag:   { main: '#2a2a38', emissive: '#4a4a6a', emissiveIntensity: 0.10, opacity: 0.4 },
  accessory_poetry_amulet:{ main: '#4a2a5a', emissive: '#8a44aa', emissiveIntensity: 0.25, opacity: 0.45 },
};

/* ─── Slot → body overlay positioning ─── */

interface OverlayPlacement {
  position: [number, number, number];
  size: [number, number, number];
}

/** Расположение оверлея для каждого слота экипировки */
const SLOT_PLACEMENT: Partial<Record<EquipmentSlot, OverlayPlacement>> = {
  head:     { position: [0, 1.55, 0],    size: [0.28, 0.15, 0.28] },
  body:     { position: [0, 0.95, 0.02], size: [0.5, 0.65, 0.25] },
  legs:     { position: [0, 0.4, 0],     size: [0.35, 0.7, 0.2] },
  feet:     { position: [0, 0.12, 0.02], size: [0.3, 0.18, 0.22] },
  hands:    { position: [0, 0.78, 0.18], size: [0.12, 0.25, 0.1] },
  accessory:{ position: [0, 1.48, 0.08], size: [0.1, 0.12, 0.05] },
};

/* ─── Component ─── */

/**
 * Оверлей экипировки — цветные полупрозрачные мешы поверх
 * частей тела процедурной модели. Читает visualTag из каталога
 * одежды и мапит на цветовую палитру.
 */
export function ClothingVisualOverlay() {
  // Читаем экипировку из стора
  const equippedVisualTags = useGameSelector((s) => {
    const entries = s.playerState.equippedItems;
    const tags: Array<{ slot: EquipmentSlot; visualTag: string }> = [];
    for (const [slot, item] of Object.entries(entries) as [EquipmentSlot, typeof entries[EquipmentSlot]][]) {
      if (!item) continue;
      const clothing = getClothingById(item.id as string);
      if (clothing) {
        tags.push({ slot, visualTag: clothing.visualTag });
      }
    }
    return tags;
  });

  // Кешируем оверлеи — избегаем лишних рендеров
  const overlays = useMemo(() => {
    return equippedVisualTags
      .map(({ slot, visualTag }) => {
        const color = VISUAL_TAG_COLORS[visualTag];
        const placement = SLOT_PLACEMENT[slot];
        if (!color || !placement) return null;
        return { slot, visualTag, color, placement };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [equippedVisualTags]);

  if (overlays.length === 0) return null;

  return (
    <group name="clothingOverlay">
      {overlays.map(({ slot, color, placement }) => {
        const [px, py, pz] = placement.position;
        const [sx, sy, sz] = placement.size;
        return (
          <mesh
            key={slot}
            name={`clothing_${slot}`}
            position={[px, py, pz]}
            renderOrder={1}
          >
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial
              color={color.main}
              emissive={color.emissive}
              emissiveIntensity={color.emissiveIntensity}
              transparent
              opacity={color.opacity}
              roughness={0.7}
              metalness={0.1}
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
