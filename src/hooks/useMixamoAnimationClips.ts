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
 * Loads on-disk Mixamo animation GLBs and registers clip actions on an existing mixer.
 * Returns merged action map (embedded clips + Mixamo overrides by canonical name).
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

    const loadBindingAt = (index: number): void => {
      if (cancelled || index >= bindings.length) return;

      if (isUiOverlayBlockingDeferredAssets()) {
        const cancel = scheduleIdleSlice(() => loadBindingAt(index));
        cancelSchedules.push(cancel);
        return;
      }

      const binding = bindings[index];
      scheduleGltfPreload(
        binding.url,
        () => {
          void (async () => {
            try {
              const gltf = await loader.loadAsync(binding.url);
              if (cancelled) return;
              const clip = gltf.animations[0];
              if (!clip) {
                loadBindingAt(index + 1);
                return;
              }
              const renamed = clip.clone();
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
            loadBindingAt(index + 1);
          })();
        },
        GltfPreloadPriority.Deferred,
      );
    };

    loadBindingAt(0);

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
