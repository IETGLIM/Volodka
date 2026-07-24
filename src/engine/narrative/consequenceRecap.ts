/**
 * Phase 12.5: Consequence Recap System
 *
 * Reads the choiceLog and moralChoices arrays (populated by Phase 12.1)
 * and generates human-readable summaries for:
 *   - Act transitions ("Ранее в ВОЛОДЬКА...")
 *   - Save-load context recovery
 *   - Journal "decisions" review
 *
 * This is the Disco Elysium-style "thought cabinet reflects on past choices"
 * system that makes the player's journey feel consequential.
 */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';

interface ParsedChoice {
  nodeId: string;
  text: string;
  kind: 'story' | 'dialogue';
  timestamp: number;
}

interface ParsedMoralChoice {
  nodeId: string;
  text: string;
  timestamp: number;
}

function parseChoiceLog(raw: string[]): ParsedChoice[] {
  const parsed: ParsedChoice[] = [];
  for (const entry of raw) {
    try {
      const obj = JSON.parse(entry);
      if (obj.n && obj.t) {
        parsed.push({ nodeId: obj.n, text: obj.t, kind: obj.k ?? 'story', timestamp: obj.ts ?? 0 });
      }
    } catch { /* skip malformed entries */ }
  }
  return parsed;
}

function parseMoralChoices(raw: string[]): ParsedMoralChoice[] {
  const parsed: ParsedMoralChoice[] = [];
  for (const entry of raw) {
    try {
      const obj = JSON.parse(entry);
      if (obj.n && obj.t) {
        parsed.push({ nodeId: obj.n, text: obj.t, timestamp: obj.ts ?? 0 });
      }
    } catch { /* skip */ }
  }
  return parsed;
}

/**
 * Get the player's full decision history, most recent first.
 */
export function getChoiceHistory(): ParsedChoice[] {
  const snap = getGameSnapshot();
  return parseChoiceLog(snap.playerState.choiceLog).reverse();
}

/**
 * Get only morally significant choices (karma/NPC relation changes).
 */
export function getMoralHistory(): ParsedMoralChoice[] {
  const snap = getGameSnapshot();
  return parseMoralChoices(snap.playerState.moralChoices).reverse();
}

/**
 * Generate a recap summary for the current act.
 * Returns a concise Russian-language summary of key decisions.
 *
 * Example output:
 *   «Акт 2 позади. Ты помог Альберту с кодом, отказался сдавать Зарему,
 *    и нашёл третий стих. Карма: +12. Союзники: Альберт, Виктория.»
 */
export function generateActRecap(actNumber: number): string {
  const snap = getGameSnapshot();
  const choices = parseChoiceLog(snap.playerState.choiceLog);
  const moralChoices = parseMoralChoices(snap.playerState.moralChoices);
  const karma = snap.playerState.karma;

  const lines: string[] = [];

  // Opening
  if (actNumber > 1) {
    lines.push(`Акт ${actNumber - 1} позади.`);
  } else {
    lines.push('Начало пути.');
  }

  // Moral choices summary (capped at 3 most recent)
  if (moralChoices.length > 0) {
    const recent = moralChoices.slice(-3).reverse();
    for (const mc of recent) {
      const text = mc.text.length > 60 ? mc.text.slice(0, 57) + '...' : mc.text;
      lines.push(`• ${text}`);
    }
  }

  // Karma assessment
  if (karma >= 65) {
    lines.push('Люди видят в тебе что-то хорошее.');
  } else if (karma <= 35) {
    lines.push('Твои поступки вызывают тревогу.');
  }

  return lines.join('\n');
}

/**
 * Count total choices and moral choices for a stats display.
 */
export function getConsequenceStats(): {
  totalChoices: number;
  moralChoices: number;
  karma: number;
} {
  const snap = getGameSnapshot();
  return {
    totalChoices: snap.playerState.choiceLog.length,
    moralChoices: snap.playerState.moralChoices.length,
    karma: snap.playerState.karma,
  };
}