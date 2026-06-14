import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PoemPowerEffectView } from '@/components/game/poemPowerEffect/PoemPowerEffectView';
import { usePoemPowerEffectController } from '@/components/game/poemPowerEffect/usePoemPowerEffectController';

function PoemPowerEffectInner() {
  const fx = usePoemPowerEffectController();

  return (
    <PoemPowerEffectView
      notification={fx.latestNotification}
      reducedMotion={fx.reducedMotion}
      powerActivatedLabel={fx.powerActivatedLabel}
    />
  );
}

export function PoemPowerEffect() {
  return (
    <ErrorBoundary name="PoemPowerEffect" fallback={null}>
      <PoemPowerEffectInner />
    </ErrorBoundary>
  );
}
