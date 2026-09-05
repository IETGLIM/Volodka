/**
 * AssetDiagnosticsBadge — прод-панель самодиагностики (v4.14.1).
 *
 * Отвечает на вопросы «куда делись текстуры? что с физикой?» на устройстве
 * игрока: показывает отказы загрузки GLB/текстур/звука (THREE.DefaultLoadingManager),
 * статус Rapier WASM и активный пресет качества. Клавиша F8 или клик по бейджу.
 *
 * Принципы:
 *  - при нулевых отказах НЕ рендерит ничего (нулевая нагрузка на HUD);
 *  - имена ресурсов в панели усечены — панель не должна ломать раскладку;
 *  - pointer-events только на самом бейдже/панели, остальное прозрачено;
 *  - reduced-motion учитывается (никаких анимаций кроме лёгкого opacity).
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  assetFailureKindLabelRu,
  clearRuntimeDiagnostics,
  getRuntimeDiagnosticsSnapshot,
  subscribeRuntimeDiagnostics,
  type RapierStatus,
  type RuntimeDiagnosticsSnapshot,
} from '@/engine/diagnostics/runtimeDiagnostics';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const RAPIER_LABEL_RU: Record<RapierStatus, string> = {
  pending: 'инициализация…',
  external: 'готов (внешний WASM)',
  inline: 'готов (встроенный WASM)',
  failed: 'ОШИБКА ИНИЦИАЛИЗАЦИИ',
};

const RAPIER_TONE: Record<RapierStatus, string> = {
  pending: 'text-slate-300',
  external: 'text-emerald-300',
  inline: 'text-sky-300',
  failed: 'text-red-300',
};

/** Обрезка URL до читаемого вида: последняя директория + имя файла. */
function shortenUrl(url: string, max = 52): string {
  const clean = url.split(/[?#]/)[0] ?? url;
  const parts = clean.split('/').filter(Boolean);
  if (parts.length <= 3) return clean.slice(0, max);
  return `…/${parts.slice(-3).join('/')}`.slice(-max);
}

function useRuntimeDiagnosticsSnapshot(): RuntimeDiagnosticsSnapshot {
  return useSyncExternalStore(subscribeRuntimeDiagnostics, getRuntimeDiagnosticsSnapshot, getRuntimeDiagnosticsSnapshot);
}

export function AssetDiagnosticsBadge() {
  const snapshot = useRuntimeDiagnosticsSnapshot();
  const { preset } = useGraphicsQuality();
  const [open, setOpen] = useState(false);

  // F8 — toggle панели (F5/F9 заняты сейвами, F8 свободна).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'F8') return;
      e.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hasFailures = snapshot.totalFailures > 0;
  const hasCritical = snapshot.rapier === 'failed' || hasFailures;

  const dismiss = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const presetLine = useMemo(
    () => `${preset.labelRu} · окружение: ${preset.environmentRenderMode} · NPC: ${preset.npcRenderMode}`,
    [preset],
  );

  if (!hasCritical && !open) return null;

  return (
    <>
      {hasCritical && !open && (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Диагностика: проблемных загрузок ${snapshot.totalFailures}. Открыть панель (F8)`}
          className="pointer-events-auto fixed bottom-2 left-2 flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-950/90 px-2 py-1 font-mono text-[10px] text-amber-200 transition-opacity hover:opacity-90"
          style={{ zIndex: UI_LAYERS.DEV_PANEL }}
        >
          <AlertTriangle className="size-3" aria-hidden />
          <span>
            {snapshot.rapier === 'failed' ? 'Физика не инициализирована' : null}
            {snapshot.rapier === 'failed' && hasFailures ? ' · ' : null}
            {hasFailures
              ? `${snapshot.totalFailures} загрузок не удалось — F8`
              : null}
          </span>
        </button>
      )}

      {open && (
        <section
          aria-label="Панель диагностики ресурсов и физики"
          className="pointer-events-auto fixed bottom-2 left-2 max-h-[70vh] w-[min(420px,calc(100vw-1rem))] overflow-y-auto rounded border border-slate-500/40 bg-slate-950/95 p-3 font-mono text-[11px] leading-relaxed text-slate-200 shadow-xl backdrop-blur"
          style={{ zIndex: UI_LAYERS.DEV_PANEL }}
        >
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold tracking-wide text-slate-100">
              Диагностика (F8)
            </h2>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Закрыть панель диагностики"
              className="rounded p-0.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </header>

          <dl className="mb-2 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-400">Физика (Rapier)</dt>
              <dd className={RAPIER_TONE[snapshot.rapier]}>{RAPIER_LABEL_RU[snapshot.rapier]}</dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="shrink-0 text-slate-400">Пресет качества</dt>
              <dd className="text-right text-slate-300">{presetLine}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-400">Неудачных загрузок</dt>
              <dd className={hasFailures ? 'text-amber-300' : 'text-emerald-300'}>
                {snapshot.totalFailures}
              </dd>
            </div>
          </dl>

          {snapshot.failures.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-slate-400">Отказы (последние):</p>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded border border-white/5 bg-black/30 p-1.5">
                {snapshot.failures.map((f) => (
                  <li key={`${f.kind}:${f.url}`} className="truncate" title={`${f.kind}:${f.url}`}>
                    <span className="text-slate-500">[{assetFailureKindLabelRu(f.kind)}]</span>{' '}
                    <span className="text-slate-300">{shortenUrl(f.url)}</span>
                    {f.count > 1 && <span className="text-slate-500"> ×{f.count}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mb-2 text-slate-500">
            Если список пуст, а текстуры или модели отсутствуют — пришлите скриншот консоли
            браузера (F12 → Console) вместе с этой панелью.
          </p>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearRuntimeDiagnostics}
              className="flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="size-3" aria-hidden />
              Очистить счётчик
            </button>
            <span className="text-slate-600">v4.14.1</span>
          </div>
        </section>
      )}
    </>
  );
}
