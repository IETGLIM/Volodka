import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePage, GamePageSuspenseFallback } from '@/components/game/GamePage';

const orchestratorTestControls = vi.hoisted(() => ({
  shouldSuspend: false,
  contentShouldCrash: false,
  lazyImportDelayMs: 0,
}));

vi.mock('./orchestrator/OrchestratorContent', () => ({
  OrchestratorContent: () => {
    if (orchestratorTestControls.contentShouldCrash) {
      throw new Error('Render crash');
    }
    return <div data-testid="orchestrator-content">content</div>;
  },
}));

vi.mock('./GameOrchestrator', async (importOriginal) => {
  const delayMs = orchestratorTestControls.lazyImportDelayMs;
  if (delayMs > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  const actual = await importOriginal<typeof import('./GameOrchestrator')>();
  const ActualGameOrchestrator = actual.GameOrchestrator;

  return {
    GameOrchestrator: function SuspenseAwareGameOrchestrator() {
      if (orchestratorTestControls.shouldSuspend) {
        throw new Promise(() => {});
      }
      return <ActualGameOrchestrator />;
    },
  };
});

const ORCHESTRATOR_TIMEOUT_MS = 3000;
const LOADING_LABEL = /загрузка/i;

async function expectOrchestratorMounted(): Promise<void> {
  await waitFor(
    () => {
      expect(screen.getByTestId('game-orchestrator')).toBeInTheDocument();
      expect(screen.getByTestId('orchestrator-content')).toBeInTheDocument();
    },
    { timeout: ORCHESTRATOR_TIMEOUT_MS },
  );
}

function expectLoadingIndicatorVisible(): void {
  expect(screen.getByTestId('game-page-suspense-fallback')).toBeInTheDocument();
  expect(screen.getByRole('status', { name: LOADING_LABEL })).toBeInTheDocument();
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();
}

describe('GamePage', () => {
  beforeEach(() => {
    orchestratorTestControls.shouldSuspend = false;
    orchestratorTestControls.contentShouldCrash = false;
    orchestratorTestControls.lazyImportDelayMs = 0;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('GamePageSuspenseFallback', () => {
    it('renders the visible loading indicator', () => {
      render(<GamePageSuspenseFallback />);
      expectLoadingIndicatorVisible();
    });
  });

  describe('with default props', () => {
    it('wraps the lazy orchestrator in the real game error boundary', async () => {
      render(<GamePage />);

      expect(screen.getByTestId('game-error-boundary')).toBeInTheDocument();
      await expectOrchestratorMounted();
    });

    it('shows the loading indicator while the orchestrator suspends', () => {
      orchestratorTestControls.shouldSuspend = true;
      render(<GamePage />);

      expectLoadingIndicatorVisible();
      expect(screen.queryByTestId('game-orchestrator')).not.toBeInTheDocument();
    });

    it('shows the loading indicator until the lazy chunk resolves after import delay', async () => {
      vi.resetModules();
      orchestratorTestControls.lazyImportDelayMs = 150;

      const { GamePage: FreshGamePage } = await import('./GamePage');
      render(<FreshGamePage />);

      expectLoadingIndicatorVisible();
      await expectOrchestratorMounted();
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-page-suspense-fallback')).not.toBeInTheDocument();
    });

    it('shows recovery UI when orchestrator content throws', async () => {
      orchestratorTestControls.contentShouldCrash = true;
      render(<GamePage />);

      expect(
        await screen.findByRole('heading', { name: 'Произошла ошибка' }, { timeout: ORCHESTRATOR_TIMEOUT_MS }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Попробовать восстановить' })).toBeInTheDocument();
      expect(screen.queryByTestId('orchestrator-content')).not.toBeInTheDocument();
    });
  });

  describe('with suppressBootOverlay', () => {
    it('does not render the loading indicator while suspended', () => {
      orchestratorTestControls.shouldSuspend = true;
      render(<GamePage suppressBootOverlay />);

      expect(screen.queryByTestId('game-page-suspense-fallback')).not.toBeInTheDocument();
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-orchestrator')).not.toBeInTheDocument();
    });

    it('still mounts the orchestrator after suspense resolves', async () => {
      render(<GamePage suppressBootOverlay />);
      await expectOrchestratorMounted();
    });
  });
});
