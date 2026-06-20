import { describe, expect, it } from 'vitest';
import { resolveEscapeDismissAction } from '@/engine/input/escapeDismissAction';

const baseCtx = {
  mode: 'exploration' as const,
  panelStackLength: 0,
  examineOpen: false,
  codebreakerOpen: false,
  openstackTerminalOpen: false,
  bashTerminalOpen: false,
  poetryGameOpen: false,
  hackingGameOpen: false,
  memoryGameOpen: false,
  quizGameOpen: false,
  rhythmGameOpen: false,
};

describe('resolveEscapeDismissAction', () => {
  it('closes examine first', () => {
    expect(
      resolveEscapeDismissAction({
        ...baseCtx,
        examineOpen: true,
        panelStackLength: 2,
      }),
    ).toEqual({ type: 'close_examine' });
  });

  it('closes minigame before panels', () => {
    expect(
      resolveEscapeDismissAction({
        ...baseCtx,
        panelStackLength: 1,
        codebreakerOpen: true,
      }),
    ).toEqual({ type: 'close_minigame' });
  });

  it('pops panel stack before opening pause menu', () => {
    expect(
      resolveEscapeDismissAction({
        ...baseCtx,
        panelStackLength: 2,
      }),
    ).toEqual({ type: 'pop_panel' });
  });

  it('toggles pause menu only in exploration with empty stack', () => {
    expect(resolveEscapeDismissAction(baseCtx)).toEqual({ type: 'toggle_pause_menu' });
  });

  it('no-ops in combat with empty stack', () => {
    expect(
      resolveEscapeDismissAction({
        ...baseCtx,
        mode: 'combat',
      }),
    ).toEqual({ type: 'noop' });
  });

  it('no-ops in cutscene with empty stack', () => {
    expect(
      resolveEscapeDismissAction({
        ...baseCtx,
        mode: 'cutscene',
      }),
    ).toEqual({ type: 'noop' });
  });
});
