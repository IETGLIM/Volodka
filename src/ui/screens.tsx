/**
 * Экраны: загрузка, главное меню, пауза, настройки, «О сказке».
 * Меню прозрачное — за ним живёт 3D-долина (движок уже работает).
 */
import { useState } from 'react';
import type { Settings } from '../game/types';

/* ================= BOOT ================= */
export function BootScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] cursor-pointer" onClick={onEnter}>
      {/* кинематографичный фон */}
      <picture className="absolute inset-0 h-full w-full">
        <source srcSet="art/boot-wide.jpg" media="(min-aspect-ratio: 4/3)" />
        <img src="art/boot.png" alt="Володька" className="boot-zoom absolute inset-0 h-full w-full object-cover" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/25 to-[#05070f]/55" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <div className="rise-in text-[#f2c14e] tracking-[0.6em] text-sm font-semibold mb-5">✦ &nbsp;СКАЗКА О ПОТЕРЯННЫХ СТРОКАХ&nbsp; ✦</div>
        <h1 className="font-display text-gold-grad rise-in text-6xl md:text-8xl font-bold tracking-wide" style={{ animationDelay: '0.15s' }}>
          ВОЛОДЬКА
        </h1>
        <div className="rise-in ornament-line w-64 my-6" style={{ animationDelay: '0.3s' }} />
        <p className="rise-in font-display italic text-xl md:text-2xl text-[#e9e4d4]/90 max-w-lg" style={{ animationDelay: '0.4s' }}>
          Поэт потерял свои стихи. Долина помнит каждый — осталось дойти.
        </p>
        <div className="rise-in mt-12 flex flex-col items-center gap-2" style={{ animationDelay: '0.6s' }}>
          <span className="pulse-soft text-[#f5eeda] text-lg tracking-[0.2em] uppercase">нажми, чтобы войти в сказку</span>
          <span className="text-[#9fb0d8] text-xs">лучше всего играется в наушниках</span>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN MENU ================= */
export function MainMenu({
  hasSave,
  progress,
  onContinue,
  onNewGame,
  onSettings,
  onAbout,
}: {
  hasSave: boolean;
  progress: { lines: number; finale: boolean } | null;
  onContinue: () => void;
  onNewGame: () => void;
  onSettings: () => void;
  onAbout: () => void;
}) {
  const [confirmNew, setConfirmNew] = useState(false);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-gradient-to-r from-[#04060f]/90 via-[#04060f]/45 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-center pl-[6vw] pr-8">
        <div className="fade-in mb-3 flex items-center gap-3 text-[#f2c14e]/80 text-sm tracking-[0.5em]">
          <span className="ornament-line w-14" /> ЭПИЗОД I
        </div>
        <h1 className="font-display text-gold-grad fade-in text-6xl md:text-7xl font-bold leading-none tracking-wide drop-shadow-[0_4px_30px_rgba(242,193,78,0.25)]">
          ВОЛОДЬКА
        </h1>
        <p className="font-display italic fade-in mt-2 text-xl md:text-2xl text-[#d9cfa8]">сказка о потерянных строках</p>

        <div className="mt-10 flex w-72 flex-col gap-3">
          {hasSave && (
            <button className="btn-hero" onClick={onContinue}>
              <span>⟳</span> Продолжить путь
              {progress && (
                <span className="ml-auto text-[11px] font-normal tracking-normal text-[#e9c97a]/90">
                  {progress.finale ? '✦ финал' : `📜 ${progress.lines}/6`}
                </span>
              )}
            </button>
          )}
          {!confirmNew ? (
            <button className="btn-hero" onClick={() => (hasSave ? setConfirmNew(true) : onNewGame())}>
              <span>✦</span> Новая сказка
            </button>
          ) : (
            <div className="glass rounded-lg p-4 fade-in">
              <p className="text-sm text-[#e9e4d4] leading-snug">Начать с начала? Прежний путь сотрётся безвозвратно.</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost flex-1 justify-center" onClick={() => setConfirmNew(false)}>Отмена</button>
                <button className="btn-ghost flex-1 justify-center !text-[#f2c14e]" onClick={onNewGame}>Стереть и начать</button>
              </div>
            </div>
          )}
          <button className="btn-hero" onClick={onSettings}><span>♫</span> Настройки</button>
          <button className="btn-hero" onClick={onAbout}><span>?</span> О сказке</button>
        </div>

        <div className="fade-in absolute bottom-6 left-[6vw] right-8 flex items-end justify-between text-[11px] text-[#8b9ac0]/80" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col gap-1">
            <span>стихи — Владимир Лебедев · мир, код и звук — братский союз</span>
            <span className="text-[#5f6d95]">долина за этим окном — живая: в ней идёт своя ночь</span>
          </div>
          <span className="text-[#5f6d95]">v1.2 · живая долина · Three.js</span>
        </div>
      </div>
    </div>
  );
}

/* ================= PAUSE ================= */
export function PauseMenu({
  onResume,
  onSettings,
  onMenu,
}: {
  onResume: () => void;
  onSettings: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#04060f]/55 backdrop-blur-[3px]">
      <div className="glass fade-in w-[min(92vw,380px)] rounded-xl p-7 text-center">
        <div className="text-[#f2c14e] text-sm tracking-[0.4em] mb-1">❖</div>
        <h2 className="font-display text-3xl text-[#f5eeda] mb-1">Пауза</h2>
        <p className="text-[11px] text-[#9fb0d8] mb-6 tracking-widest uppercase">долина ждёт тебя</p>
        <div className="flex flex-col gap-3">
          <button className="btn-hero justify-center" onClick={onResume}><span>▶</span> Вернуться</button>
          <button className="btn-hero justify-center" onClick={onSettings}><span>♫</span> Настройки</button>
          <button className="btn-hero justify-center" onClick={onMenu}><span>☾</span> В главное меню</button>
        </div>
      </div>
    </div>
  );
}

/* ================= SETTINGS ================= */
export function SettingsModal({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#04060f]/55 backdrop-blur-[3px]" onClick={onClose}>
      <div className="glass fade-in w-[min(92vw,420px)] rounded-xl p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl text-[#f5eeda]">Настройки</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="flex flex-col gap-5">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9fb0d8]">Музыка — {Math.round(settings.music * 100)}</span>
            <input
              type="range" min={0} max={100} value={Math.round(settings.music * 100)}
              onChange={(e) => set({ music: Number(e.target.value) / 100 })}
              className="mt-2 w-full accent-[#f2c14e]"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9fb0d8]">Звуки — {Math.round(settings.sfx * 100)}</span>
            <input
              type="range" min={0} max={100} value={Math.round(settings.sfx * 100)}
              onChange={(e) => set({ sfx: Number(e.target.value) / 100 })}
              className="mt-2 w-full accent-[#f2c14e]"
            />
          </label>
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#9fb0d8]">Качество</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['high', 'low'] as const).map((q) => (
                <button
                  key={q}
                  className={`btn-ghost justify-center ${settings.quality === q ? '!border-[#f2c14e]/70 !text-[#f2c14e]' : ''}`}
                  onClick={() => set({ quality: q })}
                >
                  {q === 'high' ? 'Высокое ✦' : 'Экономное'}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.hints} onChange={(e) => set({ hints: e.target.checked })} className="accent-[#f2c14e] w-4 h-4" />
            <span className="text-sm text-[#e9e4d4]">Подсказки управления в начале пути</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ================= ABOUT ================= */
