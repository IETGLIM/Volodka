/* ─── Volodka RPG – Environmental Effects Overlay ───
 * Comprehensive atmospheric visual overlay system for the 3D game world.
 * Renders weather, time-of-day, combat, and location-based effects.
 * 
 * All effects are pure CSS/React (no WebGL) for broad compatibility.
 * Uses memo HOC for performance optimization.
 * Respects prefers-reduced-motion for accessibility.
 */

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS / ОПРЕДЕЛЕНИЯ ТИПОВ
   ══════════════════════════════════════════════════════════════ */

export type WeatherType = 
  | 'clear' 
  | 'rain' 
  | 'heavy-rain' 
  | 'storm' 
  | 'snow' 
  | 'fog' 
  | 'dense-fog' 
  | 'dust' 
  | 'toxic-fog';

export type LocationType = 
  | 'outdoor' 
  | 'indoor' 
  | 'digital' 
  | 'industrial' 
  | 'underground' 
  | 'surface';

export interface EnvironmentalEffectsOverlayProps {
  /** Current weather condition */
  weather: WeatherType;
  /** Time of day 0-24 (hour) */
  timeOfDay: number;
  /** Current location type for special effects */
  locationType?: LocationType;
  /** Whether player is in combat */
  inCombat?: boolean;
  /** Player health percentage 0-100 for damage effects */
  healthPercent?: number;
  /** Whether player recently took damage (flash effect) */
  justDamaged?: boolean;
  /** Wind direction in degrees 0-360 */
  windDirection?: number;
  /** Wind intensity 0-100 */
  windIntensity?: number;
  /** Enable/disable all effects */
  enabled?: boolean;
}

/** Internal state computed from props */
interface ActiveEffects {
  showRain: boolean;
  rainIntensity: 'light' | 'medium' | 'heavy' | 'storm';
  showSnow: boolean;
  showFog: boolean;
  fogDensity: 'light' | 'dense' | 'toxic';
  showDust: boolean;
  dustIntensity: number;
  timePhase: 'night' | 'sunrise' | 'day' | 'sunset';
  showCombatVignette: boolean;
  combatPulseActive: boolean;
  desaturationAmount: number;
  locationEffect: LocationType | null;
}

/* ══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS / ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ══════════════════════════════════════════════════════════════ */

/**
 * Determine time phase from hour value
 * night: 21-5, sunrise: 5-9, day: 9-17, sunset: 17-21
 */
function getTimePhase(hour: number): ActiveEffects['timePhase'] {
  const normalizedHour = ((hour % 24) + 24) % 24; // Handle edge cases
  if (normalizedHour >= 21 || normalizedHour < 5) return 'night';
  if (normalizedHour >= 5 && normalizedHour < 9) return 'sunrise';
  if (normalizedHour >= 9 && normalizedHour < 17) return 'day';
  return 'sunset';
}

/**
 * Compute which effects should be active based on props
 */
function computeActiveEffects(props: EnvironmentalEffectsOverlayProps): ActiveEffects {
  const { weather, timeOfDay, locationType, inCombat, healthPercent = 100, justDamaged, windIntensity = 50 } = props;

  // Weather-based effects
  const showRain = weather === 'rain' || weather === 'heavy-rain' || weather === 'storm';
  let rainIntensity: ActiveEffects['rainIntensity'] = 'light';
  if (weather === 'heavy-rain') rainIntensity = 'heavy';
  if (weather === 'storm') rainIntensity = 'storm';
  if (weather === 'rain') rainIntensity = 'medium';

  const showSnow = weather === 'snow';
  
  const showFog = weather === 'fog' || weather === 'dense-fog' || weather === 'toxic-fog';
  let fogDensity: ActiveEffects['fogDensity'] = 'light';
  if (weather === 'dense-fog') fogDensity = 'dense';
  if (weather === 'toxic-fog') fogDensity = 'toxic';

  const showDust = weather === 'dust';
  const dustIntensity = Math.max(0, Math.min(100, windIntensity));

  // Time-based
  const timePhase = getTimePhase(timeOfDay);

  // Combat effects
  const showCombatVignette = !!inCombat;
  const combatPulseActive = !!justDamaged;
  const desaturationAmount = healthPercent < 30 
    ? Math.round((30 - healthPercent) / 30 * 40) // 0-40% at low health
    : 0;

  // Location effect
  const locationEffect = locationType ?? 'outdoor';

  return {
    showRain,
    rainIntensity,
    showSnow,
    showFog,
    fogDensity,
    showDust,
    dustIntensity,
    timePhase,
    showCombatVignette,
    combatPulseActive,
    desaturationAmount,
    locationEffect,
  };
}

