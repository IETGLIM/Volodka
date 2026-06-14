import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoadingScreen } from '@/components/game/LoadingScreen';
import { resetDefaultAccessibilityManager, initAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';

describe('LoadingScreen', () => {
  beforeEach(() => {
    resetDefaultAccessibilityManager();
    initAccessibilitySettings();
  });

  afterEach(() => {
    resetDefaultAccessibilityManager();
  });

  it('renders progressbar with message and percent', () => {
    render(<LoadingScreen progress={42} message="Тестовая загрузка" />);

    const bar = screen.getByRole('progressbar', { name: 'Тестовая загрузка' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText(/Тестовая загрузка, 42 процентов/)).toBeInTheDocument();
  });

  it('shows title when showTitle is enabled', () => {
    render(<LoadingScreen progress={10} showTitle />);
    expect(screen.getAllByText('ВОЛОДЬКА').length).toBeGreaterThan(0);
  });
});
