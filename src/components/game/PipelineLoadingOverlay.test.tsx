import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PipelineLoadingOverlay } from '@/components/game/PipelineLoadingOverlay';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';

describe('PipelineLoadingOverlay', () => {
  beforeEach(() => {
    loadingPipeline.reset();
    loadingPipeline.reportStage('boot_start');
  });

  afterEach(() => {
    loadingPipeline.reset();
  });

  it('binds to pipeline progress and custom message', () => {
    render(<PipelineLoadingOverlay message="Кастомное сообщение" />);

    expect(screen.getByRole('progressbar', { name: 'Кастомное сообщение' })).toBeInTheDocument();
  });

  it('calls onPlayable when pipeline reaches playable', async () => {
    const onPlayable = vi.fn();
    render(<PipelineLoadingOverlay onPlayable={onPlayable} />);

    act(() => {
      loadingPipeline.reportStage('playable');
    });
    await waitFor(() => expect(onPlayable).toHaveBeenCalledOnce());
  });

  it('shows start confirm at playable when requireStartConfirm', async () => {
    render(<PipelineLoadingOverlay requireStartConfirm />);

    act(() => {
      loadingPipeline.reportStage('playable');
    });
    const startButton = await screen.findByRole('button', { name: 'Начать игру' });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Начать игру' })).not.toBeInTheDocument();
    });
  });
});
