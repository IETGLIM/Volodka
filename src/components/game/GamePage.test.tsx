import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GamePage } from '@/components/game/GamePage';

vi.mock('@/components/game/GameErrorBoundary', () => ({
  GameErrorBoundary: ({ children }: { children: ReactNode }) => (
    <div data-testid="game-error-boundary">{children}</div>
  ),
}));

vi.mock('./GameOrchestrator', () => ({
  GameOrchestrator: () => <div data-testid="game-orchestrator">orchestrator</div>,
}));

describe('GamePage', () => {
  it('wraps lazy orchestrator in error boundary', async () => {
    render(<GamePage />);
    expect(screen.getByTestId('game-error-boundary')).toBeInTheDocument();
    expect(await screen.findByTestId('game-orchestrator')).toBeInTheDocument();
  });

  it('suppresses suspense fallback when boot overlay is active', async () => {
    render(<GamePage suppressBootOverlay />);
    expect(screen.getByTestId('game-error-boundary')).toBeInTheDocument();
    expect(await screen.findByTestId('game-orchestrator')).toBeInTheDocument();
  });
});
