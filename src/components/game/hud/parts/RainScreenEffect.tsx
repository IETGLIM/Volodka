/* ─── Volodka RPG – Rain Screen Effect ───
 * Full-screen canvas-based rain overlay that renders
 * animated rain drops during rain/storm weather.
 * Uses canvas for performance (no DOM elements per drop).
 * Also shows subtle fog/mist during snow.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useHUDControllerState } from '@/store/selectors';
import { determineWeatherType, type WeatherType } from '@/data/weatherEffects';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const DROP_COUNT = 60;
const SNOW_COUNT = 35;

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

interface SnowFlake {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  drift: number;
}

export function RainScreenEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const dropsRef = useRef<RainDrop[]>([]);
  const snowRef = useRef<SnowFlake[]>([]);
  const reducedMotion = useEffectiveReducedMotion();
  const { weatherEnabled, rainIntensity, currentSceneId, timeOfDay } = useHUDControllerState();
  const [snowActive, setSnowActive] = useState(false);

  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  const currentWeather: WeatherType = determineWeatherType(
    weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay
  );

  const isRain = currentWeather === 'rain' || currentWeather === 'storm';
  const isSnow = currentWeather === 'snow';

  // Initialize drops
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (dropsRef.current.length === 0) {
      for (let i = 0; i < DROP_COUNT; i++) {
        dropsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: 4 + Math.random() * 8,
          length: 10 + Math.random() * 20,
          opacity: 0.08 + Math.random() * 0.15,
        });
      }
    }
    if (snowRef.current.length === 0) {
      for (let i = 0; i < SNOW_COUNT; i++) {
        snowRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: 0.5 + Math.random() * 1.5,
          size: 1 + Math.random() * 2,
          opacity: 0.15 + Math.random() * 0.25,
          drift: (Math.random() - 0.5) * 0.5,
        });
      }
    }
  }, []);

  // Canvas animation loop
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let running = true;
    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isRain) {
        const intensity = currentWeather === 'storm' ? 1.5 : 1;
        for (const drop of dropsRef.current) {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 1, drop.y + drop.length * intensity);
          ctx.strokeStyle = `rgba(150, 200, 255, ${drop.opacity * intensity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          drop.y += drop.speed * intensity;
          drop.x -= 0.5 * intensity;
          if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
          }
        }
      }

      if (isSnow) {
        for (const flake of snowRef.current) {
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 230, 250, ${flake.opacity})`;
          ctx.fill();

          flake.y += flake.speed;
          flake.x += flake.drift + Math.sin(flake.y * 0.01) * 0.3;
          if (flake.y > canvas.height) {
            flake.y = -flake.size;
            flake.x = Math.random() * canvas.width;
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isRain, isSnow, currentWeather, reducedMotion]);

  if (reducedMotion || (!isRain && !isSnow)) return null;

  return (
    <AnimatePresence>
      {(isRain || isSnow) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}