import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LoadingScreen } from '@/components/game/LoadingScreen';
import { LOADING_DEFAULT_MESSAGE, LOADING_MESSAGE_ID, LOADING_TITLE_TEXT } from '@/engine/loading/loadingConstants';

vi.mock('@/components/game/shared/CanvasMatrixRain', () => ({
  CanvasMatrixRain: () => <div data-testid="matrix-rain" />,
}));

vi.mock('@/hooks/useLoadingScreenFx', () => ({
  useLoadingScreenFx: () => ({
    matrixRain: false,
    filmGrain: false,
    hexDump: false,
    bootText: false,
    breathingGlow: false,
    crtSweep: false,
    cornerDecor: false,
    cinematicBars: false,
    glitchTitle: false,
    tipRotation: false,
    contentMotion: false,
    spinnerPulse: false,
  }),
}));

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default message when message prop is omitted', () => {
    render(<LoadingScreen progress={10} />);
    expect(document.getElementById(LOADING_MESSAGE_ID)).toHaveTextContent(LOADING_DEFAULT_MESSAGE);
  });

  it('exposes progressbar with clamped aria-valuenow', () => {
    render(<LoadingScreen progress={150} message="Тестовая загрузка" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('aria-labelledby', LOADING_MESSAGE_ID);
  });

  it('announces percent with correct Russian plural in sr-only region', () => {
    render(<LoadingScreen progress={42} message="Тестовая загрузка" />);
    expect(screen.getByText('Тестовая загрузка, 42 процента')).toBeInTheDocument();
  });

  it('supports 0 and 100 progress values', () => {
    const { rerender } = render(<LoadingScreen progress={0} message="Старт" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    rerender(<LoadingScreen progress={100} message="Готово" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('updates progress when props change', () => {
    const { rerender } = render(<LoadingScreen progress={10} message="Загрузка" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');

    rerender(<LoadingScreen progress={55} message="Загрузка" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '55');
  });

  it('does not render title when showTitle is false', () => {
    render(<LoadingScreen progress={10} />);
    expect(screen.queryByText(LOADING_TITLE_TEXT)).not.toBeInTheDocument();
  });

  it('renders title when showTitle is true', () => {
    render(<LoadingScreen progress={10} showTitle />);
    expect(screen.getByText(LOADING_TITLE_TEXT)).toBeInTheDocument();
  });

  it('exposes aria-live regions for quote and tip', () => {
    render(<LoadingScreen progress={10} />);
    const liveRegions = screen.getAllByText(/.*/, { selector: '[aria-live="polite"]' });
    expect(liveRegions.length).toBeGreaterThanOrEqual(2);
  });
});
