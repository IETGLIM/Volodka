import type { CSSProperties } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  style?: CSSProperties;
}

/** Smoothly animates numeric display; useSpring tracks `value` without a manual sync effect. */
export function AnimatedCounter({ value, className, style }: AnimatedCounterProps) {
  const spring = useSpring(value, { stiffness: 120, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v));

  return (
    <motion.span className={className} style={style}>
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}
