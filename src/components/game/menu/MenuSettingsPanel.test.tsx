import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuSettingsPanel } from '@/components/game/menu/MenuSettingsPanel';
import { GRAPHICS_SETTINGS_KEY } from '@/engine/graphics/qualityPresets';
import {
  resetDefaultAccessibilityManager,
  initAccessibilitySettings,
} from '@/engine/accessibility/accessibilitySettings';

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: { playSfx: vi.fn() },
}));

vi.mock('@/engine/menu/menuPresentation', () => ({
  safePlayMenuSfx: vi.fn(),
}));

describe('MenuSettingsPanel (compact mode of unified settings)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDefaultAccessibilityManager();
    initAccessibilitySettings();
  });

  afterEach(() => {
    localStorage.clear();
    resetDefaultAccessibilityManager();
  });

  it('renders graphics quality presets in the main menu', () => {
    render(
      <MenuSettingsPanel musicEnabled onToggleMusic={vi.fn()} onClose={vi.fn()} />,
    );

    const group = screen.getByRole('group', { name: 'Качество графики' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Авто' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Низкое' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Высокое' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ультра' })).toBeInTheDocument();
  });

  it('persists a manual quality preset before the game starts', async () => {
    const user = userEvent.setup();
    render(
      <MenuSettingsPanel musicEnabled onToggleMusic={vi.fn()} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Высокое' }));

    expect(localStorage.getItem(GRAPHICS_SETTINGS_KEY)).toBe('high');
    expect(screen.getByRole('button', { name: 'Высокое' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows personalization switches with switch semantics', () => {
    render(
      <MenuSettingsPanel musicEnabled onToggleMusic={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('switch', { name: 'Музыка' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Нуар-режим' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Матричный дождь' })).toBeInTheDocument();
  });

  it('forwards music toggle to the menu state', async () => {
    const onToggleMusic = vi.fn();
    const user = userEvent.setup();
    render(
      <MenuSettingsPanel musicEnabled onToggleMusic={onToggleMusic} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole('switch', { name: 'Музыка' }));
    expect(onToggleMusic).toHaveBeenCalledOnce();
  });

  it('closes via the close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MenuSettingsPanel musicEnabled onToggleMusic={vi.fn()} onClose={onClose} />,
    );

    await user.click(screen.getByRole('button', { name: 'Закрыть настройки' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