/**
 * Convert wind direction (degrees) to CSS transform angle for rain
 */
function getRainAngle(windDirection?: number): number {
  if (windDirection === undefined) return 15; // Default slight angle
  // Wind direction is where wind comes FROM, so rain falls opposite + slight downward
  const normalizedDir = (((windDirection + 180) % 360) + 360) % 360;
  return Math.max(5, Math.min(35, 90 - normalizedDir)); // Clamp to reasonable range
}

/**
 * Get vignette colors based on time phase
 */
function getTimeVignetteColors(phase: ActiveEffects['timePhase']): {
  topColor: string;
  bottomColor: string;
  ambientGlow?: string;
} {
  switch (phase) {
    case 'night':
      return {
        topColor: 'rgba(8, 12, 35, 0.25)',
        bottomColor: 'rgba(15, 20, 45, 0.15)',
        ambientGlow: 'radial-gradient(ellipse at 50% 120%, rgba(60, 80, 140, 0.08), transparent 70%)',
      };
    case 'sunrise':
      return {
        topColor: 'rgba(255, 120, 60, 0.12)',
        bottomColor: 'rgba(255, 80, 40, 0.06)',
        ambientGlow: 'radial-gradient(ellipse at 50% 100%, rgba(255, 150, 80, 0.15), transparent 60%)',
      };
    case 'sunset':
      return {
        topColor: 'rgba(200, 70, 50, 0.14)',
        bottomColor: 'rgba(180, 50, 30, 0.10)',
        ambientGlow: 'radial-gradient(ellipse at 50% 100%, rgba(255, 100, 50, 0.18), transparent 55%)',
      };
    case 'day':
    default:
      return {
        topColor: 'rgba(255, 255, 255, 0.03)',
        bottomColor: 'rgba(240, 245, 255, 0.02)',
      };
  }
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS: WEATHER EFFECTS / ЭФЕКТЫ ПОГОДЫ
   ══════════════════════════════════════════════════════════════ */

/** Rain drop element configuration */
interface RainDropConfig {
  id: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
  width: number;
  height: number;
}

/**
 * Generate rain drop configurations for performance-conscious rendering
 */
function generateRainDrops(intensity: ActiveEffects['rainIntensity']): RainDropConfig[] {
  const counts: Record<ActiveEffects['rainIntensity'], number> = {
    light: 25,
    medium: 50,
    heavy: 90,
    storm: 140,
  };
  
  const count = counts[intensity];
  const drops: RainDropConfig[] = [];
  
  for (let i = 0; i < count; i++) {
    drops.push({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.4 + Math.random() * 0.3,
      opacity: 0.15 + Math.random() * 0.25,
      width: 1 + Math.random() * 1.5,
      height: 15 + Math.random() * 25,
    });
  }
  
  return drops;
}

interface RainEffectProps {
  intensity: ActiveEffects['rainIntensity'];
  windDirection?: number;
  reducedMotion: boolean;
}

/**
 * Rain Effect Component
 * CSS-animated rain drops with variable intensity and wind angle
 */
const RainEffect = memo<RainEffectProps>(({ intensity, windDirection, reducedMotion }) => {
  const drops = useMemo(() => generateRainDrops(intensity), [intensity]);
  const angle = useMemo(() => getRainAngle(windDirection), [windDirection]);
  
  // Intensity affects animation speed multiplier
  const speedMultiplier = useMemo(() => {
    switch (intensity) {
      case 'light': return 1;
      case 'medium': return 0.75;
      case 'heavy': return 0.5;
      case 'storm': return 0.35;
    }
  }, [intensity]);

  if (reducedMotion) return null;

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 10 }}
    >
      {/* Rain container with wind angle transformation */}
      <div
        style={{
          position: 'absolute',
          inset: '-20% 0 0 -20%',
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'top center',
        }}
      >
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="absolute bg-gradient-to-b from-transparent to-cyan-200/30 rounded-full"
            style={{
              left: `${drop.left}%`,
              top: '-10%',
              width: `${drop.width}px`,
              height: `${drop.height}px`,
              opacity: drop.opacity,
              animation: `env-rain-fall ${drop.duration * speedMultiplier}s linear ${drop.delay}s infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Splash effect at bottom */}
      {(intensity === 'heavy' || intensity === 'storm') && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ opacity: intensity === 'storm' ? 0.6 : 0.35 }}
        >
          {Array.from({ length: intensity === 'storm' ? 20 : 12 }).map((_, i) => (
            <div
              key={`splash-${i}`}
              className="absolute bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${10 + Math.random() * 30}px`,
                animation: `env-splash 0.6s ease-out ${Math.random() * 0.8}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Storm-specific lightning flash effect */}
      {intensity === 'storm' && (
        <div 
          className="absolute inset-0 bg-white/5 pointer-events-none"
          style={{ animation: 'env-lightning-flash 4s ease-in-out infinite' }}
        />
      )}
    </div>
  );
});

RainEffect.displayName = 'RainEffect';

/** Snowflake configuration */
interface SnowflakeConfig {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  swayAmount: number;
}

/**
 * Generate snowflake configurations
 */
function generateSnowflakes(): SnowflakeConfig[] {
  const flakes: SnowflakeConfig[] = [];
  const count = 45;
  
  for (let i = 0; i < count; i++) {
    flakes.push({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      size: 2 + Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.5,
      swayAmount: 20 + Math.random() * 30,
    });
  }
  
  return flakes;
}

interface SnowEffectProps {
  reducedMotion: boolean;
}

/**
 * Snow Effect Component
 * Falling snowflakes with gentle horizontal sway
 */
const SnowEffect = memo<SnowEffectProps>(({ reducedMotion }) => {
  const flakes = useMemo(() => generateSnowflakes(), []);

  if (reducedMotion) return null;

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 11 }}
    >
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white shadow-sm"
          style={{
            left: `${flake.left}%`,
            top: '-5%',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `env-snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
            '--env-sway-amount': `${flake.swayAmount}px`,
          } as React.CSSProperties}
        >
          {/* Inner glow effect for larger flakes */}
          {flake.size > 3.5 && (
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(220, 235, 255, 0.9), rgba(255, 255, 255, 0.4))',
                boxShadow: '0 0 4px rgba(200, 220, 255, 0.5)',
              }}
            />
          )}
        </div>
      ))}
      
      {/* Frost accumulation effect at screen edges */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(230, 240, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 50%, rgba(230, 240, 255, 0.06) 0%, transparent 40%),
            radial-gradient(ellipse at 100% 50%, rgba(230, 240, 255, 0.06) 0%, transparent 40%)
          `,
          animation: 'env-frost-pulse 8s ease-in-out infinite',
        }}
      />
    </div>
  );
});

SnowEffect.displayName = 'SnowEffect';

interface FogEffectProps {
  density: ActiveEffects['fogDensity'];
  reducedMotion: boolean;
}

/**
 * Fog/Mist Effect Component
 * Gradient overlays with drift animation
 * Supports light, dense, and toxic (green-tinted) variants
 */
const FogEffect = memo<FogEffectProps>(({ density, reducedMotion }) => {
  const fogStyle = useMemo(() => {
    const baseOpacity = density === 'dense' ? 0.55 : density === 'toxic' ? 0.5 : 0.35;
    
    let colorTint: string;
    switch (density) {
      case 'toxic':
        colorTint = 'rgba(80, 160, 90, ';
        break;
      case 'dense':
        colorTint = 'rgba(180, 190, 200, ';
        break;
      default:
        colorTint = 'rgba(200, 210, 220, ';
    }
    
    return {
      baseOpacity,
      colorTint,
    };
  }, [density]);

  if (reducedMotion) return null;

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 9 }}
    >
      {/* Primary fog layer - slow drift */}
      <div
        className="absolute w-[200%] h-[150%] -left-1/2 -top-1/4"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${fogStyle.colorTint}${fogStyle.baseOpacity}) 0%, ${fogStyle.colorTint}0) 70%)`,
          filter: 'blur(30px)',
          animation: 'env-fog-drift-1 25s ease-in-out infinite',
          opacity: fogStyle.baseOpacity,
        }}
      />
      
      {/* Secondary fog layer - faster drift, offset */}
      <div
        className="absolute w-[180%] h-[130%] -left-1/3 -top-1/5"
        style={{
          background: `radial-gradient(ellipse at 70% 60%, ${fogStyle.colorTint}${fogStyle.baseOpacity * 0.8}) 0%, ${fogStyle.colorTint}0) 65%)`,
          filter: 'blur(40px)',
          animation: 'env-fog-drift-2 18s ease-in-out infinite reverse',
          opacity: fogStyle.baseOpacity * 0.7,
        }}
      />
      
      {/* Tertiary layer for dense/toxic fog */}
      {(density === 'dense' || density === 'toxic') && (
        <div
          className="absolute w-[150%] h-full -left-1/4"
          style={{
            background: `linear-gradient(90deg, ${fogStyle.colorTint}0.1), transparent 20%, ${fogStyle.colorTint}${fogStyle.baseOpacity * 0.3}, transparent 80%)`,
            filter: 'blur(20px)',
            animation: 'env-fog-drift-3 12s ease-in-out infinite',
          }}
        />
      )}
      
      {/* Bottom fog pool */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: `linear-gradient(to top, ${fogStyle.colorTint}${fogStyle.baseOpacity * 0.6}), transparent)`,
          filter: 'blur(15px)',
        }}
      />
      
      {/* Toxic fog particles */}
      {density === 'toxic' && (
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`toxic-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${3 + Math.random() * 8}px`,
                height: `${3 + Math.random() * 8}px`,
                background: 'radial-gradient(circle, rgba(120, 200, 100, 0.3), transparent)',
                filter: 'blur(2px)',
                animation: `env-toxic-particle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

FogEffect.displayName = 'FogEffect';

/** Dust particle configuration */
interface DustParticleConfig {
  id: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

/**
 * Generate dust particle configurations
 */
function generateDustParticles(intensity: number): DustParticleConfig[] {
  const count = Math.floor(intensity / 5); // 0-20 particles based on intensity
  const particles: DustParticleConfig[] = [];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 1.5 + Math.random() * 2,
      size: 1 + Math.random() * 3,
      opacity: 0.2 + Math.random() * 0.3,
    });
  }
  
  return particles;
}

interface DustWindEffectProps {
  intensity: number;
  windDirection?: number;
  reducedMotion: boolean;
}

/**
 * Dust/Wind Effect Component
 * Horizontal particle streaks for desert/wasteland scenes
 */
const DustWindEffect = memo<DustWindEffectProps>(({ intensity, windDirection, reducedMotion }) => {
  const particles = useMemo(() => generateDustParticles(intensity), [intensity]);
  
  // Determine streak direction based on wind
  const streakAngle = useMemo(() => {
    if (windDirection !== undefined) {
      // Wind comes FROM this direction, particles go TO opposite
      return ((windDirection + 180) % 360);
    }
    return 270; // Default: left to right
  }, [windDirection]);

  if (reducedMotion || particles.length === 0) return null;

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 8 }}
    >
      {/* Base dust haze */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(180, 160, 130, 0.08), transparent)',
          animation: 'env-dust-haze 4s ease-in-out infinite alternate',
        }}
      />
      
      {/* Horizontal streak particles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${streakAngle - 270}deg)`,
        }}
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `-5%`,
              top: `${particle.top}%`,
              width: `${particle.size * 8}px`, // Stretched horizontally
              height: `${particle.size}px`,
              opacity: particle.opacity,
              background: 'linear-gradient(90deg, transparent, rgba(200, 180, 150, 0.6), transparent)',
              animation: `env-dust-streak ${particle.duration}s linear ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Intense dust overlay for high intensity */}
      {intensity > 70 && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(180, 150, 110, 0.12), transparent 60%)',
            animation: 'env-dust-intense 2s ease-in-out infinite alternate',
          }}
        />
      )}
    </div>
  );
});

DustWindEffect.displayName = 'DustWindEffect';

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS: TIME & COMBAT EFFECTS / ЭФЕКТЫ ВРЕМЕНИ И БОЯ
   ══════════════════════════════════════════════════════════════ */

interface TimeVignetteProps {
  phase: ActiveEffects['timePhase'];
  reducedMotion: boolean;
}

/**
 * Time-of-day Vignette Component
 * Subtle color tinting based on current time
 * - Night: cool blue tint
 * - Sunrise/Sunset: warm orange tint
 * - Day: subtle bright wash
 */
const TimeVignette = memo<TimeVignetteProps>(({ phase, reducedMotion }) => {
  const colors = useMemo(() => getTimeVignetteColors(phase), [phase]);
  
  // Skip rendering during clear day (minimal effect)
  if (phase === 'day') {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ zIndex: 5 }}
      >
        {/* Very subtle day brightness */}
        <div
          className="absolute inset-0 transition-opacity duration-3000"
          style={{
            background: `linear-gradient(180deg, ${colors.topColor}, transparent 30%, transparent 70%, ${colors.bottomColor})`,
            transitionTimingFunction: 'ease-in-out',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 5 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{
          background: `linear-gradient(
            180deg,
            ${colors.topColor} 0%,
            transparent 25%,
            transparent 75%,
            ${colors.bottomColor} 100%
          )`,
        }}
      />
      
      {/* Ambient glow for sunrise/sunset/night */}
      {colors.ambientGlow && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 4, ease: 'easeInOut', delay: 0.5 }}
          style={{ background: colors.ambientGlow }}
        />
      )}
      
      {/* Stars hint at night (subtle) */}
      {phase === 'night' && !reducedMotion && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute rounded-full bg-white/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`, // Only upper portion
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                animation: `env-star-twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 5}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TimeVignette.displayName = 'TimeVignette';

interface CombatOverlayProps {
  isActive: boolean;
  pulseActive: boolean;
  healthPercent: number;
  desaturationAmount: number;
  reducedMotion: boolean;
}

/**
 * Combat Intensity Overlay Component
 * Red vignette during combat with pulse on damage
 * Desaturation effect when health is critically low
 */
const CombatOverlay = memo<CombatOverlayProps>(({
  isActive,
  pulseActive,
  healthPercent,
  desaturationAmount,
  reducedMotion,
}) => {
  // Calculate red vignette intensity based on health
  const vignetteIntensity = useMemo(() => {
    if (!isActive) return 0;
    // Stronger vignette at lower health
    const baseIntensity = 0.08;
    const healthFactor = (100 - healthPercent) / 100;
    return baseIntensity + (healthFactor * 0.12); // 0.08 - 0.20
  }, [isActive, healthPercent]);

  // Pulse flash when damaged
  const pulseOpacity = useMemo(() => pulseActive ? 0.25 : 0, [pulseActive]);

  if (!isActive && desaturationAmount === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 12 }}
    >
      {/* Red vignette border effect */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: vignetteIntensity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              boxShadow: `inset 0 0 ${100 + (100 - healthPercent)}px rgba(180, 30, 30, ${vignetteIntensity})`,
              borderRadius: 0,
            }}
          />
        )}
      </AnimatePresence>

      {/* Damage pulse flash */}
      <AnimatePresence>
        {pulseActive && !reducedMotion && (
          <motion.div
            className="absolute inset-0 bg-red-600"
            initial={{ opacity: pulseOpacity }}
            animate={{ 
              opacity: [pulseOpacity, pulseOpacity * 0.5, 0],
            }}
            transition={{ duration: 0.4, times: [0, 0.5, 1], ease: 'easeOut' }}
            style={{ mixBlendMode: 'overlay' }}
          />
        )}
      </AnimatePresence>

      {/* Low health desaturation overlay */}
      {desaturationAmount > 0 && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: desaturationAmount / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            background: `grayscale(${desaturationAmount}%) saturate(${
              100 - desaturationAmount * 0.5
            }%)`,
            mixBlendMode: 'normal',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Critical health warning border pulse */}
      {isActive && healthPercent < 25 && !reducedMotion && (
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 30px rgba(200, 50, 50, 0.15)`,
            animation: 'env-critical-health 1.5s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
});

