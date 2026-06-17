import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Clock,
  Eye,
  Feather,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { POEMS, getMainPoems, getHiddenPoems } from '@/data/poems';
import {
  canUsePower,
  getCooldownRemaining,
  getPoemPower,
} from '@/engine/PoemPowerSystem';
import { requestPoemPowerActivation } from '@/engine/poemReading/poemReadingOrchestrator';
import { journalTelemetry } from '@/engine/journal/journalTelemetry';
import { JOURNAL_THEME_COLORS } from '@/components/game/journal/journalConstants';
import { audioEngine } from '@/engine/AudioEngine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollectedPoems } from '@/store/selectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface PoemsTabProps {
  searchQuery: string;
}

const PoemGridCard = memo(function PoemGridCard({
  poemId,
  title,
  isCollected,
  isHidden,
  onSelect,
}: {
  poemId: string;
  title: string;
  isCollected: boolean;
  isHidden: boolean;
  onSelect: (id: string) => void;
}) {
  const poemPower = isCollected ? getPoemPower(poemId) : undefined;

  return (
    <button
      type="button"
      onClick={() => isCollected && onSelect(poemId)}
      disabled={!isCollected}
      aria-label={isCollected ? title : 'Стих ещё не найден'}
      className={`text-left p-3 rounded-xl border transition-all duration-200 min-h-[44px] ${
        isCollected
          ? 'border-cyan-900/20 bg-slate-900/20 hover:bg-amber-950/15 hover:border-amber-800/25 cursor-pointer'
          : 'border-slate-800/15 bg-slate-900/10 opacity-40 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {isCollected ? (
          isHidden ? (
            <Eye className="size-3 text-cyan-500/40 shrink-0" aria-hidden />
          ) : (
            <Sparkles className="size-3 text-amber-500/40 shrink-0" aria-hidden />
          )
        ) : (
          <Lock className="size-3 text-slate-600 shrink-0" aria-hidden />
        )}
        <span className={`text-sm truncate ${isCollected ? 'text-slate-200' : 'text-slate-600'}`}>
          {isCollected ? title : '???'}
        </span>
      </div>
      {isCollected && poemPower && (
        <span className="text-[10px] text-cyan-500/60 ml-5">⚡ {poemPower.name}</span>
      )}
      {!isCollected && (
        <p className="text-[10px] text-slate-700 ml-5 italic">
          {isHidden ? 'Скрытый стих' : 'Ещё не найдено'}
        </p>
      )}
    </button>
  );
});

function usePoemCooldownSeconds(poemId: string | null, active: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!poemId || !active) {
      setSeconds(0);
      return;
    }

    const tick = () => {
      const remaining = getCooldownRemaining(poemId);
      setSeconds(Math.ceil(remaining / 1000));
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [poemId, active]);

  return seconds;
}

export function PoemsTab({ searchQuery }: PoemsTabProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const collectedPoems = useCollectedPoems();
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);

  const mainPoems = getMainPoems();
  const hiddenPoems = getHiddenPoems();
  const selectedPoem = POEMS.find((poem) => poem.id === selectedPoemId);
  const power = selectedPoemId ? getPoemPower(selectedPoemId) : undefined;
  const cooldownSec = usePoemCooldownSeconds(selectedPoemId, !!selectedPoem);

  const handleSelectPoem = useCallback((poemId: string) => {
    setSelectedPoemId(poemId);
    journalTelemetry.track({ action: 'poem_view', itemId: poemId, tab: 'poems' });
  }, []);

  const handleActivate = useCallback(() => {
    if (!selectedPoemId || !power) return;
    if (!canUsePower(selectedPoemId) || activating) return;

    setActivating(true);
    const result = requestPoemPowerActivation(selectedPoemId);
    if (result.status === 'activated' || result.status === 'cutscene_pending') {
      if (result.status === 'activated') {
        audioEngine.playSfx('quest_complete');
      }
      setJustUsed(true);
      setTimeout(() => setJustUsed(false), 2000);
    }
    setActivating(false);
  }, [selectedPoemId, power, activating]);

  const filteredMain = useMemo(() => {
    if (!searchQuery.trim()) return mainPoems;
    const query = searchQuery.toLowerCase();
    return mainPoems.filter(
      (poem) =>
        poem.title.toLowerCase().includes(query)
        || poem.themes.some((theme) => theme.toLowerCase().includes(query)),
    );
  }, [mainPoems, searchQuery]);

  const filteredHidden = useMemo(() => {
    if (!searchQuery.trim()) return hiddenPoems;
    const query = searchQuery.toLowerCase();
    return hiddenPoems.filter(
      (poem) =>
        poem.title.toLowerCase().includes(query)
        || poem.themes.some((theme) => theme.toLowerCase().includes(query)),
    );
  }, [hiddenPoems, searchQuery]);

  if (selectedPoem) {
    const available = canUsePower(selectedPoem.id);
    const onCooldown = cooldownSec > 0;

    return (
      <div className="h-full flex flex-col">
        <button
          type="button"
          onClick={() => setSelectedPoemId(null)}
          className="flex items-center gap-1.5 text-xs text-cyan-400/70 hover:text-cyan-300 px-5 py-3 transition-colors shrink-0"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Назад к списку
        </button>

        <ScrollArea className="flex-1">
          <div className="px-5 pb-5">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-amber-200/90 mb-1 font-serif break-words">
                {selectedPoem.title}
              </h3>
              <p className="text-xs text-slate-500">{selectedPoem.author}</p>
            </div>

            {selectedPoem.themes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {selectedPoem.themes.map((theme) => (
                  <span
                    key={theme}
                    className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${
                      JOURNAL_THEME_COLORS[theme] ?? 'bg-slate-800/60 text-slate-300 border-slate-600/40'
                    }`}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            )}

            {selectedPoem.intro && (
              <div className="mb-4 px-3 py-2.5 rounded-lg border border-cyan-900/20 bg-slate-900/30">
                <p className="text-sm text-slate-400 italic leading-relaxed font-serif break-words">
                  {selectedPoem.intro}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-700/30" />
              <Feather className="size-3 text-amber-600/40" aria-hidden />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-700/30" />
            </div>

            <div className="space-y-0.5 max-w-md mx-auto">
              {selectedPoem.lines.map((line, index) => (
                <p
                  key={`${selectedPoem.id}-line-${index}`}
                  className={`text-center leading-relaxed font-serif break-words ${
                    line === ''
                      ? 'h-3'
                      : line.startsWith('___')
                        ? 'text-slate-500 text-sm tracking-widest'
                        : line.startsWith('-')
                          ? 'text-amber-200/60 text-sm italic'
                          : 'text-slate-200/90 italic text-[15px]'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>

            {power && (
              <div
                className={`mt-5 p-3 rounded-xl border transition-all duration-300 ${
                  justUsed && !reducedMotion
                    ? 'border-amber-400/60 bg-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                    : available
                      ? 'border-cyan-800/40 bg-cyan-950/20'
                      : 'border-slate-800/30 bg-slate-900/20 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className={`size-4 ${justUsed ? 'text-amber-400' : available ? 'text-cyan-400' : 'text-slate-500'}`} aria-hidden />
                  <span className={`text-sm font-medium ${justUsed ? 'text-amber-300' : available ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {power.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed break-words">{power.description}</p>
                {available ? (
                  <Button
                    onClick={handleActivate}
                    disabled={activating}
                    size="sm"
                    className="w-full bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-200 border border-cyan-700/30 text-xs"
                    variant="outline"
                    aria-busy={activating}
                  >
                    <Sparkles className="size-3 mr-1.5" aria-hidden />
                    {activating ? 'Активация...' : 'Активировать способность'}
                  </Button>
                ) : onCooldown ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500" aria-live="polite">
                    <Clock className="size-3" aria-hidden />
                    <span>Перезарядка: {cooldownSec}с</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">
            <Feather className="size-3 inline mr-1 text-amber-400/60" aria-hidden />
            {collectedPoems.length} из {POEMS.length} найдено
          </p>
          <Badge variant="outline" className="text-[10px] border-cyan-800/40 text-cyan-400/70">
            Стих — это сила
          </Badge>
        </div>

        {filteredMain.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[11px] font-medium text-amber-500/60 uppercase tracking-widest mb-3">
              Стихи Владимира
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredMain.map((poem) => (
                <PoemGridCard
                  key={poem.id}
                  poemId={poem.id}
                  title={poem.title}
                  isCollected={collectedPoems.includes(poem.id)}
                  isHidden={false}
                  onSelect={handleSelectPoem}
                />
              ))}
            </div>
          </div>
        )}

        {filteredHidden.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[11px] font-medium text-cyan-500/60 uppercase tracking-widest mb-3">
              Скрытые стихи
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredHidden.map((poem) => (
                <PoemGridCard
                  key={poem.id}
                  poemId={poem.id}
                  title={poem.title}
                  isCollected={collectedPoems.includes(poem.id)}
                  isHidden
                  onSelect={handleSelectPoem}
                />
              ))}
            </div>
          </div>
        )}

        {collectedPoems.length === 0 && (
          <div className="text-center py-12">
            <Feather className="size-10 text-slate-700 mx-auto mb-3" aria-hidden />
            <p className="text-sm text-slate-500 mb-1">Стихотворения ещё не найдены</p>
            <p className="text-xs text-slate-600">Исследуйте мир, и стихи откроются вам</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
