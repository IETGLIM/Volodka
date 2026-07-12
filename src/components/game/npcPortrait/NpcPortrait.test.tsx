import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NpcPortrait } from '@/components/game/NpcPortrait';

vi.mock('@/hooks/useAccessibilitySettings', () => ({
  useAccessibilitySettings: () => ({ colorBlindMode: 'none' }),
}));

vi.mock('@/components/game/npcPortrait/useNpcPortrait', () => ({
  useNpcPortrait: () => ({
    imageUrl: null,
    initial: 'A',
    resolved: {
      bodyColor: '#2a3142',
      accentColor: '#4a5568',
      headAccessory: 'none',
      height: 1,
      glowColor: '#22d3ee',
      silhouette: 'average',
    },
  }),
}));

describe('NpcPortrait', () => {
  it('renders accessible placeholder by default', () => {
    render(<NpcPortrait npcId="albert" name="Albert" />);
    expect(screen.getByRole('img', { name: /Портрет персонажа Albert/ })).toBeInTheDocument();
  });

  it('hides portrait from accessibility tree when decorative', () => {
    render(<NpcPortrait npcId="albert" name="Albert" decorative />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
