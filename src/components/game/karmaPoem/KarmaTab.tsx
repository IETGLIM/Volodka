import { memo } from 'react';
import type { EndingView } from '@/engine/karmaPoem/karmaPoemPresentation';

function karmaStrokeColor(karma: number): string {
  if (karma >= 60) return '#34d399';
  if (karma < 40) return '#f87171';
  return '#fbbf24';
}

interface KarmaTabProps {
  karma: number;
  availableEndings: EndingView[];
  recentChanges: ReadonlyArray<{ id: string; text: string }>;
  reducedMotion: boolean;
}

const EndingRow = memo(function EndingRow({ ending }: { ending: EndingView }) {
  return (
    <div
      tabIndex={0}
      className={`flex items-start gap-3 px-3 py-2 rounded outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 ${
        ending.available
          ? 'bg-cyan-950/20 border border-cyan-800/30'
          : 'bg-slate-900/30 border border-slate-700/20 opacity-60'
      }`}
    >
      <span className="text-sm mt-0.5" aria-hidden>{ending.available ? '🔓' : '🔒'}</span>
      <div className="min-w-0">
        <div className={`text-[12px] font-mono font-bold break-words ${ending.available ? 'text-slate-100' : 'text-slate-500'}`}>
          {ending.title}
        </div>
        <div className="text-[10px] font-mono text-slate-500 break-words">{ending.condition}</div>
      </div>
    </div>
  );
});

export function KarmaTab({ karma, availableEndings, recentChanges, reducedMotion }: KarmaTabProps) {
  const stroke = karmaStrokeColor(karma);
  const dash = (karma / 100) * 314.16;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="relative" role="img" aria-label={`Карма: ${karma}`}>
          <svg viewBox="0 0 120 120" width="160" height="160" aria-hidden>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#334155" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={stroke}
              strokeWidth="8"
              strokeDasharray={`${dash} 314.16`}
              strokeDashoffset="78.54"
              strokeLinecap="round"
              className={reducedMotion ? undefined : 'transition-[stroke-dasharray] duration-500 ease-out'}
              style={{ filter: `drop-shadow(0 0 6px ${stroke}66)` }}
            />
            <text x="60" y="58" textAnchor="middle" dominantBaseline="middle" fill={stroke} fontSize="28" fontFamily="monospace" fontWeight="bold">
              {karma}
            </text>
            <text x="60" y="76" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
              КАРМА
            </text>
          </svg>
        </div>
      </div>

      <div className="text-sm font-mono leading-relaxed px-4 py-3 rounded bg-cyan-950/20 border border-cyan-900/20 text-slate-400 break-words">
        Карма отражает твой моральный путь. Высокая карма открывает путь Создателя и Повстанца. Низкая — путь Изгнанника.
      </div>

      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-3 text-cyan-400/70">
          ДОСТУПНЫЕ КОНЦОВКИ:
        </h3>
        <div className="space-y-2" role="list" aria-label="Концовки">
          {availableEndings.map((ending) => (
            <EndingRow key={ending.id} ending={ending} />
          ))}
        </div>
      </div>

      {recentChanges.length > 0 && (
        <div>
          <h3 className="text-[11px] font-mono tracking-wider mb-2 text-amber-400/70">
            ПОСЛЕДНИЕ ИЗМЕНЕНИЯ:
          </h3>
          <div className="space-y-1" aria-live="polite">
            {recentChanges.map((change) => (
              <div key={change.id} className="text-[11px] font-mono text-slate-400 break-words">
                {change.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
