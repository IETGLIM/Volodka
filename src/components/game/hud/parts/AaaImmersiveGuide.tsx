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
  scene_factory: 'Металл и пар. Здесь что-то большое дышит.',
  scene_pier: 'Вода тихо плещет. Можно бросить мысли в реку.',
  scene_roof: 'Ветер сильный. Город выглядит меньше сверху.',
  scene_bunker: 'Зелёный свет. Машины помнят имена.',
  scene_park: 'Листья шепчут. Здесь когда-то было тихо.',
  first_explore_hub: 'Можно просто ходить. Мир сам расскажет, если послушать.',
  karma_high: 'Ты стал чуть светлее. Люди это чувствуют.',
  karma_low: 'Тяжесть в груди. Мир отвечает тем же.',
  poem_power: 'Стихи шевелятся внутри. Можно выпустить их наружу.',
  night_city: 'Неон мигает. Город не спит, только притворяется.',
  // AAA Phase A/C: more poetic whispers for the densest living world scenes (dream, rooftops, campfires, battle aftermath, cozy rooms)
  sleep_dream: 'Звёзды шепчут. Это не просто сон — это память.',
  dream_memory: 'Старый предмет плывёт. Он помнит тебя.',
  rooftop_sky: 'Ветер сильный. Здесь можно оставить всё позади.',
  chk_campfire: 'Огонь трещит. Истории в нём старше нас.',
  battle_after: 'Тишина после. Обломки помнят.',
  library_basement: 'Пыль тяжёлая. Секреты не любят свет.',
  albert_room: 'Тёплый свет. Здесь можно остаться навсегда.',
  solnysh_room: 'Солнце в окне. Даже в темноте светит.',
  zarema_room: 'Цветы и зеркала. Кто-то любил это место.',
  city_plaza: 'Неон в лужах. Город дышит неоном.',
  forest_night: 'Деревья помнят. Шепчут то, что ты забыл.',
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
      eventBus.on('encounter:presentation_start', () => {
        show(`combat_${Date.now()}`, INNER_VOICE_LINES.combat_near, 'whisper', 3200);
      }),
      eventBus.on('combat:start', () => {
        show(`combat_battle_${Date.now()}`, INNER_VOICE_LINES.combat_near, 'whisper', 2800);
      }),
      eventBus.on('scene:enter', ({ sceneId }) => {
        const key = `scene_${sceneId}`;
        let line = (INNER_VOICE_LINES as any)[key] || (INNER_VOICE_LINES as any)[`scene_${sceneId.split('_')[0]}`];
        if (!line) {
          // Fallback poetic atmosphere lines for all hubs
          if (sceneId.includes('factory') || sceneId.includes('basement')) line = INNER_VOICE_LINES.scene_factory;
          else if (sceneId.includes('pier') || sceneId.includes('river')) line = INNER_VOICE_LINES.scene_pier;
          else if (sceneId.includes('roof')) line = INNER_VOICE_LINES.scene_roof;
          else if (sceneId.includes('bunker')) line = INNER_VOICE_LINES.scene_bunker;
          else if (sceneId.includes('park')) line = INNER_VOICE_LINES.scene_park;
          else if (sceneId.includes('street') || sceneId.includes('city')) line = INNER_VOICE_LINES.night_city;
          // AAA Phase A/C dense living world scenes
          else if (sceneId.includes('sleep_dream') || sceneId.includes('dream')) line = INNER_VOICE_LINES.sleep_dream || INNER_VOICE_LINES.dream_memory;
          else if (sceneId.includes('rooftop') || sceneId.includes('roof')) line = INNER_VOICE_LINES.rooftop_sky;
          else if (sceneId.includes('chk_campfire')) line = INNER_VOICE_LINES.chk_campfire;
          else if (sceneId.includes('battle')) line = INNER_VOICE_LINES.battle_after;
          else if (sceneId.includes('library_basement')) line = INNER_VOICE_LINES.library_basement;
          else if (sceneId.includes('albert_backroom')) line = INNER_VOICE_LINES.albert_room;
          else if (sceneId.includes('solnysh_room')) line = INNER_VOICE_LINES.solnysh_room;
          else if (sceneId.includes('zarema')) line = INNER_VOICE_LINES.zarema_room;
          else if (sceneId.includes('city_square')) line = INNER_VOICE_LINES.city_plaza;
          else if (sceneId.includes('chk_forest') || sceneId.includes('park_day')) line = INNER_VOICE_LINES.forest_night;
        }
        if (line && !shownRef.current.has(key)) {
          show(key, line, 'memory', 3800);
        }
      }),
      // Extra living-world triggers (show, don't tell)
      eventBus.on('poem:power_used', () => {
        if (!shownRef.current.has('poem_power')) {
          show('poem_power', INNER_VOICE_LINES.poem_power, 'poetic', 4600);
        }
      }),
      eventBus.on('player:karma_change' as any, ({ delta }: any) => {
        if (Math.abs(delta || 0) > 8) {
          const line = (delta || 0) > 0 ? INNER_VOICE_LINES.karma_high : INNER_VOICE_LINES.karma_low;
          show(`karma_${Date.now()}`, line, 'thought', 3200);
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
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
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
