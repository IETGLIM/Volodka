import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readStoredPoemViewMode,
  resolveDefaultPoemViewMode,
  writeStoredPoemViewMode,
} from './poemViewMode';

const STORAGE_KEY = 'volodka:poetry-view-mode';

describe('poemViewMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readStoredPoemViewMode', () => {
    it('returns null when nothing is stored', () => {
      expect(readStoredPoemViewMode()).toBeNull();
    });

    it('returns the stored mode', () => {
      window.localStorage.setItem(STORAGE_KEY, 'spread');
      expect(readStoredPoemViewMode()).toBe('spread');
      window.localStorage.setItem(STORAGE_KEY, 'scroll');
      expect(readStoredPoemViewMode()).toBe('scroll');
    });

    it('rejects unknown values', () => {
      window.localStorage.setItem(STORAGE_KEY, 'matrix');
      expect(readStoredPoemViewMode()).toBeNull();
    });

    it('survives a throwing localStorage (private mode)', () => {
      const original = window.localStorage.getItem.bind(window.localStorage);
      vi.spyOn(window.localStorage, 'getItem').mockImplementation((key: string) => {
        if (key === STORAGE_KEY) throw new DOMException('denied');
        return original(key);
      });
      expect(readStoredPoemViewMode()).toBeNull();
    });
  });

  describe('writeStoredPoemViewMode', () => {
    it('persists the mode', () => {
      writeStoredPoemViewMode('scroll');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('scroll');
      writeStoredPoemViewMode('spread');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('spread');
    });

    it('survives a throwing localStorage', () => {
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('denied');
      });
      expect(() => writeStoredPoemViewMode('spread')).not.toThrow();
    });
  });

  describe('resolveDefaultPoemViewMode', () => {
    it('prefers the sticky stored choice over the viewport', () => {
      window.localStorage.setItem(STORAGE_KEY, 'scroll');
      vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
      expect(resolveDefaultPoemViewMode()).toBe('scroll');
    });

    it('auto-selects spread on lg+ viewports', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: query === '(min-width: 1024px)',
      }) as MediaQueryList);
      expect(resolveDefaultPoemViewMode()).toBe('spread');
    });

    it('auto-selects scroll on narrow viewports', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
      expect(resolveDefaultPoemViewMode()).toBe('scroll');
    });

    it('falls back to scroll when matchMedia throws', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation(() => {
        throw new TypeError('not a function environment');
      });
      expect(resolveDefaultPoemViewMode()).toBe('scroll');
    });
  });
});
