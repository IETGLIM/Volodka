/* ─── Volodka RPG – optional Mixamo GLB clips merged into a skinned mixer ─── */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { MixamoClipId } from '@/config/mixamoAnimationCatalog';
import { MIXAMO_ANIMATION_CATALOG } from '@/config/mixamoAnimationCatalog';
import { MIXAMO_CLIP_IDS_ON_DISK } from '@/config/mixamoClipsOnDisk';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { isUiOverlayBlockingDeferredAssets } from '@/engine/assets/gltfPreloadOverlayGate';
import {
  GltfPreloadPriority,
  scheduleGltfPreload,
} from '@/engine/assets/gltfPreloadScheduler';
import { filterClipTracksToExistingNodes } from '@/engine/animation/filterClipTracks';

export interface MixamoClipBinding {
  clipId: MixamoClipId;
  url: string;
  canonicalName: string;
}

function getOnDiskMixamoBindings(): MixamoClipBinding[] {
  const onDisk = new Set(MIXAMO_CLIP_IDS_ON_DISK);
  return MIXAMO_ANIMATION_CATALOG.filter((spec) => onDisk.has(spec.id)).map((spec) => ({
    clipId: spec.id,
    url: spec.publicUrl,
    canonicalName: spec.canonicalClipName,
  }));
}

function scheduleIdleSlice(callback: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const idleId = requestIdleCallback(callback, { timeout: 48 });
    return () => cancelIdleCallback(idleId);
  }
  const timeoutId = setTimeout(callback, 0);
  return () => clearTimeout(timeoutId);
}

/**
 * Clip ids that are CRITICAL — must be available immediately, before any
 * cutscene or gameplay movement begins.
 *
 * The embedded Quaternius player/NPC GLBs ship 24 properly-named clips
 * (Idle, Idle_Neutral, Walk, Run, Wave, Interact, …) that already cover
 * idle/walk/run locomotion. The Mixamo catalog adds 6 supplementary clips
 * for states the embedded GLB does NOT provide: idle, walking, talking,
 * sitting, sleeping, working. Of these, idle/walking are aliases for the
 * embedded clips (loaded as canonical-name overrides), while talking/
 * sitting/sleeping/working are the ONLY source for those states.
 *
 * The deferred loader (below) is gated by `isUiOverlayBlockingDeferredAssets()`
 * which PAUSES during story overlays / examine panels. The wake-up cutscene
 * needs the 'sleeping' clip in phase 1 (lying in bed) and 'sitting' in
 * phases 5-8 (at desk) — if these are deferred, the avatar falls back to
 * the embedded 'idle' clip and slides in a standing pose while the
 * cutscene claims the character is lying/sitting.
 *
 * Marking all 6 clips as CRITICAL bypasses BOTH the scheduler and the
 * overlay gate, loading them in parallel immediately when the mixer is
 * ready. They are small (~56KB each, ~340KB total) and already preloaded
 * into the browser HTTP cache by `useGLTF.preload` calls at module load
 * in CesiumPlayerModel.tsx, so `loader.loadAsync` hits the cache and
 * resolves in ~1-2ms per clip.
 */
const CRITICAL_CLIP_IDS: ReadonlySet<MixamoClipId> = new Set<MixamoClipId>([
  'idle',
  'walking',
  'talking',
  'sitting',
  'sleeping',
  'working',
]);

/**
 * Loads on-disk Mixamo animation GLBs and registers clip actions on an existing mixer.
 * Returns merged action map (embedded clips + Mixamo overrides by canonical name).
 *
 * Critical clips (idle, walking) load IMMEDIATELY, bypassing the overlay gate
 * and the preload scheduler. Deferred clips (talking, sitting, sleeping, working)
 * load sequentially through the scheduler, paused while UI overlays are open.
 */
