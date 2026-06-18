/* ─── Volodka RPG – optional Mixamo GLB clips merged into a skinned mixer ─── */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { MixamoClipId } from '@/config/mixamoAnimationCatalog';
import { MIXAMO_ANIMATION_CATALOG } from '@/config/mixamoAnimationCatalog';
import { MIXAMO_CLIP_IDS_ON_DISK } from '@/config/mixamoClipsOnDisk';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';

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
    const loader = new GLTFLoader();
    extendGltfLoader(loader);

    const loadAll = async () => {
      const next: Record<string, THREE.AnimationAction> = {};
      for (const binding of bindings) {
        try {
          const gltf = await loader.loadAsync(binding.url);
          if (cancelled) return;
          const clip = gltf.animations[0];
          if (!clip) continue;
          const renamed = clip.clone();
          renamed.name = binding.canonicalName;
          next[binding.canonicalName] = mixer.clipAction(renamed, root);
        } catch {
          // Clip missing on disk despite on-disk registry — skip until re-import.
        }
      }
      if (!cancelled) setMixamoActions(next);
    };

    void loadAll();

    return () => {
      cancelled = true;
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
