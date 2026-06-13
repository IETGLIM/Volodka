import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  createLoadingPipeline,
  deriveLoadingErrorCode,
  type LoadingPipeline,
  type LoadingStageId,
} from './LoadingPipeline';

function stubAnimationFrame(): void {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    clearTimeout(id);
  });
}

describe('LoadingPipeline', () => {
  let pipeline: LoadingPipeline;

  beforeEach(() => {
    vi.useFakeTimers();
    stubAnimationFrame();
    pipeline = createLoadingPipeline();
  });

  afterEach(() => {
    pipeline.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('advances stages monotonically', () => {
    pipeline.reportStage('boot_data');
    expect(pipeline.getSnapshot().pct).toBe(12);
    pipeline.reportStage('narrative_data');
    expect(pipeline.getSnapshot().pct).toBe(48);
    pipeline.reportStage('boot_data');
    expect(pipeline.getSnapshot().pct).toBe(48);
  });

  it('sub-progress stays within stage bounds', () => {
    pipeline.reportStage('narrative_data');
    pipeline.reportSubProgress(0.5);
    const snap = pipeline.getSnapshot();
    expect(snap.pct).toBeGreaterThan(48);
    expect(snap.pct).toBeLessThan(62);
  });

  it('records errors with support code', () => {
    pipeline.reportError(new Error('boom'));
    const snap = pipeline.getSnapshot();
    expect(snap.stage).toBe('error');
    expect(snap.error).toBe('boom');
    expect(snap.errorCode).toMatch(/^BOOT-[0-9A-F]{4}$/);
  });

  it('updates error message on repeated reportError', () => {
    pipeline.reportError(new Error('boom'));
    pipeline.reportError(new Error('bang'));
    expect(pipeline.getSnapshot().error).toBe('bang');
    expect(pipeline.getSnapshot().errorCode).toBe(deriveLoadingErrorCode(new Error('bang'), 'bang'));
  });

  it('emits boot:failed on reportError', () => {
    const failed: string[] = [];
    const unsub = eventBus.on('boot:failed', ({ reason }) => {
      failed.push(reason);
    });
    pipeline.reportError(new Error('boot failed'));
    expect(failed).toEqual(['boot failed']);
    unsub();
  });

  it('ignores duplicate error reports with the same message', () => {
    let emits = 0;
    const unsub = pipeline.subscribe(() => {
      emits += 1;
    });
    emits = 0;

    pipeline.reportError(new Error('boom'));
    const afterFirst = emits;
    pipeline.reportError(new Error('boom'));

    expect(emits).toBe(afterFirst);
    expect(pipeline.getSnapshot().error).toBe('boom');
    unsub();
  });

  it('re-subscribes to canvas:first-frame after reset', async () => {
    pipeline.reportStage('canvas_init');
    pipeline.reset();
    pipeline.reportStage('canvas_init');

    eventBus.emit('canvas:first-frame', { generation: 1 });
    expect(pipeline.getSnapshot().stage).toBe('first_frame');

    await vi.runAllTimersAsync();

    expect(pipeline.getSnapshot().stage).toBe('complete');
    expect(pipeline.getSnapshot().pct).toBe(100);
  });

  it('playable and complete have distinct progress milestones', async () => {
    pipeline.reportStage('canvas_init');
    eventBus.emit('canvas:first-frame', { generation: 1 });
    expect(pipeline.getSnapshot().stage).toBe('first_frame');
    expect(pipeline.getSnapshot().pct).toBe(94);

    await vi.advanceTimersByTimeAsync(0);
    expect(pipeline.getSnapshot().stage).toBe('playable');
    expect(pipeline.getSnapshot().pct).toBe(97);

    await vi.advanceTimersByTimeAsync(320);
    expect(pipeline.getSnapshot().stage).toBe('complete');
    expect(pipeline.getSnapshot().pct).toBe(100);
  });

  it('staggered first-frame stages emit in separate ticks', async () => {
    const stages: LoadingStageId[] = [];
    const unsub = pipeline.subscribe((snap) => stages.push(snap.stage));

    pipeline.reportStage('canvas_init');
    eventBus.emit('canvas:first-frame', { generation: 1 });

    expect(stages.at(-1)).toBe('first_frame');
    expect(stages.filter((s) => s === 'playable')).toHaveLength(0);

    await vi.runAllTimersAsync();

    expect(stages).toContain('playable');
    expect(stages.at(-1)).toBe('complete');
    unsub();
  });

  it('instances are isolated from each other', () => {
    const other = createLoadingPipeline();
    pipeline.reportStage('narrative_data');
    expect(other.getSnapshot().pct).toBe(0);
    other.dispose();
  });

  it('rejects complete before playable', () => {
    pipeline.reportStage('canvas_init');
    pipeline.reportStage('complete');
    expect(pipeline.getSnapshot().stage).toBe('canvas_init');
  });

  it('defers complete until playable hold elapses', async () => {
    pipeline.reportStage('playable');
    pipeline.reportStage('complete');
    expect(pipeline.getSnapshot().stage).toBe('playable');

    await vi.advanceTimersByTimeAsync(319);
    expect(pipeline.getSnapshot().stage).toBe('playable');

    await vi.advanceTimersByTimeAsync(1);
    expect(pipeline.getSnapshot().stage).toBe('complete');
  });

  it('allows complete after playable hold when reported manually', async () => {
    pipeline.reportStage('playable');
    await vi.advanceTimersByTimeAsync(320);
    pipeline.reportStage('complete');
    expect(pipeline.getSnapshot().stage).toBe('complete');
  });
});
