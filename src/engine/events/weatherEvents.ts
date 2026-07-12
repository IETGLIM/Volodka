import type { EventWeatherType } from '@/shared/types/game';

/** Weather systems — RainSystem, SnowSystem, WeatherAlertNotification. */
export interface WeatherEvents {
  'weather:rain': { active: boolean; intensity: number };
  'weather:snow': { active: boolean; intensity: number };
  'weather:changed': { weatherType: EventWeatherType; temperature: number; debuffs?: string[] };
}
