import { describe, expect, it } from 'vitest';
import { isValidSaveDataShape } from './saveDataValidation';

describe('isValidSaveDataShape', () => {
  it('отклоняет null, примитивы, массив, пустой объект', () => {
    expect(isValidSaveDataShape(null)).toBe(false);
    expect(isValidSaveDataShape(undefined)).toBe(false);
    expect(isValidSaveDataShape('x')).toBe(false);
    expect(isValidSaveDataShape(1)).toBe(false);
    expect(isValidSaveDataShape([])).toBe(false);
    expect(isValidSaveDataShape({})).toBe(false);
  });

  it('принимает объекты с узнаваемыми полями сейва', () => {
    expect(isValidSaveDataShape({ playerState: { mood: 1 } })).toBe(true);
    expect(isValidSaveDataShape({ currentNodeId: 'a' })).toBe(true);
    expect(isValidSaveDataShape({ exploration: { x: 1 } })).toBe(true);
    expect(isValidSaveDataShape({ activeQuestIds: [] })).toBe(true);
    expect(isValidSaveDataShape({ inventory: [] })).toBe(true);
    expect(isValidSaveDataShape({ questProgress: {} })).toBe(true);
  });
});
