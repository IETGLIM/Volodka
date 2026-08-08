'use client';

/* ─── Volodka RPG – NPC Schedule Display (HUD Panel) ─── */
/* Shows which NPCs are at the player's current location, their
 * schedules, and time-based availability indicators.
 * Glass morphism cyberpunk design, Russian text. */

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useGameStore as _useGameStore } from '@/store/gameStore';
import { useCurrentSceneId, useTimeOfDay } from '@/store/selectors';
import { buildScheduleContext } from '@/shared/scheduleContext';
import { getNPCLocationForTime, getNPCSchedule } from '@/engine/ScheduleEngine';
import { findNpcById as _findNpcById, NPC_BY_ID } from '@/data/allNpcDefinitions';
import { NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';
import { SCHEDULE_ACTIVITY_LABELS } from '@/engine/npcSchedule/npcScheduleConstants';
import { SCENE_CONFIG } from '@/config/scenes';
import { getCombinedGameState } from '@/store/storeBindings';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { EXPLORATION_HUD_LAYOUT } from '@/shared/constants/hudLayout';
import type { SceneId, ScheduleEntry } from '@/shared/types/game';

type AvailabilityStatus = 'here' | 'arriving_soon' | 'leaving_soon' | 'will_arrive' | 'gone';

interface NpcScheduleItem {
  npcId: string;
  name: string;
  portraitColor: string;
  currentEntry: ScheduleEntry | null;
  currentSceneName: string;
  activity: string;
  availability: AvailabilityStatus;
  fullSchedule: ScheduleEntry[];
}

function formatHour(h: number): string {
  return `${String(Math.floor(h)).padStart(2, '0')}:00`;
}

function getAvailability(
  entry: ScheduleEntry | null,
  currentHour: number,
  currentSceneId: SceneId,
): AvailabilityStatus {
  if (!entry) return 'gone';
  const isHere = entry.sceneId === currentSceneId;
  const timeUntilEnd = entry.endHour - currentHour;
  const timeUntilStart = entry.startHour - currentHour;

  if (isHere) {
    if (timeUntilEnd <= 1 && timeUntilEnd > 0) return 'leaving_soon';
    return 'here';
  }
  if (timeUntilStart > 0 && timeUntilStart <= 2) return 'arriving_soon';
  if (timeUntilStart > 2) return 'will_arrive';
  return 'gone';
}

const AVAILABILITY_LABELS: Record<AvailabilityStatus, { text: string; color: string }> = {
  here: { text: 'Здесь', color: 'text-emerald-400' },
  arriving_soon: { text: 'Скоро придёт', color: 'text-cyan-400' },
  leaving_soon: { text: 'Скоро уйдёт', color: 'text-amber-400' },
  will_arrive: { text: 'Придёт позже', color: 'text-slate-400' },
  gone: { text: 'Ушёл', color: 'text-slate-500' },
};

function NpcScheduleCard({ item, expanded, onToggle }: {
  item: NpcScheduleItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const avail = AVAILABILITY_LABELS[item.availability];
  const isHere = item.availability === 'here';

  return (
    <motion.div
      layout
      className="rounded-lg border overflow-hidden"
      style={{
        background: isHere
          ? 'linear-gradient(145deg, rgba(0,0,0,0.65) 0%, rgba(16,185,129,0.06) 100%)'
          : 'linear-gradient(145deg, rgba(0,0,0,0.55) 0%, rgba(15,23,42,0.45) 100%)',
        borderColor: isHere ? 'rgba(16,185,129,0.25)' : 'rgba(51,65,85,0.4)',
        boxShadow: isHere ? '0 0 8px rgba(16,185,129,0.08)' : undefined,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        {/* Portrait dot */}
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${item.portraitColor}30, ${item.portraitColor}10)`,
            border: `1.5px solid ${item.portraitColor}50`,
            boxShadow: isHere ? `0 0 6px ${item.portraitColor}30` : undefined,
          }}
        >
          <User className="size-3.5" style={{ color: item.portraitColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif text-slate-200 truncate">
              {item.name}
            </span>
            <span className={`text-[9px] font-mono ${avail.color}`}>
              {avail.text}
            </span>
          </div>
          {item.currentEntry && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="size-2.5 text-slate-500" />
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {item.currentSceneName} · {item.activity}
              </span>
            </div>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="size-3.5 text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="size-3.5 text-slate-500 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 space-y-1.5">
              <div className="h-px" style={{
                background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.3), transparent)',
              }} />
              {/* Timeline */}
              <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                <Clock className="size-2.5" />
                <span>Расписание</span>
              </div>
              <div className="space-y-1">
                {item.fullSchedule.map((entry, i) => {
                  const sceneName = SCENE_CONFIG[entry.sceneId]?.name ?? entry.sceneId;
                  const isCurrent = entry === item.currentEntry;
                  return (
                    <div
                      key={`${entry.startHour}-${i}`}
                      className="flex items-center gap-2 px-1.5 py-1 rounded"
                      style={{
                        background: isCurrent ? 'rgba(16,185,129,0.08)' : undefined,
                        borderLeft: isCurrent ? '2px solid rgba(16,185,129,0.5)' : '2px solid transparent',
                      }}
                    >
                      <span className={`text-[9px] font-mono tabular-nums w-16 shrink-0 ${isCurrent ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {formatHour(entry.startHour)}–{formatHour(entry.endHour)}
                      </span>
                      <span className={`text-[10px] font-mono truncate ${isCurrent ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {sceneName}
                      </span>
                      <span className={`text-[9px] font-mono ml-auto shrink-0 ${isCurrent ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {SCHEDULE_ACTIVITY_LABELS[entry.activity] ?? entry.activity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function NpcScheduleDisplay() {
  const currentSceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const [expandedNpc, setExpandedNpc] = useState<string | null>(null);

  const scheduleItems = useMemo(() => {
    try {
      const state = getCombinedGameState();
      const ctx = buildScheduleContext(state);
      const allNpcIds = Object.keys(NPC_BY_ID);
      const items: NpcScheduleItem[] = [];

      for (const npcId of allNpcIds) {
        const def = NPC_BY_ID.get(npcId);
        if (!def) continue;

        const entry = getNPCLocationForTime(npcId, timeOfDay, ctx);
        const schedule = getNPCSchedule(npcId, ctx);
        const sceneName = entry
          ? (SCENE_CONFIG[entry.sceneId]?.name ?? entry.sceneId)
          : '—';
        const activity = entry
          ? (SCHEDULE_ACTIVITY_LABELS[entry.activity] ?? entry.activity)
          : '—';
        const colors = NPC_PORTRAIT_COLORS[npcId];

        items.push({
          npcId,
          name: def.name,
          portraitColor: colors?.primary ?? '#94a3b8',
          currentEntry: entry,
          currentSceneName: sceneName,
          activity,
          availability: getAvailability(entry, timeOfDay, currentSceneId),
          fullSchedule: schedule,
        });
      }

      // Sort: NPCs here first, then arriving soon, then others
      const order: Record<AvailabilityStatus, number> = {
        here: 0,
        arriving_soon: 1,
        leaving_soon: 2,
        will_arrive: 3,
        gone: 4,
      };
      items.sort((a, b) => order[a.availability] - order[b.availability]);
      return items;
    } catch {
      return [];
    }
  }, [timeOfDay, currentSceneId]);

  const hereItems = scheduleItems.filter((i) => i.availability === 'here' || i.availability === 'leaving_soon');
  const otherItems = scheduleItems.filter((i) => i.availability !== 'here' && i.availability !== 'leaving_soon');
  const hasNpcsHere = hereItems.length > 0;

  const handleToggle = useCallback((npcId: string) => {
    setExpandedNpc((prev) => (prev === npcId ? null : npcId));
  }, []);

  return (
    <div
      className="fixed pointer-events-none hidden lg:block"
      data-testid="npc-schedule-display"
      style={{
        top: EXPLORATION_HUD_LAYOUT.TOP_BAR_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP + 8,
        left: EXPLORATION_HUD_LAYOUT.RIGHT_INSET,
        zIndex: UI_LAYERS.HUD,
        maxWidth: 260,
      }}
    >
      <motion.div
        className="pointer-events-auto rounded-lg border backdrop-blur-md overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.72) 0%, rgba(15,23,42,0.6) 50%, rgba(0,0,0,0.5) 100%)',
          borderColor: 'rgba(51,65,85,0.5)',
          boxShadow: '0 0 12px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-1.5 px-3 py-2"
          style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}
        >
          <Clock className="size-3 text-cyan-400" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Персонажи
          </span>
          {hasNpcsHere && (
            <span className="ml-auto text-[9px] font-mono text-emerald-400">
              {hereItems.length} здесь
            </span>
          )}
        </div>

        {/* NPC list */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1.5" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(100,116,139,0.3) transparent',
        }}>
          {hereItems.length > 0 && hereItems.map((item) => (
            <NpcScheduleCard
              key={item.npcId}
              item={item}
              expanded={expandedNpc === item.npcId}
              onToggle={() => handleToggle(item.npcId)}
            />
          ))}
          {otherItems.length > 0 && hereItems.length > 0 && (
            <div className="h-px" style={{
              background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.25), transparent)',
            }} />
          )}
          {otherItems.filter((i) => i.availability === 'arriving_soon' || i.availability === 'will_arrive').map((item) => (
            <NpcScheduleCard
              key={item.npcId}
              item={item}
              expanded={expandedNpc === item.npcId}
              onToggle={() => handleToggle(item.npcId)}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(51,65,85,0.3), transparent)',
          }}
        />\n        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[8px] text-slate-600 font-mono">volodka://npcs</span>
          <span className="text-[8px] text-slate-500 font-mono tabular-nums">
            {Math.floor(timeOfDay).toString().padStart(2, '0')}:00
          </span>
        </div>
      </motion.div>
    </div>
  );
}