CombatOverlay.displayName = 'CombatOverlay';

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS: LOCATION-SPECIFIC EFFECTS / ЭФЕКТЫ ЛОКАЦИЙ
   ══════════════════════════════════════════════════════════════ */

interface LocationEffectProps {
  locationType: LocationType;
  reducedMotion: boolean;
}

/**
 * Location-specific Effects Component
 * - Digital: Cyber grid pattern
 * - Industrial/Desert: Heat shimmer
 * - Surveillance areas: Scanlines
 * - Underground: Subtle darkness vignette
 */
const LocationEffect = memo<LocationEffectProps>(({ locationType, reducedMotion }) => {
  switch (locationType) {
    case 'digital':
      return <DigitalSpaceEffect reducedMotion={reducedMotion} />;
    case 'industrial':
      return <IndustrialEffect reducedMotion={reducedMotion} />;
    case 'underground':
      return <UndergroundEffect reducedMotion={reducedMotion} />;
    default:
      return null;
  }
});

LocationEffect.displayName = 'LocationEffect';

/** Cyber grid pattern for digital/virtual spaces */
interface DigitalSpaceEffectProps {
  reducedMotion: boolean;
}

const DigitalSpaceEffect = memo<DigitalSpaceEffectProps>(({ reducedMotion }) => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    aria-hidden="true"
    style={{ zIndex: 6 }}
  >
    {/* Animated cyber grid */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 229, 255, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 229, 255, 0.06) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        animation: reducedMotion ? 'none' : 'cyber-grid-scroll 8s linear infinite',
      }}
    />

    {/* Diagonal scan line accent */}
    {!reducedMotion && (
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 229, 255, 0.02) 10px, rgba(0, 229, 255, 0.02) 11px)',
        }}
      />
    )}

    {/* Corner data decorations */}
    <div className="absolute top-3 left-3 text-[9px] font-mono text-cyan-400/20 tracking-widest" style={{ fontFamily: "'Geist Mono', monospace" }}>
      {'// DIGITAL_SPACE'}
    </div>
    <div className="absolute bottom-3 right-3 text-[8px] font-mono text-cyan-400/15 tracking-wider">
      {`SYS.NODE_${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`}
    </div>

    {/* Subtle edge glow lines */}
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.2), transparent)',
        boxShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
      }}
    />
    <div
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.2), transparent)',
        boxShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
      }}
    />
  </div>
));

