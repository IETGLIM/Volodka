import { afterEach, describe, expect, it, vi } from 'vitest';

describe('explorationDiagnostics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('включает предикаты при значении env «1»', async () => {
    vi.stubEnv('NEXT_PUBLIC_EXPLORATION_RAPIER_DEBUG_COLLIDERS', '1');
    vi.stubEnv('NEXT_PUBLIC_EXPLORATION_MESH_AUDIT', '1');
    vi.stubEnv('NEXT_PUBLIC_EXPLORATION_NOCLIP', '1');
    vi.stubEnv('NEXT_PUBLIC_EXPLORATION_WEBGL_CONTEXT_LOG', '1');
    vi.stubEnv('NEXT_PUBLIC_EXPLORATION_SCALE_DEBUG', '1');
    const m = await import('./explorationDiagnostics');
    expect(m.isExplorationRapierColliderDebugEnabled()).toBe(true);
    expect(m.isExplorationMeshAuditEnabled()).toBe(true);
    expect(m.isExplorationNoclipEnabled()).toBe(true);
    expect(m.isExplorationWebGlContextLogEnabled()).toBe(true);
    expect(m.isExplorationScaleDebugEnabled()).toBe(true);
  });
});
