
/* ─── Volodka RPG – Save Slot Manager (Cyberpunk Terminal Aesthetic) ─── */
/* Full-screen modal for managing 3 save slots with preview metadata,
 * save/load/delete actions, and auto-save indicator. */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { useGameStore } from '@/store/gameStore';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId } from '@/shared/types/game';
import type { SavePayload } from '@/shared/validation/saveSchema';
import { validateSaveData } from '@/shared/validation/saveSchema';
import { POEMS } from '@/data/poems';

const TOTAL_POEMS = POEMS.length;

// ─── Types ───

interface SaveSlotManagerProps {
  open: boolean;
  onClose: () => void;
}

/** Validated save payload plus optional slot-manager UI metadata */
type SaveSlotPreview = SavePayload & { playTimeSeconds?: number };

// ─── LocalStorage helpers ───

function getSaveSlotKey(slot: number): string {
  return `volodka_save_slot_${slot}`;
}

function readSaveSlot(slot: number): SaveSlotPreview | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(getSaveSlotKey(slot));
  if (!raw) return null;

  const validation = validateSaveData(raw);
  if (!validation.success) return null;

  return validation.data;
}

/** Look up a human-readable scene name from the scene config */
function getSceneName(sceneId: string): string {
  const config = SCENE_CONFIG[sceneId as SceneId];
  return config?.name ?? sceneId;
}

