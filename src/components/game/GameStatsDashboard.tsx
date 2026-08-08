'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock, Footprints, Users, MapPin, ScrollText,
  Swords, Wrench, Award, TrendingUp,
  Trophy, ChevronRight, BarChart3, Zap, Heart,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';

/* ─── Types ─── */

interface SessionStats {
  sessionStart: number;
  sessionPlayTimeMs: number;
  questsCompletedThisSession: number;
  combatsWonThisSession: number;
  stepsThisSession: number;
}

interface PersonalRecords {
  longestSessionMs: number;
  mostQuestsInSession: number;
  mostCombatsInSession: number;
  mostStepsInSession: number;
}

interface PersistedStats {
  totalPlayTimeMs: number;
  totalSteps: number;
  totalQuestsCompleted: number;
  totalCombatsWon: number;
  totalPoemsCollected: number;
  totalNpcsMet: number;
  totalLocationsDiscovered: number;
  totalItemsCrafted: number;
  currentKarma: number;
  lastSessionStats: SessionStats | null;
  personalRecords: PersonalRecords;
  sessionCount: number;
}

const LS_KEY = 'volodka_game_stats_dashboard';

const DEFAULT_RECORDS: PersonalRecords = {
  longestSessionMs: 0,
  mostQuestsInSession: 0,
  mostCombatsInSession: 0,
  mostStepsInSession: 0,
};

const DEFAULT_STATS: PersistedStats = {
  totalPlayTimeMs: 0,
  totalSteps: 0,
  totalQuestsCompleted: 0,
  totalCombatsWon: 0,
  totalPoemsCollected: 0,
  totalNpcsMet: 0,
  totalLocationsDiscovered: 0,
  totalItemsCrafted: 0,
  currentKarma: 0,
  lastSessionStats: null,
  personalRecords: DEFAULT_RECORDS,
  sessionCount: 0,
};

/* ─── Helpers ─── */

function loadPersisted(): PersistedStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATS, ...parsed, personalRecords: { ...DEFAULT_RECORDS, ...parsed.personalRecords } };
    }
  } catch { /* ignore */ }
  return DEFAULT_STATS;
}

function persistStats(stats: PersistedStats): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(stats));
  } catch { /* ignore */ }
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

function formatDurationLong(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ─── Stat card ─── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  delta?: number;
}

