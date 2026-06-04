
/* ─── Volodka RPG – Quest Board Panel ───
 * Daily & weekly mission board with rotating missions.
 * Uses PanelWrapper with emerald accent and ScrollText icon.
 * Cyberpunk visual style with scanlines, glow effects, and Framer Motion.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText,
  Diamond,
  Clock,
  Zap,
  Coins,
  Heart,
  Check,
  X,
  Gift,
  Shield,
  Swords,
  ShieldCheck,
  Bug,
  Footprints,
  Eye,
  Moon,
  Map,
  Handshake,
  Heart as HeartIcon,
  MessageCircle,
  Users,
  BookOpen,
  Sparkles,
  Feather,
  Music,
  Hammer,
  FlaskConical,
  Wrench,
  Lightbulb,
  Star,
  AlertCircle,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import {
  DAILY_MISSION_POOL,
  DAILY_MISSION_CATEGORY_META,
  getDailyMissionPool,
  getWeeklyMissionPool,
  getDaySeed,
  getWeekSeed,
  type DailyMission,
  type DailyMissionCategory,
  type DailyMissionResetSchedule,
} from '@/data/dailyMissions';
import { PanelWrapper } from '@/components/game/PanelWrapper';

/* ─── Icon map for mission icons ─── */
const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="size-4" />,
  Swords: <Swords className="size-4" />,
  ShieldCheck: <ShieldCheck className="size-4" />,
  Bug: <Bug className="size-4" />,
  Footprints: <Footprints className="size-4" />,
  Eye: <Eye className="size-4" />,
  Moon: <Moon className="size-4" />,
  Map: <Map className="size-4" />,
  Handshake: <Handshake className="size-4" />,
  Heart: <HeartIcon className="size-4" />,
  MessageCircle: <MessageCircle className="size-4" />,
  Users: <Users className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  Sparkles: <Sparkles className="size-4" />,
  Feather: <Feather className="size-4" />,
  Music: <Music className="size-4" />,
  Hammer: <Hammer className="size-4" />,
  FlaskConical: <FlaskConical className="size-4" />,
  Wrench: <Wrench className="size-4" />,
  Lightbulb: <Lightbulb className="size-4" />,
};

function getMissionIcon(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] ?? <Star className="size-4" />;
}

/* ─── Difficulty diamonds ─── */
function DifficultyIndicator({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  const count = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 3 }, (_, i) => (
        <Diamond
          key={i}
          className={`size-2.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-700'}`}
        />
      ))}
    </div>
  );
}

