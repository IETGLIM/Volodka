
/* ─── Volodka RPG – Developer Debug Panel (F3) ─── */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { useGameStore } from '@/store/gameStore';
import { useDevPanelSceneTab, useDevPanelStateTab } from '@/store/selectors';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { getFrameProfilerSnapshot, type FrameProfilerSnapshot } from '@/engine/frame';
import {
  getRuntimeBudgetSnapshot,
  getLoadingTimelineSnapshot,
  getDrawCallBudget,
  getActiveFpsBudget,
  PERFORMANCE_BUDGETS,
} from '@/engine/performance';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { SCENE_CONFIG } from '@/config/scenes';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import type { SceneId } from '@/shared/types/game';
import { POEMS } from '@/data/poems';

/* ── Types ── */

type TabKey = 'perf' | 'scene' | 'state' | 'events' | 'cheats';

interface EventLogEntry {
  time: number;
  event: string;
  payload: unknown;
}

/* ── All valid scene IDs ── */
const _SCENE_IDS = Object.keys(SCENE_CONFIG) as SceneId[];

/* ── Scene category groupings ── */
const SCENE_GROUPS: Record<string, SceneId[]> = {
  '🏠 Дом': ['volodka_room', 'volodka_corridor', 'home_evening', 'solnysh_room', 'zarema_albert_room'],
  '🌆 Улица': ['street_night', 'street_winter'],
  '🏢 Локации': ['cafe_evening', 'office_day', 'park_day', 'library_day'],
  '⚔️ Особые': ['battle', 'sleep_dream', 'rooftop_edge', 'abandoned_factory'],
};

/* ── Main component ── */

