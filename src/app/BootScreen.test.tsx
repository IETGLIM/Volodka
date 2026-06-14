import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BootError, BootScreen } from '@/app/BootScreen';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';

describe('BootError', () => {
  it('renders message, error code, and retry action', () => {
    const onRetry = vi.fn();
    render(
      <BootError
        message="Сеть недоступна"
        errorCode="BOOT-1A2B"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByTestId('boot-error')).toBeInTheDocument();
    expect(screen.getByText('Сеть недоступна')).toBeInTheDocument();
    expect(screen.getByText(/BOOT-1A2B/)).toBeInTheDocument();

    screen.getByRole('button', { name: 'Повторить' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('BootScreen', () => {
  beforeEach(() => {
    loadingPipeline.reset();
    loadingPipeline.reportStage('boot_start');
  });

  afterEach(() => {
    loadingPipeline.reset();
  });

  it('shows boot loading overlay while pipeline is active', () => {
    render(<BootScreen />);
    expect(screen.getByTestId('boot-loading-overlay')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows boot error UI when pipeline reports failure', () => {
    loadingPipeline.reportError(new Error('chunk load failed'));
    render(<BootScreen onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('chunk load failed')).toBeInTheDocument();
    expect(screen.queryByTestId('boot-loading-overlay')).not.toBeInTheDocument();
  });
});
