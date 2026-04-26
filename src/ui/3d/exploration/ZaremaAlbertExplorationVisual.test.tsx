import '@testing-library/jest-dom/vitest';
import { Component, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { ZaremaAlbertExplorationVisual } from '@/ui/3d/exploration/ZaremaAlbertExplorationVisual';

class TestErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="render-error">{this.state.message}</div>;
    }
    return this.props.children;
  }
}

describe('ZaremaAlbertExplorationVisual', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('does not crash after materials are created', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      const noop = vi.fn();
      return new Proxy(
        {
          canvas: document.createElement('canvas'),
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          font: '',
          globalAlpha: 1,
          measureText: vi.fn().mockReturnValue({ width: 10 }),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
          closePath: vi.fn(),
          arc: vi.fn(),
          rect: vi.fn(),
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          fillText: vi.fn(),
        },
        {
          get(target, prop) {
            if (prop in target) return target[prop as keyof typeof target];
            return noop;
          },
          set(target, prop, value) {
            (target as Record<PropertyKey, unknown>)[prop] = value;
            return true;
          },
        },
      ) as any;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary>
        <ZaremaAlbertExplorationVisual />
      </TestErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('render-error')).toBeNull();
      expect(document.querySelector('group[name="ZaremaAlbertExplorationVisual"]')).toBeTruthy();
    });
  });
});