export function DevPanel({ startOpen = false }: { startOpen?: boolean }) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [visible, setVisible] = useState(startOpen);
  const [activeTab, setActiveTab] = useState<TabKey>('perf');

  // FPS tracking
  const fpsHistory = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);

  // Renderer info (read from bridge)
  const [frameProfiler, setFrameProfiler] = useState<FrameProfilerSnapshot | null>(null);

  // Event log
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Memory info (Chrome only)
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  // ── Toggle with F3 ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── FPS measurement via requestAnimationFrame ──
  useEffect(() => {
    if (!visible) return;
    let rafId: number;
    const measure = () => {
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;
      fpsHistory.current.push(1000 / delta);
      // Keep ~2 seconds of frames at 60fps
      if (fpsHistory.current.length > 120) fpsHistory.current.shift();
      const avg =
        fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
      setFps(Math.round(avg));
      setFrameTime(Math.round(delta * 100) / 100);
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [visible]);

  // ── Renderer info polling (every 500ms when visible) ──
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setFrameProfiler(getFrameProfilerSnapshot());
      // Chrome-only memory API
      const perf = performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      };
      if (perf.memory) {
        setMemoryInfo({
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  // ── Event log subscription via onAny ──
  useEffect(() => {
    if (!visible) return;
    const unsub = eventBus.onAny((event, payload) => {
      setEvents((prev) => {
        const next = [...prev, { time: Date.now(), event, payload }];
        // Keep last 30
        if (next.length > 30) next.shift();
        return next;
      });
    }, EventBusPriority.Debug);
    return unsub;
  }, [visible]);

  // ── Auto-scroll events ──
  useEffect(() => {
    if (activeTab === 'events' && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, activeTab]);

  // ── Close handler ──
  const handleClose = useCallback(() => setVisible(false), []);

  if (!visible) return null;

  return (
    <FocusTrap initialFocusRef={closeButtonRef}>
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      {...dialogProps}
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        width: 360,
        maxHeight: '85vh',
        zIndex: UI_LAYERS.DEV_PANEL,
        background: 'rgba(2, 6, 12, 0.94)',
        border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.2)',
        borderRadius: 10,
        color: '#e0e0e0',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 12,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        userSelect: 'none',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h2 {...titleProps} className="sr-only">Панель разработчика</h2>
      {/* Header with tabs + close */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgb(var(--cyber-cyan-rgb) / 0.1)',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {(['perf', 'scene', 'state', 'events', 'cheats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '7px 0',
              background: activeTab === tab ? 'rgb(var(--cyber-cyan-rgb) / 0.1)' : 'transparent',
              color: activeTab === tab ? 'var(--cyber-cyan)' : '#555',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 10,
              textTransform: 'uppercase' as const,
              letterSpacing: 1.5,
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#555',
            cursor: 'pointer',
            fontSize: 14,
            padding: '4px 8px',
            lineHeight: 1,
          }}
          title="Close (F3)"
          aria-label="Закрыть панель разработчика"
        >
          ✕
        </button>
      </div>

      {/* Tab content */}
      <div style={{ padding: 10, maxHeight: 'calc(85vh - 44px)', overflowY: 'auto' }} className="game-scrollbar">
        {activeTab === 'perf' && (
          <PerfTab
            fps={fps}
            frameTime={frameTime}
            frameProfiler={frameProfiler}
            memoryInfo={memoryInfo}
          />
        )}
        {activeTab === 'scene' && <SceneTab />}
        {activeTab === 'state' && <StateTab />}
        {activeTab === 'events' && <EventsTab events={events} eventsEndRef={eventsEndRef} />}
        {activeTab === 'cheats' && <CheatsTab />}
      </div>
    </motion.div>
    </FocusTrap>
  );
}

/* ── Performance Tab ── */

function PerfTab({
  fps,
  frameTime,
  frameProfiler,
  memoryInfo,
}: {
  fps: number;
  frameTime: number;
  frameProfiler: FrameProfilerSnapshot | null;
  memoryInfo: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null;
}) {
  const fpsColor = fps > 50 ? '#4f4' : fps > 30 ? '#ff4' : '#f44';
  const budgetMs = 1000 / 60;
  const runtimeBudget = getRuntimeBudgetSnapshot();
  const loadTimeline = getLoadingTimelineSnapshot();
  const fpsTarget = getActiveFpsBudget();
  const sceneId = frameProfiler ? useGameStore.getState().exploration.currentSceneId : null;
  const drawBudget = sceneId ? getDrawCallBudget(sceneId) : PERFORMANCE_BUDGETS.drawCalls.defaultMax;

  return (
    <div>
      {/* Budget targets */}
      <div style={{ marginBottom: 12, padding: 8, borderRadius: 4, background: '#111', border: '1px solid #222' }}>
        <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
          Performance budgets
        </div>
        <Row label="FPS target" value={`${fpsTarget.target} (min ${fpsTarget.min})`} />
        <Row label="Profile" value={runtimeBudget?.fpsProfile ?? '—'} />
        {loadTimeline.firstScenePlayableMs != null && (
          <Row
            label="First scene"
            value={`${loadTimeline.firstScenePlayableMs.toFixed(0)} ms`}
            valueColor={
              loadTimeline.firstScenePlayableMs > PERFORMANCE_BUDGETS.firstScenePlayableMs.hardMax
                ? '#f44'
                : loadTimeline.firstScenePlayableMs > PERFORMANCE_BUDGETS.firstScenePlayableMs.target
                  ? '#ff4'
                  : '#4f4'
            }
          />
        )}
        {sceneId && frameProfiler && (
          <Row
            label={`Draw calls (${sceneId})`}
            value={`${frameProfiler.drawCalls} / ${drawBudget}`}
            valueColor={frameProfiler.drawCalls > drawBudget ? '#f44' : frameProfiler.drawCalls > drawBudget * 0.85 ? '#ff4' : '#888'}
          />
        )}
        {runtimeBudget && runtimeBudget.violations.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 10, color: '#f88' }}>
            {runtimeBudget.violations.slice(0, 4).map((v) => (
              <div key={v.id}>{v.message}</div>
            ))}
          </div>
        )}
      </div>
      {/* FPS */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color: fpsColor, fontSize: 22, fontWeight: 'bold' }}>{fps}</span>
        <span style={{ color: '#666', fontSize: 11 }}>FPS</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>{frameTime}ms</span>
      </div>

      {/* FPS bar */}
      <div style={{ height: 3, borderRadius: 2, background: '#222', marginTop: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, (fps / 60) * 100)}%`,
          background: fpsColor,
          borderRadius: 2,
          transition: 'width 0.3s',
        }} />
      </div>

      {frameProfiler && (
        <>
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
              Frame Budget (CPU)
            </div>
            <Row label="Canvas frame" value={`${frameProfiler.cpuFrameMs.toFixed(2)} ms`} />
            <Row label="Budget runner" value={`${frameProfiler.cpuBudgetMs.toFixed(2)} ms`} />
            <Row label="Physics step" value={`${frameProfiler.physicsStepMs.toFixed(2)} ms`} />
            <Row label="Legacy useFrame est." value={`${frameProfiler.legacyUseFrameEstimate.toFixed(2)} ms`} />
            <Row label="Registered ticks" value={frameProfiler.registeredTicks} />
            <Row label="Zustand notifies" value={frameProfiler.zustandNotificationsThisFrame} />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
              Systems @ 60fps ({budgetMs.toFixed(1)} ms)
            </div>
            {(['interaction', 'player', 'npc', 'camera', 'weather', 'postfx', 'misc'] as const).map((id) => {
              const sys = frameProfiler.systems[id];
              const pct = sys.budgetPct;
              const barColor = pct > 40 ? '#f44' : pct > 20 ? '#ff4' : 'var(--cyber-cyan)';
              return (
                <div key={id} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: '#888' }}>{id}</span>
                    <span style={{ color: '#666' }}>{sys.cpuMs.toFixed(2)} ms ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>

          {frameProfiler.topTicks.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                Top Ticks
              </div>
              {frameProfiler.topTicks.map((tick) => (
                <Row
                  key={`${tick.system}:${tick.label}`}
                  label={`${tick.system}/${tick.label}`}
                  value={`${tick.cpuMs.toFixed(2)} ms`}
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
              GPU / Renderer
            </div>
            <Row label="DPR" value={frameProfiler.dpr.toFixed(2)} />
            <Row label="Draw Calls" value={frameProfiler.drawCalls} />
            <Row label="Triangles" value={formatNumber(frameProfiler.triangles)} />
            <Row label="Textures" value={frameProfiler.textures} />
            <Row label="Geometries" value={frameProfiler.geometries} />
            <Row label="Programs" value={frameProfiler.programs} />
            <Row label="GPU frame" value={frameProfiler.gpuFrameMs != null ? `${frameProfiler.gpuFrameMs.toFixed(2)} ms` : 'N/A'} />
          </div>

          {frameProfiler.gpuMemory && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                GPU Memory (est.)
              </div>
              {(() => {
                const gpu = frameProfiler.gpuMemory;
                const totalMb = gpu.estimatedTotalBytes / (1024 * 1024);
                const budget = PERFORMANCE_BUDGETS.gpuMemoryEstimateMb;
                const pct = Math.min(100, (totalMb / budget.hardMax) * 100);
                const barColor =
                  totalMb > budget.hardMax ? '#f44' : totalMb > budget.target ? '#ff4' : 'var(--cyber-cyan)';
                const driftMb = gpu.driftBytes / (1024 * 1024);
                return (
                  <>
                    <Row
                      label="Total est."
                      value={`${totalMb.toFixed(1)} / ${budget.hardMax} MB`}
                      valueColor={barColor}
                    />
                    <Row label="Module geo" value={formatBytes(gpu.moduleGeometryBytes)} />
                    <Row label="Module mat" value={formatBytes(gpu.moduleMaterialBytes)} />
                    <Row label="Scene est." value={formatBytes(gpu.sceneEstimateBytes)} />
                    {gpu.baselineBytes != null && (
                      <Row
                        label="Drift vs baseline"
                        value={`+${driftMb.toFixed(1)} MB`}
                        valueColor={gpu.driftSeverity === 'fail' ? '#f44' : gpu.driftSeverity === 'warn' ? '#ff4' : '#888'}
                      />
                    )}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: 2,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Memory (Chrome only) */}
      {memoryInfo && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
            Memory
          </div>
          <Row label="JS Heap" value={formatBytes(memoryInfo.usedJSHeapSize)} />
          <Row label="Total Heap" value={formatBytes(memoryInfo.totalJSHeapSize)} />
          <Row label="Heap Limit" value={formatBytes(memoryInfo.jsHeapSizeLimit)} />
          <div style={{ marginTop: 4 }}>
            <div style={{ height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%`,
                  background: memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8 ? '#f44' : 'var(--cyber-cyan)',
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ color: '#444', marginTop: 12, fontSize: 9 }}>F3 — закрыть</div>
    </div>
  );
}

