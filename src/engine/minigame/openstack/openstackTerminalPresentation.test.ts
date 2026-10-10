import { describe, expect, it } from 'vitest';
import {
  OPENSTACK_TERMINAL_LABELS,
  isOpenStackPlayPhase,
  isTimerActivePhase,
} from '@/engine/minigame/openstack/openstackTerminalConstants';
import {
  buildTerminalLogText,
  formatPhaseHeader,
  getTimeLeftColor,
} from '@/engine/minigame/openstack/openstackTerminalPresentation';

describe('openstackTerminalPresentation', () => {
  it('getTimeLeftColor reflects urgency thresholds', () => {
    expect(getTimeLeftColor(45)).toBe('#46b96e');
    expect(getTimeLeftColor(20)).toBe('#e2a84b');
    expect(getTimeLeftColor(5)).toBe('#c65548');
  });

  it('formatPhaseHeader builds localized phase banner', () => {
    expect(formatPhaseHeader(2, 'ИЗОЛЯЦИЯ')).toBe(
      OPENSTACK_TERMINAL_LABELS.phaseHeader(2, 'ИЗОЛЯЦИЯ'),
    );
  });

  it('buildTerminalLogText joins non-empty lines', () => {
    expect(
      buildTerminalLogText([
        { text: 'line 1', color: '#fff' },
        { text: '', color: '#fff' },
        { text: 'line 2', color: '#fff' },
      ]),
    ).toBe('line 1\nline 2');
  });

  it('phase guards identify playable and timed phases', () => {
    expect(isOpenStackPlayPhase('repair')).toBe(true);
    expect(isOpenStackPlayPhase('alert')).toBe(false);
    expect(isTimerActivePhase('diagnose')).toBe(true);
    expect(isTimerActivePhase('success')).toBe(false);
  });
});