export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#04060f]/55 backdrop-blur-[3px]" onClick={onClose}>
      <div className="parchment fade-in w-[min(92vw,560px)] max-h-[86vh] overflow-y-auto rounded-xl p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="font-display text-3xl font-bold">О сказке</h2>
          <button className="btn-ghost !text-[#3a2c14] !border-[#3a2c14]/30" onClick={onClose}>✕</button>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
          <p>
            Володька — поэт. В ночь, когда погасла луна, его стихи разлетелись по долине, а память уснула.
            Остался огонёк-проводник, деревня, старый дуб и шесть строк, которые ждут, когда их соберут в балладу.
          </p>
          <p>
            Это браузерная 3D-сказка: живой мир с циклом дня и ночи, процедурной музыкой, светлячками,
            квестом ветров и стихами, которые возвращают память.
          </p>
        </div>
        <div className="mt-5 ornament-line !bg-[#3a2c14]/30" />
        <h3 className="font-display text-xl font-bold mt-4 mb-2">Управление</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <span><b>W A S D</b> — идти</span>
          <span><b>Shift</b> — бежать</span>
          <span><b>Space</b> — прыжок</span>
          <span><b>V</b> — кувырок-уворот (i-frame)</span>
          <span><b>ЛКМ / F</b> — удар посохом</span>
          <span><b>F x3</b> — комбо из 3 ударов</span>
          <span><b>R</b> — съесть рябину (+35 HP)</span>
          <span><b>Лут</b> — притягивается рядом</span>
          <span><b>Мышь</b> — камера</span>
          <span><b>Колесо</b> — приближение (2.6–12.5 м)</span>
          <span><b>E</b> — взаимодействие</span>
          <span><b>Пробел</b> — дальше (в сценах)</span>
          <span><b>J</b> — журнал стихов</span>
          <span><b>Esc</b> — пауза</span>
        </div>
        <div className="mt-5 ornament-line !bg-[#3a2c14]/30" />
        <p className="mt-4 text-sm italic">
          Стихи — авторское произведение Владимира Лебедева; они — часть сюжета и живут в отдельном файле.
          Долина собрана из кода и света: никаких загрузок, всё звучит процедурно.
        </p>
      </div>
    </div>
  );
}
