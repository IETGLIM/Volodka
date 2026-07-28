/* ─── Music theory helpers (pure) — MusicEngine 3-layer scene music ─── */

/**
 * Scales defined as arrays of MIDI semitone offsets from the root.
 * The root is specified per scene config.
 */
export interface ScaleDef {
  /** Human-readable name */
  name: string;
  /** Semitone intervals from root (0 = root, always included) */
  intervals: number[];
}

/** Convert a MIDI note number to frequency in Hz */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Pick a random element from an array */
export function pickRandom<T>(arr: readonly T[], random: () => number = Math.random): T {
  return arr[Math.floor(random() * arr.length)];
}

/**
 * Build a chord from a scale by stacking thirds.
 * Returns an array of MIDI note numbers.
 */
export function buildChord(
  scale: ScaleDef,
  rootMidi: number,
  degree: number, // 0-based scale degree
  voices: number,
  useSeventh: boolean,
  useOpenFifths: boolean,
): number[] {
  const notes: number[] = [];
  const numScaleNotes = scale.intervals.length;

  if (useOpenFifths) {
    // Root and fifth only
    const rootInterval = scale.intervals[degree % numScaleNotes];
    // Fifth is typically 4 scale degrees up
    const fifthInterval = scale.intervals[(degree + 4) % numScaleNotes];
    const octaveShift = Math.floor((degree + 4) / numScaleNotes);

    notes.push(rootMidi + rootInterval);
    notes.push(rootMidi + fifthInterval + octaveShift * 12);
    return notes;
  }

  // Stack thirds: root (degree), 3rd (degree+2), 5th (degree+4), 7th (degree+6)
  const totalVoices = useSeventh ? Math.max(voices, 4) : voices;

  for (let v = 0; v < totalVoices; v++) {
    const scaleStep = degree + v * 2; // Stack in thirds
    const octaveShift = Math.floor(scaleStep / numScaleNotes);
    const intervalIndex = ((scaleStep % numScaleNotes) + numScaleNotes) % numScaleNotes;
    const midiNote = rootMidi + scale.intervals[intervalIndex] + octaveShift * 12;
    notes.push(midiNote);
  }

  return notes;
}

/**
 * Advance chord degree via random walk with bias toward I / IV / V.
 * Inject `random` for deterministic tests.
 */
export function advanceChordDegree(
  current: number,
  numDegrees: number,
  random: () => number = Math.random,
): number {
  const commonDegrees = [0, 3, 4]; // I, IV, V in scale degrees
  if (random() < 0.4) {
    return pickRandom(commonDegrees, random) % numDegrees;
  }
  const step = random() < 0.6 ? 1 : 2;
  return (current + step) % numDegrees;
}

/** Beat duration in ms from tempo BPM. */
export function beatMsFromTempo(tempo: number): number {
  return (60 / tempo) * 1000;
}
