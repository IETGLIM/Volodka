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
    expect(screen.getByRole('switch', { name: 'Пропускать ритуал чтения стихов' })).toBeInTheDocument();
    expect(screen.getByText('Размер субтитров')).toBeInTheDocument();
    expect(screen.getByText('Скорость текста')).toBeInTheDocument();
    expect(screen.getByText('Скорость ходьбы')).toBeInTheDocument();
  });

  it('persists skip poem cutscenes toggle', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Визуал/ }));
    await user.click(screen.getByRole('switch', { name: 'Пропускать ритуал чтения стихов' }));

    expect(localStorage.getItem('volodka_skip_poem_cutscenes')).toBe('true');
  });

  it('persists combat difficulty from controls tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Управление/ }));
    // The button's accessible name includes the difficulty icon (📖 Сюжетный).
    await user.click(screen.getByRole('button', { name: /Сюжетный/ }));

    // Modern difficulty flow: the zustand difficulty slice is the source of
    // truth (persisted via the save payload); the legacy
    // 'volodka_combat_difficulty' localStorage key belongs to the old
    // 3-tier system and is intentionally no longer written here.
    const { useGameStore } = await import('@/store/gameStore');
    expect(useGameStore.getState().difficultySettings.difficulty).toBe('story');
  });

  it('shows quality preset hints on the visual tab', async () => {
    localStorage.setItem('volodka_quality_preset', 'high');
    const user = userEvent.setup();
    render(<SettingsPanel open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Визуал/ }));

    expect(screen.getByText(/Уникальные аватары/)).toBeInTheDocument();
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
