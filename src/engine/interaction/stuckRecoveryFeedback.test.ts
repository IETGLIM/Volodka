import { describe, expect, it } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  getStuckRecoveryHintDetail,
  getStuckRecoveryReapproachHint,
  getStuckRecoveryUserMessage,
} from './stuckRecoveryFeedback';

describe('stuckRecoveryFeedback', () => {
  it('guides player to retry dialogue after dialogue stuck', () => {
    const msg = getStuckRecoveryUserMessage({
      fromState: InteractionState.Dialogue,
      targetNpcId: 'maria',
    });
    expect(msg).toContain('[E]');
    expect(msg.toLowerCase()).toContain('диалог');
  });

  it('guides approach retry for Approach stuck', () => {
    const msg = getStuckRecoveryUserMessage({
      fromState: InteractionState.Approach,
      targetNpcId: 'albert',
    });
    expect(msg).toContain('[E]');
    expect(msg).toMatch(/Подход|подойдите|отойдите/i);
  });

  it('includes state label in detail line', () => {
    expect(
      getStuckRecoveryHintDetail({
        fromState: InteractionState.Lock,
        targetNpcId: 'kate',
      }),
    ).toContain('Lock');
  });

  it('offers compass re-approach hint after recovery', () => {
    const approach = getStuckRecoveryReapproachHint({
      fromState: InteractionState.Approach,
      targetNpcId: 'maria',
    });
    expect(approach).toMatch(/Путь/i);
    expect(approach).toMatch(/отойти|подойти|шаг/i);

    const dialogue = getStuckRecoveryReapproachHint({
      fromState: InteractionState.Dialogue,
      targetNpcId: 'albert',
    });
    expect(dialogue).toMatch(/Путь/i);
    expect(dialogue).toContain('[E]');
  });
});
