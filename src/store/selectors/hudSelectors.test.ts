/* ─── Этап 100 (волна 1): контракт узких HUD-селекторов ───
 * 1. «Широкий» 12-полевой бандл useHUDControllerState не должен вернуться:
 *    все потребители переведены на узкие подписки (useHUDExploration,
 *    useVitalStats, useProgressionSummary, useScreenEffectsVitals или
 *    собственные бандлы ниже).
 * 2. Новые plain-селекторы обязаны быть shallow-стабильными (React #185):
 *    никакие вложенные литералы внутри селектора недопустимы.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { shallow } from 'zustand/vanilla/shallow';
import {
  selectAmbientOverlayState,
  selectAtmosphereCaptionState,
  selectStatsDashboardState,
} from './hudSelectors';
import type { GameStoreState } from '../types';

/* ─── Контракт 1: широкий бандл удалён ─── */

const SRC_ROOT = resolve(__dirname, '../..');

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      collectTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

describe('этап 100: широкий HUD-бандл удалён', () => {
  it('useHUDControllerState больше нигде не вызывается', () => {
    const offenders: string[] = [];
    for (const file of collectTsFiles(SRC_ROOT)) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('useHUDControllerState')) offenders.push(file);
    }
    expect(
      offenders,
      `12-полевой бандл вернулся в файлах: ${offenders.join(', ')} — используйте узкие подписки`,
    ).toEqual([]);
  });
});

/* ─── Контракт 2: shallow-стабильность новых селекторов ─── */

function makeState(): GameStoreState {
  return {
    showStoryOverlay: true,
    currentNodeId: 'corridor_door',
    diegeticNarrative: null,
    collectedPoems: [],
    quests: [],
    npcRelations: [],
    unlockedAchievements: [],
    playerState: {
      karma: 50,
      stress: 20,
      flags: {},
      visitedNodes: ['park_day'],
      progression: { currentAct: 1, level: 1, xp: 0, xpToNextLevel: 100 },
      inventory: [],
    },
    exploration: { timeOfDay: 12, currentSceneId: 'park_day' },
  } as unknown as GameStoreState;
}

describe('этап 100: новые HUD-селекторы shallow-стабильны', () => {
  const selectors = [
    ['selectAmbientOverlayState', selectAmbientOverlayState],
    ['selectAtmosphereCaptionState', selectAtmosphereCaptionState],
    ['selectStatsDashboardState', selectStatsDashboardState],
  ] as const;

  it.each(selectors)('%s возвращает shallow-равный снапшот для того же состояния', (_name, select) => {
    const state = makeState();
    const a = select(state);
    const b = select(state);
    expect(shallow(a, b)).toBe(true);
  });

  it.each(selectors)('%s не создаёт вложенных свежих объектов', (_name, select) => {
    const state = makeState();
    const a = select(state) as Record<string, unknown>;
    const b = select(state) as Record<string, unknown>;
    for (const key of Object.keys(a)) {
      const va = a[key];
      const vb = b[key];
      if (typeof va === 'object' && va !== null) {
        // Объектные поля обязаны приходить из стора той же ссылкой.
        expect(vb, `поле "${key}" должно быть ссылочно-стабильным`).toBe(va);
      }
    }
  });
});
