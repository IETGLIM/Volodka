import { describe, expect, it } from 'vitest';
import { resolveManualChunk, ROLLUP_MIN_CHUNK_SIZE, validateChunkConfig } from '../../vite/chunks';

describe('resolveManualChunk', () => {
  it('routes extended act files to act-specific chunks', () => {
    expect(resolveManualChunk('G:/1O1O1/src/data/story/act1Extended.ts')).toBe('data-story-act1');
    expect(resolveManualChunk('G:/1O1O1/src/data/story/act4QuietHour.ts')).toBe('data-story-act4');
  });

  it('routes satellite story packs to dedicated chunks', () => {
    expect(resolveManualChunk('G:/1O1O1/src/data/story/pierStory.ts')).toBe('data-story-pier');
    expect(resolveManualChunk('G:/1O1O1/src/data/story/libraryStory.ts')).toBe('data-story-library');
  });

  it('routes poems registry only to data-poems', () => {
    expect(resolveManualChunk('G:/1O1O1/src/data/unifiedPoemRegistry.ts')).toBe('data-poems');
  });

  it('routes lore tables to data-lore', () => {
    expect(resolveManualChunk('G:/1O1O1/src/data/loreEntries.ts')).toBe('data-lore');
  });

  it('routes shared GPU registries to boot-shared (breaks combat ↔ toast panel cycle)', () => {
    expect(resolveManualChunk('G:/1O1O1/src/engine/three/moduleGeometryRegistry.ts')).toBe('boot-shared');
    expect(resolveManualChunk('G:/1O1O1/src/engine/three/disposeThreeResources.ts')).toBe('boot-shared');
  });

  it('routes notification toasts HUD to game-ui-notification-toasts', () => {
    expect(
      resolveManualChunk('G:/1O1O1/src/components/game/notificationToasts/NotificationToastsPanel.tsx'),
    ).toBe('game-ui-notification-toasts');
  });

  it('routes chk narrative to pack-chk-narrative', () => {
    expect(resolveManualChunk('G:/1O1O1/src/data/chkTolpa/storyNodes.ts')).toBe('pack-chk-narrative');
  });
});

describe('chunk size policy', () => {
  it('exports 5KB threshold for Rollup min chunk merge', () => {
    expect(ROLLUP_MIN_CHUNK_SIZE).toBe(5 * 1024);
  });
});

describe('validateChunkConfig', () => {
  it('reports no duplicate DATA_* module ids', () => {
    expect(validateChunkConfig()).toEqual([]);
  });
});
