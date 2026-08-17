import { describe, expect, it } from 'vitest';
import {
  getSceneSpecificFov,
  INDOOR_FOV,
  OUTDOOR_FOV,
} from './cameraConstants';

describe('cameraConstants', () => {
  it('uses indoor FOV for inherited room variants', () => {
    expect(getSceneSpecificFov('zarema_room')).toBe(INDOOR_FOV);
    expect(getSceneSpecificFov('zarema_albert_room')).toBe(INDOOR_FOV);
  });

  it('keeps outdoor extension hubs on outdoor FOV', () => {
    expect(getSceneSpecificFov('city_square')).toBe(OUTDOOR_FOV);
  });
});
