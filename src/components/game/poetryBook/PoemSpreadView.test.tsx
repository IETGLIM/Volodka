import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PoemSpreadView } from './PoemSpreadView';
import { POEMS } from '@/data/poems';

// PoemPowerCard тянет GameActionBridge (снапшот стора) при рендере —
// в изолированном тесте вида он не участвует, ставим стаб.
vi.mock('./PoemPowerCard', () => ({
  PoemPowerCard: () => <div data-testid="poem-power-stub" />,
}));

const poem = POEMS[0]!;
const contentRef: React.RefObject<HTMLDivElement | null> = { current: null };

function makeProps(overrides: Partial<Parameters<typeof PoemSpreadView>[0]> = {}) {
  return {
    selectedPoem: poem,
    displayedLines: poem.lines,
    done: true,
    skipAll: vi.fn(),
    marginNote: undefined,
    pageNumber: 1,
    totalPages: 3,
    currentPoemIndex: 0,
    reducedMotion: true,
    contentRef,
    handleBack: vi.fn(),
    handlePrevPoem: vi.fn(),
    handleNextPoem: vi.fn(),
    readPoemIds: new Set<string>(),
    viewMode: 'spread' as const,
    onToggleViewMode: vi.fn(),
    ...overrides,
  };
}

describe('PoemSpreadView', () => {
  it('renders the two-page spread with title, author and poem text', () => {
    render(<PoemSpreadView {...makeProps()} />);

    expect(screen.getByRole('heading', { name: poem.title })).toBeInTheDocument();
    // Автор встречается дважды: в шапке листа и на титульной странице
    expect(screen.getAllByText(poem.author).length).toBe(2);
    // Лист-метка шапки тетради с римским номером
    expect(screen.getAllByText(/ночная тетрадь · лист/i).length).toBeGreaterThan(0);
    // Строки стиха присутствуют (первая непустая)
    const firstLine = poem.lines.find((line) => line !== '')!;
    expect(screen.getByText(firstLine)).toBeInTheDocument();
  });

  it('keeps the full poem text intact in the reading view', () => {
    render(<PoemSpreadView {...makeProps()} />);
    for (const line of poem.lines) {
      if (line === '') continue;
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it('calls skipAll when the poem body is clicked mid-typewriter', () => {
    const skipAll = vi.fn();
    render(<PoemSpreadView {...makeProps({ done: false, skipAll })} />);

    const region = screen.getByRole('region', { name: `Разворот стиха «${poem.title}»` });
    const clickEvent = createEvent.click(region);
    // aria-hidden body содержит строки — клик идёт на родителя-скролла
    fireEvent(region, clickEvent);
    expect(skipAll).toHaveBeenCalledTimes(1);
  });

  it('shows the margin note only when the typewriter is done', () => {
    const note = { id: 'm1', poemId: poem.id, text: 'Заметка на полях' };
    const { rerender } = render(<PoemSpreadView {...makeProps({ done: false, marginNote: note })} />);
    expect(screen.queryByText(note.text)).not.toBeInTheDocument();

    rerender(<PoemSpreadView {...makeProps({ done: true, marginNote: note })} />);
    expect(screen.getByText(note.text)).toBeInTheDocument();
  });

  it('disables the prev button at the first poem and next at the last', () => {
    const { rerender } = render(<PoemSpreadView {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Пред.' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'След.' })).toBeEnabled();

    rerender(
      <PoemSpreadView
        {...makeProps({ currentPoemIndex: 2, pageNumber: 3 })}
      />,
    );
    expect(screen.getByRole('button', { name: 'Пред.' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'След.' })).toBeDisabled();
  });

  it('offers the view-mode toggle with correct pressed state', () => {
    const onToggleViewMode = vi.fn();
    const { rerender } = render(
      <PoemSpreadView {...makeProps({ viewMode: 'spread', onToggleViewMode })} />,
    );

    const toggle = screen.getByRole('button', { name: 'Показать простым свитком' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(onToggleViewMode).toHaveBeenCalledTimes(1);

    rerender(<PoemSpreadView {...makeProps({ viewMode: 'scroll', onToggleViewMode })} />);
    expect(screen.getByRole('button', { name: 'Показать разворотом тетради' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('renders nothing without a selected poem', () => {
    const { container } = render(
      <PoemSpreadView {...makeProps({ selectedPoem: null })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the read stamp only for poems already read', () => {
    // Не прочитан — штампа нет (и скрытой подписи тоже)
    const unread = render(<PoemSpreadView {...makeProps()} />);
    expect(screen.queryByText('прочитано')).not.toBeInTheDocument();
    expect(screen.queryByText('Стих прочитан')).not.toBeInTheDocument();
    unread.unmount();

    // Прочитан — штамп на титуле + скрытая подпись для скринридера
    render(<PoemSpreadView {...makeProps({ readPoemIds: new Set([poem.id]) })} />);
    expect(screen.getByText('прочитано')).toBeInTheDocument();
    expect(screen.getByText('Стих прочитан')).toBeInTheDocument();
  });
});