DigitalSpaceEffect.displayName = 'DigitalSpaceEffect';

/** Heat shimmer effect for industrial/desert areas */
interface IndustrialEffectProps {
  reducedMotion: boolean;
}

const IndustrialEffect = memo<IndustrialEffectProps>(({ reducedMotion }) => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    aria-hidden="true"
    style={{ zIndex: 7 }}
  >
    {/* Warm color tint */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, rgba(255, 140, 60, 0.04) 0%, rgba(200, 100, 50, 0.03) 50%, rgba(180, 80, 40, 0.05) 100%)',
      }}
    />

    {/* Heat shimmer distortion effect */}
    {!reducedMotion && (
      <>
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to top, rgba(255, 200, 150, 0.06), transparent)',
            animation: 'env-heat-shimmer 3s ease-in-out infinite',
            filter: 'blur(2px)',
          }}
        />
        
        {/* Rising heat wave lines */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`heat-${i}`}
            className="absolute left-0 right-0 h-px"
            style={{
              bottom: `${5 + i * 8}%`,
              background: `linear-gradient(90deg, transparent, rgba(255, 180, 100, ${0.05 - i * 0.008}), transparent)`,
              animation: `env-heat-wave ${2 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </>
    )}

    {/* Subtle particulate matter */}
    <div className="absolute inset-0 opacity-30">
      {[...Array(8)].map((_, i) => (
        <div
          key={`particulate-${i}`}
          className="absolute rounded-full bg-orange-400/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${60 + Math.random() * 40}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            animation: reducedMotion ? 'none' : `env-particulate-rise ${4 + Math.random() * 3}s ease-out ${Math.random() * 4}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
));

