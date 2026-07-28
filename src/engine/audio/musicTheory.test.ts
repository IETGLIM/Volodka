import { describe, expect, it } from 'vitest';
import {
  advanceChordDegree,
  beatMsFromTempo,
  buildChord,
  midiToFreq,
  pickRandom,
  type ScaleDef,
} from './musicTheory';
import { getSceneMusicConfig, SCALES, SCENE_MUSIC_CONFIGS } from './musicConfigs';

const minorPent: ScaleDef = SCALES.minor_pentatonic;

describe('musicTheory midiToFreq', () => {
  it('maps A4 (69) to 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });

  it('maps C4 (60) near 261.63 Hz', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3);
  });
});

describe('musicTheory pickRandom', () => {
  it('uses injected random for deterministic pick', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 0)).toBe('a');
    expect(pickRandom(['a', 'b', 'c'], () => 0.99)).toBe('c');
  });
});

describe('musicTheory buildChord', () => {
  it('stacks thirds for a triad from degree 0', () => {
    // minor pent: 0,3,5,7,10 → degree 0 triad: root, +2 steps, +4 steps
    expect(buildChord(minorPent, 48, 0, 3, false, false)).toEqual([48, 53, 58]);
  });

  it('builds open fifths as root + scale fifth', () => {
    // degree 0 + 4 scale steps → intervals[4]=10 → MIDI 58
    expect(buildChord(minorPent, 48, 0, 3, false, true)).toEqual([48, 58]);
  });

  it('extends to 7th when requested', () => {
    expect(buildChord(minorPent, 48, 0, 3, true, false)).toHaveLength(4);
  });
});

describe('musicTheory advanceChordDegree', () => {
  it('jumps to common degree when random < 0.4', () => {
    // first call < 0.4 → common branch; second call picks index 0 of [0,3,4]
    let n = 0;
    const random = () => {
      n += 1;
      return n === 1 ? 0.1 : 0;
    };
    expect(advanceChordDegree(2, 5, random)).toBe(0);
  });

  it('steps by 1 when random ≥ 0.4 and step roll < 0.6', () => {
    let n = 0;
    const random = () => {
      n += 1;
      return n === 1 ? 0.5 : 0.1;
    };
    expect(advanceChordDegree(1, 5, random)).toBe(2);
  });
});

describe('musicTheory beatMsFromTempo', () => {
  it('converts 60 BPM to 1000 ms', () => {
    expect(beatMsFromTempo(60)).toBe(1000);
  });

  it('converts 120 BPM to 500 ms', () => {
    expect(beatMsFromTempo(120)).toBe(500);
  });
});

describe('musicConfigs', () => {
  it('covers every SceneId key in SCENE_MUSIC_CONFIGS', () => {
    expect(Object.keys(SCENE_MUSIC_CONFIGS).length).toBeGreaterThanOrEqual(14);
  });

  it('getSceneMusicConfig returns undefined for unknown scenes', () => {
    expect(getSceneMusicConfig('not_a_scene')).toBeUndefined();
    expect(getSceneMusicConfig('volodka_room')?.rootMidi).toBe(48);
  });
});