/* ─── Reset timer ─── */
function ResetTimer({ resetSchedule }: { resetSchedule: DailyMissionResetSchedule }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let target: Date;

      if (resetSchedule === 'daily') {
        target = new Date(now);
        target.setHours(24, 0, 0, 0);
      } else {
        // Next Monday midnight
        target = new Date(now);
        const day = target.getDay();
        const daysUntilMonday = day === 0 ? 1 : 8 - day;
        target.setDate(target.getDate() + daysUntilMonday);
        target.setHours(0, 0, 0, 0);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Скоро сброс');
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}д ${hours % 24}ч`);
      } else {
        setTimeLeft(`${hours}ч ${minutes}м`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [resetSchedule]);

  return (
    <div className="flex items-center gap-1">
      <Clock className="size-3 text-amber-400/70" />
      <span className="text-[10px] font-mono text-amber-400/70">{timeLeft}</span>
    </div>
  );
}

/* ─── Category badge ─── */
function CategoryBadge({ category }: { category: DailyMissionCategory }) {
  const meta = DAILY_MISSION_CATEGORY_META[category];
  return (
    <span
      className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
      style={{
        color: meta.color,
        background: `${meta.color}12`,
        border: `1px solid ${meta.color}25`,
      }}
    >
      {meta.label}
    </span>
  );
}

/* ─── Progress bar ─── */
function MissionProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, Math.max(0, (current / target) * 100));
  return (
    <div className="relative h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

/* ─── Mission Card ─── */
function MissionCard({
  mission,
  acceptedMission,
  onAccept,
  onAbandon,
  onClaim,
}: {
  mission: DailyMission;
  acceptedMission?: {
    progress: Record<string, number>;
    completed: boolean;
    claimed: boolean;
  };
  onAccept: () => void;
  onAbandon: () => void;
  onClaim: () => void;
}) {
  const meta = DAILY_MISSION_CATEGORY_META[mission.category];
  const isAccepted = !!acceptedMission;
  const isCompleted = acceptedMission?.completed ?? false;
  const isClaimed = acceptedMission?.claimed ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-lg border overflow-hidden transition-all"
      style={{
        borderLeftColor: meta.color,
        borderLeftWidth: '3px',
        borderColor: isClaimed
          ? 'rgba(100,116,139,0.1)'
          : isCompleted
            ? 'rgba(16,185,129,0.3)'
            : isAccepted
              ? `${meta.color}30`
              : 'rgba(100,116,139,0.15)',
        background: isClaimed
          ? 'rgba(15,23,42,0.2)'
          : isCompleted
            ? 'rgba(16,185,129,0.06)'
            : isAccepted
              ? `${meta.color}08`
              : 'rgba(15,23,42,0.4)',
        opacity: isClaimed ? 0.5 : 1,
      }}
    >
      <div className="p-3 sm:p-4">
        {/* Top row: icon + title + category + difficulty */}
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              borderColor: `${meta.color}25`,
              background: isAccepted ? `${meta.color}12` : 'rgba(0,0,0,0.3)',
              color: isAccepted ? meta.color : 'rgba(100,116,139,0.5)',
            }}
          >
            {isClaimed ? (
              <Check className="size-4 text-emerald-400/50" />
            ) : isCompleted ? (
              <Gift className="size-4 text-emerald-400" />
            ) : (
              getMissionIcon(mission.icon)
            )}
          </div>

          {/* Title + description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span
                className="text-xs font-semibold font-mono truncate"
                style={{
                  color: isClaimed ? '#64748b' : isCompleted ? '#34d399' : '#e2e8f0',
                  textShadow: isCompleted ? '0 0 6px rgba(52,211,153,0.3)' : 'none',
                }}
              >
                {mission.title}
              </span>
              <CategoryBadge category={mission.category} />
              <DifficultyIndicator difficulty={mission.difficulty} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Objectives with progress */}
        <div className="mt-2.5 space-y-1.5">
          {mission.objectives.map((obj) => {
            const current = acceptedMission?.progress[obj.id] ?? 0;
            const target = obj.target;
            const done = current >= target;
            return (
              <div key={obj.id}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] font-mono ${done ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {done && <Check className="size-2.5 inline mr-0.5" />}
                    {obj.description}
                  </span>
                  <span className={`text-[10px] font-mono tabular-nums ${done ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {current}/{target}
                  </span>
                </div>
                <MissionProgressBar current={current} target={target} />
              </div>
            );
          })}
        </div>

        {/* Rewards + actions row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Rewards */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5" title="Опыт">
              <Zap className="size-3 text-cyan-400/60" />
              <span className="text-[10px] font-mono text-cyan-300/80">{mission.rewards.xp}</span>
            </div>
            <div className="flex items-center gap-0.5" title="Кредиты">
              <Coins className="size-3 text-amber-400/60" />
              <span className="text-[10px] font-mono text-amber-300/80">{mission.rewards.credits}</span>
            </div>
            {mission.rewards.karma && (
              <div className="flex items-center gap-0.5" title="Карма">
                <Heart className="size-3 text-rose-400/60" />
                <span className="text-[10px] font-mono text-rose-300/80">+{mission.rewards.karma}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ResetTimer resetSchedule={mission.resetSchedule} />

            {isClaimed ? (
              <span className="text-[9px] font-mono text-slate-600 px-2 py-1 rounded border border-slate-800/30 bg-slate-900/30">
                Получено
              </span>
            ) : isCompleted ? (
              <button
                onClick={onClaim}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                  border: '1px solid rgba(16,185,129,0.4)',
                  color: '#34d399',
                  boxShadow: '0 0 12px rgba(16,185,129,0.15)',
                }}
              >
                <Gift className="size-3" />
                Забрать
              </button>
            ) : isAccepted ? (
              <button
                onClick={onAbandon}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(251,113,133,0.08)',
                  border: '1px solid rgba(251,113,133,0.25)',
                  color: '#fb7185',
                }}
              >
                <X className="size-3" />
                Отказаться
              </button>
            ) : (
              <button
                onClick={onAccept}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34d399',
                  boxShadow: '0 0 8px rgba(16,185,129,0.1)',
                }}
              >
                Принять
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export function QuestBoardPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const acceptedDailyMissions = useGameStore((s) => s.acceptedDailyMissions);
  const acceptDailyMission = useGameStore((s) => s.acceptDailyMission);
  const abandonDailyMission = useGameStore((s) => s.abandonDailyMission);
  const claimDailyMissionReward = useGameStore((s) => s.claimDailyMissionReward);
  const playerLevel = useGameStore((s) => s.playerState.progression?.level ?? 1);

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Get today's missions
  const daySeed = useMemo(() => getDaySeed(), []);
  const weekSeed = useMemo(() => getWeekSeed(), []);

  const dailyMissions = useMemo(
    () => getDailyMissionPool(daySeed, playerLevel),
    [daySeed, playerLevel],
  );

  const weeklyMissions = useMemo(
    () => getWeeklyMissionPool(weekSeed, playerLevel),
    [weekSeed, playerLevel],
  );

  const currentMissions = activeTab === 'daily' ? dailyMissions : weeklyMissions;

  // Separate active (accepted) missions and available missions
  const activeMissions = useMemo(() => {
    return currentMissions
      .map((m) => {
        const accepted = acceptedDailyMissions.find((a) => a.missionId === m.id);
        if (!accepted) return null;
        return { mission: m, accepted };
      })
      .filter(Boolean) as Array<{ mission: DailyMission; accepted: typeof acceptedDailyMissions[0] }>;
  }, [currentMissions, acceptedDailyMissions]);

  const availableMissions = useMemo(() => {
    const acceptedIds = new Set(acceptedDailyMissions.map((a) => a.missionId));
    return currentMissions.filter((m) => !acceptedIds.has(m.id));
  }, [currentMissions, acceptedDailyMissions]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAccept = useCallback((missionId: string) => {
    acceptDailyMission(missionId);
  }, [acceptDailyMission]);

  const handleAbandon = useCallback((missionId: string) => {
    abandonDailyMission(missionId);
  }, [abandonDailyMission]);

  const handleClaim = useCallback((missionId: string) => {
    claimDailyMissionReward(missionId);
  }, [claimDailyMissionReward]);

  const activeCount = acceptedDailyMissions.filter((m) => !m.completed && !m.claimed).length;
  const completedCount = acceptedDailyMissions.filter((m) => m.claimed).length;

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title="ДОСКА ЗАДАНИЙ"
      urlPath="volodka://quest-board"
      accentColor="emerald"
      layout="centered"
      maxWidth="max-w-3xl"
      icon={<ScrollText className="size-4 text-emerald-400/60" />}
      shortcutLabel="B"
      headerExtra={
        <div className="flex items-center gap-2">
          {/* Mission count badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border"
            style={{
              borderColor: 'rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.08)',
            }}
          >
            <ScrollText className="size-3.5 text-emerald-400" />
            <span className="text-xs font-bold font-mono text-emerald-300" style={{ textShadow: '0 0 6px rgba(16,185,129,0.4)' }}>
              {activeCount}
            </span>
            <span className="text-[10px] text-emerald-400/70 font-mono">активных</span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">volodka://quest-board</span>
          <span className="text-[9px] text-slate-500 font-mono">
            Активных: {activeCount} • Выполнено: {completedCount} • Максимум: 3
          </span>
        </div>
      }
    >
      <div className="scanline-overlay" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/40">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'daily'
                ? 'text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={activeTab === 'daily' ? {
              background: 'rgba(16,185,129,0.12)',
              boxShadow: '0 0 8px rgba(16,185,129,0.12), inset 0 0 4px rgba(16,185,129,0.06)',
            } : {}}
          >
            <Clock className="size-3.5" style={{ color: activeTab === 'daily' ? '#34d399' : undefined }} />
            <span style={{ color: activeTab === 'daily' ? '#34d399' : undefined }}>Ежедневные</span>
            <span className="text-[8px] opacity-50">{dailyMissions.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'weekly'
                ? 'text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={activeTab === 'weekly' ? {
              background: 'rgba(16,185,129,0.12)',
              boxShadow: '0 0 8px rgba(16,185,129,0.12), inset 0 0 4px rgba(16,185,129,0.06)',
            } : {}}
          >
            <Star className="size-3.5" style={{ color: activeTab === 'weekly' ? '#34d399' : undefined }} />
            <span style={{ color: activeTab === 'weekly' ? '#34d399' : undefined }}>Еженедельные</span>
            <span className="text-[8px] opacity-50">{weeklyMissions.length}</span>
          </button>
        </div>

        {/* ── Mission list ── */}
        <div className="relative p-4 sm:p-6 overflow-y-auto max-h-96 custom-scrollbar">
          {/* Decorative background grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="quest-board-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#quest-board-grid)" />
          </svg>

          {/* Decorative glow spots */}
          <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 space-y-4">
            {/* Active missions section */}
            {activeMissions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Активные задания</span>
                  <div className="flex-1 h-px bg-emerald-400/15" />
                </div>
                <div className="space-y-2">
                  {activeMissions.map(({ mission, accepted }) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      acceptedMission={accepted}
                      onAccept={() => handleAccept(mission.id)}
                      onAbandon={() => handleAbandon(mission.id)}
                      onClaim={() => handleClaim(mission.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available missions section */}
            {availableMissions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Доступные задания</span>
                  <div className="flex-1 h-px bg-slate-700/30" />
                </div>
                <div className="space-y-2">
                  {availableMissions.map((mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      onAccept={() => handleAccept(mission.id)}
                      onAbandon={() => handleAbandon(mission.id)}
                      onClaim={() => handleClaim(mission.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {currentMissions.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="size-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-mono">Нет доступных заданий</p>
                <p className="text-[10px] text-slate-600 mt-1">Наберите уровень, чтобы открыть больше миссий</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
