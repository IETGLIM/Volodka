/** Procedural ambient sound profile identifiers (shared — no data-layer imports). */
export type AmbientSoundType =
  | 'cafe'
  | 'office'
  | 'park'
  | 'library'
  | 'street'
  | 'home'
  | 'factory'
  | 'basement'
  | 'rooftop'
  | 'corridor'
  | 'combat'
  | 'rain'
  | 'snow'
  | 'pier';

export type SceneWeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';

export interface SceneAmbienceConfig {
  /** Ambient profile for daytime (6:00–20:00) */
  daySound: AmbientSoundType;
  /** Ambient profile for nighttime (20:00–6:00) */
  nightSound: AmbientSoundType;
  /** Crossfade duration in ms when entering or switching day/night */
  transitionDuration?: number;
}
