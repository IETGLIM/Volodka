import { useSyncExternalStore, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getGameSnapshot,
  subscribeGameSnapshot,
} from '@/shared/gameBridge/gameActionBridge';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import { ACHIEVEMENTS } from '@/data/achievements';
import { TOTAL_UNIFIED_POEMS } from '@/data/poemCollectionMeta';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  Clock,
  Map,
  BookOpen,
  ScrollText,
  Swords,
  Users,
  Package,
  Trophy,
} from 'lucide-react';

const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
const MAX_LEVEL = 50;

const ACT_NAMES: Record<number, string> = {
  1: 'Пробуждение',
  2: 'Погружение',
  3: 'Разлом',
  4: 'Отражение',
  5: 'Метафорга',
  6: 'Взлом',
  7: 'Финал',
};

function karmaTier(karma: number): { label: string; color: string } {
  if (karma >= 60) return { label: 'Светлая', color: 'text-emerald-400' };
  if (karma >= 20) return { label: 'Положительная', color: 'text-cyan-400' };
  if (karma >= -20) return { label: 'Нейтральная', color: 'text-slate-400' };
  if (karma >= -60) return { label: 'Тёмная', color: 'text-rose-400' };
  return { label: 'Порочная', color: 'text-red-500' };
}

function timeOfDayLabel(t: number): string {
  if (t < 6) return 'Ночь';
  if (t < 10) return 'Утро';
  if (t < 14) return 'День';
  if (t < 18) return 'Вечер';
  if (t < 22) return 'Сумерки';
  return 'Ночь';
}

function subscribeSnap(listener: () => void): () => void {
  return subscribeGameSnapshot(() => listener());
}

function getSnapshot(): GameStoreSnapshot {
  return getGameSnapshot();
}

function getServerSnapshot(): GameStoreSnapshot {
  return getGameSnapshot();
}

interface StatisticsTabProps {
  searchQuery: string;
}

