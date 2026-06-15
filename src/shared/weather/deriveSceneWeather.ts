import type { SceneId } from '@/config/sceneDefinitions';
import type { SceneWeatherType } from '@/shared/types/ambientSound';

export interface SceneWeatherState {
  type: SceneWeatherType;
  temperature: number;
  wind: 'calm' | 'light' | 'strong';
  airQuality: 'clean' | 'dusty' | 'smoggy';
}

/** Derive in-world weather from scene id and time of day (shared by HUD + audio). */
export function deriveSceneWeather(sceneId: SceneId, timeOfDay: number): SceneWeatherState {
  const isNight = timeOfDay >= 21 || timeOfDay < 6;
  const isMorning = timeOfDay >= 6 && timeOfDay < 10;
  const isDay = timeOfDay >= 10 && timeOfDay < 18;
  const isEvening = timeOfDay >= 18 && timeOfDay < 21;

  switch (sceneId) {
    case 'volodka_room':
    case 'volodka_corridor':
    case 'home_evening':
    case 'zarema_albert_room':
    case 'solnysh_room':
    case 'cafe_evening':
    case 'office_day':
    case 'library_day':
      return { type: 'clear', temperature: 20, wind: 'calm', airQuality: 'clean' };

    case 'street_night': {
      if (isNight) return { type: 'rain', temperature: 4, wind: 'light', airQuality: 'smoggy' };
      if (isMorning) return { type: 'fog', temperature: 8, wind: 'light', airQuality: 'smoggy' };
      if (isDay) return { type: 'clear', temperature: 14, wind: 'light', airQuality: 'smoggy' };
      return { type: 'rain', temperature: 7, wind: 'light', airQuality: 'smoggy' };
    }

    case 'street_winter':
      return { type: 'snow', temperature: isNight ? -15 : -8, wind: 'strong', airQuality: 'dusty' };

    case 'park_day': {
      if (isMorning) return { type: 'fog', temperature: 12, wind: 'calm', airQuality: 'clean' };
      if (isNight) return { type: 'clear', temperature: 10, wind: 'light', airQuality: 'clean' };
      return { type: 'clear', temperature: 20, wind: 'light', airQuality: 'clean' };
    }

    case 'battle':
      return { type: 'storm', temperature: 2, wind: 'strong', airQuality: 'dusty' };

    case 'sleep_dream':
      return { type: 'fog', temperature: 15, wind: 'calm', airQuality: 'clean' };

    case 'chk_forest_zorge': {
      if (isNight || isEvening) {
        return { type: 'snow', temperature: -8, wind: 'light', airQuality: 'clean' };
      }
      if (isMorning) return { type: 'fog', temperature: -4, wind: 'calm', airQuality: 'clean' };
      return { type: 'fog', temperature: -2, wind: 'light', airQuality: 'clean' };
    }

    case 'rooftop_edge': {
      if (isNight) return { type: 'storm', temperature: -3, wind: 'strong', airQuality: 'smoggy' };
      return { type: 'clear', temperature: 2, wind: 'strong', airQuality: 'smoggy' };
    }

    case 'abandoned_factory':
    case 'factory_basement':
      return { type: 'fog', temperature: isNight ? 8 : 14, wind: 'light', airQuality: 'dusty' };

    case 'river_pier': {
      if (isNight || isEvening) return { type: 'rain', temperature: 3, wind: 'light', airQuality: 'smoggy' };
      return { type: 'clear', temperature: 10, wind: 'light', airQuality: 'clean' };
    }

    default:
      return { type: 'clear', temperature: 18, wind: 'calm', airQuality: 'clean' };
  }
}
