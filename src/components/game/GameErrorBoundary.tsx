import React from 'react';
import { RecoveryScreen } from '@/components/game/RecoveryScreen';
import {
  buildErrorCode,
  buildErrorRecoveryContext,
} from '@/engine/recovery/buildErrorRecoveryContext';
import type { ErrorRecoveryContext } from '@/engine/recovery/errorRecoveryTypes';
import { gameTelemetry } from '@/engine/recovery/gameTelemetry';
import { recoveryManager } from '@/engine/recovery/recoveryManager';
import { useErrorRecoveryContext } from '@/engine/recovery/useErrorRecoveryContext';

type GameErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type GameErrorBoundaryCoreProps = GameErrorBoundaryProps & {
  context: ErrorRecoveryContext;
};

type GameErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  recoveryKey: number;
  recoveryContext: ErrorRecoveryContext;
};

/**
 * Catches render crashes in game UI and shows a recovery screen.
 * Wrapped by {@link GameErrorBoundary} which supplies live diagnostic context.
 */
class GameErrorBoundaryCore extends React.Component<
  GameErrorBoundaryCoreProps,
  GameErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryCoreProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryKey: 0,
      recoveryContext: props.context,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GameErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: GameErrorBoundaryCoreProps): void {
    if (!this.state.hasError && prevProps.context !== this.props.context) {
      this.setState({ recoveryContext: this.props.context });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const recoveryContext = {
      ...buildErrorRecoveryContext(error),
      ...this.props.context,
      errorCode: buildErrorCode(error),
    };

    this.setState({ errorInfo: info, recoveryContext });

    gameTelemetry.captureException(error, {
      componentStack: info.componentStack,
      context: recoveryContext,
    });
  }

  clearErrorState = (): void => {
    this.setState((state) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryKey: state.recoveryKey + 1,
      recoveryContext: this.props.context,
    }));
  };

  handleRecover = (): void => {
    recoveryManager.attemptRecovery();
    this.clearErrorState();
  };

  handleRestartScene = (): void => {
    recoveryManager.restartCurrentScene();
    this.clearErrorState();
  };

  handleResetSettings = (): void => {
    recoveryManager.resetSettings();
  };

  handleResetAll = (): void => {
    recoveryManager.resetAllData();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <RecoveryScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          context={this.state.recoveryContext}
          onRecover={this.handleRecover}
          onRestartScene={this.handleRestartScene}
          onResetSettings={this.handleResetSettings}
          onResetAll={this.handleResetAll}
        />
      );
    }

    return (
      <div key={this.state.recoveryKey} className="contents" data-testid="game-error-boundary">
        {this.props.children}
      </div>
    );
  }
}

/** Functional wrapper — supplies live game context to the class error boundary. */
export function GameErrorBoundary({ children, fallback }: GameErrorBoundaryProps) {
  const context = useErrorRecoveryContext();

  return (
    <GameErrorBoundaryCore context={context} fallback={fallback}>
      {children}
    </GameErrorBoundaryCore>
  );
}
