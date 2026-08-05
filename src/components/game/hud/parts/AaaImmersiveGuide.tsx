/* ─── Volodka RPG – AAA Immersive Guide ───
 * Show-don't-tell guidance system: no tutorial popups, only diegetic whispers,
 * environmental nudges, and inner monologue as Volodka thinks.
 * Luxurious, filmi, minimal — appears as ink bleed near bottom, not centered popup.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface GuideEntry {
  id: string;
  text: string;
  tone: 'whisper' | 'thought' | 'memory' | 'poetic';
  duration: number;
}

const INNER_VOICE_LINES: Record<string, string> = {
  first_interact: 'Руки помнят — нажми, потяни, послушай, что ответит.',
  first_npc: 'Кто-то рядом. Слова иногда открывают двери лучше ключей.',
  first_poem: 'Строки на бумаге теплее, чем кажется. Прочитай — и мир ответит.',
  low_energy: 'Дыхание сбилось. Кофе, пауза, строка стиха — тоже путь.',
  high_stress: 'Шум в голове. Остановись. Послушай тишину между мыслями.',
  combat_near: 'Тень сгустилась. Не обязательно драться, но будь готов.',
  quest_new: 'Новая нить. Потянет — посмотрим, куда приведет.',
  scene_chka: 'ЧК. Запах дешевого кофе и старых историй.',
  scene_office: 'Офис. Гул машин и чужие разговоры за стеной.',
  scene_library: 'Пыль, книги, тихий шепот страниц.',
};

function toneStyle(tone: GuideEntry['tone']) {
  switch (tone) {
    case 'whisper': return { color: 'var(--hud-filmic-ink-dim)', fontStyle: 'italic', tracking: '0.08em' };
    case 'thought': return { color: 'var(--hud-filmic-ink)', fontStyle: 'normal', tracking: '0.06em' };
    case 'memory': return { color: 'var(--hud-filmic-ink-meta)', fontStyle: 'italic', tracking: '0.12em' };
    case 'poetic': return { color: 'var(--hud-filmic-glow-warm)', fontStyle: 'italic', tracking: '0.10em' };
  }
}

export function AaaImmersiveGuide() {
  const [entry, setEntry] = useState<GuideEntry | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const show = (id: string, text: string, tone: GuideEntry['tone'] = 'thought', duration = 4200) => {
      if (shownRef.current.has(id)) return;
      shownRef.current.add(id);
      if (timerRef.current) clearTimeout(timerRef.current);
      setEntry({ id, text, tone, duration });
      timerRef.current = setTimeout(() => setEntry(null), duration);
      // auto-clean shown after 120s to allow re-show
      setTimeout(() => shownRef.current.delete(id), 120_000);
    };

    const unsubs = [
      eventBus.on('interaction:hint', ({ label }) => {
        if (!label) return;
        if (label.toLowerCase().includes('осмотр')) {
          show(`guide_first_interact_${Date.now()}`, INNER_VOICE_LINES.first_interact, 'whisper', 3600);
        }
      }),
      eventBus.on('npc:talked', () => {
        if (!shownRef.current.has('first_npc')) {
          show('first_npc', INNER_VOICE_LINES.first_npc, 'thought', 4000);
        }
      }),
      eventBus.on('poem:collected', () => {
        show(`poem_${Date.now()}`, INNER_VOICE_LINES.first_poem, 'poetic', 5000);
      }),
      eventBus.on('quest:accepted', () => {
        show(`quest_${Date.now()}`, INNER_VOICE_LINES.quest_new, 'thought', 3500);
      }),
      eventBus.on('combat:proximity', () => {
        show(`combat_${Date.now()}`, INNER_VOICE_LINES.combat_near, 'whisper', 3200);
      }),
      eventBus.on('scene:enter', ({ sceneId }) => {
        const key = `scene_${sceneId}`;
        const line = (INNER_VOICE_LINES as any)[key] || (INNER_VOICE_LINES as any)[`scene_${sceneId.split('_')[0]}`];
        if (line && !shownRef.current.has(key)) {
          show(key, line, 'memory', 3800);
        }
      }),
    ];

    return () => {
      unsubs.forEach(u => u());
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[22vh] max-w-[28rem] w-[86vw] md:w-[32rem] flex justify-center"
      style={{ zIndex: UI_LAYERS.HUD + 1 }}
      aria-live="polite"
    >
      <AnimatePresence>
        {entry && (
          <motion.div
            key={entry.id}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(2px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="hud-filmic-caption hud-filmic-ink-bleed px-5 py-2.5 text-center"
          >
            <div className="hud-filmic-rule hud-filmic-rule--wide opacity-40" aria-hidden />
            <p
              className="hud-filmic-body text-[12px] leading-relaxed"
              style={toneStyle(entry.tone) as any}
            >
              {entry.text}
            </p>
            <div className="hud-filmic-rule hud-filmic-rule--soft opacity-30 mt-1" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
