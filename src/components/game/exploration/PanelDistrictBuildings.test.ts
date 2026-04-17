import { describe, expect, it } from 'vitest';
import { PANEL_BUILDING_SPECS } from './PanelDistrictBuildings';

describe('PanelDistrictBuildings', () => {
  it('exports five panel blocks for instancing', () => {
    expect(PANEL_BUILDING_SPECS.length).toBe(5);
  });
});
