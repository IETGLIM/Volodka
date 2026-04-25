'use client';

import React, { useEffect, useRef, Suspense, memo, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { eventBus } from '@/engine/events/EventBus';
import type { StreamingChunkId } from '@/data/streamingChunkId';
import { retainGltfModelUrl, releaseGltfModelUrl } from '@/lib/gltfModelCache';
import { isExplorationStreamingDebugEnabled } from '@/lib/explorationDiagnostics';

/**
 * React wrapper for streaming chunk.
 * - Renders children in Suspense when active.
 * - Emits `streaming:chunk_activated` after mount (allows Rapier bodies to register).
 * - On unmount or deactivation: cleanup, emit `streaming:chunk_deactivated`.
 * - Integrates with gltfModelCache for retain/release.
 * See docs/scene-streaming-spec.md v0.2 for lifecycle contract.
 */
export const StreamingChunk = memo(function StreamingChunk({
  chunkId,
  children,
  assets = [],
}: {
  chunkId: StreamingChunkId;
  children: ReactNode;
  /** Optional list of URLs to retain on activation (for prefetch/LRU). */
  assets?: string[];
}) {
  const { scene } = useThree();
  const hasEmittedActivated = useRef(false);
  const mountedAssets = useRef<string[]>([]);

  // Retain assets on mount
  useEffect(() => {
    const toRetain = assets.filter(Boolean);
    toRetain.forEach((url) => {
      retainGltfModelUrl(url);
      mountedAssets.current.push(url);
    });

    return () => {
      mountedAssets.current.forEach((url) => releaseGltfModelUrl(url));
      mountedAssets.current = [];
    };
  }, [assets]);

  // Emit activated after mount (give Rapier one frame to register bodies)
  useEffect(() => {
    if (hasEmittedActivated.current) return;

    const rafId = requestAnimationFrame(() => {
      const rapierBodyCount = scene.children.reduce((count, child) => {
        // Rough count of RigidBody descendants (heuristic)
        if ((child as any).userData?.isRigidBody) count++;
        return count;
      }, 0);

      eventBus.emit('streaming:chunk_activated', {
        chunkId,
        sceneId: undefined, // can be passed from parent if needed
        rapierBodyCount: rapierBodyCount > 0 ? rapierBodyCount : undefined,
      });
      hasEmittedActivated.current = true;

      if (isExplorationStreamingDebugEnabled()) {
        console.info(`[StreamingChunk] activated: ${chunkId} (bodies ~${rapierBodyCount})`);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [chunkId, scene]);

  // Cleanup on unmount -> emit deactivated
  useEffect(() => {
    return () => {
      if (isExplorationStreamingDebugEnabled()) {
        console.info(`[StreamingChunk] deactivated (unmount): ${chunkId}`);
      }
      eventBus.emit('streaming:chunk_deactivated', { chunkId });
      hasEmittedActivated.current = false;
    };
  }, [chunkId]);

  return (
    <Suspense fallback={null}>
      <group userData={{ streamingChunkId: chunkId }}>
        {children}
      </group>
    </Suspense>
  );
});