/* ── Scene Tab ── */

function SceneTab() {
  const { sceneId, playerPos, playerRot, mode, timeOfDay, npcStates } = useDevPanelSceneTab();
  const rendererInfo = getFrameProfilerSnapshot();

  const handleSceneSwitch = useCallback((id: SceneId) => {
    const config = SCENE_CONFIG[id];
    if (!config) return;
    requestSceneTransition(id, config.spawnPoint as [number, number, number]);
  }, []);

  return (
    <div>
      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
        Текущая сцена
      </div>
      <Row label="Scene ID" value={sceneId} valueColor="var(--cyber-cyan)" />
      <Row label="Mode" value={mode} valueColor="var(--cyber-cyan)" />
      <Row label="Time of Day" value={`${timeOfDay.toFixed(1)}h`} />

      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
        Player
      </div>
      <Row
        label="Position"
        value={`x:${playerPos[0].toFixed(1)} y:${playerPos[1].toFixed(1)} z:${playerPos[2].toFixed(1)}`}
      />
      <Row label="Rotation" value={`${(playerRot * (180 / Math.PI)).toFixed(1)}°`} />

      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
        GPU / Memory Snapshot
      </div>
      <Row label="Draw Calls" value={rendererInfo.drawCalls} />
      <Row label="Triangles" value={rendererInfo.triangles.toLocaleString()} />
      <Row label="Geometries" value={rendererInfo.geometries} />
      <Row label="Textures" value={rendererInfo.textures} />
      <Row label="Programs" value={rendererInfo.programs} />
      <Row label="DPR" value={rendererInfo.dpr.toFixed(2)} />

      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
        Objects
      </div>
      <Row label="NPC States" value={Object.keys(npcStates).length} />

      {/* Scene switcher */}
      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 12 }}>
        Переключить сцену
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.entries(SCENE_GROUPS).map(([group, ids]) => (
          <div key={group}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 3, fontWeight: 600 }}>{group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {ids.map((id) => {
                const config = SCENE_CONFIG[id];
                const isActive = id === sceneId;
                return (
                  <button
                    key={id}
                    onClick={() => handleSceneSwitch(id)}
                    style={{
                      padding: '3px 6px',
                      fontSize: 10,
                      borderRadius: 4,
                      border: `1px solid ${isActive ? 'var(--cyber-cyan)' : 'rgba(100,116,139,0.2)'}`,
                      background: isActive ? 'rgb(var(--cyber-cyan-rgb) / 0.15)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? 'var(--cyber-cyan)' : '#aaa',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                    title={config?.name ?? id}
                  >
                    {config?.name ?? id}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State Tab ── */

function StateTab() {
  const {
    karma,
    stress,
    energy,
    mode,
    quests,
    collectedPoems,
    flags,
    inventory,
    progression,
    skills,
  } = useDevPanelStateTab();

  const activeQuests = quests.filter((q) => q.status === 'active');
  const completedQuests = quests.filter((q) => q.status === 'completed');

  return (
    <div>
      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
        Game
      </div>
      <Row label="Mode" value={mode} valueColor="var(--cyber-cyan)" />
      <Row label="Level" value={progression.level} />
      <Row label="XP" value={`${progression.xp}/${progression.xpToNextLevel}`} />

      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
        Stats
      </div>
      <Row label="Karma" value={karma} valueColor="var(--cyber-cyan)" />
      <Row label="Stress" value={stress} valueColor={stress > 70 ? '#f88' : '#ddd'} />
      <Row label="Energy" value={energy} valueColor={energy < 30 ? '#f88' : '#8f8'} />

      {/* Stat bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        <StatBar label="Karma" value={karma} max={100} color="var(--cyber-cyan)" />
        <StatBar label="Stress" value={stress} max={100} color="#f88" />
        <StatBar label="Energy" value={energy} max={100} color="#8f8" />
      </div>

      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
        Progress
      </div>
      <Row label="Active Quests" value={activeQuests.length} valueColor="#ff4" />
      <Row label="Completed Quests" value={completedQuests.length} />
      <Row label="Collected Poems" value={collectedPoems.length} valueColor="#f8f" />
      <Row label="Inventory Items" value={inventory.length} />
      <Row label="Flags Set" value={Object.keys(flags).length} />

      {Object.keys(skills).length > 0 && (
        <>
          <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
            Skills
          </div>
          {Object.entries(skills).map(([skill, val]) => (
            <Row key={skill} label={skill} value={val as number} />
          ))}
        </>
      )}

      {/* Flags list */}
      {Object.keys(flags).length > 0 && (
        <>
          <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 }}>
            Flags
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {Object.entries(flags).filter(([, v]) => v).map(([key]) => (
              <span key={key} style={{ padding: '1px 4px', fontSize: 9, background: 'rgb(var(--cyber-cyan-rgb) / 0.1)', border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)', borderRadius: 3, color: '#88ddff' }}>
                {key}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Events Tab ── */

function EventsTab({
  events,
  eventsEndRef,
}: {
  events: EventLogEntry[];
  eventsEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? events.filter((e) => e.event.includes(filter))
    : events;

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter events..."
        style={{
          width: '100%',
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(100,116,139,0.2)',
          borderRadius: 4,
          color: '#ddd',
          fontSize: 10,
          marginBottom: 8,
          outline: 'none',
        }}
      />
      {filtered.length === 0 ? (
        <div style={{ color: '#555', textAlign: 'center', padding: 16 }}>
          {filter ? 'No matching events' : 'No events yet...'}
        </div>
      ) : (
        <div style={{ maxHeight: 300, overflowY: 'auto' }} className="game-scrollbar">
          {filtered.map((e, i) => (
            <div
              key={`${e.time}-${i}`}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                padding: '3px 0',
                fontSize: 10,
              }}
            >
              <span style={{ color: '#444', marginRight: 6 }}>
                {new Date(e.time).toLocaleTimeString('en', { hour12: false })}
              </span>
              <span style={{ color: 'var(--cyber-cyan)' }}>{e.event}</span>
              {e.payload !== undefined && e.payload !== null && typeof e.payload === 'object' && Object.keys(e.payload as object).length > 0 && (
                <span style={{ color: '#555', marginLeft: 4 }}>
                  {truncatePayload(e.payload)}
                </span>
              )}
            </div>
          ))}
          <div ref={eventsEndRef} />
        </div>
      )}
    </div>
  );
}

/* ── Cheats Tab ── */

function CheatsTab() {
  const handleSetKarma = useCallback((val: number) => {
    const state = useGameStore.getState();
    const diff = val - state.playerState.karma;
    state.addKarma(diff);
  }, []);

  const handleSetEnergy = useCallback((val: number) => {
    const state = useGameStore.getState();
    const diff = val - state.playerState.energy;
    state.addEnergy(diff);
  }, []);

  const handleSetStress = useCallback((val: number) => {
    const state = useGameStore.getState();
    const diff = val - state.playerState.stress;
    state.addStress(diff);
  }, []);

  const handleAddPoem = useCallback(() => {
    const state = useGameStore.getState();
    const poems = state.collectedPoems;
    if (poems.length >= POEMS.length) return;
    // Generate a fake poem ID for testing
    const nextIdx = poems.length + 1;
    const poemId = `dev_poem_${nextIdx}`;
    state.collectPoem(poemId);
  }, []);

  const handleToggleFlag = useCallback((flag: string) => {
    const state = useGameStore.getState();
    state.setFlag(flag, !state.playerState.flags[flag]);
  }, []);

  const handleSetTime = useCallback((time: number) => {
    const state = useGameStore.getState();
    const diff = time - state.exploration.timeOfDay;
    if (diff !== 0) state.advanceTime(diff);
  }, []);

  const flags = useGameStore((s) => s.playerState.flags);

  return (
    <div>
      <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
        Quick Cheats
      </div>

      {/* Karma presets */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Karma: </span>
        {[0, 25, 50, 75, 100].map((v) => (
          <button
            key={v}
            onClick={() => handleSetKarma(v)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              borderRadius: 3,
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.2)',
              background: 'rgb(var(--cyber-cyan-rgb) / 0.05)',
              color: 'var(--cyber-cyan)',
              cursor: 'pointer',
              marginRight: 3,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Energy presets */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Energy: </span>
        {[0, 25, 50, 75, 100].map((v) => (
          <button
            key={v}
            onClick={() => handleSetEnergy(v)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              borderRadius: 3,
              border: '1px solid rgba(52,211,153,0.2)',
              background: 'rgba(52,211,153,0.05)',
              color: '#34d399',
              cursor: 'pointer',
              marginRight: 3,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Stress presets */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Stress: </span>
        {[0, 25, 50, 75, 100].map((v) => (
          <button
            key={v}
            onClick={() => handleSetStress(v)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              borderRadius: 3,
              border: '1px solid rgba(251,113,133,0.2)',
              background: 'rgba(251,113,133,0.05)',
              color: '#fb7185',
              cursor: 'pointer',
              marginRight: 3,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Time presets */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Time: </span>
        {[6, 10, 14, 18, 22, 2].map((v) => (
          <button
            key={v}
            onClick={() => handleSetTime(v)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              borderRadius: 3,
              border: '1px solid rgba(251,191,36,0.2)',
              background: 'rgba(251,191,36,0.05)',
              color: '#fbbf24',
              cursor: 'pointer',
              marginRight: 3,
            }}
          >
            {v}:00
          </button>
        ))}
      </div>

      {/* Flags */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Flags: </span>
        {['rooftop_unlocked', 'factory_unlocked'].map((flag) => {
          const active = flags[flag];
          return (
            <button
              key={flag}
              onClick={() => handleToggleFlag(flag)}
              style={{
                padding: '2px 6px',
                fontSize: 9,
                borderRadius: 3,
                border: `1px solid ${active ? 'rgb(var(--cyber-cyan-rgb) / 0.3)' : 'rgba(100,116,139,0.2)'}`,
                background: active ? 'rgb(var(--cyber-cyan-rgb) / 0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? 'var(--cyber-cyan)' : '#666',
                cursor: 'pointer',
                marginRight: 3,
              }}
            >
              {flag.replace('_unlocked', '')}
            </button>
          );
        })}
      </div>

      {/* Add poem */}
      <button
        onClick={handleAddPoem}
        style={{
          padding: '4px 8px',
          fontSize: 10,
          borderRadius: 4,
          border: '1px solid rgba(251,191,36,0.2)',
          background: 'rgba(251,191,36,0.05)',
          color: '#fbbf24',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        + Collect Next Poem
      </button>
    </div>
  );
}

/* ── Helpers ── */

function Row({
  label,
  value,
  valueColor = '#ddd',
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
      <span style={{ color: '#777' }}>{label}</span>
      <span style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#666', width: 50, fontSize: 10 }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${(value / max) * 100}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span style={{ color: '#666', fontSize: 10, width: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1000000).toFixed(1)}M`;
}

function truncatePayload(payload: unknown): string {
  try {
    const str = JSON.stringify(payload);
    return str.length > 50 ? str.slice(0, 50) + '…' : str;
  } catch {
    return '{…}';
  }
}
