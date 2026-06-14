import { Cloud, CloudFog, CloudLightning, CloudRain, Snowflake, Sun } from 'lucide-react';
import { type WeatherType, WEATHER_EFFECTS } from '@/data/weatherEffects';

interface WeatherIconProps {
  type: WeatherType;
  className?: string;
}

export function WeatherIcon({ type, className = 'size-4' }: WeatherIconProps) {
  const weatherEffect = WEATHER_EFFECTS[type];
  const color = weatherEffect?.color ?? '#f0c040';

  switch (type) {
    case 'rain':
      return <CloudRain className={className} style={{ color }} aria-hidden="true" />;
    case 'snow':
      return <Snowflake className={className} style={{ color }} aria-hidden="true" />;
    case 'fog':
      return <CloudFog className={className} style={{ color }} aria-hidden="true" />;
    case 'storm':
      return <CloudLightning className={className} style={{ color }} aria-hidden="true" />;
    default:
      return <Sun className={className} style={{ color }} aria-hidden="true" />;
  }
}

export function getWeatherDescription(type: WeatherType): string {
  return WEATHER_EFFECTS[type]?.description ?? '';
}
