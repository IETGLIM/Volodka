import { motion } from 'framer-motion';
import {
  getCinematicTypeStyles,
  type CinematicBeatType,
} from './cinematicNarrativeStyles';

export interface CinematicTitleCardProps {
  title: string;
  subtitle?: string;
  accentColor: string;
  type?: CinematicBeatType;
  reducedMotion?: boolean;
  titleId?: string;
  /** Smaller title sizing for location banners */
  size?: 'hero' | 'location';
}

/** Centered AAA title card — shared by transitions, banners, cutscenes. */
export function CinematicTitleCard({
  title,
  subtitle,
  accentColor,
  type = 'story_moment',
  reducedMotion = false,
  titleId,
  size = 'hero',
}: CinematicTitleCardProps) {
  const typeStyles = getCinematicTypeStyles(type);
  const titleClass =
    size === 'location'
      ? 'text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.14em]'
      : `${typeStyles.titleSize} ${typeStyles.titleWeight} ${typeStyles.titleTracking}`;

  return (
    <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 px-6">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.2, delay: 0.15, ease: 'easeOut' }}
        className="w-24 sm:w-36 h-px origin-center"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
        }}
      />

      <motion.h2
        id={titleId}
        initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          duration: reducedMotion ? 0 : typeStyles.fadeInDuration,
          delay: typeStyles.titleDelay,
          ease: 'easeOut',
        }}
        className={`${titleClass} text-center`}
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          color: 'rgba(255,255,255,0.96)',
          textShadow: `0 0 40px ${accentColor}50, 0 2px 12px rgba(0,0,0,0.85)`,
        }}
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.9,
            delay: typeStyles.bodyDelay,
            ease: 'easeOut',
          }}
          className={`${size === 'location' ? 'text-xs sm:text-sm' : typeStyles.bodySize} text-center max-w-xl tracking-wide uppercase`}
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(200, 210, 230, 0.65)',
            textShadow: `0 0 20px ${accentColor}20`,
          }}
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.2, delay: 0.45, ease: 'easeOut' }}
        className="w-16 sm:w-24 h-px origin-center"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}45, transparent)`,
        }}
      />
    </div>
  );
}