export function useMixamoAnimationClips(
  mixer: THREE.AnimationMixer | null,
  root: THREE.Object3D | null,
  embeddedActions: Record<string, THREE.AnimationAction> | null,
): Record<string, THREE.AnimationAction> | null {
  const bindings = getOnDiskMixamoBindings();
  const [mixamoActions, setMixamoActions] = useState<Record<string, THREE.AnimationAction>>({});
  const mixamoActionsRef = useRef(mixamoActions);
  mixamoActionsRef.current = mixamoActions;

  useEffect(() => {
    if (!mixer || !root || bindings.length === 0) {
      return;
    }

    let cancelled = false;
    const cancelSchedules: Array<() => void> = [];
    const loader = new GLTFLoader();
    extendGltfLoader(loader);

    // ── Critical clips: load immediately in parallel (no gate, no scheduler) ──
    // These are needed for the core idle↔walk locomotion blend tree. Without
    // them the avatar has no walk cycle and slides in a static pose.
    const criticalBindings = bindings.filter((b) => CRITICAL_CLIP_IDS.has(b.clipId));
    for (const binding of criticalBindings) {
      void (async () => {
        try {
          const gltf = await loader.loadAsync(binding.url);
          if (cancelled) return;
          const clip = gltf.animations[0];
          if (!clip) return;
          // Filter out tracks targeting bones that don't exist in the
          // destination rig (Mixamo clips reference handl/handr/handslotl/
          // handslotr/Rig_Medium which don't exist in the Quaternius
          // player skeleton). Silences THREE.PropertyBinding warnings and
          // avoids wasted per-frame binding-resolution work.
          const filtered = filterClipTracksToExistingNodes(clip, root);
          const renamed = filtered.clone();
          renamed.name = binding.canonicalName;
          const action = mixer.clipAction(renamed, root);
          action.enabled = true;
          setMixamoActions((prev) => ({
            ...prev,
            [binding.canonicalName]: action,
          }));
        } catch {
          // Clip missing on disk despite on-disk registry — skip.
        }
      })();
    }

    // ── Deferred clips: load sequentially through scheduler (gated by overlay) ──
    const deferredBindings = bindings.filter((b) => !CRITICAL_CLIP_IDS.has(b.clipId));
    const loadDeferredAt = (index: number): void => {
      if (cancelled || index >= deferredBindings.length) return;

      if (isUiOverlayBlockingDeferredAssets()) {
        const cancel = scheduleIdleSlice(() => loadDeferredAt(index));
        cancelSchedules.push(cancel);
        return;
      }

      const binding = deferredBindings[index];
      scheduleGltfPreload(
        binding.url,
        () => {
          void (async () => {
            try {
              const gltf = await loader.loadAsync(binding.url);
              if (cancelled) return;
              const clip = gltf.animations[0];
              if (!clip) {
                loadDeferredAt(index + 1);
                return;
              }
              // Filter orphan tracks (see criticalBindings comment above).
              const filtered = filterClipTracksToExistingNodes(clip, root);
              const renamed = filtered.clone();
              renamed.name = binding.canonicalName;
              const action = mixer.clipAction(renamed, root);
              action.enabled = true;
              setMixamoActions((prev) => ({
                ...prev,
                [binding.canonicalName]: action,
              }));
            } catch {
              // Clip missing on disk despite on-disk registry — skip until re-import.
            }
            loadDeferredAt(index + 1);
          })();
        },
        GltfPreloadPriority.Deferred,
      );
    };

    loadDeferredAt(0);

    return () => {
      cancelled = true;
      for (const cancel of cancelSchedules) cancel();
      for (const action of Object.values(mixamoActionsRef.current)) {
        action.stop();
        mixer.uncacheClip(action.getClip());
      }
      setMixamoActions({});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- MIXAMO_CLIP_IDS_ON_DISK is module constant
  }, [mixer, root, MIXAMO_CLIP_IDS_ON_DISK.join(',')]);

  return useMemo(() => {
    if (!embeddedActions && Object.keys(mixamoActions).length === 0) {
      return null;
    }
    return { ...(embeddedActions ?? {}), ...mixamoActions };
  }, [embeddedActions, mixamoActions]);
}
