import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { InnerMonologueOverlay } from '@/components/game/InnerMonologueOverlay';
import { eventBus } from '@/engine/EventBus';
import {
  releaseImmersiveVoiceChannel,
  requestImmersiveVoiceChannel,
  resetImmersiveVoiceChannelForTests,
} from '@/engine/presentation/immersiveVoiceChannel';

/* The shared component-setup rAF mock queues frames without pumping them,
 * so the rAF-based typewriter never advances. For THIS suite we swap in a
 * timer-driven rAF so the queued thought text actually types out. */
const originalRaf = globalThis.requestAnimationFrame;
const originalCancelRaf = globalThis.cancelAnimationFrame;

beforeAll(() => {
  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback): number =>
      setTimeout(() => cb(performance.now()), 16) as unknown as number,
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  });
});

afterAll(() => {
  vi.stubGlobal('requestAnimationFrame', originalRaf);
  vi.stubGlobal('cancelAnimationFrame', originalCancelRaf);
});

/** v4.48.13: thoughts and the Голос subtitle share one immersive lane —
 *  thoughts queue while the voice plays and are preempted mid-display. */
describe('InnerMonologueOverlay — immersive voice lane', () => {
  beforeEach(() => {
    resetImmersiveVoiceChannelForTests();
  });

  it('queues the thought while a voice line plays, shows it when the lane frees', async () => {
    render(<InnerMonologueOverlay />);
    act(() => {
      requestImmersiveVoiceChannel('voice');
      eventBus.emit('volodka:thought', { text: 'Кофе остыл. Как всегда.', duration: 2500 });
    });
    // Voice holds the lane — no thought bubble yet.
    expect(screen.queryByTestId('inner-monologue-overlay')).toBeNull();

    act(() => {
      releaseImmersiveVoiceChannel('voice');
    });
    await waitFor(() => {
      expect(screen.getByTestId('inner-monologue-overlay')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Кофе остыл/)).toBeInTheDocument();
    });
  });

  it('preempts the visible thought when the Голос starts, then restores it', async () => {
    render(<InnerMonologueOverlay />);
    act(() => {
      eventBus.emit('volodka:thought', { text: 'Сорок седьмая пятница.', duration: 6000 });
    });
    await waitFor(() => {
      expect(screen.getByText(/Сорок седьмая пятница/)).toBeInTheDocument();
    });

    // Голос starts mid-thought — the bubble hides, the lane belongs to voice.
    act(() => {
      requestImmersiveVoiceChannel('voice');
    });
    await waitFor(() => {
      expect(screen.queryByTestId('inner-monologue-overlay')).toBeNull();
    });

    // Voice ends — the preempted thought comes back to the front.
    act(() => {
      releaseImmersiveVoiceChannel('voice');
    });
    await waitFor(() => {
      expect(screen.getByText(/Сорок седьмая пятница/)).toBeInTheDocument();
    });
  });

  it('does not restart an identical thought that is already on screen', async () => {
    render(<InnerMonologueOverlay />);
    act(() => {
      eventBus.emit('volodka:thought', { text: 'Тишина в проводке.', duration: 6000 });
    });
    await waitFor(() => {
      expect(screen.getByText(/Тишина в проводке/)).toBeInTheDocument();
    });
    act(() => {
      eventBus.emit('volodka:thought', { text: 'Тишина в проводке.', duration: 6000 });
    });
    // Still a single bubble, still the same thought — no restart, no stacking.
    expect(screen.getAllByText(/Тишина в проводке/)).toHaveLength(1);
  });
});
