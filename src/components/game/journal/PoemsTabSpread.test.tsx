import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POEMS } from '@/data/poems';
import { useGameStore } from '@/store/gameStore';
import { PoemsTab } from './PoemsTab';

// PoemPowerCard тянет GameActionBridge (снапшот стора) — в изолированном
// тесте вкладки он не участвует, ставим стаб (см. PoemSpreadView.test.tsx).
vi.mock('@/components/game/poetryBook/PoemPowerCard', () => ({
  PoemPowerCard: () => <div data-testid="poem-power-stub" />,
}));

// Детерминизм: машинописец мгновенен, кулдаун способности нулевой.
vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));
vi.mock('@/components/game/poetryBook/usePoemCooldownSeconds', () => ({
  usePoemCooldownSeconds: () => 0,
}));

const poem_1 = POEMS.find((poem) => poem.id === 'poem_1')!;

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
  useGameStore.setState({ collectedPoems: ['poem_1', 'poem_2'] });
});

describe('PoemsTab — разворот «Ночной тетради» (v4.48.10)', () => {
  it('opens the book spread when a collected poem is clicked with spread view mode', () => {
    window.localStorage.setItem('volodka:poetry-view-mode', 'spread');
    render(<PoemsTab searchQuery="" />);

    fireEvent.click(screen.getByRole('button', { name: poem_1.title }));

    // Шапка листа с римским номером и титульная страница
    expect(screen.getAllByText(/ночная тетрадь · лист/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(poem_1.title).length).toBeGreaterThan(0);
    // Сила стиха (стаб PoemPowerCard) на левой странице
    expect(screen.getByTestId('poem-power-stub')).toBeInTheDocument();
  });

  it('keeps the whole poem text intact in the spread', () => {
    window.localStorage.setItem('volodka:poetry-view-mode', 'spread');
    render(<PoemsTab searchQuery="" />);
    fireEvent.click(screen.getByRole('button', { name: poem_1.title }));

    for (const line of poem_1.lines) {
      if (line === '') continue;
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it('back button in the spread returns to the journal grid', () => {
    window.localStorage.setItem('volodka:poetry-view-mode', 'spread');
    render(<PoemsTab searchQuery="" />);
    fireEvent.click(screen.getByRole('button', { name: poem_1.title }));

    fireEvent.click(screen.getByRole('button', { name: /назад к списку/i }));

    // Грид снова на месте: счётчик найденного
    expect(screen.getByText(/из \d+ найдено/i)).toBeInTheDocument();
  });

  it('scroll reader shows title, poem lines and the view-mode toggle', () => {
    render(<PoemsTab searchQuery="" />);
    fireEvent.click(screen.getByRole('button', { name: poem_1.title }));

    expect(screen.getByRole('heading', { name: poem_1.title })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /показать разворотом тетради/i }),
    ).toBeInTheDocument();
  });

  it('toggle in the scroll reader switches to the spread and back (sticky storage)', () => {
    render(<PoemsTab searchQuery="" />);
    fireEvent.click(screen.getByRole('button', { name: poem_1.title }));

    // Свиток → разворот
    fireEvent.click(screen.getByRole('button', { name: /показать разворотом тетради/i }));
    expect(screen.getAllByText(/ночная тетрадь · лист/i).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem('volodka:poetry-view-mode')).toBe('spread');

    // Разворот → свиток
    fireEvent.click(screen.getByRole('button', { name: /показать простым свитком/i }));
    expect(screen.getByRole('heading', { name: poem_1.title })).toBeInTheDocument();
    expect(window.localStorage.getItem('volodka:poetry-view-mode')).toBe('scroll');
  });
});
