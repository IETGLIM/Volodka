import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirstReadingCelebration } from '@/components/game/FirstReadingCelebration';
import { prepareFirstReadingCelebrationContent } from '@/engine/quest/firstReadingCelebrationContent';

vi.mock('@/engine/quest/firstReadingCelebrationContent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/engine/quest/firstReadingCelebrationContent')>();
  return {
    ...actual,
    prepareFirstReadingCelebrationContent: vi.fn(actual.prepareFirstReadingCelebrationContent),
  };
});

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

describe('FirstReadingCelebration container', () => {
  beforeEach(() => {
    vi.mocked(prepareFirstReadingCelebrationContent).mockReset();
  });

  it('dismisses without rendering when content preparation throws', async () => {
    const onDismiss = vi.fn();
    vi.mocked(prepareFirstReadingCelebrationContent).mockImplementation(() => {
      throw new Error('missing quest data');
    });

    render(<FirstReadingCelebration onDismiss={onDismiss} />);

    expect(screen.queryByTestId('first-reading-celebration')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the overlay when content preparation succeeds', async () => {
    const onDismiss = vi.fn();
    vi.mocked(prepareFirstReadingCelebrationContent).mockReturnValue({
      quoteText: 'Тестовая цитата',
      excerptText: 'Строка один\nСтрока два',
      excerptLines: ['Строка один', 'Строка два'],
      isFragment: true,
      poemData: { title: 'Стих', author: 'Автор', lines: ['Строка один', 'Строка два'] },
      combatCue: 'Бой · Тест',
      rewardSummary: 'Награда',
      bonusXp: 10,
      bonusCredits: 5,
    });

    render(<FirstReadingCelebration onDismiss={onDismiss} />);

    expect(await screen.findByTestId('first-reading-celebration')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
