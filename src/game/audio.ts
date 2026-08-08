/**
 * Процедурный аудио-движок: генеративная музыка, ветер, птицы, сверчки и SFX.
 * Никаких внешних файлов — всё синтезируется в Web Audio API.
 */
import { rand, pick, clamp } from './utils';

const A_MINOR_PAD: number[][] = [
  [110, 130.81, 164.81, 220],
  [87.31, 130.81, 174.61, 220],
  [130.81, 164.81, 196, 261.63],
  [98, 123.47, 146.83, 196],
];
const PENTA = [440, 523.25, 587.33, 659.25, 783.99, 880];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicG: GainNode | null = null;
  private sfxG: GainNode | null = null;
  private ambG: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private rainGain: GainNode | null = null;

  private chordIdx = 0;
  private nextChord = 0;
  private bellNext = 0;
  private birdNext = 0;
  private cricketNext = 0;
  private stepFlip = false;
  private intensity = 0;

  musicVol = 0.7;
  sfxVol = 0.8;
  started = false;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(comp);
      this.musicG = ctx.createGain();
      this.musicG.gain.value = this.musicVol;
      this.musicG.connect(this.master);
      this.sfxG = ctx.createGain();
      this.sfxG.gain.value = this.sfxVol;
      this.sfxG.connect(this.master);
      this.ambG = ctx.createGain();
      this.ambG.gain.value = 0.8;
      this.ambG.connect(this.master);

      // noise buffer
      const len = ctx.sampleRate * 2;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      // wind loop
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.value = 380;
      this.windFilter.Q.value = 0.6;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.05;
      src.connect(this.windFilter).connect(this.windGain).connect(this.ambG);
      src.start();

      // rain loop
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = this.noiseBuf;
      rainSrc.loop = true;
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1100;
      rainFilter.Q.value = 0.4;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;
      rainSrc.connect(rainFilter).connect(this.rainGain).connect(this.ambG);
      rainSrc.start();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.started = true;
  }

  setVolumes(music: number, sfx: number) {
    this.musicVol = music;
    this.sfxVol = sfx;
    if (this.musicG && this.ctx) this.musicG.gain.setTargetAtTime(music, this.ctx.currentTime, 0.1);
    if (this.sfxG && this.ctx) this.sfxG.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.1);
  }

  setIntensity(v: number) {
    this.intensity = clamp(v, 0, 1);
  }

  setDucking(v: boolean) {
    if (this.musicG && this.ctx) {
      const target = v ? this.musicVol * 0.22 : this.musicVol;
      this.musicG.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    }
  }

  setRain(v: number) {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(v * 0.16, this.ctx.currentTime, 0.6);
    }
  }

  thunder() {
    const ctx = this.ctx;
    if (!ctx || !this.ambG) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(72, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 1.6);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(0.22, t + 0.08);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    osc.connect(gn).connect(this.ambG);
    osc.start(t);
    osc.stop(t + 2.3);
    this.noiseHit(1.1, 300, 'lowpass', 0.1, 0.02, 120);
  }

  update(_dt: number, night: number, gust: number) {
    if (!this.ctx || !this.started) return;
    const t = this.ctx.currentTime;
    if (this.windGain && this.windFilter) {
      this.windGain.gain.setTargetAtTime(0.045 + gust * 0.045 + night * 0.02, t, 0.5);
      this.windFilter.frequency.setTargetAtTime(300 + gust * 320, t, 0.5);
    }
    if (t >= this.nextChord) {
      this.playChord();
      this.nextChord = t + 7.5;
    }
    if (t >= this.bellNext) {
      this.playBell();
      this.bellNext = t + rand(1.4, 5.4);
    }
    if (night > 0.45 && t >= this.cricketNext) {
      this.cricket();
      this.cricketNext = t + rand(0.5, 1.6);
    }
    if (night < 0.5 && t >= this.birdNext) {
      this.bird();
      this.birdNext = t + rand(3, 10);
    }
  }

  // ---------- music ----------
  private playChord() {
    const ctx = this.ctx;
    if (!ctx || !this.musicG) return;
    const t = ctx.currentTime + 0.05;
    const chord = A_MINOR_PAD[this.chordIdx % A_MINOR_PAD.length];
    const g = 0.05 + this.intensity * 0.045;
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f * (i === 0 ? 0.5 : 1);
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 760 + this.intensity * 500;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(g / chord.length, t + 2.6);
      gn.gain.setValueAtTime(g / chord.length, t + 4.6);
      gn.gain.linearRampToValueAtTime(0.0001, t + 7.6);
      osc.connect(flt).connect(gn).connect(this.musicG!);
      osc.start(t);
      osc.stop(t + 7.8);
      // sub
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = f / 4;
      const sgn = ctx.createGain();
      sgn.gain.setValueAtTime(0, t);
      sgn.gain.linearRampToValueAtTime(0.07, t + 2.4);
      sgn.gain.linearRampToValueAtTime(0.0001, t + 7.4);
      sub.connect(sgn).connect(this.musicG!);
      sub.start(t);
      sub.stop(t + 7.6);
    });
    this.chordIdx++;
  }

  private playBell() {
    const ctx = this.ctx;
    if (!ctx || !this.musicG) return;
    const f = pick(PENTA) * (Math.random() < 0.25 ? 2 : 1);
    const t = ctx.currentTime;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(0.028 + this.intensity * 0.03, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = f * 2.76;
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    osc.connect(gn);
    osc2.connect(g2).connect(gn);
    gn.connect(this.musicG);
    osc.start(t); osc.stop(t + 2.3);
    osc2.start(t); osc2.stop(t + 2.3);
  }

  // ---------- ambience ----------
  private bird() {
    const ctx = this.ctx;
    if (!ctx || !this.ambG) return;
    const t = ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const t0 = t + i * rand(0.09, 0.2);
      const f0 = rand(2400, 3800);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * rand(1.2, 1.7), t0 + 0.06);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0, t0);
      gn.gain.linearRampToValueAtTime(0.035, t0 + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      osc.connect(gn).connect(this.ambG);
      osc.start(t0);
      osc.stop(t0 + 0.15);
    }
  }

  private cricket() {
    const ctx = this.ctx;
    if (!ctx || !this.ambG) return;
    const t = ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const t0 = t + i * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = rand(4100, 4600);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0, t0);
      gn.gain.linearRampToValueAtTime(0.012, t0 + 0.008);
      gn.gain.linearRampToValueAtTime(0.0001, t0 + 0.03);
      osc.connect(gn).connect(this.ambG);
      osc.start(t0);
      osc.stop(t0 + 0.04);
    }
  }

  // ---------- SFX ----------
  private noiseHit(dur: number, freq: number, type: BiquadFilterType, gain: number, when = 0, endFreq?: number) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxG || !this.noiseBuf) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = rand(0.8, 1.2);
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.setValueAtTime(freq, t);
    if (endFreq) flt.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(gain, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(gn).connect(this.sfxG);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slideTo?: number) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxG) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(gain, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gn).connect(this.sfxG);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  click() { this.tone(640, 0.07, 'square', 0.05, 0, 460); }
  hover() { this.tone(880, 0.05, 'sine', 0.03, 0, 940); }
  jump() {
    this.tone(280, 0.16, 'sine', 0.06, 0, 560);
    this.noiseHit(0.06, 900, 'bandpass', 0.03, 0, 1600);
  }
  land() {
    this.noiseHit(0.09, 260, 'lowpass', 0.11);
    this.tone(120, 0.1, 'sine', 0.05, 0, 80);
  }
  swing(combo = 0) {
    const base = 420 - combo * 40;
    this.tone(base, 0.12, 'sawtooth', 0.045, 0, base * 1.7);
    this.noiseHit(0.09, 700, 'bandpass', 0.05, 0, 2600);
  }
  hit() {
    this.tone(860, 0.08, 'square', 0.08, 0, 260);
    this.tone(1320, 0.14, 'sine', 0.06, 0.02, 1860);
    this.noiseHit(0.05, 2000, 'highpass', 0.06);
  }
  enemyHurt() {
    this.tone(220, 0.18, 'sawtooth', 0.07, 0, 120);
    this.noiseHit(0.07, 600, 'bandpass', 0.05);
  }
  enemyDie() {
    this.tone(180, 0.5, 'sine', 0.08, 0, 60);
    this.tone(440, 0.8, 'sine', 0.05, 0.1, 880);
    this.noiseHit(0.4, 1400, 'bandpass', 0.07, 0, 600);
  }
  playerHurt() {
    this.tone(180, 0.22, 'sawtooth', 0.11, 0, 90);
    this.tone(90, 0.3, 'sine', 0.08, 0, 70);
  }
  splash() {
    this.noiseHit(0.5, 500, 'bandpass', 0.05, 0, 1500);
    this.tone(320, 0.25, 'sine', 0.04, 0, 180);
    this.tone(700, 0.3, 'sine', 0.025, 0.08, 1100);
  }
  reel() {
    this.tone(420, 0.1, 'square', 0.035, 0, 620);
    this.tone(620, 0.1, 'square', 0.035, 0.14, 880);
  }
  pickup() {
    this.tone(880, 0.14, 'sine', 0.14);
    this.tone(1318.5, 0.3, 'sine', 0.13, 0.07);
    this.tone(2093, 0.5, 'sine', 0.045, 0.14);
  }
  step(run: boolean) {
    this.stepFlip = !this.stepFlip;
    this.noiseHit(0.06, this.stepFlip ? 380 : 300, 'lowpass', run ? 0.1 : 0.065);
  }
  whoosh() { this.noiseHit(0.4, 300, 'bandpass', 0.16, 0, 2400); }
  lantern() {
    this.tone(200, 0.12, 'sine', 0.16, 0, 430);
    this.tone(1568, 0.5, 'sine', 0.05, 0.1);
  }
  chime() {
    this.tone(1046, 1.1, 'sine', 0.08);
    this.tone(1568, 1.4, 'sine', 0.055, 0.08);
  }
  purr() {
    const ctx = this.ctx;
    if (!ctx || !this.sfxG) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 54;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 9;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 14;
    lfo.connect(lfoG).connect(osc.frequency);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(0.1, t + 0.08);
    gn.gain.linearRampToValueAtTime(0.05, t + 0.9);
    gn.gain.linearRampToValueAtTime(0.0001, t + 1.15);
    osc.connect(gn).connect(this.sfxG);
    osc.start(t); osc.stop(t + 1.2);
    lfo.start(t); lfo.stop(t + 1.2);
  }
  bleat() {
    const ctx = this.ctx;
    if (!ctx || !this.sfxG) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(430, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.4);
    const vib = ctx.createOscillator();
    vib.frequency.value = 11;
    const vibG = ctx.createGain();
    vibG.gain.value = 22;
    vib.connect(vibG).connect(osc.frequency);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(0.09, t + 0.03);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 1600;
    osc.connect(flt).connect(gn).connect(this.sfxG);
    osc.start(t); osc.stop(t + 0.5);
    vib.start(t); vib.stop(t + 0.5);
  }
  fireCrackle() {
    this.noiseHit(rand(0.02, 0.05), rand(1400, 3200), 'highpass', rand(0.02, 0.05));
  }
  sting() {
    const ctx = this.ctx;
    if (!ctx || !this.musicG) return;
    const t = ctx.currentTime;
    [220, 261.63, 329.63].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(0.045, t + 1.4);
      gn.gain.linearRampToValueAtTime(0.0001, t + 4.4);
      osc.connect(gn).connect(this.musicG!);
      osc.start(t + i * 0.06);
      osc.stop(t + 4.5);
    });
    this.tone(1318.5, 2.4, 'sine', 0.035, 0.5);
  }
  pageTurn() { this.noiseHit(0.12, 1200, 'bandpass', 0.06, 0, 700); }
}
