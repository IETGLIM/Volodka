/* ─── Volodka RPG – Ambient Sound Mixer ─── */
/* Small floating panel that lets the player adjust ambient sound volumes
 * independently (rain, wind, footsteps, music, etc.) with cyberpunk-styled
 * sliders. Toggle via a speaker icon button; expands to a compact mixer.
 *
 * Wired to actual audio engines — changes persist via localStorage and sync
 * with the Settings Panel. */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Music, CloudRain, Footprints, Mic } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomAmbientMixerPx, bottomRightInsetPx } from '@/shared/constants/hudLayout';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { musicEngine } from '@/engine/MusicEngine';
import { ambientEngine } from '@/engine/audio/AmbientEngine';
import { readAudioSettings, AUDIO_SETTINGS_CHANGED, type AudioSettingsSnapshot } from '@/engine/audio/AudioSettings';

/* ─── Types ─── */

interface SoundChannel {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  value: number; // 0–100
  /** Which engine to call on change */
  applyTo: 'music' | 'sfx' | 'ambient' | null;
  /** localStorage key for persistence */
  lsKey: string;
}

/* ─── Constants ─── */

const CYAN = 'var(--cyber-cyan)';
const CYAN_BORDER = 'rgb(var(--cyber-cyan-rgb) / 0.3)';
const CYAN_GLOW = 'rgb(var(--cyber-cyan-rgb) / 0.12)';
const BG_GLASS = 'rgba(8, 14, 24, 0.82)';

const LS_KEY_MAP: Record<string, string> = {
  music: 'volodka_music_volume',
  sfx: 'volodka_sfx_volume',
  ambient: 'volodka_ambient_volume',
  voice: 'volodka_voice_volume',
};

function readChannelDefaults(): SoundChannel[] {
  const s = readAudioSettings();
  return [
    { id: 'music',   label: 'Музыка',    icon: Music,     value: Math.round(s.musicVolume * 100),   applyTo: 'music',   lsKey: LS_KEY_MAP.music },
    { id: 'ambient', label: 'Атмосфера', icon: CloudRain, value: Math.round(s.ambientVolume * 100), applyTo: 'ambient', lsKey: LS_KEY_MAP.ambient },
    { id: 'sfx',     label: 'Звуки',     icon: Footprints, value: Math.round(s.sfxVolume * 100),     applyTo: 'sfx',     lsKey: LS_KEY_MAP.sfx },
    { id: 'voice',   label: 'Голоса',    icon: Mic,       value: 75,                                 applyTo: null,       lsKey: LS_KEY_MAP.voice ?? 'volodka_voice_volume' },
  ];
}

/* ─── Panel animation variants ─── */

const panelVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 8,
    transition: {
      duration: 0.18,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

/* ─── Helpers ─── */

function lsGetNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
  } catch {
    return fallback;
  }
}

function lsSetNumber(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* quota */ }
}

/** Apply a 0–100 value to the correct engine. */
function applyToEngine(engineKey: 'music' | 'sfx' | 'ambient' | null, percent: number): void {
  if (!engineKey) return;
  // Respect global mute from SettingsPanel
  let muted = false;
  try { muted = localStorage.getItem('volodka_muted') === 'true'; } catch { /* ignore */ }
  const volume = muted ? 0 : percent / 100;

  switch (engineKey) {
    case 'music':
      musicEngine.setVolume(volume);
      break;
    case 'sfx':
      audioEngine.setVolume(volume);
      break;
    case 'ambient':
      ambientEngine.setVolume(volume);
      break;
  }
}

/* ─── Component ─── */

