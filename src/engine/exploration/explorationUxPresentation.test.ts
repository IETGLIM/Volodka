import { describe, expect, it } from 'vitest';
import {
  formatInteractionHintAria,
  formatInteractionHintBadge,
  formatInteractionHintKey,
  formatTransitionProgressLabel,
  getInteractionHintVisual,
  getSceneTransitionAccent,
  getTransitionProgressVisual,
  resolveInteractionInputMode,
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

  it('resolveInteractionInputMode prefers touch, then gamepad', () => {
    expect(resolveInteractionInputMode({ touchDevice: true, gamepadConnected: true })).toBe('touch');
    expect(resolveInteractionInputMode({ gamepadConnected: true })).toBe('gamepad');
    expect(resolveInteractionInputMode({})).toBe('keyboard');
  });

  it('formatInteractionHintKey maps gamepad to A and touch sentinel', () => {
    expect(formatInteractionHintKey('E', { gamepadConnected: true })).toBe('A');
    expect(formatInteractionHintKey('E', { touchDevice: true })).toBe('touch');
    expect(formatInteractionHintKey('E', {})).toBe('E');
  });

  it('formatInteractionHintBadge wraps keyboard and gamepad keys', () => {
    expect(formatInteractionHintBadge('E', {})).toBe('[E]');
    expect(formatInteractionHintBadge('E', { gamepadConnected: true })).toBe('[A]');
    expect(formatInteractionHintBadge('E', { touchDevice: true })).toBe('');
  });

  it('formatInteractionHintAria mentions gamepad and touch bindings', () => {
    expect(formatInteractionHintAria('Поговорить', 'E', undefined, { gamepadConnected: true })).toContain('кнопка A');
    expect(formatInteractionHintAria('Поговорить', 'E', undefined, { touchDevice: true })).toContain('коснитесь');
  });
});
