import { describe, expect, it, vi, beforeEach } from 'vitest';
import { exportPhotoGalleryBatch } from './photoGalleryBatchExport';

const downloadMock = vi.fn();

vi.mock('@/engine/photo/photoModePresentation', () => ({
  downloadPhotoStill: (...args: unknown[]) => downloadMock(...args),
}));

describe('exportPhotoGalleryBatch', () => {
  beforeEach(() => {
    downloadMock.mockReset();
    downloadMock.mockReturnValue({ ok: true, method: 'download' });
    vi.useFakeTimers();
  });

  it('downloads capped gallery entries', async () => {
    const entries = [
      { id: 'a', dataUrl: 'data:image/png;base64,aaa', timestamp: 3, filter: 'neon' as const, sceneName: 'A' },
      { id: 'b', dataUrl: 'data:image/png;base64,bbb', timestamp: 2, filter: 'noir' as const, sceneName: 'B' },
      { id: 'c', dataUrl: 'data:image/png;base64,ccc', timestamp: 1, filter: 'neon' as const, sceneName: 'C' },
    ];
    const promise = exportPhotoGalleryBatch(entries, 2);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.attempted).toBe(2);
    expect(result.downloaded).toBe(2);
    expect(result.failed).toBe(0);
    expect(downloadMock).toHaveBeenCalledTimes(2);
    expect(downloadMock).toHaveBeenNthCalledWith(1, entries[0].dataUrl, 'neon');
    expect(downloadMock).toHaveBeenNthCalledWith(2, entries[1].dataUrl, 'noir');
  });
});
