import { describe, expect, it } from 'vitest';
import { formatSceneBanner } from '@/engine/world/worldAmbiencePresentation';

describe('formatSceneBanner', () => {
  it('includes cell and region for residential interior', () => {
    const banner = formatSceneBanner('home_evening', 'Кухня');
    expect(banner.title).toBe('Кухня');
    expect(banner.subtitle).toContain('Спальные кварталы');
    expect(banner.subtitle).toContain('Город Володьки');
  });

  it('includes industrial region for factory', () => {
    const banner = formatSceneBanner('abandoned_factory', 'Заброшенный завод');
    expect(banner.subtitle).toContain('Промзона');
  });
});
