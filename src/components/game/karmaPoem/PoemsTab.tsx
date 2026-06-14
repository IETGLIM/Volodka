import type { PoemSlotView } from '@/engine/karmaPoem/karmaPoemPresentation';
import { PoemSlotGrid } from '@/components/game/karmaPoem/PoemSlotGrid';

interface PoemsTabProps {
  poemSlots: PoemSlotView[];
  collectedCount: number;
  totalPoems: number;
  readyPowerCount: number;
  powerPoemCount: number;
  poemBypassQuests: Array<{ id: string; title: string }>;
}

export function PoemsTab({
  poemSlots,
  collectedCount,
  totalPoems,
  readyPowerCount,
  powerPoemCount,
  poemBypassQuests,
}: PoemsTabProps) {
  return (
    <div className="space-y-6">
      <div className="text-sm font-mono leading-relaxed px-4 py-3 rounded bg-emerald-950/20 border border-emerald-900/20 text-slate-400 break-words">
        Стихи — твоя сила в этом мире. Каждое стихотворение даёт особую способность и может открыть закрытые пути.
      </div>

      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-3 text-emerald-400/70">
          СОБРАННЫЕ СТИХИ ({collectedCount}/{totalPoems}):
        </h3>
        <PoemSlotGrid slots={poemSlots} />
      </div>

      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-2 text-amber-400/70">
          СИЛА СТИХОВ:
        </h3>
        <div className="flex flex-wrap items-center gap-4 px-3 py-2 rounded bg-amber-950/15 border border-amber-900/20">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-amber-300">{readyPowerCount}</div>
            <div className="text-[9px] font-mono text-slate-500">Доступно</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-slate-400">{powerPoemCount}</div>
            <div className="text-[9px] font-mono text-slate-500">С силой</div>
          </div>
          <div className="text-[11px] font-mono text-slate-500">Перезарядка: 60 сек</div>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-2 text-violet-400/70">
          ОБХОД СТИХАМИ:
        </h3>
        <div className="text-[11px] font-mono leading-relaxed px-3 py-2 rounded bg-violet-950/15 border border-violet-900/20 text-violet-200/70 break-words">
          Некоторые задания можно обойти, применив силу стихотворения. Это позволяет пройти сложные испытания альтернативным путём.
          {poemBypassQuests.length > 0 && (
            <ul className="mt-2 space-y-1 list-none">
              {poemBypassQuests.map((quest) => (
                <li key={quest.id} className="text-violet-300/60">• {quest.title}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
