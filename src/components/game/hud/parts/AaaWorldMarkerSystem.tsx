/* ─── AAA World Marker — show, don't tell guidance ───
 * Instead of popup tutorials, world itself guides:
 * - light flicker toward objective
 * - dust motes drift toward interesting prop
 * - NPC gaze direction hint
 * - floor light pool near door
 * Implemented as CSS overlays + event listeners, cheap.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface Marker {
  id: string;
  text: string;
  x: number; // 0-100 vw
  y: number; // 0-100 vh
}

export function AaaWorldMarkerSystem() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const addMarker = (id: string, text: string) => {
      // Position near center but slightly offset, like diegetic whisper
      const x = 50 + (Math.random() - 0.5) * 12;
      const y = 62 + (Math.random() - 0.5) * 8;
      setMarkers(m => [...m.filter(mm => mm.id !== id), { id, text, x, y }]);
      setTimeout(() => setMarkers(m => m.filter(mm => mm.id !== id)), 5200);
    };

    const unsubs = [
      eventBus.on('quest:objective_updated' as any, ({ questTitle }: any) => {
        if (questTitle) addMarker(`quest_${questTitle}_${Date.now()}`, `↗ ${questTitle}`);
      }),
      eventBus.on('scene:enter', ({ sceneId }) => {
        // First time in scene, hint at explore
        if (Math.random() < 0.22) {
          const hints: Record<string, string> = {
            cafe_evening: 'Запах кофе ведёт к стойке',
            office_day: 'Мерцание мониторов в углу',
            library_day: 'Пыль на полке шепчет',
            street_night: 'Неон отражается в луже — туда',
          };
          const h = hints[sceneId as string];
          if (h) addMarker(`scene_hint_${sceneId}_${Date.now()}`, h);
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: UI_LAYERS.HUD - 1 }}>
      <AnimatePresence>
        {markers.map(m => (
          <motion.div
            key={m.id}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 0.72, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute hud-filmic-caption px-3 py-1.5"
            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="hud-filmic-rule opacity-30 mb-1" aria-hidden />
            <p className="hud-filmic-body text-[11px] italic tracking-[0.06em] text-stone-300/70">{m.text}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
