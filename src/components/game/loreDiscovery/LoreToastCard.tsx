import { memo, useEffect, useId, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, BookOpen, Sparkles, Star } from 'lucide-react';
import {
  LORE_TOAST_HINT,
  LORE_TOAST_STAGGER_MS,
} from '@/engine/lore/loreDiscoveryConstants';
import {
  buildLoreToastAccessibleLabel,
  buildLoreToastDescription,
  getLoreToastDurationMs,
  getLoreToastSubtitle,
  getLoreToastVisual,
} from '@/engine/lore/loreDiscoveryPresentation';
import type { LoreToastItem } from '@/engine/lore/loreDiscoveryTypes';
import type { LoreRarity } from '@/store/shared';

type LoreToastCardProps = {
  toast: LoreToastItem;
  index: number;
  reducedMotion: boolean;
  onOpenCodex: (loreId: string) => void;
  onDismiss: (id: string) => void;
};

function RarityIcon({ rarity, className, style }: { rarity: LoreRarity; className?: string; style?: CSSProperties }) {
  switch (rarity) {
    case 'common':
      return <BookOpen className={className} style={style} aria-hidden />;
    case 'uncommon':
      return <BookMarked className={className} style={style} aria-hidden />;
    case 'rare':
      return <Sparkles className={className} style={style} aria-hidden />;
    case 'legendary':
      return <Star className={className} style={style} aria-hidden />;
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

function LoreToastProgressBar({
  toast,
  durationMs,
  reducedMotion,
  accent,
}: {
  toast: LoreToastItem;
  durationMs: number;
  reducedMotion: boolean;
  accent: ReturnType<typeof getLoreToastVisual>;
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => tick((value) => value + 1), 250);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const elapsed = Date.now() - toast.createdAt;
  const remaining = Math.max(0, 100 - Math.round((elapsed / durationMs) * 100));

  return (
    <motion.div
      className="absolute bottom-0 left-0 h-[2px]"
      style={{ background: accent.countdownBg, boxShadow: `0 0 6px ${accent.glow}` }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={remaining}
      aria-label="Время до закрытия уведомления"
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: durationMs / 1000, ease: 'linear' }}
    />
  );
}

export const LoreToastCard = memo(function LoreToastCard({
  toast,
  index,
  reducedMotion,
  onOpenCodex,
  onDismiss,
}: LoreToastCardProps) {
  const titleId = useId();
  const descriptionId = useId();
  const hintId = useId();
  const accent = getLoreToastVisual(toast.rarity);
  const durationMs = getLoreToastDurationMs(toast.rarity);
  const subtitle = getLoreToastSubtitle(toast.rarity, toast.category);

  const handleClick = () => {
    onOpenCodex(toast.loreId);
    onDismiss(toast.id);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${hintId}`}
      aria-label={buildLoreToastAccessibleLabel(toast.title)}
      className="lore-discovery-toast pointer-events-auto relative overflow-hidden text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        borderRadius: '8px',
        boxShadow: accent.shadow,
        minWidth: '220px',
        maxWidth: '320px',
        fontFamily: "'Geist Mono', monospace",
      }}
      initial={reducedMotion ? false : { opacity: 0, x: -60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: -40, scale: 0.92 }}
      transition={{
        duration: reducedMotion ? 0 : 0.35,
        delay: reducedMotion ? 0 : index * (LORE_TOAST_STAGGER_MS / 1000),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onDismiss(toast.id);
        }
      }}
    >
      {!reducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent.primary}18 45%, ${accent.primary}40 50%, ${accent.primary}18 55%, transparent 100%)`,
            backgroundSize: '300% 100%',
          }}
          initial={{ backgroundPosition: '100% 0%' }}
          animate={{ backgroundPosition: '-100% 0%' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        <div
          className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
          style={{ background: accent.iconBg, boxShadow: `0 0 8px ${accent.glow}` }}
          aria-hidden
        >
          <RarityIcon rarity={toast.rarity} className="size-4.5" style={{ color: accent.primary }} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            id={titleId}
            className="text-sm font-mono font-bold tracking-wide truncate"
            style={{ color: accent.textColor, textShadow: `0 0 8px ${accent.glow}` }}
          >
            {toast.title}
          </span>
          <span id={descriptionId} className="text-[10px] font-mono text-slate-400 tracking-wide truncate">
            {subtitle}
          </span>
          <span id={hintId} className="text-[9px] font-mono text-slate-600 tracking-wide">
            {LORE_TOAST_HINT}
          </span>
        </div>
      </div>

      <span className="sr-only">{buildLoreToastDescription(toast)}</span>

      <LoreToastProgressBar
        toast={toast}
        durationMs={durationMs}
        reducedMotion={reducedMotion}
        accent={accent}
      />
    </motion.button>
  );
});
