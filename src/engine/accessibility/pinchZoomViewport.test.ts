/**
 * Тесты viewport-меты пинч-зума (аудит этап 121).
 * Окружение node — document подменяется vi.stubGlobal.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyPinchZoomViewport,
  findViewportMeta,
  VIEWPORT_META_CONTENT_GAME,
  VIEWPORT_META_CONTENT_ZOOMABLE,
} from './pinchZoomViewport';

function stubDocument(withMeta: boolean): { meta: { content: string } | null } {
  const meta = withMeta ? { content: VIEWPORT_META_CONTENT_GAME } : null;
  const document = {
    querySelector: vi.fn((selector: string) =>
      selector === 'meta[name="viewport"]' ? meta : null,
    ),
  };
  vi.stubGlobal('document', document);
  return { meta };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pinchZoomViewport', () => {
  it('включённый зум переписывает мету на зумируемую', () => {
    const { meta } = stubDocument(true);
    applyPinchZoomViewport(true);
    expect(meta!.content).toBe(VIEWPORT_META_CONTENT_ZOOMABLE);
    expect(VIEWPORT_META_CONTENT_ZOOMABLE).not.toContain('user-scalable=no');
    expect(VIEWPORT_META_CONTENT_ZOOMABLE).not.toContain('maximum-scale=1');
  });

  it('выключенный зум возвращает игровую фиксацию', () => {
    const { meta } = stubDocument(true);
    meta!.content = VIEWPORT_META_CONTENT_ZOOMABLE;
    applyPinchZoomViewport(false);
    expect(meta!.content).toBe(VIEWPORT_META_CONTENT_GAME);
    expect(VIEWPORT_META_CONTENT_GAME).toContain('user-scalable=no');
  });

  it('идемпотентно — повторный вызов не меняет контент', () => {
    const { meta } = stubDocument(true);
    applyPinchZoomViewport(false);
    const afterFirst = meta!.content;
    applyPinchZoomViewport(false);
    expect(meta!.content).toBe(afterFirst);
    expect(meta!.content).toBe(VIEWPORT_META_CONTENT_GAME);
  });

  it('no-op без мета-тега и вне DOM (SSR)', () => {
    stubDocument(false);
    expect(findViewportMeta()).toBeNull();
    expect(() => applyPinchZoomViewport(true)).not.toThrow();
  });
});
