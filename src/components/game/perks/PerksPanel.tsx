import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Feather, Zap } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { PerkCard } from '@/components/game/perks/PerkCard';
import { PerkCategoryTabs } from '@/components/game/perks/PerkCategoryTabs';
import { usePerksPanelData } from '@/components/game/perks/usePerksPanelData';
import '@/components/game/perks/perks-panel.css';
import { PERKS, PERK_CATEGORY_META, type PerkCategory } from '@/data/perks';
import {
  PERK_CATEGORY_TAB_LABELS,
  PERKS_PANEL_LABELS,
} from '@/engine/perks/perksPanelConstants';
import {
  canAffordPerk,
  computeCategoryCounts,
  filterPerksByCategory,
  getGridItemMotion,
  getPerkState,
} from '@/engine/perks/perksPanelPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export type PerksPanelProps = {
  open: boolean;
  onClose: () => void;
};

function PerksPanelInner({ open, onClose }: PerksPanelProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const { perkPoints, level, unlockedPerks, acquirePerk, canAcquirePerk } = usePerksPanelData();
  const [activeCategory, setActiveCategory] = useState<PerkCategory | 'all'>('all');
  const [categoryAnnouncement, setCategoryAnnouncement] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAcquire = useCallback(
    (perkId: string) => {
      if (!canAcquirePerk(perkId)) return;
      acquirePerk(perkId);
    },
    [acquirePerk, canAcquirePerk],
  );

  const categoryCounts = useMemo(() => computeCategoryCounts(unlockedPerks), [unlockedPerks]);
  const filteredPerks = useMemo(
    () => filterPerksByCategory(activeCategory),
    [activeCategory],
  );
  const totalAcquired = unlockedPerks.length;
  const totalPerks = PERKS.length;
  const gridMotion = getGridItemMotion(reducedMotion);

  const handleCategorySelect = useCallback((category: PerkCategory | 'all') => {
    setActiveCategory(category);
    const label =
      category === 'all'
        ? PERKS_PANEL_LABELS.tabAll
        : PERK_CATEGORY_TAB_LABELS[category];
    setCategoryAnnouncement(PERKS_PANEL_LABELS.categoryChanged(label));
  }, []);

  useEffect(() => {
    if (!open) return;
    gridRef.current?.focus();
  }, [activeCategory, open]);

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title={PERKS_PANEL_LABELS.title}
      urlPath={PERKS_PANEL_LABELS.urlPath}
      accentColor="amber"
      layout="centered"
      maxWidth="max-w-4xl"
      icon={<Feather className="size-4 text-amber-400/60" aria-hidden="true" />}
      shortcutLabel={PERKS_PANEL_LABELS.shortcut}
      headerExtra={
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border"
            style={{
              borderColor: 'rgba(251,191,36,0.3)',
              background: 'rgba(251,191,36,0.08)',
            }}
            aria-label={`${perkPoints} ${PERKS_PANEL_LABELS.perkPointsUnit}`}
          >
            <Zap className="size-3.5 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-bold font-mono text-amber-300 neon-text-amber">{perkPoints}</span>
            <span className="text-[10px] text-amber-400/70 font-mono">{PERKS_PANEL_LABELS.perkPointsUnit}</span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">{PERKS_PANEL_LABELS.footerUrl}</span>
          <span className="text-[9px] text-slate-500 font-mono">
            {PERKS_PANEL_LABELS.footerProgress(totalAcquired, totalPerks)}
          </span>
        </div>
      }
    >
      <div className={`${reducedMotion ? 'perks-panel--reduced-motion' : ''}`}>
        <div className="sr-only" aria-live="polite">
          {categoryAnnouncement}
        </div>

        <PerkCategoryTabs
          activeCategory={activeCategory}
          categoryCounts={categoryCounts}
          onSelect={handleCategorySelect}
        />

        <div className="relative p-4 sm:p-6 overflow-auto max-h-[65vh] custom-scrollbar">
          {!reducedMotion && (
            <>
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <pattern id="perk-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#perk-grid)" />
              </svg>
              <div
                className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)' }}
                aria-hidden="true"
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.03) 0%, transparent 70%)' }}
                aria-hidden="true"
              />
            </>
          )}

          <div
            ref={gridRef}
            tabIndex={-1}
            role="list"
            aria-label={PERKS_PANEL_LABELS.listAria}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10 outline-none"
          >
            <AnimatePresence mode="popLayout">
              {filteredPerks.map((perk) => {
                const state = getPerkState(perk, unlockedPerks, perkPoints, level);
                const meta = PERK_CATEGORY_META[perk.category];
                const afford = canAffordPerk(perkPoints, perk);

                return (
                  <motion.div
                    key={perk.id}
                    layout={!reducedMotion}
                    initial={gridMotion.initial}
                    animate={gridMotion.animate}
                    exit={gridMotion.exit}
                    transition={gridMotion.transition}
                  >
                    <PerkCard
                      perk={perk}
                      state={state}
                      categoryColor={meta.color}
                      onAcquire={handleAcquire}
                      canAfford={afford}
                      reducedMotion={reducedMotion}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredPerks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm font-mono" role="status">
              {PERKS_PANEL_LABELS.emptyCategory}
            </div>
          )}
        </div>
      </div>
    </PanelWrapper>
  );
}

export function PerksPanel(props: PerksPanelProps) {
  return (
    <ErrorBoundary name="PerksPanel" fallback={null}>
      <PerksPanelInner {...props} />
    </ErrorBoundary>
  );
}
