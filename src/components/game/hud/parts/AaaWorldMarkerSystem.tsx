/* ─── AAA World Marker — show, don't tell, роскошное направление ───
 * Мир сам ведёт: свет мерцает к цели, пыль тянется к предмету,
 * взгляд NPC, лужа неона. Без попапов, без туториалов — кинематографично.
 * Дешёвые CSS overlay + EventBus, не спамят.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface Marker {
  id: string;
  text: string;
  x: number;
  y: number;
  tone: 'whisper' | 'warm' | 'cool';
}

const SCENE_HINTS: Record<string, { text: string; tone: Marker['tone'] }> = {
  cafe_evening: { text: 'Запах кофе ведёт к стойке', tone: 'warm' },
  office_day: { text: 'Мерцание мониторов в углу', tone: 'cool' },
  library_day: { text: 'Пыль на полке шепчет', tone: 'warm' },
  street_night: { text: 'Неон отражается в луже — туда', tone: 'cool' },
  river_pier: { text: 'Огонь на воде зовёт ближе', tone: 'warm' },
  pier_evening: { text: 'Ветер с реки несёт голоса', tone: 'cool' },
  volodka_room: { text: 'Кровать, стол, окно — всё помнит', tone: 'warm' },
  home_evening: { text: 'Тепло кухни держит свет', tone: 'warm' },
  city_square: { text: 'Неон в лужах ведёт к центру', tone: 'cool' },
  chk_forest_zorge: { text: 'Дым костра тянет сквозь деревья', tone: 'warm' },
  factory_basement: { text: 'Зелёный гул «Зари-М» в глубине', tone: 'cool' },
};

export function AaaWorldMarkerSystem() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const reducedMotion = useEffectiveReducedMotion();
  const shownScenesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const addMarker = (id: string, text: string, tone: Marker['tone'] = 'whisper') => {
      const x = 50 + (Math.random() - 0.5) * 10;
      const y = 64 + (Math.random() - 0.5) * 6;
      setMarkers((m) => [...m.filter((mm) => mm.id !== id), { id, text, x, y, tone }]);
      setTimeout(() => setMarkers((m) => m.filter((mm) => mm.id !== id)), 4600);
    };

    const unsubs = [
      eventBus.on('quest:objective_updated' as any, ({ questTitle, objectiveText }: any) => {
        const t = objectiveText || questTitle;
        if (t && Math.random() < 0.55) {
          // Only half objectives — avoid spam, show-don't-tell: whisper, not order
          const short = String(t).slice(0, 42);
          addMarker(`quest_${short}_${Date.now()}`, `↗ ${short}`, 'warm');
        }
      }),
      eventBus.on('scene:enter', ({ sceneId }: any) => {
        const sid = String(sceneId);
        if (shownScenesRef.current.has(sid)) return;
        shownScenesRef.current.add(sid);
        setTimeout(() => shownScenesRef.current.delete(sid), 180_000);
        if (Math.random() < 0.32) {
          const hint = SCENE_HINTS[sid];
          if (hint) addMarker(`scene_hint_${sid}_${Date.now()}`, hint.text, hint.tone);
        }
      }),
      // Examination cue — very subtle, world whispers after examine
      eventBus.on('interaction:start' as any, ({ label }: any) => {
        if (!label) return;
        if (String(label).toLowerCase().includes('осмотр') && Math.random() < 0.18) {
          const whispers = ['Можно присмотреться ближе', 'Здесь что-то спрятано', 'Потрогай — мир ответит'];
          const w = whispers[Math.floor(Math.random() * whispers.length)];
          addMarker(`examine_whisper_${Date.now()}`, w, 'whisper');
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: UI_LAYERS.HUD - 1 }}>
      <AnimatePresence>
        {markers.map((m) => (
          <motion.div
            key={m.id}
            initial={
              reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.97, filter: 'blur(3px)' as any }
            }
            animate={{ opacity: m.tone === 'whisper' ? 0.62 : 0.76, y: 0, scale: 1, filter: 'blur(0px)' as any }}
            exit={{ opacity: 0, y: -6, scale: 0.98, filter: 'blur(2px)' as any }}
            transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
            className="absolute hud-filmic-caption hud-filmic-ink-bleed px-3 py-1.5 max-w-[18rem]"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              transform: 'translate(-50%, -50%)',
              borderColor:
                m.tone === 'warm'
                  ? 'rgba(255,210,140,0.14)'
                  : m.tone === 'cool'
                    ? 'rgba(140,180,230,0.12)'
                    : 'rgba(220,215,210,0.08)',
            }}
          >
            <div
              className="hud-filmic-rule opacity-30 mb-1"
              style={{
                background:
                  m.tone === 'warm'
                    ? 'linear-gradient(90deg, transparent, rgba(255,210,140,0.5), transparent)'
                    : m.tone === 'cool'
                      ? 'linear-gradient(90deg, transparent, rgba(140,180,230,0.45), transparent)'
                      : undefined,
              }}
              aria-hidden
            />
            <p
              className="hud-filmic-body text-[11px] italic tracking-[0.06em] leading-relaxed text-center"
              style={{
                color:
                  m.tone === 'warm'
                    ? 'rgba(255,235,200,0.78)'
                    : m.tone === 'cool'
                      ? 'rgba(210,225,245,0.72)'
                      : 'rgba(212,211,209,0.66)',
              }}
            >
              {m.text}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
