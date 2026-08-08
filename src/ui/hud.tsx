/**
 * HUD и оверлеи: компас, квест-карточка, подсказки, тосты, баннеры,
 * диалоги, катсцены и журнал стихов.
 */
import { useEffect, useRef, useState } from 'react';
import type { HudState, DialogueView, CutsceneView, ToastMsg, JournalData } from '../game/types';
import { POEM_TITLE } from '../game/poems';

/* ================= typewriter ================= */
function useTypewriter(text: string, speed = 20) {
  const [len, setLen] = useState(0);
  const complete = len >= text.length;
  useEffect(() => {
    setLen(0);
    if (speed <= 0) { setLen(text.length); return; }
    const iv = window.setInterval(() => {
      setLen((l) => {
        if (l >= text.length) { window.clearInterval(iv); return l; }
        return l + 1;
      });
    }, speed);
    return () => window.clearInterval(iv);
  }, [text, speed]);
  return { text: text.slice(0, len), complete, skip: () => setLen(text.length) };
}

/* ================= зерно ================= */
export function Grain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = 140;
    cv.height = 140;
    const img = ctx.createImageData(140, 140);
    let raf = 0;
    const draw = () => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="grain-layer" style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />;
}

/* ================= HUD ================= */
export function HUD({ hud, onInteract }: { hud: HudState | null; onInteract: () => void }) {
  if (!hud) return null;
  const degCl = Math.max(-80, Math.min(80, hud.objDeg));
  const hpPct = hud.maxHp > 0 ? hud.hp / hud.maxHp : 1;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* квест-карточка */}
      <div className="absolute left-5 top-5 quest-card">
        <div className="glass rounded-lg px-4 py-3 max-w-[300px]">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f2c14e]">{hud.objectiveTitle}</div>
          <div className="mt-1.5 text-sm leading-snug text-[#efe9d8]">{hud.objectiveText}</div>
          <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#8fa0c8]">
            <span>{hud.timeLabel}</span><span>·</span><span>день {hud.day}</span>
          </div>
        </div>
      </div>

      {/* счётчики + здоровье */}
      <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
        <div className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-black/50">
            <div className="h-full transition-all duration-300" style={{ width: `${hpPct * 100}%`, background: hpPct > 0.5 ? '#f2c14e' : hpPct > 0.25 ? '#e88a4a' : '#e84a4a' }} />
          </div>
          <span className="text-xs font-semibold text-[#f5eeda]">❤ {Math.round(hud.hp)}</span>
        </div>
        <div className="glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#f5eeda]">📜 строки {hud.stanzas}<span className="text-[#8fa0c8]">/{hud.totalStanzas}</span></div>
        {(hud.fireflies > 0 || hud.finale) && (
          <div className="glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#f5eeda]">✨ светлячки {hud.fireflies}<span className="text-[#8fa0c8]">/{hud.totalFireflies}</span></div>
        )}
        {(hud.lanterns > 0 || hud.finale) && (
          <div className="glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#f5eeda]">🏮 фонари {hud.lanterns}<span className="text-[#8fa0c8]">/{hud.totalLanterns}</span></div>
        )}
        {hud.enemies > 0 && (
          <div className="glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#ff8a6a]">👁 тени {hud.enemies}</div>
        )}
        {(hud.lootEssence > 0 || hud.lootBerries > 0 || hud.lootShards > 0 || hud.lootBark > 0) && (
          <div className="glass flex items-center gap-3 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#f5eeda]">
            <span title="Эхо строки" className="text-[#8fd8ff]">✦ {hud.lootEssence}</span>
            <span title="Рябиновая ягода" className="text-[#e87970]">● {hud.lootBerries}</span>
            <span title="Лунный осколок" className="text-[#b7a8ff]">◆ {hud.lootShards}</span>
            <span title="Живая кора" className="text-[#9acb80]">❧ {hud.lootBark}</span>
          </div>
        )}
      </div>

      {/* компас */}
      {hud.objDist > 4 && (
        <div className="absolute left-1/2 top-5 flex -translate-x-1/2 flex-col items-center">
          <div className="relative h-9 w-64">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/12" />
            <div className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-[#f2c14e]/70" />
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-transform duration-300"
              style={{ left: `calc(50% + ${(degCl / 90) * 45}% - 6px)`, transform: `translateY(-50%) rotate(${hud.objDeg}deg)` }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" className="drop-shadow-[0_0_6px_rgba(242,193,78,0.8)]">
                <path d="M6 0 L11 12 L6 9.2 L1 12 Z" fill="#f2c14e" />
              </svg>
            </div>
          </div>
          <div className="mt-0.5 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-semibold text-[#f5eeda]">{Math.round(hud.objDist)} м</div>
        </div>
      )}

      {/* атака подсказка */}
      <div className="absolute bottom-5 left-5 flex items-center gap-2">
        <div className="glass rounded-full px-3 py-1.5 text-[11px] text-[#e9e4d4]">🪄 <b>ЛКМ</b> / <b>F</b> — удар посохом</div>
        <div className="glass rounded-full px-3 py-1.5 text-[11px] text-[#e9e4d4]"><b>Space</b> — прыжок · <b>V</b> — кувырок · <b>R</b> — рябина</div>
      </div>

      {/* поплавок рыбалки */}
      {hud.fishing && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors duration-200 ${hud.fishing.phase === 'bite' ? 'border-[#ff6a5a] bg-[#ff6a5a]/20' : hud.fishing.phase === 'wait' ? 'border-[#7fd8ff]/60 bg-[#7fd8ff]/10' : 'border-[#f2c14e]/50 bg-[#f2c14e]/10'}`}>
            <span className={`text-2xl ${hud.fishing.phase === 'bite' ? 'animate-ping text-[#ff8a7a]' : hud.fishing.phase === 'wait' ? 'text-[#7fd8ff]' : 'text-[#f2c14e]'}`}>🎣</span>
            {hud.fishing.phase === 'bite' && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#ff6a5a]/60" />
                <span className="absolute -inset-3 rounded-full border border-[#ff6a5a]/30" style={{ animation: 'rippleRing 1.1s ease-out infinite' }} />
              </>
            )}
          </div>
          {hud.fishing.phase === 'bite' && (
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ff8a7a]">Клюёт! Жми E</span>
          )}
          {hud.fishing.phase === 'wait' && (
            <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] text-[#9fd8f2]">Ждём поклёвку...</span>
          )}
          {hud.fishing.phase === 'cast' && (
            <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] text-[#e9e4d4]">Заброс...</span>
          )}
        </div>
      )}

      {/* подсказка взаимодействия */}
      {hud.prompt && (
        <button
          onClick={onInteract}
          className="prompt-pill pointer-events-auto absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-2.5 text-[#f5eeda]"
        >
          <span className="text-lg leading-none">{hud.prompt.icon}</span>
          <span className="text-sm font-semibold tracking-wide">{hud.prompt.text}</span>
          <span className="keycap">E</span>
        </button>
      )}
    </div>
  );
}

/* ================= подсказка управления ================= */
export function ControlsHint({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(visible);
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setShow(false), 30000);
    return () => window.clearTimeout(t);
  }, [visible]);
  if (!visible || !show) return null;
  return (
    <div className="glass fade-in pointer-events-none absolute bottom-5 right-5 z-30 rounded-lg px-4 py-3 text-[11px] leading-relaxed text-[#b9c4e0]">
      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[#f5eeda]">
        <span className="keycap">W</span><span className="keycap">A</span><span className="keycap">S</span><span className="keycap">D</span>
        <span className="ml-1">— идти</span>
        <span className="ml-2 keycap">⇧</span><span className="ml-1">— бег</span>
        <span className="ml-2 keycap">Space</span><span className="ml-1">— прыжок</span>
        <span className="ml-2 keycap">V</span><span className="ml-1">— кувырок</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="keycap">ЛКМ</span>/<span className="keycap">F</span><span className="ml-1">— удар посохом (комбо x3)</span>
        <span className="ml-2 keycap">R</span><span className="ml-1">— съесть рябину (+35)</span>
        <span className="ml-2 keycap">E</span><span className="ml-1">— взаимодействие</span>
        <span className="ml-2 keycap">J</span><span className="ml-1">— журнал</span>
        <span className="ml-2 text-[#8fa0c8]">колесо — камера</span>
      </div>
    </div>
  );
}

/* ================= тосты ================= */
export function Toasts({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-30 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="toast-anim glass flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-[#f5eeda]">
          <span className="text-lg leading-none">{t.icon}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ================= баннер главы ================= */
export function BannerView({ banner }: { banner: { text: string; id: number } | null }) {
  if (!banner) return null;
  return (
    <div key={banner.id} className="pointer-events-none fixed inset-x-0 top-[24%] z-40 flex justify-center">
      <div className="banner-anim flex flex-col items-center gap-3 px-6 text-center">
        <div className="text-[#f2c14e] tracking-[0.6em] text-sm">✦ ✦ ✦</div>
        <h2 className="font-display text-gold-grad text-4xl md:text-6xl font-bold tracking-[0.28em] uppercase">{banner.text}</h2>
        <div className="ornament-line w-56" />
      </div>
    </div>
  );
}

/* ================= диалог ================= */
export function DialogueBox({
  view,
  onNext,
  onChoose,
}: {
  view: DialogueView;
  onNext: () => void;
  onChoose: (idx: number) => void;
}) {
  const { text, complete, skip } = useTypewriter(view.text, 18);
  const handleClick = () => {
    if (!complete) { skip(); return; }
    if (view.choices.length === 0) onNext();
  };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6">
      <div className="glass pointer-events-auto w-full max-w-2xl cursor-pointer rounded-xl p-5" onClick={handleClick}>
        <div className="flex items-start gap-4">
          {view.portrait ? (
            <img src={view.portrait} alt={view.speaker} className="h-16 w-16 shrink-0 rounded-full border-2 border-[#f2c14e]/50 object-cover shadow-[0_0_20px_rgba(242,193,78,0.25)]" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#f2c14e]/40 bg-[#1a2140] text-2xl">✦</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#f2c14e]">{view.speaker}</div>
            <p className="font-display mt-1.5 min-h-[3.4em] text-lg leading-relaxed text-[#f5eeda] md:text-xl">
              {text}
              {!complete && <span className="caret" />}
            </p>
          </div>
        </div>
        {complete && view.choices.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
            {view.choices.map((c, i) => (
              <button
                key={i}
                className="btn-ghost !text-[#f2c14e] !border-[#f2c14e]/40 hover:!bg-[#f2c14e]/10"
                onClick={(e) => { e.stopPropagation(); onChoose(c.idx); }}
              >
                {c.label} →
              </button>
            ))}
          </div>
        )}
        {complete && view.choices.length === 0 && (
          <div className="mt-2 text-right text-[11px] uppercase tracking-[0.25em] text-[#8fa0c8]">кликни, чтобы продолжить ▸</div>
        )}
      </div>
    </div>
  );
}

/* ================= катсцена ================= */
export function CutsceneOverlay({
  view,
  onNext,
  onSkip,
}: {
  view: CutsceneView;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { text, complete, skip } = useTypewriter(view.text, 22);
  const { text: verseText, complete: verseDone, skip: verseSkip } = useTypewriter(view.verse ?? '', 30);
  const handleClick = () => {
    if (view.verse) {
      if (!verseDone) { verseSkip(); return; }
    } else if (!complete) { skip(); return; }
    onNext();
  };
  return (
    <div className="letterbox-on fixed inset-0 z-[60] cursor-pointer" onClick={handleClick}>
      <div className="letterbox-top" />
      <div className="letterbox-bottom" />
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: view.total }).map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i <= view.idx ? 'bg-[#f2c14e]' : 'bg-white/20'}`} />
          ))}
        </div>
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); onSkip(); }}>Пропустить ⏭</button>
      </div>

      {view.verse ? (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="parchment rise-in w-full max-w-lg rounded-lg px-8 py-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
            <div className="text-[11px] uppercase tracking-[0.4em] text-[#8a6a2e]">✦ {POEM_TITLE} ✦</div>
            <div className="mt-1 text-[11px] italic tracking-widest text-[#8a6a2e]">— {view.speaker} —</div>
            <p className="font-display mt-4 whitespace-pre-line text-xl leading-relaxed font-medium text-[#3a2c14]">
              {verseText}
              {!verseDone && <span className="caret" />}
            </p>
            <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-[#8a6a2e]/70">{view.idx + 1} / {view.total}</div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-14">
          <div className="max-w-3xl text-center">
            {view.portrait ? (
              <img src={view.portrait} alt={view.speaker} className="mx-auto mb-3 h-14 w-14 rounded-full border-2 border-[#f2c14e]/50 object-cover" />
            ) : (
              <div className="font-display text-sm uppercase tracking-[0.4em] text-[#f2c14e]">{view.speaker}</div>
            )}
            <p className="font-display text-xl leading-relaxed text-[#f5eeda] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] md:text-2xl">
              {text}
              {!complete && <span className="caret" />}
            </p>
            <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/40">{view.idx + 1} / {view.total} · клик — дальше</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= журнал ================= */
export function JournalModal({ data, onClose }: { data: JournalData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060f]/60 backdrop-blur-[3px]" onClick={onClose}>
      <div className="parchment fade-in flex max-h-[88vh] w-[min(94vw,760px)] flex-col rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#3a2c14]/20 px-8 pb-4 pt-6">
          <div>
            <h2 className="font-display text-3xl font-bold">Журнал странника</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#8a6a2e]">{data.timeLabel} · день {data.day}</p>
          </div>
          <button className="btn-ghost !border-[#3a2c14]/30 !text-[#3a2c14]" onClick={onClose}>✕ (Esc)</button>
        </div>
        <div className="overflow-y-auto px-8 py-6">
          <h3 className="font-display text-2xl font-bold text-[#5a3f16]">{POEM_TITLE}</h3>
          <div className="mt-4 flex flex-col gap-4">
            {data.stanzas.map((s, i) => (
              <div key={i} className={`rounded-lg border p-4 ${s.found ? 'border-[#3a2c14]/25 bg-[#3a2c14]/5' : 'border-dashed border-[#3a2c14]/20 bg-transparent'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-semibold text-[#5a3f16]">{s.found ? s.title : 'Строка ещё в долине'}</span>
                  <span className="text-[11px] italic text-[#8a6a2e]">{s.found ? s.place : '· · ·'}</span>
                </div>
                {s.found ? (
                  <p className="font-display mt-2 whitespace-pre-line text-[17px] leading-relaxed italic text-[#3a2c14]">{s.lines.join('\n')}</p>
                ) : (
                  <p className="font-display mt-2 text-[17px] italic text-[#8a6a2e]/60">«...скоро здесь зазвучат строки...»</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#3a2c14]/20 p-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a6a2e]">Дары долины</h4>
              <p className="mt-2 text-sm">✨ Светлячки — {data.fireflies}/{data.totalFireflies}</p>
              <p className="mt-1 text-sm">🏮 Фонари — {data.lanterns}/{data.totalLanterns}</p>
              <p className="mt-2 text-xs italic text-[#8a6a2e]">Собери 12 огоньков — Милица приготовила награду.</p>
            </div>
            <div className="rounded-lg border border-[#3a2c14]/20 p-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a6a2e]">Спутники</h4>
              <p className="mt-2 text-sm">{data.metStarets ? '☀ Старец — благословил путь' : '☀ Старец — ждёт у дуба'}</p>
              <p className="mt-1 text-sm">{data.catBack ? '🐱 Барсик — дома, мурчит' : '🐱 Барсик — гуляет у пруда'}</p>
              <p className="mt-1 text-sm">🐐 Маланья — страж мельничного холма</p>
            </div>
          </div>

          {data.finale && (
            <div className="mt-5 rounded-lg border border-[#3a2c14]/30 bg-[#f2c14e]/15 p-4 text-center">
              <p className="font-display text-lg italic">«Сказка рассказана. Строки снова вместе — и теперь они навсегда твои.»</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
