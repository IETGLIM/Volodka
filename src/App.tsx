/**
 * ВОЛОДЬКА — сказка о потерянных строках.
 * Оркестрация: канвас с 3D-миром + все оверлеи интерфейса.
 */
import { useEffect, useRef, useState } from 'react';
import { Game, loadSettings } from './game/engine';
import type { GameEvents, HudState, DialogueView, CutsceneView, ToastMsg, Settings, JournalData } from './game/types';
import { BootScreen, MainMenu, PauseMenu, SettingsModal, AboutModal } from './ui/screens';
import { HUD, DialogueBox, CutsceneOverlay, Toasts, BannerView, JournalModal, ControlsHint } from './ui/hud';

type Phase = 'boot' | 'menu' | 'game';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [phase, setPhase] = useState<Phase>('boot');
  const [hud, setHud] = useState<HudState | null>(null);
  const [dialogue, setDialogue] = useState<DialogueView | null>(null);
  const [cutscene, setCutscene] = useState<CutsceneView | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [banner, setBanner] = useState<{ text: string; id: number } | null>(null);
  const [fade, setFade] = useState(0);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalData, setJournalData] = useState<JournalData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [hasSave, setHasSave] = useState(false);
  const [menuProgress, setMenuProgress] = useState<{ lines: number; finale: boolean } | null>(null);
  const toastId = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const events: GameEvents = {
      hud: setHud,
      dialogue: setDialogue,
      cutscene: setCutscene,
      toast: (t) => {
        const id = ++toastId.current;
        setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
      },
      banner: (text) => setBanner({ text, id: Date.now() }),
      fade: setFade,
      pause: setPauseOpen,
      journal: (open) => {
        setJournalOpen(open);
        if (open) setJournalData(gameRef.current?.getJournalData() ?? null);
      },
    };
    const game = new Game(canvas, events);
    gameRef.current = game;
    setHasSave(game.hasSave());
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  // Esc закрывает журнал
  useEffect(() => {
    if (!journalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setJournalOpen(false);
        gameRef.current?.setJournalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [journalOpen]);

  const enterBoot = () => {
    const g = gameRef.current;
    if (!g) return;
    g.audio.unlock();
    g.startMenu();
    setPhase('menu');
    setMenuProgress(g.hasSave() ? g.getMenuProgress() : null);
  };

  const newGame = () => {
    const g = gameRef.current;
    if (!g) return;
    g.newGame();
    setPhase('game');
    setHasSave(true);
  };

  const continueGame = () => {
    const g = gameRef.current;
    if (!g) return;
    g.continueGame();
    setPhase('game');
  };

  const toMenu = () => {
    gameRef.current?.toMenu();
    setPhase('menu');
    setHasSave(true);
  };

  const updateSettings = (s: Settings) => {
    setSettings(s);
    gameRef.current?.setSettings(s);
  };

  const openSettings = () => {
    setSettingsOpen(true);
    gameRef.current?.audio.click();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0b0f1e]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="vignette" />

      {/* фейды */}
      <div className="pointer-events-none fixed inset-0 z-[70] bg-black" style={{ opacity: fade }} />

      {/* игра */}
      {phase === 'game' && !cutscene && <HUD hud={hud} onInteract={() => gameRef.current?.doInteract()} />}
      {phase === 'game' && <ControlsHint visible={phase === 'game' && !cutscene} />}
      <Toasts toasts={toasts} />
      <BannerView banner={banner} />

      {/* диалог */}
      {dialogue && !cutscene && (
        <DialogueBox
          view={dialogue}
          onNext={() => gameRef.current?.dialogueNext()}
          onChoose={(i) => gameRef.current?.dialogueChoose(i)}
        />
      )}

      {/* катсцена */}
      {cutscene && (
        <CutsceneOverlay
          view={cutscene}
          onNext={() => gameRef.current?.cutsceneNext()}
          onSkip={() => gameRef.current?.cutsceneSkip()}
        />
      )}

      {/* журнал */}
      {journalOpen && journalData && (
        <JournalModal data={journalData} onClose={() => { setJournalOpen(false); gameRef.current?.setJournalOpen(false); }} />
      )}

      {/* пауза */}
      {phase === 'game' && pauseOpen && !journalOpen && (
        <PauseMenu
          onResume={() => gameRef.current?.resume()}
          onSettings={openSettings}
          onMenu={toMenu}
        />
      )}

      {/* настройки */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* о сказке */}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {/* меню */}
      {phase === 'menu' && (
        <MainMenu
          hasSave={hasSave}
          progress={menuProgress}
          onContinue={continueGame}
          onNewGame={newGame}
          onSettings={openSettings}
          onAbout={() => setAboutOpen(true)}
        />
      )}

      {/* загрузка */}
      {phase === 'boot' && <BootScreen onEnter={enterBoot} />}
    </div>
  );
}
