/* ─── Volodka RPG – optional Mixamo GLB clips merged into a skinned mixer ─── */

import { useEffect, useMemo, useState } from 'react';
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
import { filterClipTracksToExistingNodes, remapClipTracksToSkeleton, stripRootTranslationTracks } from '@/engine/animation/filterClipTracks';

export interface MixamoClipBinding {
  clipId: MixamoClipId;
  url: string;
  canonicalName: string;
  aliases: readonly string[];
}

function getOnDiskMixamoBindings(): MixamoClipBinding[] {
  const onDisk = new Set(MIXAMO_CLIP_IDS_ON_DISK);
  return MIXAMO_ANIMATION_CATALOG.filter((spec) => onDisk.has(spec.id)).map((spec) => ({
    clipId: spec.id,
    url: spec.publicUrl,
    canonicalName: spec.canonicalClipName,
    aliases: spec.clipAliases,
  }));
}

function resolveSourceClip(
  clips: readonly THREE.AnimationClip[],
  binding: MixamoClipBinding,
): THREE.AnimationClip | null {
  const names = [binding.canonicalName, binding.clipId, ...binding.aliases];
  for (const name of names) {
    const exact = clips.find((clip) => clip.name.toLowerCase() === name.toLowerCase());
    if (exact) return exact;
  }
  // Import scripts normally strip files to one clip. Never pick an arbitrary
  // first animation from an unstripped multi-clip GLB.
  return clips.length === 1 ? clips[0] ?? null : null;
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
 * Clip ids that are CRITICAL — must be available immediately for wake + locomotion.
 *
 * Wake needs sleeping (bed) and sitting (desk). Idle/walking cover locomotion.
 * Talking/working stay deferred to cut New Game parse hitch.
 */
const CRITICAL_CLIP_IDS: ReadonlySet<MixamoClipId> = new Set<MixamoClipId>([
  'idle',
  'walking',
  'sitting',
  'sleeping',
]);

/**
 * Loads on-disk Mixamo animation GLBs and registers clip actions on an existing mixer.
 * Returns merged action map (embedded clips + Mixamo overrides by canonical name).
 *
 * Critical clips load IMMEDIATELY (bypass overlay gate + scheduler).
 * Deferred clips (talking, working, …) load sequentially through the scheduler.
 */
export function useMixamoAnimationClips(
  mixer: THREE.AnimationMixer | null,
  root: THREE.Object3D | null,
  embeddedActions: Record<string, THREE.AnimationAction> | null,
): Record<string, THREE.AnimationAction> | null {
  const bindings = getOnDiskMixamoBindings();
  const [mixamoActions, setMixamoActions] = useState<Record<string, THREE.AnimationAction>>({});

  useEffect(() => {
    if (!mixer || !root || bindings.length === 0) {
      return;
    }

    let cancelled = false;
    const cancelSchedules: Array<() => void> = [];
    const createdActions = new Set<THREE.AnimationAction>();
    const loader = new GLTFLoader();
    extendGltfLoader(loader);

    // Coalesce actions that become ready in the same turn. The locomotion pair
    // below is deliberately published together; deferred cinematic arrivals
    // remain independent and do not trigger locomotion re-binding.
    const pendingActions: Record<string, THREE.AnimationAction> = {};
    let flushScheduled = false;
    const scheduleFlush = (): void => {
      if (flushScheduled) return;
      flushScheduled = true;
      queueMicrotask(() => {
        flushScheduled = false;
        if (cancelled) return;
        if (Object.keys(pendingActions).length === 0) return;
        // Snapshot before clearing: React may invoke the state updater after
        // this microtask returns.
        const flushedActions = { ...pendingActions };
        for (const key of Object.keys(pendingActions)) {
          delete pendingActions[key];
        }
        setMixamoActions((prev) => ({ ...prev, ...flushedActions }));
      });
    };

    const loadBindingAction = async (
      binding: MixamoClipBinding,
    ): Promise<THREE.AnimationAction | null> => {
      try {
        const gltf = await loader.loadAsync(binding.url);
        if (cancelled) return null;
        const clip = resolveSourceClip(gltf.animations, binding);
        if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0) return null;

        const filtered = stripRootTranslationTracks(
          filterClipTracksToExistingNodes(
            remapClipTracksToSkeleton(clip, root),
            root,
          ),
        );
        // A clip with no compatible destination tracks would override a valid
        // embedded action with a static bind pose. Keep the fallback instead.
        if (filtered.tracks.length === 0) return null;

        const renamed = filtered.clone();
        renamed.name = binding.canonicalName;
        const action = mixer.clipAction(renamed, root);
        action.enabled = true;
        createdActions.add(action);
        return action;
      } catch {
        // Missing/malformed staged clip: preserve the embedded fallback.
        return null;
      }
    };

    // ── Critical clips: load immediately in parallel (no gate, no scheduler) ──
    // These are needed for the core idle↔walk locomotion blend tree. Without
    // them the avatar has no walk cycle and slides in a static pose.
    const criticalBindings = bindings.filter((b) => CRITICAL_CLIP_IDS.has(b.clipId));
    const locomotionBindings = criticalBindings.filter(
      (binding) => binding.clipId === 'idle' || binding.clipId === 'walking',
    );
    const cinematicCriticalBindings = criticalBindings.filter(
      (binding) => binding.clipId !== 'idle' && binding.clipId !== 'walking',
    );

    // Publish idle + walk atomically. Mixing one newly retargeted action with
    // one embedded action can briefly produce incompatible poses and a hitch.
    void Promise.all(
      locomotionBindings.map(async (binding) => ({
        binding,
        action: await loadBindingAction(binding),
      })),
    ).then((loaded) => {
      if (cancelled) return;
      const completePair =
        locomotionBindings.length === 2 &&
        loaded.every(({ action }) => action !== null);
      if (completePair) {
        for (const { binding, action } of loaded) {
          if (action) pendingActions[binding.canonicalName] = action;
        }
        scheduleFlush();
      } else {
        for (const { action } of loaded) {
          if (!action) continue;
          action.stop();
          mixer.uncacheClip(action.getClip());
          createdActions.delete(action);
        }
      }
    });

    for (const binding of cinematicCriticalBindings) {
      void loadBindingAction(binding).then((action) => {
        if (!cancelled && action) {
          pendingActions[binding.canonicalName] = action;
          scheduleFlush();
        }
      });
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
            const action = await loadBindingAction(binding);
            if (!cancelled && action) {
              pendingActions[binding.canonicalName] = action;
              scheduleFlush();
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
      for (const action of createdActions) {
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
