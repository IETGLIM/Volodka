/** Modes for the single poem-reveal presentation shell. */

export type PoemRevealMode = 'discovery' | 'power_ritual' | 'explicit_read';

export type PoemRevealJob = {
  poemId: string;
  mode: PoemRevealMode;
};

/** Stage flags — same shell, different length / chrome per mode. */
export type PoemRevealStageFlags = {
  showKicker: boolean;
  kickerLabel: string;
  showTitleCard: boolean;
  showCompletenessBadge: boolean;
  showCombatCue: boolean;
  showPowerDescription: boolean;
  showBookHint: boolean;
  /** Camera dolly toward Volodka (power ritual only). */
  emitCameraDolly: boolean;
  /** Muffle ambient for intimate reading (power ritual). */
  muffleAudio: boolean;
  accentColor: string;
  testId: string;
};

export const POEM_REVEAL_STAGE_FLAGS: Record<PoemRevealMode, PoemRevealStageFlags> = {
  discovery: {
    showKicker: true,
    kickerLabel: 'Стих найден',
    showTitleCard: true,
    showCompletenessBadge: true,
    showCombatCue: true,
    showPowerDescription: true,
    showBookHint: true,
    emitCameraDolly: false,
    muffleAudio: false,
    accentColor: '#66ffaa',
    testId: 'poem-discovery-reveal',
  },
  power_ritual: {
    showKicker: true,
    kickerLabel: 'Чтение',
    showTitleCard: true,
    showCompletenessBadge: true,
    showCombatCue: true,
    showPowerDescription: true,
    showBookHint: true,
    emitCameraDolly: true,
    muffleAudio: true,
    accentColor: '#c8e6ff',
    testId: 'poem-reading-cutscene',
  },
  explicit_read: {
    showKicker: true,
    kickerLabel: 'Чтение',
    showTitleCard: true,
    showCompletenessBadge: true,
    showCombatCue: true,
    showPowerDescription: false,
    showBookHint: true,
    emitCameraDolly: false,
    muffleAudio: false,
    accentColor: '#66ffaa',
    testId: 'poem-explicit-read',
  },
};
