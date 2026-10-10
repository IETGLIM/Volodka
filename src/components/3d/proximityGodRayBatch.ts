import type { RefObject } from 'react';
import type { Group, Mesh, MeshBasicMaterial, PointLight, SpotLight } from 'three';
import {
  registerFrameTick,
  unregisterFrameTick,
} from '@/engine/frame/FrameBudgetRegistry';
import type { FrameTickContext } from '@/engine/frame/types';
import type { ProximityGodRayProps } from './ProximityGodRayTypes';

/**
 * PERF (v4.40, этап 27): центральный батч-тик всех ProximityGodRay сцены.
 *
 * Раньше каждый экземпляр луча регистрировал собственный useFrameTick
 * ('interaction') — 17-19 тиков на сцену, каждый со своей guard-обёрткой,
 * ключом таймингов и парой performance.now(). Теперь экземпляры живут в
 * одном реестре и обслуживаются ОДНИМ зарегистрированным тиком:
 *   - счётчик Registered ticks сокращается на ~19 записей;
 *   - пер-тиковый overhead (guard, key-build, profiling) выполняется один
 *     раз на кадр, а не N раз;
 *   - неактивные лучи по-прежнему выходят мгновенно (edge-triggered
 *     видимость из v4.40), активные обновляются как раньше.
 *
 * Логика обновления конкретного луча не изменилась — перенесена как есть.
 */
export interface GodRayBatchEntry {
  /** Latest render props (mirrored each render — avoids stale closures). */
  props: ProximityGodRayProps;
  usesActiveRef: boolean;
  rootGroup: RefObject<Group | null>;
  spot: RefObject<SpotLight | null>;
  fill: RefObject<PointLight | null>;
  coneMat: RefObject<MeshBasicMaterial | null>;
  glintMat: RefObject<MeshBasicMaterial | null>;
  glintMesh: RefObject<Mesh | null>;
  hidden: boolean;
  /** Self-advanced pulse phase when no parent pulsePhaseRef is provided. */
  pulse: number;
}

const batchEntries = new Set<GodRayBatchEntry>();
let batchTickId: number | null = null;

export function runProximityGodRayBatch({ delta }: FrameTickContext): void {
  for (const entry of batchEntries) {
    const { props } = entry;
    const liveActive = entry.usesActiveRef
      ? (props.activeRef?.current ?? false)
      : (props.active ?? false);

    if (!liveActive) {
      if (!entry.hidden) {
        entry.hidden = true;
        if (entry.rootGroup.current) entry.rootGroup.current.visible = false;
      }
      continue;
    }

    const liveColor = props.colorRef?.current ?? props.color ?? '#88eeff';
    if (entry.hidden) {
      entry.hidden = false;
      if (entry.rootGroup.current) entry.rootGroup.current.visible = true;
    }
    if (!props.pulsePhaseRef) entry.pulse += delta * 3.4;
    const prox = Math.max(0.25, Math.min(1, props.proximityRef?.current ?? 1));
    const phase = props.pulsePhaseRef?.current ?? entry.pulse;
    const hoverPulse = props.staticHighlightRef?.current ? 0 : Math.sin(phase) * 0.14;
    const flashBoost = props.flashRef?.current ? 0.55 : 0;
    const intensity = (0.4 + hoverPulse + flashBoost) * prox;

    if (entry.spot.current) {
      entry.spot.current.intensity = intensity;
      entry.spot.current.color.set(liveColor);
    }
    if (entry.fill.current) {
      entry.fill.current.intensity = intensity * 0.62;
      entry.fill.current.color.set(liveColor);
    }
    if (entry.coneMat.current) {
      entry.coneMat.current.opacity = (0.1 + hoverPulse * 0.04 + flashBoost * 0.06) * prox;
      entry.coneMat.current.color.set(liveColor);
    }
    if (entry.glintMat.current) {
      entry.glintMat.current.opacity = (0.24 + Math.max(hoverPulse, 0) * 0.22 + flashBoost * 0.16) * prox;
      entry.glintMat.current.color.set(liveColor);
    }
    if (entry.glintMesh.current) {
      const scale = 1 + Math.max(hoverPulse, 0) * 0.75 + flashBoost * 0.6;
      entry.glintMesh.current.scale.setScalar(scale);
    }
  }
}

export function addGodRayBatchEntry(entry: GodRayBatchEntry): void {
  batchEntries.add(entry);
  if (batchTickId == null) {
    batchTickId = registerFrameTick('interaction', runProximityGodRayBatch, {
      label: 'ProximityGodRayBatch',
    });
  }
}

export function removeGodRayBatchEntry(entry: GodRayBatchEntry): void {
  batchEntries.delete(entry);
  if (batchTickId != null && batchEntries.size === 0) {
    unregisterFrameTick(batchTickId);
    batchTickId = null;
  }
}

/** Soft-active beams for tests: registry inspection without renderer. */
export function getGodRayBatchEntryCountForTests(): number {
  return batchEntries.size;
}

/** Soft-active beams for tests: one central tick, not one per instance. */
export function isGodRayBatchTickRegisteredForTests(): boolean {
  return batchTickId != null;
}

/** Soft-active beams for tests. */
export function resetGodRayBatchForTests(): void {
  batchEntries.clear();
  if (batchTickId != null) {
    unregisterFrameTick(batchTickId);
    batchTickId = null;
  }
}
