import { describe, expect, it } from 'vitest';
import { CODE_SPLITTING_GROUPS, MIN_CHUNK_SIZE, toRolldownGroups } from '../../vite/chunks';

describe('CODE_SPLITTING_GROUPS', () => {
  it('exports groups array with expected names', () => {
    const names = CODE_SPLITTING_GROUPS.map((g) => g.name);
    expect(names).toContain('physics-wasm');
    expect(names).toContain('three');
    expect(names).toContain('vendor');
    expect(names).toContain('engine-combat');
    expect(names).toContain('data-story-act1');
    expect(names).toContain('boot-shared');
  });

  it('all groups have name, test, priority', () => {
    for (const group of CODE_SPLITTING_GROUPS) {
      expect(group.name).toBeTruthy();
      expect(group.test).toBeInstanceOf(RegExp);
      expect(typeof group.priority).toBe('number');
    }
  });

  it('groups are sorted by priority descending (highest first)', () => {
    for (let i = 1; i < CODE_SPLITTING_GROUPS.length; i++) {
      expect(CODE_SPLITTING_GROUPS[i - 1].priority).toBeGreaterThanOrEqual(
        CODE_SPLITTING_GROUPS[i].priority,
      );
    }
  });

  it('no duplicate group names', () => {
    const names = CODE_SPLITTING_GROUPS.map((g) => g.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });

  it('act-specific story groups exist for all 7 acts', () => {
    for (let act = 1; act <= 7; act++) {
      expect(CODE_SPLITTING_GROUPS.some((g) => g.name === `data-story-act${act}`)).toBe(true);
    }
  });

  it('satellite story packs have dedicated groups', () => {
    const names = CODE_SPLITTING_GROUPS.map((g) => g.name);
    expect(names).toContain('data-story-pier');
    expect(names).toContain('data-story-library');
    expect(names).toContain('data-story-factory');
    expect(names).toContain('data-story-resistance');
    expect(names).toContain('data-story-epilogue');
    expect(names).toContain('data-story-solnysh');
  });

  it('physics is split into wasm + r3f chunks', () => {
    const names = CODE_SPLITTING_GROUPS.map((g) => g.name);
    expect(names).toContain('physics-wasm');
    expect(names).toContain('physics-r3f');
  });

  it('three.js is split into core + examples', () => {
    const names = CODE_SPLITTING_GROUPS.map((g) => g.name);
    expect(names).toContain('three');
    expect(names).toContain('three-examples');
  });
});

describe('MIN_CHUNK_SIZE', () => {
  it('exports 5KB threshold (same as old experimentalMinChunkSize)', () => {
    expect(MIN_CHUNK_SIZE).toBe(5 * 1024);
  });
});

describe('toRolldownGroups', () => {
  it('converts groups to Rolldown format', () => {
    const rolldown = toRolldownGroups(CODE_SPLITTING_GROUPS);
    expect(rolldown.length).toBe(CODE_SPLITTING_GROUPS.length);
    expect(rolldown[0]).toHaveProperty('name');
    expect(rolldown[0]).toHaveProperty('test');
    expect(rolldown[0]).toHaveProperty('priority');
  });
});
