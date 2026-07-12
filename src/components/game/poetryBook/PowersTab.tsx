import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { POEMS } from '@/data/poems';
import { canUsePower, getAllPoemPowers, getPoemPower } from '@/engine/PoemPowerSystem';
import { POETRY_BOOK_LABELS } from '@/engine/poetryBook/poetryBookConstants';
import { PoemPowerCard } from '@/components/game/poetryBook/PoemPowerCard';
import { usePoemPowersCooldownRefresh } from '@/components/game/poetryBook/usePoemCooldownSeconds';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameStore } from '@/store/gameStore';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function PowersTab() {
  const reducedMotion = useEffectiveReducedMotion();
  const collectedPoems = useGameStore((s) => s.collectedPoems);

  const collectedPowers = useMemo(
    () =>
      collectedPoems
        .map((poemId) => {
          const power = getPoemPower(poemId);
          const poem = POEMS.find((entry) => entry.id === poemId);
          return { poemId, power, poem };
        })
        .filter((entry) => entry.power !== undefined),
    [collectedPoems],
  );

  const poemIds = useMemo(
    () => collectedPowers.map((entry) => entry.poemId),
    [collectedPowers],
  );
  usePoemPowersCooldownRefresh(poemIds);

  const availableCount = collectedPowers.filter((entry) => canUsePower(entry.poemId)).length;
  const totalPowers = getAllPoemPowers().length;

  if (collectedPowers.length === 0) {
    return (
      <div
        role="tabpanel"
        id="poetry-book-panel-powers"
        aria-labelledby="poetry-book-tab-powers"
        className="flex flex-col items-center justify-center h-full py-16"
      >
        <Zap className="size-10 text-amber-700/30 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-amber-500/40 mb-1 font-serif">{POETRY_BOOK_LABELS.emptyPowersTitle}</p>
        <p className="text-xs text-amber-700/30 font-serif">{POETRY_BOOK_LABELS.emptyPowersHint}</p>
      </div>
    );
  }

  return (
    <div
      role="tabpanel"
      id="poetry-book-panel-powers"
      aria-labelledby="poetry-book-tab-powers"
      aria-label={POETRY_BOOK_LABELS.powersListRegion}
    >
      <ScrollArea className="h-[calc(90vh-170px)]">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-400/70" aria-hidden="true" />
              <span className="text-xs text-amber-400/70 font-serif">
                {POETRY_BOOK_LABELS.powersReadyCount(availableCount, collectedPowers.length)}
              </span>
            </div>
            <span className="text-[10px] text-amber-600/40 font-serif">
              {POETRY_BOOK_LABELS.powersUnlockedCount(collectedPowers.length, totalPowers)}
            </span>
          </div>
          <div className="flex flex-col gap-3" role="list">
            {collectedPowers.map(({ poemId, power, poem }) => {
              if (!power || !poem) return null;
              return (
                <div key={poemId} role="listitem">
                  <PoemPowerCard
                    poemId={poemId}
                    poemTitle={poem.title}
                    variant="detailed"
                    reducedMotion={reducedMotion}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
