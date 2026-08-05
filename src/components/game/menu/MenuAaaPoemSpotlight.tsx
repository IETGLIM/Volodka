import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POEMS } from '@/data/poems';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

function getRandomPoems(count = 5) {
  const shuffled = [...POEMS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function extractExcerpt(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 3).slice(0, 3);
  return lines.join('\n');
}

export function MenuAaaPoemSpotlight({ enabled }: { enabled: boolean }) {
  const reducedMotion = useEffectiveReducedMotion();
  const poems = useMemo(() => getRandomPoems(8), []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setIndex(i => (i + 1) % poems.length), 12000);
    return () => clearInterval(id);
  }, [enabled, poems.length]);

  if (!enabled || poems.length === 0) return null;

  const poem = poems[index];
  const fullText = poem.lines.join('\n');
  const excerpt = extractExcerpt(fullText);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3.2, duration: 1.8 }}
      className="absolute bottom-[18vh] left-1/2 -translate-x-1/2 max-w-[32rem] w-[88vw] md:w-[36rem] z-20 pointer-events-none hidden lg:flex flex-col items-center"
      aria-hidden="true"
    >
      <div className="w-10 h-px bg-gradient-to-r from-transparent via-stone-400/20 to-transparent mb-3" />
      <AnimatePresence mode="wait">
        <motion.div
          key={poem.id}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(3px)' }}
          animate={{ opacity: 0.72, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="font-serif text-[11px] md:text-[12px] leading-[1.9] tracking-[0.06em] text-stone-300/60 whitespace-pre-line italic">
            {excerpt}
          </p>
          <p className="mt-2 font-serif text-[9px] tracking-[0.22em] uppercase text-stone-500/60">
            — {poem.title} ·
            <span className="ml-1 text-stone-600/50">строка, что помнит</span>
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 w-10 h-px bg-gradient-to-r from-transparent via-stone-400/15 to-transparent" />
    </motion.div>
  );
}
