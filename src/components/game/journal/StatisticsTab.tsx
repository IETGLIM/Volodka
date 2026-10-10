import { useSyncExternalStore } from 'react';
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

/**
 * Z3 (v4.40, этап 29): узкая проекция статистики вместо полного снапшота.
 *
 * Раньше useSyncExternalStore получал полный GameStoreSnapshot: вкладка
 * статистики перерисовывалась на ЛЮБОЕ изменение снапшота (позиция игрока,
 * уведомления, прогресс квестов — всё заменяет ссылку снапшота). Теперь
 * getSnapshot возвращает мемоизированную проекцию только тех полей, что
 * реально читает вкладка: сравнение идёт по примитивам/коллекциям этих
 * полей — движение игрока (exploration-объект заменяется, а сцена/TOD —
 * нет) и прочий шум больше не ре-рендерят вкладку.
 */
interface StatisticsSnapshot {
  level: number;
  act: number;
  visitedCount: number;
  sceneId: string;
  tod: number;
  poemsCollected: number;
  poemPowersUsed: number;
  questsCompleted: number;
  questsActive: number;
  combatsWon: number;
  highStress: boolean;
  friendlyNpcs: number;
  karmaVal: number;
  inventoryCount: number;
  equippedCount: number;
  achUnlocked: number;
  craftCount: number;
}

let cachedStatsSnapshot: StatisticsSnapshot | null = null;
let cachedStatsInputs: unknown[] | null = null;

function buildStatsInputs(snap: GameStoreSnapshot): unknown[] {
  return [
    snap.playerState.progression,
    snap.playerState.visitedNodes.length,
    snap.playerState.karma,
    snap.playerState.inventory.length,
    snap.exploration.currentSceneId,
    snap.exploration.timeOfDay,
    snap.collectedPoems.length,
    snap.trophyTracking?.poemPowersUsedCount ?? 0,
    snap.trophyTracking?.highStressWin ?? false,
    snap.trophyTracking?.craftCount ?? 0,
    snap.quests,
    snap.achievementProgress?.combatVictories ?? 0,
    snap.npcRelations,
    snap.equippedItems,
    snap.unlockedAchievements.length,
  ];
}

function getStatisticsSnapshot(): StatisticsSnapshot {
  const snap = getGameSnapshot();
  const inputs = buildStatsInputs(snap);
  if (cachedStatsSnapshot && cachedStatsInputs) {
    let equal = cachedStatsInputs.length === inputs.length;
    if (equal) {
      for (let i = 0; i < inputs.length; i++) {
        if (!Object.is(cachedStatsInputs[i], inputs[i])) {
          equal = false;
          break;
        }
      }
    }
    if (equal) return cachedStatsSnapshot;
  }
  const prog = snap.playerState.progression;
  cachedStatsSnapshot = {
    level: prog.level,
    act: prog.currentAct,
    visitedCount: snap.playerState.visitedNodes.length,
    sceneId: snap.exploration.currentSceneId,
    tod: snap.exploration.timeOfDay,
    poemsCollected: snap.collectedPoems.length,
    poemPowersUsed: snap.trophyTracking?.poemPowersUsedCount ?? 0,
    questsCompleted: snap.quests.filter((q) => q.status === 'completed').length,
    questsActive: snap.quests.filter((q) => q.status === 'active').length,
    combatsWon: snap.achievementProgress?.combatVictories ?? 0,
    highStress: snap.trophyTracking?.highStressWin ?? false,
    friendlyNpcs: snap.npcRelations.filter((r) => r.value > 0).length,
    karmaVal: snap.playerState.karma,
    inventoryCount: snap.playerState.inventory.length,
    equippedCount: snap.equippedItems
      ? Object.values(snap.equippedItems).filter((v) => v !== null && v !== undefined).length
      : 0,
    achUnlocked: snap.unlockedAchievements.length,
    craftCount: snap.trophyTracking?.craftCount ?? 0,
  };
  cachedStatsInputs = inputs;
  return cachedStatsSnapshot;
}

function getServerSnapshot(): StatisticsSnapshot {
  return getStatisticsSnapshot();
}

interface StatisticsTabProps {
  searchQuery: string;
}

export function StatisticsTab({ searchQuery: _searchQuery }: StatisticsTabProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const stats = useSyncExternalStore(subscribeSnap, getStatisticsSnapshot, getServerSnapshot);

  const actName = ACT_NAMES[stats.act] ?? `Акт ${stats.act}`;
  const kt = karmaTier(stats.karmaVal);
  const poemPct = TOTAL_UNIFIED_POEMS > 0 ? (stats.poemsCollected / TOTAL_UNIFIED_POEMS) * 100 : 0;
  const achPct = TOTAL_ACHIEVEMENTS > 0 ? (stats.achUnlocked / TOTAL_ACHIEVEMENTS) * 100 : 0;

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
              <span className="font-mono text-sm text-slate-200">{actName}</span>
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
                style={{ width: `${poemPct}%`, transition: barTransition }}
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
                <span className={`ml-2 text-xs ${kt.color}`}>({kt.label})</span>
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
                style={{ width: `${achPct}%`, transition: barTransition }}
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
