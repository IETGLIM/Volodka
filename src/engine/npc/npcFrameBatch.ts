/* ─── Volodka RPG – single useFrameTick coordinator for all NPC updates ─── */

import { useLayoutEffect, useRef } from 'react';
import type { FrameTickCallback, FrameTickContext } from '@/engine/frame/types';

export type NpcFrameCallbackKind = 'main' | 'mixer' | 'procedural' | 'overlay' | 'sprite';

interface NpcFrameEntry {
  /** Unique token — survives remount races. Cleanup removes by token, not by
   *  ownerKey:kind, so a stale cleanup from a previous mount cannot remove a
   *  freshly-registered entry with the same logical key. */
  token: number;
  key: string;
  kind: NpcFrameCallbackKind;
  callback: FrameTickCallback;
  enabled?: () => boolean;
}

let nextToken = 1;
const entries: NpcFrameEntry[] = [];
let sortedEntries: NpcFrameEntry[] = [];
let dirty = true;
let rebuildCount = 0;

function rebuildSortedEntries(): void {
  const kindOrder: Record<NpcFrameCallbackKind, number> = {
    main: 0,
    mixer: 1,
    procedural: 2,
    overlay: 3,
    sprite: 4,
  };
  sortedEntries = [...entries].sort((a, b) => {
    const kindDiff = kindOrder[a.kind] - kindOrder[b.kind];
    if (kindDiff !== 0) return kindDiff;
    return a.key.localeCompare(b.key);
  });
  dirty = false;
  rebuildCount += 1;
}

export function registerNpcFrameCallback(
  ownerKey: string,
  kind: NpcFrameCallbackKind,
  callback: FrameTickCallback,
  options?: { enabled?: () => boolean },
): () => void {
  const token = nextToken++;
  const key = `${ownerKey}:${kind}`;
  entries.push({ token, key, kind, callback, enabled: options?.enabled });
  dirty = true;
  return () => {
    const index = entries.findIndex((entry) => entry.token === token);
    if (index >= 0) {
      entries.splice(index, 1);
      dirty = true;
    }
  };
}

export function runNpcFrameBatch(ctx: FrameTickContext): void {
  if (dirty) {
    rebuildSortedEntries();
  }
  for (const entry of sortedEntries) {
    if (entry.enabled && !entry.enabled()) continue;
    entry.callback(ctx);
  }
}

export function getNpcFrameBatchEntryCount(): number {
  return entries.length;
}

/** Число пересортировок с момента последнего сброса (аудит этап 110 —
 *  регрессионный детектор churn: ре-рендеры компонентов не должны
 *  инвалидировать сортировку). */
export function getNpcFrameBatchRebuildCount(): number {
  return rebuildCount;
}

export function resetNpcFrameBatchForTests(): void {
  entries.length = 0;
  sortedEntries = [];
  dirty = true;
  rebuildCount = 0;
}

/** Register an NPC frame callback for the central batch runner (no per-NPC useFrameTick). */
export function useRegisterNpcFrame(
  ownerKey: string,
  kind: NpcFrameCallbackKind,
  callback: FrameTickCallback,
  options?: { enabled?: boolean | (() => boolean) },
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const enabledOption = options?.enabled;
  const enabledRef = useRef(enabledOption);
  enabledRef.current = enabledOption;

  // Аудит этап 110: enabledOption НЕ является зависимостью эффекта намеренно.
  // Инлайн-стрелки вида `enabled: () => cond` получают новую идентичность на
  // каждом рендере; с dep-массивом каждое перерисовывание компонента сносило
  // регистрацию и регистрировало заново, ставя dirty → rebuildSortedEntries
  // пересортировал весь список чуть ли не каждый кадр при 50 NPC. Обёртка ниже читает
  // enabledRef в момент вызова, поэтому по-кадровая семантика enabled
  // (undefined → всегда активен, boolean → значение, функция → вызов)
  // сохраняется без перерегистраций.
  useLayoutEffect(() => {
    return registerNpcFrameCallback(
      ownerKey,
      kind,
      (ctx) => callbackRef.current(ctx),
      {
        enabled: () => {
          const enabled = enabledRef.current;
          if (enabled === undefined) return true;
          return typeof enabled === 'function' ? enabled() : enabled !== false;
        },
      },
    );
  }, [ownerKey, kind]);
}