export function StatisticsTab({ searchQuery: _searchQuery }: StatisticsTabProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const snap = useSyncExternalStore(subscribeSnap, getSnapshot, getServerSnapshot);

  const xpForLevel = useCallback((level: number) => Math.floor(100 * Math.pow(1.25, level - 1)), []);

  const stats = useMemo(() => {
    const prog = snap.playerState.progression;
    const xpNeeded = xpForLevel(prog.level + 1);
    const xpPrev = xpForLevel(prog.level);
    const levelPct = Math.min(100, ((prog.level >= MAX_LEVEL ? 1 : 0.5) * 100));

    const visitedCount = snap.playerState.visitedNodes.length;
    const sceneId = snap.exploration.currentSceneId;
    const tod = snap.exploration.timeOfDay;

    const poemsCollected = snap.collectedPoems.length;
    const poemPct = TOTAL_UNIFIED_POEMS > 0 ? (poemsCollected / TOTAL_UNIFIED_POEMS) * 100 : 0;

    const poemPowersUsed = snap.trophyTracking?.poemPowersUsedCount ?? 0;

    const questsCompleted = snap.quests.filter((q) => q.status === 'completed').length;
    const questsActive = snap.quests.filter((q) => q.status === 'active').length;

    const combatsWon = snap.achievementProgress.combatVictories;
    const highStress = snap.trophyTracking?.highStressWin ?? false;

    const friendlyNpcs = snap.npcRelations.filter((r) => r.value > 0).length;
    const karmaVal = snap.playerState.karma;
    const kt = karmaTier(karmaVal);

    const inventoryCount = snap.playerState.inventory.length;
    const equippedCount = snap.equippedItems
      ? Object.values(snap.equippedItems).filter((v) => v !== null && v !== undefined).length
      : 0;

    const achUnlocked = snap.unlockedAchievements.length;
    const achPct = TOTAL_ACHIEVEMENTS > 0 ? (achUnlocked / TOTAL_ACHIEVEMENTS) * 100 : 0;
    const craftCount = snap.trophyTracking?.craftCount ?? 0;

    return {
      level: prog.level,
      act: prog.currentAct,
      actName: ACT_NAMES[prog.currentAct] ?? `Акт ${prog.currentAct}`,
      levelPct,
      xpNeeded,
      xpPrev,
      visitedCount,
      sceneId,
      tod,
      poemsCollected,
      poemPct,
      poemPowersUsed,
      questsCompleted,
      questsActive,
      combatsWon,
      highStress,
      friendlyNpcs,
      karmaVal,
      karmaTier: kt,
      inventoryCount,
      equippedCount,
      achUnlocked,
      achPct,
      craftCount,
    };
  }, [snap, xpForLevel]);

  const barTransition = reducedMotion ? 'none' : 'width 0.6s ease-out';

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Общее */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Общее</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Текущий акт</span>
              <span className="font-mono text-sm text-slate-200">{stats.actName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Уровень</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.level}</span>
            </div>
            <div className="mt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">Прогресс уровня</span>
                <span className="text-[10px] text-slate-500 font-mono">{stats.level}/{MAX_LEVEL}</span>
              </div>
              <div className="data-bar h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="data-bar-fill h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                  style={{ width: `${(stats.level / MAX_LEVEL) * 100}%`, transition: barTransition }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Время игры</span>
              <span className="text-xs text-slate-300">Активная сессия</span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Исследование */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <Map className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Исследование</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Сцены посещены</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.visitedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Текущая сцена</span>
              <span className="font-mono text-xs text-slate-300 truncate max-w-[160px]" title={stats.sceneId}>
                {stats.sceneId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Время суток</span>
              <span className="font-mono text-xs text-slate-300">{timeOfDayLabel(stats.tod)} ({Math.floor(stats.tod)}:00)</span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Стихотворения */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Стихотворения</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Собрано стихов</span>
              <span className="data-badge font-mono text-sm text-cyan-300">
                {stats.poemsCollected}/{TOTAL_UNIFIED_POEMS}
              </span>
            </div>
            <div className="data-bar h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="data-bar-fill h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                style={{ width: `${stats.poemPct}%`, transition: barTransition }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Стих. сил использовано</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.poemPowersUsed}</span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Задания */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Задания</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Выполнено</span>
              <span className="data-badge font-mono text-sm text-emerald-400">{stats.questsCompleted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Активных</span>
              <span className="data-badge font-mono text-sm text-amber-400">{stats.questsActive}</span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Бой */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <Swords className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Бой</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Побед в бою</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.combatsWon}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Победа при высоком стрессе</span>
              <span className={`font-mono text-sm ${stats.highStress ? 'text-rose-400' : 'text-slate-600'}`}>
                {stats.highStress ? 'Да' : 'Нет'}
              </span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Социальное */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Социальное</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Дружественных NPC</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.friendlyNpcs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Карма</span>
              <span className="font-mono text-sm text-slate-200">
                {stats.karmaVal > 0 ? '+' : ''}{stats.karmaVal}
                <span className={`ml-2 text-xs ${stats.karmaTier.color}`}>({stats.karmaTier.label})</span>
              </span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Инвентарь */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Инвентарь</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Предметов</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.inventoryCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Слоты экипировки</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.equippedCount}</span>
            </div>
          </div>
        </section>

        <div className="glow-line-bottom" aria-hidden />

        {/* Достижения */}
        <section className="rounded-xl glass-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold neon-text-cyan">Достижения</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Разблокировано</span>
              <span className="data-badge font-mono text-sm text-cyan-300">
                {stats.achUnlocked}/{TOTAL_ACHIEVEMENTS}
              </span>
            </div>
            <div className="data-bar h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="data-bar-fill h-full bg-gradient-to-r from-yellow-600 to-amber-400 rounded-full"
                style={{ width: `${stats.achPct}%`, transition: barTransition }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs text-slate-400">Крафтов выполнено</span>
              <span className="data-badge font-mono text-sm text-cyan-300">{stats.craftCount}</span>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