export function AmbientSoundMixer() {
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState<SoundChannel[]>(readChannelDefaults);
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleValueChange = useCallback(
    (channelId: string, newValue: number[]) => {
      const percent = newValue[0];
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, value: percent } : ch,
        ),
      );
      // Persist and apply immediately
      const ch = channelsRef.current.find((c) => c.id === channelId);
      if (ch) {
        lsSetNumber(ch.lsKey, percent);
        applyToEngine(ch.applyTo, percent);
      }
    },
    [],
  );

  // Sync with Settings Panel changes (when SettingsPanel adjusts a volume,
  // it dispatches a CustomEvent we can listen to)
  useEffect(() => {
    const handler = (e: Event) => {
      const snapshot = (e as CustomEvent<AudioSettingsSnapshot>).detail;
      if (!snapshot) return;
      setChannels((prev) =>
        prev.map((ch) => {
          switch (ch.applyTo) {
            case 'music':   return { ...ch, value: Math.round(snapshot.musicVolume * 100) };
            case 'sfx':     return { ...ch, value: Math.round(snapshot.sfxVolume * 100) };
            case 'ambient': return { ...ch, value: Math.round(snapshot.ambientVolume * 100) };
            default: return ch;
          }
        }),
      );
    };
    window.addEventListener(AUDIO_SETTINGS_CHANGED, handler);
    return () => window.removeEventListener(AUDIO_SETTINGS_CHANGED, handler);
  }, []);

  // Re-read localStorage when opening (in case SettingsPanel was used while closed)
  useEffect(() => {
    if (isOpen) {
      setChannels(readChannelDefaults());
    }
  }, [isOpen]);

  return (
    <div
      className="fixed flex flex-col items-end gap-2 pointer-events-none"
      style={{
        zIndex: UI_LAYERS.HUD,
        bottom: bottomAmbientMixerPx(),
        right: bottomRightInsetPx(),
      }}
    >
      {/* ── Mixer Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ambient-mixer-panel"
            className="pointer-events-auto relative overflow-hidden"
            style={{
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              background: BG_GLASS,
              border: `1px solid ${CYAN_BORDER}`,
              borderRadius: '8px',
              boxShadow: `0 0 10px ${CYAN_GLOW}, inset 0 0 6px rgb(var(--cyber-cyan-rgb) / 0.04)`,
              minWidth: '220px',
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Scan-line sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, transparent 40%, ' +
                  `${CYAN}10 50%, transparent 60%, transparent 100%)`,
                backgroundSize: '100% 200%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '0% 200%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />

            {/* Neon border glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-[8px] pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 5px ${CYAN_GLOW}, inset 0 0 2px ${CYAN_GLOW}`,
                  `0 0 12px ${CYAN_GLOW}, inset 0 0 5px ${CYAN_GLOW}`,
                  `0 0 5px ${CYAN_GLOW}, inset 0 0 2px ${CYAN_GLOW}`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Corner brackets */}
            <div className="corner-bracket corner-bracket-tl" />
            <div className="corner-bracket corner-bracket-tr" />
            <div className="corner-bracket corner-bracket-bl" />
            <div className="corner-bracket corner-bracket-br" />

            {/* Header */}
            <div className="relative z-20 px-3 pt-2.5 pb-1.5 border-b border-cyan-400/15">
              <span
                className="text-[10px] font-mono font-semibold tracking-widest uppercase"
                style={{ color: CYAN }}
              >
                Звуковой микшер
              </span>
            </div>

            {/* Channel rows */}
            <div className="relative z-20 px-3 py-2 flex flex-col gap-2.5">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div key={channel.id} className="mixer-channel-row flex items-center gap-2">
                    {/* Icon */}
                    <Icon
                      className="size-3.5 shrink-0"
                      style={{ color: CYAN, opacity: 0.75 }}
                    />

                    {/* Label */}
                    <span
                      className="text-[10px] font-mono w-16 shrink-0 truncate"
                      style={{ color: 'rgba(148, 163, 184, 0.8)' }}
                    >
                      {channel.label}
                    </span>

                    {/* Slider */}
                    <Slider
                      value={[channel.value]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => handleValueChange(channel.id, v)}
                      className="flex-1 min-w-[60px] ambient-mixer-slider"
                    />

                    {/* Value % */}
                    <span
                      className="text-[9px] font-mono w-7 text-right shrink-0 tabular-nums"
                      style={{ color: CYAN, opacity: 0.7 }}
                    >
                      {channel.value}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button (always visible) ── */}
      <motion.button
        className={`pointer-events-auto relative flex items-center justify-center rounded-full ${isOpen ? 'mixer-btn-active' : ''}`}
        style={{
          width: '36px',
          height: '36px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: isOpen ? 'rgb(var(--cyber-cyan-rgb) / 0.12)' : 'rgba(8, 14, 24, 0.7)',
          border: `1px solid ${isOpen ? 'rgb(var(--cyber-cyan-rgb) / 0.5)' : CYAN_BORDER}`,
          boxShadow: isOpen
            ? `0 0 12px ${CYAN_GLOW}, 0 0 4px rgb(var(--cyber-cyan-rgb) / 0.2)`
            : `0 0 6px ${CYAN_GLOW}`,
        }}
        onClick={toggleOpen}
        whileHover={{
          boxShadow: `0 0 16px ${CYAN_GLOW}, 0 0 6px rgb(var(--cyber-cyan-rgb) / 0.25)`,
          scale: 1.08,
        }}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? 'Закрыть микшер' : 'Открыть микшер'}
      >
        {/* Breathing glow behind icon */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${CYAN_GLOW} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.12, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <Volume2
          className="size-4 relative z-10"
          style={{ color: CYAN }}
        />
      </motion.button>
    </div>
  );
}