IndustrialEffect.displayName = 'IndustrialEffect';

/** Darkness vignette for underground areas */
interface UndergroundEffectProps {
  reducedMotion: boolean;
}

const UndergroundEffect = memo<UndergroundEffectProps>(({ reducedMotion }) => (
  <div
    className="absolute inset-0 pointer-events-none"
    aria-hidden="true"
    style={{ zIndex: 7 }}
  >
    {/* Heavy darkness gradient from edges */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5, 5, 15, 0.5) 100%)
        `,
      }}
    />

    {/* Top-down spotlight simulation */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse 60% 40% at 50% 0%, rgba(80, 70, 100, 0.08), transparent)
        `,
      }}
    />

    {/* Flickering ambient light (very subtle) */}
    {!reducedMotion && (
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(50, 40, 70, 0.03)',
          animation: 'env-underground-flicker 8s ease-in-out infinite',
        }}
      />
    )}

    {/* Vignette corners darker */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(0, 0, 0, 0.3) 0%, transparent 40%),
          radial-gradient(circle at 100% 0%, rgba(0, 0, 0, 0.3) 0%, transparent 40%),
          radial-gradient(circle at 0% 100%, rgba(0, 0, 0, 0.3) 0%, transparent 40%),
          radial-gradient(circle at 100% 100%, rgba(0, 0, 0, 0.3) 0%, transparent 40%)
        `,
      }}
    />
  </div>
));

UndergroundEffect.displayName = 'UndergroundEffect';

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT / ОСНОВНОЙ КОМПОНЕНТ
   ══════════════════════════════════════════════════════════════ */

/**
 * EnvironmentalEffectsOverlay - Main export
 * 
 * Comprehensive environmental visual overlay system for the Volodka RPG.
 * Renders multiple layered effects including weather, time-of-day, combat status,
 * and location-specific atmospherics.
 * 
 * @example
 * ```tsx
 * <EnvironmentalEffectsOverlay
 *   weather="rain"
 *   timeOfDay={18.5}
 *   locationType="outdoor"
 *   inCombat={true}
 *   healthPercent={65}
 *   windDirection={225}
 *   windIntensity={70}
 * />
 * ```
 */
const EnvironmentalEffectsOverlay = memo<EnvironmentalEffectsOverlayProps>((props) => {
  const {
    weather,
    timeOfDay,
    locationType = 'outdoor',
    inCombat = false,
    healthPercent = 100,
    justDamaged = false,
    windDirection = 0,
    windIntensity = 50,
    enabled = true,
  } = props;

  // Check for reduced motion preference
  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Memoize active effects computation
  const effects = useMemo(
    () => computeActiveEffects({
      weather,
      timeOfDay,
      locationType,
      inCombat,
      healthPercent,
      justDamaged,
      windIntensity,
    }),
    [weather, timeOfDay, locationType, inCombat, healthPercent, justDamaged, windIntensity]
  );

  // Early exit if disabled or no effects active
  if (!enabled) return null;

  const hasAnyEffect = 
    effects.showRain ||
    effects.showSnow ||
    effects.showFog ||
    effects.showDust ||
    effects.showCombatVignette ||
    effects.desaturationAmount > 0 ||
    effects.locationEffect !== null;

  if (!hasAnyEffect) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      role="presentation"
      aria-label="Environmental effects overlay"
      style={{ zIndex: UI_LAYERS.HUD, isolation: 'isolate' }}
    >
      {/* Layer 1: Time-of-day vignette (bottom layer) */}
      <TimeVignette phase={effects.timePhase} reducedMotion={reducedMotion} />

      {/* Layer 2: Location-specific effects */}
      {effects.locationEffect && (
        <LocationEffect locationType={effects.locationEffect} reducedMotion={reducedMotion} />
      )}

      {/* Layer 3: Weather effects */}
      <AnimatePresence mode="wait">
        {effects.showFog && (
          <motion.div
            key="fog-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <FogEffect density={effects.fogDensity} reducedMotion={reducedMotion} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {effects.showRain && (
          <motion.div
            key="rain-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <RainEffect 
              intensity={effects.rainIntensity}
              windDirection={windDirection}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {effects.showSnow && (
          <motion.div
            key="snow-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <SnowEffect reducedMotion={reducedMotion} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {effects.showDust && (
          <motion.div
            key="dust-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <DustWindEffect 
              intensity={effects.dustIntensity}
              windDirection={windDirection}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 4: Combat overlay (top layer for visibility) */}
      <CombatOverlay
        isActive={effects.showCombatVignette}
        pulseActive={effects.combatPulseActive}
        healthPercent={healthPercent}
        desaturationAmount={effects.desaturationAmount}
        reducedMotion={reducedMotion}
      />
    </div>
  );
});

EnvironmentalEffectsOverlay.displayName = 'EnvironmentalEffectsOverlay';

export default EnvironmentalEffectsOverlay;

/* ══════════════════════════════════════════════════════════════
   CSS ANIMATIONS INJECTION / ВСТРАИВАНИЕ CSS АНИМАЦИЙ
   
   These keyframes are injected via a style tag since they're
   specific to this component's effects system.
   ══════════════════════════════════════════════════════════════ */

/**
 * CSS Keyframes for environmental effects
 * Import this in your global styles or let it self-inject
 */
export const EnvironmentalEffectsCSS = () => (
  <style>{`
    /* ═── RAIN EFFECT KEYFRAMES ═── */
    @keyframes env-rain-fall {
      0% {
        transform: translateY(-100vh) translateX(0);
        opacity: 0;
      }
      10% {
        opacity: var(--rain-opacity, 1);
      }
      90% {
        opacity: var(--rain-opacity, 1);
      }
      100% {
        transform: translateY(120vh) translateX(-20px);
        opacity: 0;
      }
    }

    @keyframes env-splash {
      0% {
        transform: scaleX(0);
        opacity: 0.8;
      }
      50% {
        transform: scaleX(1);
        opacity: 0.4;
      }
      100% {
        transform: scaleX(1.5);
        opacity: 0;
      }
    }

    @keyframes env-lightning-flash {
      0%, 89%, 91%, 93%, 95%, 100% {
        opacity: 0;
      }
      90%, 92%, 94% {
        opacity: 1;
      }
    }

    /* ═── SNOW EFFECT KEYFRAMES ═── */
    @keyframes env-snowfall {
      0% {
        transform: translateY(-10vh) translateX(0);
        opacity: 0;
      }
      5% {
        opacity: 1;
      }
      95% {
        opacity: 1;
      }
      100% {
        transform: translateY(105vh) translateX(calc(var(--env-sway-amount, 20px) * -1));
        opacity: 0;
      }
      25% {
        transform: translateY(25vh) translateX(calc(var(--env-sway-amount, 20px) * 0.3));
      }
      50% {
        transform: translateY(50vh) translateX(calc(var(--env-sway-amount, 20px) * -0.2));
      }
      75% {
        transform: translateY(75vh) translateX(calc(var(--env-sway-amount, 20px) * 0.4));
      }
    }

    @keyframes env-frost-pulse {
      0%, 100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }

    /* ═── FOG EFFECT KEYFRAMES ═── */
    @keyframes env-fog-drift-1 {
      0%, 100% {
        transform: translateX(-5%) translateY(0%);
      }
      33% {
        transform: translateX(5%) translateY(-2%);
      }
      66% {
        transform: translateX(-3%) translateY(2%);
      }
    }

    @keyframes env-fog-drift-2 {
      0%, 100% {
        transform: translateX(3%) translateY(1%);
      }
      50% {
        transform: translateX(-5%) translateY(-1%);
      }
    }

    @keyframes env-fog-drift-3 {
      0%, 100% {
        transform: translateX(-2%);
      }
      50% {
        transform: translateX(4%);
      }
    }

    @keyframes env-toxic-particle {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.3;
      }
      50% {
        transform: translate(15px, -10px) scale(1.5);
        opacity: 0.6;
      }
    }

    /* ═── DUST/WIND EFFECT KEYFRAMES ═── */
    @keyframes env-dust-streak {
      0% {
        transform: translateX(-10vw);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateX(110vw);
        opacity: 0;
      }
    }

    @keyframes env-dust-haze {
      0% {
        opacity: 0.3;
        transform: scaleX(1);
      }
      100% {
        opacity: 0.6;
        transform: scaleX(1.05);
      }
    }

    @keyframes env-dust-intense {
      0% {
        opacity: 0.05;
      }
      100% {
        opacity: 0.15;
      }
    }

    /* ═── TIME VIGNETTE KEYFRAMES ═── */
    @keyframes env-star-twinkle {
      0%, 100% {
        opacity: 0.2;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.2);
      }
    }

    /* ═── COMBAT OVERLAY KEYFRAMES ═── */
    @keyframes env-critical-health {
      0%, 100% {
        box-shadow: inset 0 0 30px rgba(200, 50, 50, 0.1);
      }
      50% {
        box-shadow: inset 0 0 50px rgba(200, 50, 50, 0.2);
      }
    }

    /* ═── LOCATION EFFECT KEYFRAMES ═── */
    @keyframes cyber-grid-scroll {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 32px 32px;
      }
    }

    @keyframes env-heat-shimmer {
      0%, 100% {
        transform: translateY(0) scaleY(1);
        opacity: 0.6;
      }
      50% {
        transform: translateY(-5px) scaleY(1.02);
        opacity: 1;
      }
    }

    @keyframes env-heat-wave {
      0%, 100% {
        transform: translateY(0) scaleX(1);
        opacity: 0.5;
      }
      50% {
        transform: translateY(-8px) scaleX(1.02);
        opacity: 0.8;
      }
    }

    @keyframes env-particulate-rise {
      0% {
        transform: translateY(0);
        opacity: 0;
      }
      20% {
        opacity: 0.5;
      }
      80% {
        opacity: 0.3;
      }
      100% {
        transform: translateY(-100px);
        opacity: 0;
      }
    }

    @keyframes env-underground-flicker {
      0%, 100% {
        opacity: 0.03;
      }
      5% {
        opacity: 0.05;
      }
      10% {
        opacity: 0.02;
      }
      15% {
        opacity: 0.04;
      }
      20% {
        opacity: 0.03;
      }
      52% {
        opacity: 0.06;
      }
      56% {
        opacity: 0.02;
      }
      60% {
        opacity: 0.04;
      }
    }

    /* ═── REDUCED MOTION OVERRIDES ═── */
    @media (prefers-reduced-motion: reduce) {
      .env-effects-container *,
      .env-effects-container *::before,
      .env-effects-container *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

/* Types are already exported above - no need to re-export */
