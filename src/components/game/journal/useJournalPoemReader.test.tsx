import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POEMS } from '@/data/poems';
import { useGameStore } from '@/store/gameStore';
import {
  readStoredPoemViewMode,
  resolveDefaultPoemViewMode,
} from '@/components/game/poetryBook/poemViewMode';
import { useJournalPoemReader } from './useJournalPoemReader';

// Машинописец мгновенен под reduced motion — детерминизм тестов.
vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

const poem_1 = POEMS.find((poem) => poem.id === 'poem_1')!;

// Порядок POEMS не совпадает с порядком id (poem_2 идёт раньше poem_1):
// все индексы пейджера считаем по реальному порядку данных.
const COLLECTED_IDS = ['poem_1', 'poem_2'];
const collectedInBookOrder = POEMS.filter((poem) => COLLECTED_IDS.includes(poem.id));
const indexOfPoem = (id: string) => collectedInBookOrder.findIndex((poem) => poem.id === id);

function makeSelectPoem() {
  return vi.fn((_: string | null) => {});
}

function renderReader(selectedPoemId: string | null = null, selectPoem = makeSelectPoem()) {
  return renderHook(
    (props: { selectedPoemId: string | null; selectPoem: (id: string | null) => void }) =>
      useJournalPoemReader(props),
    { initialProps: { selectedPoemId, selectPoem } },
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  useGameStore.setState({ collectedPoems: [...COLLECTED_IDS] });
});

describe('useJournalPoemReader', () => {
  it('defaults to scroll when there is no stored preference and desktop media does not match', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    const { result } = renderReader();

    expect(result.current.viewMode).toBe('scroll');
    expect(result.current.selectedPoem).toBeNull();
    expect(result.current.currentPoemIndex).toBe(-1);
    expect(result.current.pageNumber).toBe(0);
  });

  it('defaults to spread on desktop when there is no stored preference', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const { result } = renderReader();

    expect(result.current.viewMode).toBe('spread');
  });

  it('honours the stored view mode shared with «Собрание стихов»', () => {
    window.localStorage.setItem('volodka:poetry-view-mode', 'spread');
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    const { result } = renderReader();

    expect(result.current.viewMode).toBe('spread');
  });

  it('typesets the full poem instantly under reduced motion', async () => {
    const { result } = renderReader('poem_1');

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.selectedPoem?.id).toBe('poem_1');
    expect(result.current.displayedLines).toEqual(poem_1.lines);
    expect(result.current.currentPoemIndex).toBe(indexOfPoem('poem_1'));
    expect(result.current.pageNumber).toBe(indexOfPoem('poem_1') + 1);
    expect(result.current.totalPages).toBe(COLLECTED_IDS.length);
  });

  it('pager navigates only within collected poems and stops at the edges', async () => {
    const selectPoem = makeSelectPoem();
    const idx1 = indexOfPoem('poem_1');
    const { result, rerender } = renderReader('poem_1', selectPoem);

    if (idx1 < collectedInBookOrder.length - 1) {
      act(() => result.current.handleNextPoem());
      expect(selectPoem).toHaveBeenCalledWith(collectedInBookOrder[idx1 + 1]!.id);
    }
    if (idx1 > 0) {
      act(() => result.current.handlePrevPoem());
      expect(selectPoem).toHaveBeenLastCalledWith(collectedInBookOrder[idx1 - 1]!.id);
    }

    // Второй собранный стих — обратная навигация
    const other = COLLECTED_IDS.find((id) => id !== 'poem_1')!;
    rerender({ selectedPoemId: other, selectPoem });
    await waitFor(() => expect(result.current.selectedPoem?.id).toBe(other));
    expect(result.current.currentPoemIndex).toBe(indexOfPoem(other));

    const callsBefore = selectPoem.mock.calls.length;
    if (indexOfPoem(other) >= collectedInBookOrder.length - 1) {
      act(() => result.current.handleNextPoem());
      expect(selectPoem.mock.calls.length).toBe(callsBefore);
    }
    if (indexOfPoem(other) > 0) {
      act(() => result.current.handlePrevPoem());
      expect(selectPoem).toHaveBeenLastCalledWith(collectedInBookOrder[indexOfPoem(other) - 1]!.id);
    }
  });

  it('handleBack clears the selection via selectPoem(null)', () => {
    const selectPoem = makeSelectPoem();
    const { result } = renderReader('poem_1', selectPoem);

    act(() => result.current.handleBack());
    expect(selectPoem).toHaveBeenCalledWith(null);
  });

  it('toggle flips the mode and persists it to the shared storage key', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    const { result } = renderReader();
    expect(result.current.viewMode).toBe('scroll');

    act(() => result.current.handleToggleViewMode());
    expect(result.current.viewMode).toBe('spread');
    expect(readStoredPoemViewMode()).toBe('spread');

    act(() => result.current.handleToggleViewMode());
    expect(result.current.viewMode).toBe('scroll');
    expect(resolveDefaultPoemViewMode()).toBe('scroll');
  });

  it('keeps the pager metadata derived from the collected set', () => {
    const { result, rerender } = renderReader();
    rerender({ selectedPoemId: 'poem_1', selectPoem: makeSelectPoem() });
    expect(result.current.totalPages).toBe(COLLECTED_IDS.length);
    expect(result.current.pageNumber).toBe(indexOfPoem('poem_1') + 1);
  });
});
