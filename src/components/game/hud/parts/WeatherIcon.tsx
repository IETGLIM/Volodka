/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { CloudFog, CloudLightning, CloudRain, Snowflake, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { type WeatherType, WEATHER_EFFECTS } from '@/data/weatherEffects';

interface WeatherIconProps {
  type: WeatherType;
  className?: string;
}

function WeatherIconInner({ type, className = 'size-4' }: WeatherIconProps) {
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

export function WeatherIcon({ type, className }: WeatherIconProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <WeatherIconInner type={type} className={className} />
      </motion.div>
    </AnimatePresence>
  );
}

export function getWeatherDescription(type: WeatherType): string {
  return WEATHER_EFFECTS[type]?.description ?? '';
}