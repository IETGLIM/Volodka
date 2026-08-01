/* ─── Speaker Expressions — NPC facial expression defaults & mood overrides ───
 *
 * Maps NPC IDs to their default facial expression and mood-based overrides.
 * Used by the dialogue renderer to select a portrait expression when no
 * explicit `facialExpression` is set on a DialogueNode.
 *
 * Resolution order:
 *   1. DialogueNode.facialExpression (explicit per-line)
 *   2. Mood override from this table (based on DialogueNode.emotion)
 *   3. NPC default from this table
 *   4. Fallback: 'neutral'
 */

import type { FacialExpression } from '@/shared/types/game';

/** Subset of DialogueNode.emotion used as lookup keys for mood overrides. */
export type ExpressionMoodKey = 'calm' | 'angry' | 'sad' | 'happy' | 'whisper';

export interface NpcExpressionProfile {
  /** Expression when no emotion or override is specified. */
  readonly defaultExpression: FacialExpression;
  /** Overrides keyed by dialogue emotion. Missing keys fall back to defaultExpression. */
  readonly moodOverrides?: Partial<Record<ExpressionMoodKey, FacialExpression>>;
}

/**
 * Master table: NPC id → expression profile.
 * Each NPC has a default expression and optional mood-based overrides.
 * At least 15 NPCs with 3–4 mood overrides each.
 */
export const SPEAKER_EXPRESSIONS: Record<string, NpcExpressionProfile> = {
  /* ── Main cast ── */

  albert: {
    defaultExpression: 'thinking',
    moodOverrides: {
      calm: 'thinking',
      angry: 'determined',
      sad: 'worried',
      happy: 'smirk',
      whisper: 'thinking',
    },
  },

  zarema: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'happy',
      angry: 'sad',
      sad: 'worried',
      happy: 'happy',
      whisper: 'worried',
    },
  },

  maria: {
    defaultExpression: 'determined',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'sad',
      happy: 'smirk',
      whisper: 'thinking',
    },
  },

  solnysh: {
    defaultExpression: 'happy',
    moodOverrides: {
      calm: 'happy',
      angry: 'surprised',
      sad: 'sad',
      happy: 'happy',
    },
  },

  viktor: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'thinking',
      happy: 'smirk',
    },
  },

  /* ── Office NPCs ── */

  office_alexander: {
    defaultExpression: 'determined',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'worried',
      happy: 'smirk',
    },
  },

  office_colleague: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'neutral',
      angry: 'surprised',
      sad: 'sad',
      happy: 'happy',
    },
  },

  office_dmitry: {
    defaultExpression: 'smirk',
    moodOverrides: {
      calm: 'smirk',
      angry: 'angry',
      sad: 'thinking',
      happy: 'smirk',
    },
  },

  /* ── Cafe / social NPCs ── */

  cafe_barista: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'sad',
      happy: 'happy',
    },
  },

  /* ── Underground / resistance NPCs ── */

  kira: {
    defaultExpression: 'determined',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'worried',
      happy: 'happy',
    },
  },

  boris: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'thinking',
      happy: 'smirk',
    },
  },

  tamara: {
    defaultExpression: 'thinking',
    moodOverrides: {
      calm: 'thinking',
      angry: 'determined',
      sad: 'sad',
      happy: 'happy',
    },
  },

  grisha: {
    defaultExpression: 'smirk',
    moodOverrides: {
      calm: 'smirk',
      angry: 'angry',
      sad: 'fearful',
      happy: 'happy',
    },
  },

  /* ── Expansion NPCs ── */

  anya: {
    defaultExpression: 'happy',
    moodOverrides: {
      calm: 'happy',
      angry: 'angry',
      sad: 'sad',
      whisper: 'thinking',
    },
  },

  lyonya: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'worried',
      happy: 'smirk',
    },
  },

  oleg: {
    defaultExpression: 'determined',
    moodOverrides: {
      calm: 'neutral',
      angry: 'angry',
      sad: 'thinking',
      happy: 'smirk',
    },
  },

  lena: {
    defaultExpression: 'neutral',
    moodOverrides: {
      calm: 'happy',
      angry: 'sad',
      sad: 'worried',
      happy: 'happy',
    },
  },

  baba_zina: {
    defaultExpression: 'thinking',
    moodOverrides: {
      calm: 'thinking',
      angry: 'determined',
      sad: 'sad',
      happy: 'happy',
    },
  },
};

/** Fallback expression when no profile exists. */
const FALLBACK_EXPRESSION: FacialExpression = 'neutral';

/**
 * Resolve the facial expression for a dialogue node.
 * Priority: explicit → mood override → NPC default → 'neutral'.
 */
export function resolveSpeakerExpression(
  npcId: string | undefined,
  explicitExpression: FacialExpression | undefined,
  emotion: 'calm' | 'angry' | 'sad' | 'happy' | 'whisper' | undefined,
): FacialExpression {
  // 1. Explicit per-node override wins always.
  if (explicitExpression) return explicitExpression;

  // 2. No NPC id → fallback.
  if (!npcId) return FALLBACK_EXPRESSION;

  const profile = SPEAKER_EXPRESSIONS[npcId];
  if (!profile) return FALLBACK_EXPRESSION;

  // 3. Mood override via emotion key.
  if (emotion && profile.moodOverrides) {
    const moodExpr = profile.moodOverrides[emotion];
    if (moodExpr) return moodExpr;
  }

  // 4. NPC default.
  return profile.defaultExpression;
}