function StatCard({ icon, label, value, color = '#00e5ff', delta }: StatCardProps) {
  return (
    <div className="stat-dashboard-card" style={{ '--stat-color': color } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="stat-dashboard-icon" style={{ color }}>{icon}</span>
        <span className="stat-dashboard-label">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="stat-dashboard-value">{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span
            className="text-[10px] font-mono"
            style={{ color: delta > 0 ? '#34d399' : '#f87171' }}
          >
            {delta > 0 ? `+${delta}` : String(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Personal record row ─── */

function RecordRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg stat-dashboard-record">
      <div className="flex items-center gap-2">
        <Trophy className="w-3 h-3 text-amber-400/70" />
        <span className="text-xs text-slate-400 font-mono">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-amber-300">{value}</span>
        {icon}
      </div>
    </div>
  );
}

/* ─── Main component ─── */

interface GameStatsDashboardProps {
  open: boolean;
  onClose: () => void;
}

export function GameStatsDashboard({ open, onClose }: GameStatsDashboardProps) {
  const [persisted] = useState<PersistedStats>(loadPersisted);
  const [sessionStart] = useState(() => Date.now());
  const [, setTick] = useState(0);

  // Read live game state
  const playerKarma = useGameStore((s) => s.playerState.karma);
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const quests = useGameStore((s) => s.quests);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const visitedNodes = useGameStore((s) => s.playerState.visitedNodes);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);

  // Session tracking
  const sessionPlayTimeMs = Date.now() - sessionStart;
  const sessionQuestsCompleted = useMemo(
    () => quests.filter((q) => q.status === 'completed').length,
    [quests],
  );

  // Tick every 5s to update play time display
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, [open]);

  // Save on unmount / close
  const saveBeforeClose = useCallback(() => {
    const questsCompleted = quests.filter((q) => q.status === 'completed').length;
    const updated: PersistedStats = {
      ...persisted,
      totalPlayTimeMs: persisted.totalPlayTimeMs + sessionPlayTimeMs,
      totalQuestsCompleted: Math.max(persisted.totalQuestsCompleted, questsCompleted),
      totalCombatsWon: persisted.totalCombatsWon,
      totalPoemsCollected: collectedPoems.length,
      totalNpcsMet: Math.max(persisted.totalNpcsMet, npcRelations.length),
      totalLocationsDiscovered: Math.max(persisted.totalLocationsDiscovered, visitedNodes.length),
      currentKarma: playerKarma,
      lastSessionStats: {
        sessionStart,
        sessionPlayTimeMs,
        questsCompletedThisSession: sessionQuestsCompleted,
        combatsWonThisSession: 0,
        stepsThisSession: persisted.totalSteps,
      },
      sessionCount: persisted.sessionCount + 1,
      personalRecords: {
        longestSessionMs: Math.max(persisted.personalRecords.longestSessionMs, sessionPlayTimeMs),
        mostQuestsInSession: Math.max(persisted.personalRecords.mostQuestsInSession, sessionQuestsCompleted),
        mostCombatsInSession: persisted.personalRecords.mostCombatsInSession,
        mostStepsInSession: persisted.personalRecords.mostStepsInSession,
      },
    };
    persistStats(updated);
  }, [persisted, sessionPlayTimeMs, quests, collectedPoems.length, npcRelations.length, visitedNodes.length, playerKarma, sessionStart, sessionQuestsCompleted]);

  useEffect(() => {
    if (!open) return;
    return () => { saveBeforeClose(); };
  }, [open, saveBeforeClose]);

  const totalPlayTimeMs = persisted.totalPlayTimeMs + sessionPlayTimeMs;
  const totalQuestsCompleted = Math.max(
    persisted.totalQuestsCompleted,
    quests.filter((q) => q.status === 'completed').length,
  );
  const totalPoemsCollected = collectedPoems.length;
  const totalNpcsMet = npcRelations.length;
  const totalLocations = visitedNodes.length;
  const totalAchievements = unlockedAchievements.length;

  // Session comparison
  const lastSession = persisted.lastSessionStats;
  const questDelta = lastSession ? sessionQuestsCompleted - (lastSession.questsCompletedThisSession ?? 0) : undefined;

  if (!open) return null;

  return (
    <>
      <AriaLiveRegion
        message={`Статистика игры: ${totalQuestsCompleted} заданий, ${totalPoemsCollected} стихов`}
      />
      <div className="stat-dashboard-overlay" onClick={onClose}>
        <div
          className="stat-dashboard-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Статистика игры"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-cyan-200 tracking-wider uppercase">
                Статистика
              </h2>
            </div>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-300 font-mono flex items-center gap-1 transition-colors"
              onClick={onClose}
            >
              Закрыть <ChevronRight className="w-3 h-3 rotate-90" />
            </button>
          </div>

          {/* Current session */}
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/60 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Текущая сессия
            </div>
            <div className="text-2xl font-mono font-bold text-cyan-100 mb-0.5">
              {formatDurationLong(sessionPlayTimeMs)}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Заданий выполнено: {sessionQuestsCompleted}
            </div>
          </div>

          {/* Stat cards grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Общее время"
              value={formatDuration(totalPlayTimeMs)}
            />
            <StatCard
              icon={<ScrollText className="w-3.5 h-3.5" />}
              label="Задания"
              value={totalQuestsCompleted}
              color="#34d399"
              delta={questDelta}
            />
            <StatCard
              icon={<Swords className="w-3.5 h-3.5" />}
              label="Бои"
              value={persisted.totalCombatsWon}
              color="#f87171"
            />
            <StatCard
              icon={<Users className="w-3.5 h-3.5" />}
              label="NPC"
              value={totalNpcsMet}
              color="#60a5fa"
            />
            <StatCard
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Локации"
              value={totalLocations}
              color="#fbbf24"
            />
            <StatCard
              icon={<Award className="w-3.5 h-3.5" />}
              label="Стихи"
              value={totalPoemsCollected}
              color="#fbbf24"
            />
            <StatCard
              icon={<Wrench className="w-3.5 h-3.5" />}
              label="Крафты"
              value={persisted.totalItemsCrafted}
              color="#fb923c"
            />
            <StatCard
              icon={<Heart className="w-3.5 h-3.5" />}
              label="Карма"
              value={playerKarma}
              color={playerKarma >= 0 ? '#34d399' : '#f87171'}
            />
            <StatCard
              icon={<Footprints className="w-3.5 h-3.5" />}
              label="Шаги"
              value={persisted.totalSteps}
              color="#94a3b8"
            />
          </div>

          {/* Session comparison */}
          {lastSession && (
            <div className="mb-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/60 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Сравнение сессий
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded bg-white/[0.02]">
                  <span className="text-slate-400">Пред. сессия</span>
                  <span className="text-slate-300">{formatDuration(lastSession.sessionPlayTimeMs)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded bg-white/[0.02]">
                  <span className="text-slate-400">Пред. задания</span>
                  <span className="text-slate-300">{lastSession.questsCompletedThisSession ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Personal records */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/60 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3 h-3" /> Личные рекорды
            </div>
            <div className="space-y-1">
              <RecordRow
                label="Самая длинная сессия"
                value={formatDuration(persisted.personalRecords.longestSessionMs)}
                icon={<Clock className="w-3 h-3 text-amber-400/50" />}
              />
              <RecordRow
                label="Больше всего заданий"
                value={`${persisted.personalRecords.mostQuestsInSession}`}
                icon={<ScrollText className="w-3 h-3 text-amber-400/50" />}
              />
              <RecordRow
                label="Больше всего боёв"
                value={`${persisted.personalRecords.mostCombatsInSession}`}
                icon={<Swords className="w-3 h-3 text-amber-400/50" />}
              />
              <RecordRow
                label="Больше всего шагов"
                value={`${persisted.personalRecords.mostStepsInSession}`}
                icon={<Footprints className="w-3 h-3 text-amber-400/50" />}
              />
            </div>
          </div>

          {/* Session count footer */}
          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-600">Сессий: {persisted.sessionCount + 1}</span>
            <span className="text-[9px] font-mono text-slate-600">Всего достижений: {totalAchievements}</span>
          </div>
        </div>
      </div>
    </>
  );
}
