/** ─── Volodka RPG – Audio Visualizer Bridge ─── *
*
* Provides a cached AnalyserNode connected to the shared AudioContext.
* The AudioVisualizer UI component calls these to read real-time
* frequency / waveform data from the procedural audio pipeline.
*
* Falls back gracefully when AudioContext is not yet available
* (before first user gesture) or when running in SSR.
*/

import { getSharedAudioContext } from '@/engine/SharedAudioContext';

/** Cached analyser — created once and reused. */
let cachedAnalyser: AnalyserNode | null = null;
let cachedDestination: AudioNode | null = null;

/**
 * Get or create the global AnalyserNode connected to the audio destination.
 *
 * The analyser is connected in parallel with the destination — it does NOT
 * block or alter audio output. FFT size 256 keeps CPU usage low while giving
 * 128 frequency bins (sufficient for a stylish equalizer).
 *
 * Returns `null` when:
 *   - Running server-side (SSR)
 *   - No user gesture has occurred yet (AudioContext not created)
 *   - AudioContext creation failed
 */
export function getAnalyserNode(): AnalyserNode | null {
  const ctx = getSharedAudioContext();
  if (!ctx) return null;

  // If context was closed/recreated (HMR), drop stale analyser.
  if (cachedAnalyser && cachedAnalyser.context !== ctx) {
    try { cachedAnalyser.disconnect(); } catch { /* already disconnected */ }
    cachedAnalyser = null;
    cachedDestination = null;
  }

  if (cachedAnalyser) return cachedAnalyser;

  try {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const dest = ctx.destination;
    // Connect analyser in parallel — reads from destination without blocking output.
    // We connect to a separate gain node to avoid double-playing audio.
    const tapGain = ctx.createGain();
    tapGain.gain.value = 0; // Muted tap — just for analysis
    dest.connect(tapGain);
    tapGain.connect(analyser);

    cachedAnalyser = analyser;
    cachedDestination = tapGain;
    return analyser;
  } catch {
    return null;
  }
}

/**
 * Read audio data from the AnalyserNode.
 *
 * @param analyser - The AnalyserNode instance
 * @param mode - Which data to read:
 *   - `'waveform'` → Float32Array of time-domain samples [-1..1]
 *   - `'bars'` → Uint8Array of frequency magnitudes [0..255]
 *   - `'radial'` → Uint8Array of frequency magnitudes (same as bars, rendered circularly)
 * @returns Typed array of audio data, or a zeroed fallback array.
 */
export function getAudioData(
  analyser: AnalyserNode,
  mode: 'waveform' | 'bars' | 'radial',
): Float32Array | Uint8Array {
  if (mode === 'waveform') {
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    return data;
  }

  const freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  return freqData;
}

/**
 * Release the cached analyser (called on HMR dispose / unmount).
 */
export function disposeVisualizerBridge(): void {
  if (cachedAnalyser) {
    try { cachedAnalyser.disconnect(); } catch { /* ignore */ }
    cachedAnalyser = null;
  }
  if (cachedDestination) {
    try { cachedDestination.disconnect(); } catch { /* ignore */ }
    cachedDestination = null;
  }
}