/** Format a timestamp into a Russian locale date/time string */
function formatSaveDate(timestamp: number | undefined): string {
  if (!timestamp) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

/** Format seconds into HH:MM */
function formatPlayTime(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null) return '—';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Get karma color based on value */
function getKarmaColor(karma: number): string {
  if (karma >= 70) return 'rgba(52, 211, 153, 0.9)';   // emerald — high karma
  if (karma >= 40) return 'rgba(251, 191, 36, 0.9)';   // amber — mid karma
  return 'rgba(244, 63, 94, 0.9)';                      // rose — low karma
}

/** Get karma alignment label in Russian */
function getKarmaLabel(karma: number): string {
  if (karma >= 70) return 'Свет';
  if (karma >= 40) return 'Баланс';
  return 'Тьма';
}

/** Get time-of-day label in Russian */
function getTimeOfDayLabel(time: number): string {
  if (time >= 6 && time < 12) return 'Утро';
  if (time >= 12 && time < 18) return 'День';
  if (time >= 18 && time < 22) return 'Вечер';
  return 'Ночь';
}

/** Estimate play time from current store state (rough heuristic) */
function estimatePlayTimeSeconds(): number {
  // Use a combination of progression level and visited nodes as a proxy.
  // For a more accurate timer, a dedicated play-time tracker should be used.
  const state = useGameStore.getState();
  const visitedCount = state.playerState.visitedNodes.length;
  const level = state.playerState.progression.level;
  // Rough estimate: ~2 min per visited node + 10 min base per level
  return Math.max(0, visitedCount * 120 + (level - 1) * 600);
}

// ─── Slot Card Component ───

function SaveSlotCard({
  slotNumber,
  data,
  isAutoSave,
  onSave,
  onLoad,
  onDelete,
}: {
  slotNumber: number;
  data: SaveSlotPreview | null;
  isAutoSave: boolean;
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
  onDelete: (slot: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEmpty = data === null;

  // Auto-dismiss delete confirmation after 5 seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 5000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className={`rounded-lg p-4 transition-all duration-300 ${
          isEmpty
            ? 'border-2 border-dashed border-slate-700/40 bg-slate-950/60'
            : 'border border-solid bg-slate-950/90 backdrop-blur-md'
        }`}
        style={
          !isEmpty
            ? {
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
                boxShadow:
                  '0 0 15px rgb(var(--cyber-cyan-rgb) / 0.04), inset 0 0 15px rgb(var(--cyber-cyan-rgb) / 0.02)',
              }
            : undefined
        }
      >
        {/* ── Slot Header ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs tracking-[0.15em] uppercase"
              style={{
                color: isEmpty
                  ? 'rgba(148, 163, 184, 0.4)'
                  : 'rgb(var(--cyber-cyan-rgb) / 0.7)',
              }}
            >
              Слот {slotNumber}
            </span>
            {isAutoSave && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
                style={{
                  background: 'rgba(251, 191, 36, 0.12)',
                  color: 'rgba(251, 191, 36, 0.8)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'rgba(251, 191, 36, 0.9)',
                    boxShadow: '0 0 4px rgba(251, 191, 36, 0.6)',
                  }}
                />
                Авто
              </span>
            )}
          </div>
          {!isEmpty && data?.savedAt && (
            <span
              className="font-mono text-[10px]"
              style={{ color: 'rgba(148, 163, 184, 0.5)' }}
            >
              {formatSaveDate(data.savedAt)}
            </span>
          )}
        </div>

        {/* ── Empty Slot ── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <span
              className="font-mono text-sm"
              style={{ color: 'rgba(148, 163, 184, 0.3)' }}
            >
              Пустой слот
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: 'rgba(100, 116, 139, 0.3)' }}
            >
              Нет сохранений
            </span>
          </div>
        )}

        {/* ── Filled Slot Metadata ── */}
        {!isEmpty && data && (
          <div className="flex flex-col gap-2 mb-4">
            {/* Scene & Time */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.6)' }}>
                ▸
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: 'rgba(203, 213, 225, 0.8)' }}
              >
                {getSceneName(data.exploration.currentSceneId)}
              </span>
              {data.exploration.timeOfDay !== undefined && (
                <span
                  className="font-mono text-[10px] ml-auto"
                  style={{ color: 'rgba(148, 163, 184, 0.45)' }}
                >
                  {getTimeOfDayLabel(data.exploration.timeOfDay)}
                </span>
              )}
            </div>

            {/* Stats Grid */}
            <div
              className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md p-2.5"
              style={{ background: 'rgba(15, 23, 42, 0.4)' }}
            >
              {/* Level */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  УР
                </span>
                <span className="font-mono text-xs" style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.8)' }}>
                  {data.playerState.progression.level}
                </span>
              </div>

              {/* Poems */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  Стихи
                </span>
                <span className="font-mono text-xs" style={{ color: 'rgba(168, 85, 247, 0.8)' }}>
                  {data.collectedPoems.length}/{TOTAL_POEMS}
                </span>
              </div>

              {/* Karma */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  Карма
                </span>
                <span className="font-mono text-xs" style={{ color: getKarmaColor(data.playerState.karma) }}>
                  {data.playerState.karma}
                </span>
                <span className="font-mono text-[9px]" style={{ color: getKarmaColor(data.playerState.karma), opacity: 0.6 }}>
                  {getKarmaLabel(data.playerState.karma)}
                </span>
              </div>

              {/* Play Time */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  Время
                </span>
                <span className="font-mono text-xs" style={{ color: 'rgba(203, 213, 225, 0.7)' }}>
                  {formatPlayTime(data.playTimeSeconds)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-2">
          {/* Save */}
          <motion.button
            onClick={() => onSave(slotNumber)}
            data-testid={`save-slot-${slotNumber}-save`}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label={`Сохранить игру в слот ${slotNumber}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-mono text-xs tracking-wide transition-colors"
            style={{
              color: 'rgb(var(--cyber-cyan-rgb) / 0.85)',
              background: 'rgb(var(--cyber-cyan-rgb) / 0.08)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgb(var(--cyber-cyan-rgb) / 0.15)';
              e.currentTarget.style.borderColor = 'rgb(var(--cyber-cyan-rgb) / 0.4)';
              e.currentTarget.style.boxShadow = '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgb(var(--cyber-cyan-rgb) / 0.08)';
              e.currentTarget.style.borderColor = 'rgb(var(--cyber-cyan-rgb) / 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Сохранить
          </motion.button>

          {/* Load */}
          <motion.button
            onClick={() => onLoad(slotNumber)}
            data-testid={`save-slot-${slotNumber}-load`}
            whileHover={{ scale: isEmpty ? 1 : 1.04 }}
            whileTap={{ scale: isEmpty ? 1 : 0.96 }}
            disabled={isEmpty}
            aria-label={isEmpty ? `Слот ${slotNumber} пуст, загрузка недоступна` : `Загрузить игру из слота ${slotNumber}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-mono text-xs tracking-wide transition-colors"
            style={{
              color: isEmpty
                ? 'rgba(100, 116, 139, 0.3)'
                : 'rgba(52, 211, 153, 0.85)',
              background: isEmpty
                ? 'rgba(30, 41, 59, 0.3)'
                : 'rgba(52, 211, 153, 0.08)',
              border: isEmpty
                ? '1px solid rgba(100, 116, 139, 0.1)'
                : '1px solid rgba(52, 211, 153, 0.2)',
              cursor: isEmpty ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (isEmpty) return;
              e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 211, 153, 0.15)';
            }}
            onMouseLeave={(e) => {
              if (isEmpty) return;
              e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Загрузить
          </motion.button>

          {/* Delete */}
          {!isEmpty && !confirmDelete && (
            <motion.button
              onClick={() => setConfirmDelete(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label={`Удалить сохранение в слоте ${slotNumber}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-mono text-xs tracking-wide transition-colors"
              style={{
                color: 'rgba(244, 63, 94, 0.7)',
                background: 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.35)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Удалить
            </motion.button>
          )}

          {/* Delete Confirmation */}
          {!isEmpty && confirmDelete && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="flex items-center gap-1.5"
            >
              <span
                className="font-mono text-[10px]"
                style={{ color: 'rgba(244, 63, 94, 0.7)' }}
              >
                Уверены?
              </span>
              <button
                onClick={() => {
                  onDelete(slotNumber);
                  setConfirmDelete(false);
                }}
                aria-label={`Подтвердить удаление слота ${slotNumber}`}
                className="px-2 py-1 rounded font-mono text-[10px] tracking-wide"
                style={{
                  color: 'rgba(244, 63, 94, 0.9)',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                }}
              >
                Да
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                aria-label="Отменить удаление"
                className="px-2 py-1 rounded font-mono text-[10px] tracking-wide"
                style={{
                  color: 'rgba(148, 163, 184, 0.6)',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(100, 116, 139, 0.2)',
                }}
              >
                Нет
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Hover glow effect ── */}
        {!isEmpty && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              boxShadow:
                '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.06), inset 0 0 20px rgb(var(--cyber-cyan-rgb) / 0.02)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.12)',
              borderRadius: '0.5rem',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Inner content component (remounts on each open for fresh data) ───

function SaveSlotManagerContent({ onClose }: { onClose: () => void }) {
  const saveGame = useGameStore((s) => s.saveGame);
  const loadGame = useGameStore((s) => s.loadGame);

  const [slots, setSlots] = useState<(SaveSlotPreview | null)[]>(() =>
    [1, 2, 3].map((n) => readSaveSlot(n)),
  );
  const [notification, setNotification] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const refreshSlots = useCallback(() => {
    const data = [1, 2, 3].map((n) => readSaveSlot(n));
    setSlots(data);
  }, []);

  // ── Auto-dismiss notification ──
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  // ── Find which slot has the latest save (auto-save indicator) ──
  const latestSlot = slots.reduce<number | null>((best, slot, idx) => {
    if (!slot?.savedAt) return best;
    if (best === null) return idx;
    const bestTime = slots[best]?.savedAt ?? 0;
    return slot.savedAt > bestTime ? idx : best;
  }, null);

  // ── Save current game to a specific slot ──
  const handleSave = useCallback(
    (slot: number) => {
      // 1. Call the existing saveGame which writes to `volodka_save`
      saveGame({ source: 'manual' });

      // 2. Read the result from `volodka_save` and copy it to the slot key
      try {
        const raw = localStorage.getItem('volodka_save');
        if (!raw) {
          setNotification('Ошибка: не удалось прочитать сохранение');
          return;
        }

        const validation = validateSaveData(raw);
        if (!validation.success) {
          setNotification(validation.error);
          return;
        }

        const payload = {
          ...validation.data,
          savedAt: Date.now(),
          playTimeSeconds: estimatePlayTimeSeconds(),
        };

        localStorage.setItem(getSaveSlotKey(slot), JSON.stringify(payload));
        refreshSlots();
        setNotification(`Сохранено в Слот ${slot}`);
      } catch {
        setNotification('Ошибка сохранения');
      }
    },
    [saveGame, refreshSlots],
  );

  // ── Load game from a specific slot ──
  const handleLoad = useCallback(
    (slot: number) => {
      try {
        const raw = localStorage.getItem(getSaveSlotKey(slot));
        if (!raw) {
          setNotification('Слот пуст');
          return;
        }

        const validation = validateSaveData(raw);
        if (!validation.success) {
          setNotification(validation.error);
          return;
        }

        // Copy validated slot data to the main save key, then call loadGame (re-validates)
        localStorage.setItem('volodka_save', raw);
        loadGame();
        setNotification(`Загружен Слот ${slot}`);
        // Close the manager after loading
        setTimeout(() => onClose(), 600);
      } catch {
        setNotification('Ошибка загрузки');
      }
    },
    [loadGame, onClose],
  );

  // ── Delete a slot ──
  const handleDelete = useCallback(
    (slot: number) => {
      try {
        localStorage.removeItem(getSaveSlotKey(slot));
        refreshSlots();
        setNotification(`Слот ${slot} удалён`);
      } catch {
        setNotification('Ошибка удаления');
      }
    },
    [refreshSlots],
  );

  const handleExport = useCallback(() => {
    try {
      const payload = {
        exportedAt: Date.now(),
        version: 1,
        slots: Object.fromEntries(
          [1, 2, 3].map((n) => [String(n), readSaveSlot(n)]),
        ),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `volodka-saves-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotification('Сохранения экспортированы');
    } catch {
      setNotification('Ошибка экспорта');
    }
  }, []);

  const handleImportFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = reader.result;
          if (typeof raw !== 'string') {
            setNotification('Неверный файл');
            return;
          }

          const parsed = JSON.parse(raw) as {
            slots?: Record<string, unknown>;
            slot?: number;
            data?: unknown;
          };

          // Single-slot export fallback
          if (parsed.data && typeof parsed.slot === 'number') {
            const validation = validateSaveData(JSON.stringify(parsed.data));
            if (!validation.success) {
              setNotification(validation.error);
              return;
            }
            localStorage.setItem(getSaveSlotKey(parsed.slot), JSON.stringify(validation.data));
            refreshSlots();
            setNotification(`Импортирован Слот ${parsed.slot}`);
            return;
          }

          const slotEntries = parsed.slots;
          if (!slotEntries || typeof slotEntries !== 'object') {
            setNotification('Формат файла не распознан');
            return;
          }

          let imported = 0;
          for (const [key, value] of Object.entries(slotEntries)) {
            const slotNum = Number(key);
            if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 3 || value == null) continue;
            const validation = validateSaveData(JSON.stringify(value));
            if (!validation.success) continue;
            localStorage.setItem(getSaveSlotKey(slotNum), JSON.stringify(validation.data));
            imported++;
          }

          if (imported === 0) {
            setNotification('Нет валидных слотов в файле');
            return;
          }

          refreshSlots();
          setNotification(`Импортировано слотов: ${imported}`);
        } catch {
          setNotification('Ошибка импорта');
        }
      };
      reader.readAsText(file);
    },
    [refreshSlots],
  );

  return (
    <motion.div
      className="relative z-10 w-full max-w-2xl mx-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-slot-manager-title"
      aria-describedby={notification ? 'save-slot-notification' : undefined}
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 30 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <AriaLiveRegion message={notification ?? ''} priority="polite" />
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
          borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
          boxShadow:
            '0 0 60px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.05)',
          clipPath:
            'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        {/* ── Terminal Header ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Colored dots */}
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-red-500/80" />
            <span id="save-slot-manager-title" className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/35">
              volodka://saves
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
            aria-label="Закрыть менеджер сохранений"
          >
            ✕
          </button>
        </div>

        {/* ── Notification Toast ── */}
        <AnimatePresence>
          {notification && (
            <motion.div
              id="save-slot-notification"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              role="status"
            >
              <div
                className="px-4 py-2 text-center font-mono text-xs"
                style={{
                  color: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
                  background: 'rgb(var(--cyber-cyan-rgb) / 0.05)',
                  borderBottom: '1px solid rgb(var(--cyber-cyan-rgb) / 0.1)',
                }}
              >
                {notification}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Slot Cards ── */}
        <div className="px-5 py-5 max-h-[65vh] overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {[1, 2, 3].map((slotNum, idx) => (
            <SaveSlotCard
              key={slotNum}
              slotNumber={slotNum}
              data={slots[idx]}
              isAutoSave={latestSlot === idx}
              onSave={handleSave}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.1)' }}
        >
          {/* Slot count info */}
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: 'rgba(148, 163, 184, 0.4)' }}
            >
              {slots.filter((s) => s !== null).length}/3 занято
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-hidden
              onChange={handleImportFile}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="px-2.5 py-1 rounded font-mono text-[10px] tracking-wide border transition-colors"
              style={{
                color: 'rgb(var(--cyber-cyan-rgb) / 0.75)',
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
                background: 'rgb(var(--cyber-cyan-rgb) / 0.06)',
              }}
              aria-label="Импорт сохранений из JSON файла"
            >
              Импорт
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-2.5 py-1 rounded font-mono text-[10px] tracking-wide border transition-colors"
              style={{
                color: 'rgb(var(--cyber-cyan-rgb) / 0.75)',
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
                background: 'rgb(var(--cyber-cyan-rgb) / 0.06)',
              }}
              aria-label="Экспорт всех слотов в JSON файл"
            >
              Экспорт
            </button>
          </div>

          {/* ESC hint */}
          <div className="flex items-center gap-1.5">
            <kbd
              className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(100, 116, 139, 0.25)',
                color: 'rgba(148, 163, 184, 0.5)',
              }}
            >
              Esc
            </kbd>
            <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
              назад
            </span>
          </div>
        </div>
      </div>

      {/* Corner glow decorations */}
      <div
        className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          borderLeft: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          boxShadow: '-2px -2px 10px rgb(var(--cyber-cyan-rgb) / 0.1)',
        }}
      />
      <div
        className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderTop: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          borderRight: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
          boxShadow: '2px -2px 10px rgb(var(--cyber-cyan-rgb) / 0.1)',
        }}
      />
      <div
        className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
        style={{
          borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
          borderLeft: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '-2px 2px 10px rgba(251, 191, 36, 0.05)',
        }}
      />
      <div
        className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
        style={{
          borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
          borderRight: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '2px 2px 10px rgba(251, 191, 36, 0.05)',
        }}
      />
    </motion.div>
  );
}

// ─── Main Component ───

export function SaveSlotManager({ open, onClose }: SaveSlotManagerProps) {
  // ── ESC to close ──
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.MENU }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="presentation"
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />

          {/* Scanlines overlay on backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
            }}
            aria-hidden="true"
          />

          <AriaLiveRegion message="Менеджер сохранений открыт" priority="polite" />

          {/* Panel content — remounts on each open for fresh data */}
          <FocusTrap>
            <SaveSlotManagerContent onClose={onClose} />
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
