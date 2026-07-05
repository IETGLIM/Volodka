import { describe, expect, it, vi } from 'vitest';
import type * as THREE from 'three';
import {
  adoptCanvasWebGlRenderer,
  releaseCanvasWebGlRenderer,
  resetCanvasWebGlRendererSingletonForTests,
} from './webGlRendererSingleton';

function mockRenderer(): THREE.WebGLRenderer {
  return { dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
}

describe('webGlRendererSingleton', () => {
  it('disposes the previous renderer when adopting a new one', () => {
    resetCanvasWebGlRendererSingletonForTests();
    const first = mockRenderer();
    const second = mockRenderer();

    adoptCanvasWebGlRenderer(first);
    adoptCanvasWebGlRenderer(second);

    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(second.dispose).not.toHaveBeenCalled();
  });

  it('clears the active renderer on release without double-dispose', () => {
    resetCanvasWebGlRendererSingletonForTests();
    const renderer = mockRenderer();

    adoptCanvasWebGlRenderer(renderer);
    releaseCanvasWebGlRenderer(renderer);
    adoptCanvasWebGlRenderer(mockRenderer());

    expect(renderer.dispose).not.toHaveBeenCalled();
  });
});
