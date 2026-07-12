import { describe, expect, it } from 'vitest';
import { GAMEPLAY_EXCLUSIVE_PANELS, panelStackReducer } from './panelStackReducer';

describe('panelStackReducer gameplay exclusive panels', () => {
  it('replaces other gameplay panels when opening inventory', () => {
    const next = panelStackReducer(['quests'], { type: 'toggle', panel: 'inventory' });
    expect(next).toEqual(['inventory']);
  });

  it('replaces other gameplay panels when ensuring poetry open', () => {
    const next = panelStackReducer(['inventory', 'menu'], { type: 'ensureOpen', panel: 'poetry' });
    expect(next).toEqual(['menu', 'poetry']);
  });

  it('keeps pause menu when toggling exclusive panels', () => {
    const next = panelStackReducer(['menu', 'quests'], { type: 'toggle', panel: 'inventory' });
    expect(next).toEqual(['menu', 'inventory']);
  });

  it('documents exclusive gameplay panel ids', () => {
    expect([...GAMEPLAY_EXCLUSIVE_PANELS].sort()).toEqual(['inventory', 'poetry', 'quests']);
  });
});
