import { describe, expect, it } from 'vitest';
import {
  formatInteractionHintAria,
  formatTransitionProgressLabel,
  getInteractionHintVisual,
  getSceneTransitionAccent,
  getTransitionProgressVisual,
} from '@/engine/exploration/explorationUxPresentation';

describe('explorationUxPresentation', () => {
  it('getInteractionHintVisual returns per-type accents', () => {
    expect(getInteractionHintVisual('npc').color).toContain('cyber-cyan');
    expect(getInteractionHintVisual('exit').color).toBe('#34d399');
  });

  it('getSceneTransitionAccent maps styles', () => {
    expect(getSceneTransitionAccent('flash')).toContain('255');
    expect(getSceneTransitionAccent('wipe')).toContain('255, 255');
  });

  it('getTransitionProgressVisual switches on complete', () => {
    expect(getTransitionProgressVisual(false).primary).toContain('cyber-cyan');
    expect(getTransitionProgressVisual(true).primary).toBe('#34d399');
  });

  it('formats transition and hint labels', () => {
    expect(formatTransitionProgressLabel('Улица', true)).toContain('✓');
    expect(formatInteractionHintAria('Поговорить', 'E', 'Идёт по делам')).toContain('E');
  });
});
