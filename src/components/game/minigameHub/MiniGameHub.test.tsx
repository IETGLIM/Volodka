import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MiniGameHub } from '@/components/game/MiniGameHub';

const emitMock = vi.fn();
const hasHandlersMock = vi.fn((_event: string) => true);

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    emit: (event: string, payload: unknown) => emitMock(event, payload),
    hasHandlers: (event: string) => hasHandlersMock(event),
  },
}));

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: {
    playSfx: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

describe('MiniGameHub', () => {
  beforeEach(() => {
    emitMock.mockClear();
    hasHandlersMock.mockReturnValue(true);
  });

  it('renders game list when open', () => {
    render(<MiniGameHub open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Аркада' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<MiniGameHub open onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('emits minigame:open and closes on launch', () => {
    const onClose = vi.fn();
    render(<MiniGameHub open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Запустить Взломщик кода' }));
    expect(emitMock).toHaveBeenCalledWith('minigame:open', { gameType: 'codebreaker' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
