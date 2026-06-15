import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import {
  initAccessibilitySettings,
  resetDefaultAccessibilityManager,
} from '@/engine/accessibility/accessibilitySettings';

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDefaultAccessibilityManager();
    initAccessibilitySettings();
  });

  afterEach(() => {
    localStorage.clear();
    resetDefaultAccessibilityManager();
  });

  it('renders nothing when closed', () => {
    render(<SettingsPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('heading', { name: 'Настройки' })).not.toBeInTheDocument();
  });

  it('shows tabs and audio defaults when open', () => {
    render(<SettingsPanel open onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Настройки' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Аудио/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Визуал/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Управление/ })).toBeInTheDocument();
    expect(screen.getByText('Музыка')).toBeInTheDocument();
  });

  it('shows accessibility controls on the visual tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Визуал/ }));

    expect(screen.getByText('Доступность')).toBeInTheDocument();
    expect(screen.getByText('Режим для дальтоников')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Уменьшить анимации' })).toBeInTheDocument();
    expect(screen.getByText('Размер субтитров')).toBeInTheDocument();
    expect(screen.getByText('Скорость текста')).toBeInTheDocument();
    expect(screen.getByText('Скорость ходьбы')).toBeInTheDocument();
  });

  it('persists combat difficulty from controls tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Управление/ }));
    await user.click(screen.getByRole('button', { name: 'Сюжетный' }));

    expect(localStorage.getItem('volodka_combat_difficulty')).toBe('story');
  });

  it('calls onClose from the close button and Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsPanel open onClose={onClose} />);

    await user.click(screen.getAllByRole('button', { name: 'Закрыть настройки' })[0]!);
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockClear();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
