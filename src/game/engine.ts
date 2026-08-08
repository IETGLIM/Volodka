/**
 * ВОЛОДЬКА — игровой движок с боёвкой.
 * Сцена, камера, цикл дня/ночи, огонёк-проводник, квесты,
 * катсцены, диалоги, мобы, анимированная боёвка посохом, сейвы и HUD.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { World } from './world';
import { FX } from './fx';
import { Player } from './player';
import { Npc } from './npcs';
import type { NpcKind } from './npcs';
import { Enemy } from './combat';
import { LootSystem } from './loot';
import { AudioEngine } from './audio';
import { clamp, lerp, smooth, ease, rand, TAU } from './utils';
import type { V3 } from './utils';
import { computeObjective, DEFAULT_STATE, TARGETS, hasStanza } from './quests';
import type { GameState } from './quests';
import { staretsDialogue, milicaDialogue, melnikDialogue, kotDialogue, kozaDialogue, villagerDialogue } from './dialogue';
import type { DialogueDef } from './dialogue';
import { getChapter } from './cutscenes';
import type { CSLine } from './cutscenes';
import { STANZAS } from './poems';
import type { GameEvents, HudState, JournalData, Settings, DialogueView, CutsceneView } from './types';

const SETTINGS_KEY = 'volodka-settings-v1';
const SAVE_KEY = 'volodka-save-v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Settings>;
      return { music: s.music ?? 0.7, sfx: s.sfx ?? 0.8, quality: s.quality === 'low' ? 'low' : 'high', hints: s.hints ?? true };
    }
  } catch { /* ignore */ }
  return { music: 0.7, sfx: 0.8, quality: 'high', hints: true };
}
export function saveSettings(s: Settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

interface InteractDef {
  pos: V3;
  r: number;
  icon: string;
  prompt: string;
  show: () => boolean;
  do: () => void;
  npc?: Npc | Enemy;
}

interface SaveData {
  stanzas: number[];
  fireflies: number;
  lanterns: number;
  metStarets: boolean;
  catBack: boolean;
  catQuestStarted: boolean;
  fireflyReward: boolean;
  finale: boolean;
  tDay: number;
  day: number;
  lootEssence?: number;
  lootBerries?: number;
  lootShards?: number;
  lootBark?: number;
}

const CHAPTER_NAMES: Record<string, string> = {
  prologue: 'Пролог',
  ch0: 'Глава I — Колодец строк',
  ch1: 'Глава II — Светлячковая поляна',
  ch2: 'Глава III — Мельница ветров',
  ch3: 'Глава IV — Зеркало пруда',
  ch4: 'Глава V — Старый дуб',
  ch5: 'Глава VI — Лунная поляна',
  epilogue: 'Эпилог',
};

export class Game {
  private canvas: HTMLCanvasElement;
  private events: GameEvents;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private ssao: SSAOPass | null = null;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private world!: World;
  private fx!: FX;
  private player!: Player;
  private npcs: Npc[] = [];
  private kot!: Npc;
  audio = new AudioEngine();

  mode: 'menu' | 'play' = 'menu';
  private paused = false;
  private journalOpen = false;
  private settings: Settings;

  private state: GameState = { ...DEFAULT_STATE };
  private tDay = 0.37;
  private day = 1;
  private sunDir = new THREE.Vector3(0.4, 0.7, 0.5);

  private keys = new Set<string>();
  private jumpQueued = false;
  private rollQueued = false;
  private attackQueued = false;
  private camYaw = 0.6;
  private camPitch = 0.3;
  private camDist = 6.6;
  private camTargetDist = 6.6;
  private menuDist = 34;
  private camPos = new THREE.Vector3(0, 3, 20);
  private lookTarget = new THREE.Vector3(0, 1.6, 14);
  private dragging = false;
  private lastPX = 0;
  private lastPY = 0;
  private downX = 0;
  private downY = 0;
  private downTime = 0;

  private enemies: Enemy[] = [];
  private loot!: LootSystem;
  private lootEssence = 0;
  private lootBerries = 0;
  private lootShards = 0;
  private lootBark = 0;
  private playerHurtCd = 0;
  private playerDead = false;
  private shakeT = 0;
  private shakeStr = 0;
  private enemiesClearedToast = false;
  private fishing: { phase: 'cast' | 'wait' | 'bite' | 'success' | 'fail'; t: number } | null = null;
  private fishCd = 0;
  private splashT = 0;
  private dustT = 0;
  private rainNext = 50;
  private rainDur = 0;
  private rainLevel = 0;
  private thunderT = 0;

  private interactables = new Map<string, InteractDef>();
  private activePrompt: { icon: string; text: string } | null = null;

  private wisp: THREE.Group;
  private wispLight: THREE.PointLight;
  private beam: THREE.Mesh;
  private beamMat: THREE.MeshBasicMaterial;

  private cutscene: { lines: CSLine[]; idx: number; lineT: number } | null = null;
  private pendingCb: (() => void) | null = null;
  private dialogue: { def: DialogueDef; idx: number } | null = null;

  private fade: { v: number; to: number; speed: number; cb: (() => void) | null; done: boolean } = { v: 0, to: 0, speed: 1.4, cb: null, done: true };
  private hudTimer = 0;
  private lastHud = '';
  private stepT = 0;
  private trailT = 0;
  private crackleT = 0;
  private kotFollow = false;
  private kotFollowPos = new THREE.Vector3();
  private prevElev = 0;
  private tGlobal = 0;

  // Скретч-векторы для главного цикла: одна аллокация вместо тысяч в секунду.
  private _tmpV = new THREE.Vector3();
  private _tmpV2 = new THREE.Vector3();
  private _heightFn = (x: number, z: number) => this.world.heightAt(x, z);
  private _aliveCount = 0;

  constructor(canvas: HTMLCanvasElement, events: GameEvents) {
    this.canvas = canvas;
    this.events = events;
    this.settings = loadSettings();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 900);
    this.camera.position.copy(this.camPos);
    this.scene.fog = new THREE.FogExp2(new THREE.Color('#241f4a'), 0.0042);

    this.world = new World(this.scene);
    this.fx = new FX(this.scene);
    this.fx.setFireflies(this.world.fireflyAnchors);
    this.fx.addEmitter((_dt, t, spawn) => {
      void t;
      const p = new THREE.Vector3(this.world.firePos[0], this.world.firePos[1] + 0.55, this.world.firePos[2]);
      spawn(p, new THREE.Vector3(rand(-0.15, 0.15), rand(0.7, 1.5), rand(-0.15, 0.15)), rand(0.6, 1.5), new THREE.Color('#ff9a3d'), rand(0.08, 0.16));
    });
    this.loot = new LootSystem(this.scene, (x, z) => this.world.heightAt(x, z));

    this.player = new Player((x, z) => this.world.heightAt(x, z));
    this.scene.add(this.player.group);
    this.player.group.visible = false;
    this.player.onJump = () => {
      this.audio.jump();
      this.fx.burst(this.player.pos.clone(), 0xc9bda0, 6, 1.3);
    };
    this.player.onLand = (impact) => {
      if (impact > 3) {
        this.audio.land();
        this.fx.burst(this.player.pos.clone(), 0x9a8a6a, 9, 1.6);
      }
    };
    this.player.onRoll = () => {
      this.audio.whoosh();
      this.fx.burst(this.player.pos.clone(), 0xa89878, 12, 1.8);
    };
    this.player.onSwing = (combo) => {
      this.audio.swing(combo);
      // лёгкая отдача камеры
      this.shakeT = 0.12;
      this.shakeStr = combo === 2 ? 0.22 : 0.1;
    };
    this.player.onHit = () => {
      // вызывается при каждом успешном попадании — можно ставить хитстоп
    };
    this.player.onHurt = () => {
      this.audio.playerHurt();
      this.shakeT = 0.35;
      this.shakeStr = 0.5;
      this.fx.burst(this.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff5a4a, 14, 2.2);
    };

    // NPC
    const mkNpc = (kind: NpcKind, home: V3, radius: number) => {
      const n = new Npc(kind, home, radius, (x, z) => this.world.heightAt(x, z));
      this.scene.add(n.group);
      this.npcs.push(n);
      return n;
    };
    mkNpc('starets', TARGETS.starets, 3.5);
    mkNpc('milica', TARGETS.milica, 5);
    mkNpc('melnik', [-29, 0, -36], 4);
    mkNpc('villager1', [-2, 0, 6.5], 7);
    mkNpc('villager2', [7.5, 0, 2.5], 7);
    this.kot = mkNpc('kot', TARGETS.cat, 2.5);
    mkNpc('koza', [-34.5, 0, -41], 5);

    // Мобы — тени и кустовые стражники
    this.spawnEnemies();

    // огонёк-проводник
    this.wisp = new THREE.Group();
    const wispMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff3c0' }));
    this.wisp.add(wispMesh);
    const wt = document.createElement('canvas');
    wt.width = wt.height = 64;
    const wg = wt.getContext('2d')!;
    const wgrad = wg.createRadialGradient(32, 32, 2, 32, 32, 32);
    wgrad.addColorStop(0, 'rgba(255,244,200,0.95)');
    wgrad.addColorStop(0.4, 'rgba(255,214,120,0.3)');
    wgrad.addColorStop(1, 'rgba(0,0,0,0)');
    wg.fillStyle = wgrad;
    wg.fillRect(0, 0, 64, 64);
    const wispSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(wt), color: '#ffe9a8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    wispSprite.scale.setScalar(3.2);
    this.wisp.add(wispSprite);
    this.wispLight = new THREE.PointLight('#ffd9a0', 1.3, 9, 2);
    this.wisp.add(this.wispLight);
    this.wisp.visible = false;
    this.scene.add(this.wisp);

    // луч цели
    this.beamMat = new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.5, 46, 8, 1, true), this.beamMat);
    this.beam.position.y = 23;
    this.beam.visible = false;
    this.scene.add(this.beam);

    this.registerInteractions();
    this.applyQuality();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);

    this.loop();
  }

  private spawnEnemies() {
    // очищаем старых
    for (const e of this.enemies) this.scene.remove(e.group);
    this.enemies = [];
    this._aliveCount = 0;
    this.enemiesClearedToast = false;

    const mk = (kind: 'ten' | 'kust', x: number, z: number, r: number, scale = 1) => {
      const pos = new THREE.Vector3(x, 0, z);
      const e = new Enemy(kind, pos, r, this._heightFn, scale);
      this.scene.add(e.group);
      this.enemies.push(e);
      this._aliveCount++;
    };

    // поляна и лес вокруг — тени потерянных строк
    mk('ten', -18, 28, 9, 1.05);
    mk('ten', -24, 21, 8, 1.0);
    mk('ten', -12, 34, 7, 0.95);
    mk('kust', -28, 30, 7, 1.0);
    mk('kust', -8, 38, 6, 0.9);

    // у пруда — кустовые стражники
    mk('kust', 28, -18, 6, 1.0);
    mk('ten', 34, -22, 7, 1.05);

    // дорога к мельнице — тени
    mk('ten', -26, -32, 8, 1.1);
    mk('ten', -36, -42, 7, 1.0);
    mk('kust', -32, -48, 6, 0.95);

    // дальний восток и дубовая роща
    mk('ten', 22, -28, 9, 1.0);
    mk('kust', 18, 12, 7, 0.9);
    mk('ten', 24, -8, 8, 1.0);

    // лунная поляна — финальная стража
    mk('ten', 4, 54, 9, 1.15);
    mk('ten', -2, 58, 8, 1.1);
  }

  // ================= INPUT =================
  private onKeyDown = (e: KeyboardEvent) => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === 'KeyE' && this.mode === 'play' && !this.paused && !this.journalOpen && !this.cutscene && !this.dialogue) {
      if (this.fishing && this.fishing.phase === 'bite') this.catchFish();
      else this.doInteract();
    }
    if (e.code === 'Space') {
      if (this.cutscene) this.cutsceneNext();
      else if (this.mode === 'play' && !this.paused && !this.journalOpen && !this.dialogue) this.jumpQueued = true;
    }
    if (e.code === 'KeyV' && this.mode === 'play' && !this.paused && !this.journalOpen && !this.cutscene && !this.dialogue) {
      this.rollQueued = true;
    }
    if ((e.code === 'KeyF' || e.code === 'KeyX') && this.mode === 'play' && !this.paused && !this.journalOpen && !this.cutscene && !this.dialogue) {
      this.attackQueued = true;
    }
    if (e.code === 'KeyR' && this.mode === 'play' && !this.paused && !this.journalOpen && !this.cutscene && !this.dialogue) {
      this.useBerry();
    }
    if (e.code === 'KeyJ' && this.mode === 'play' && !this.paused && !this.cutscene && !this.dialogue) {
      this.events.journal(true);
      this.journalOpen = true;
    }
    if (e.code === 'Escape') {
      if (this.journalOpen) {
        this.journalOpen = false;
        this.events.journal(false);
        return;
      }
      if (this.dialogue) { this.closeDialogue(); return; }
      if (this.cutscene) { this.cutsceneSkip(); return; }
      if (this.mode === 'play') {
        this.paused = !this.paused;
        this.events.pause(this.paused);
        if (!this.paused) this.audio.click();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true;
    this.lastPX = this.downX = e.clientX;
    this.lastPY = this.downY = e.clientY;
    this.downTime = performance.now();
    // правая кнопка — всегда камера
    if (e.button === 2) return;
  };
  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPX;
    const dy = e.clientY - this.lastPY;
    this.lastPX = e.clientX;
    this.lastPY = e.clientY;
    if (this.mode !== 'play' || this.paused) return;
    if (this.cutscene) return;
    // если зажата правая кнопка или движение значительное — камера
    if (e.buttons === 2 || Math.hypot(dx, dy) > 2) {
      this.camYaw -= dx * 0.005;
      this.camPitch = clamp(this.camPitch + dy * 0.004, 0.06, 1.12);
    }
  };
  private onPointerUp = (e: PointerEvent) => {
    const dt = performance.now() - this.downTime;
    const dist = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
    const wasClick = dt < 280 && dist < 12 && e.button === 0;
    this.dragging = false;
    if (wasClick && this.mode === 'play' && !this.paused && !this.journalOpen && !this.cutscene && !this.dialogue) {
      // Во время «поклёвки» клик = подсечка (как и E), а не пустой удар.
      if (this.fishing && this.fishing.phase === 'bite') {
        this.catchFish();
      } else {
        this.attackQueued = true;
      }
    }
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (this.mode === 'menu') {
      this.menuDist = clamp(this.menuDist + e.deltaY * 0.02, 22, 52);
    } else {
      this.camTargetDist = clamp(this.camTargetDist + e.deltaY * 0.006, 2.6, 12.5);
    }
  };
  private onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
  };

  // ================= INTERACTIONS =================
  private registerInteractions() {
    const add = (id: string, def: InteractDef) => this.interactables.set(id, def);
    for (let i = 0; i < 6; i++) {
      const idx = i;
      add(`scroll${i}`, {
        pos: this.world.getScrollPos(i),
        r: 1.9,
        icon: '📜',
        prompt: 'Взять строку',
        show: () => !this.world.isScrollCollected(idx) && idx === this.nextStanza() && (idx > 0 || this.state.metStarets),
        do: () => this.collectStanza(idx),
      });
    }
    const talk = (id: string, npc: Npc, prompt: string, fn: () => void) =>
      add(id, { pos: [npc.group.position.x, 0, npc.group.position.z], r: 2.8, icon: '💬', prompt, show: () => true, do: fn, npc });
    talk('starets', this.npcs[0], 'Поговорить со Старцем', () => this.startDialogue(staretsDialogue(this.state)));
    talk('milica', this.npcs[1], 'Поговорить с Милицей', () => this.startDialogue(milicaDialogue(this.state)));
    talk('melnik', this.npcs[2], 'Поговорить с Пахомом', () => this.startDialogue(melnikDialogue(this.state)));
    talk('v1', this.npcs[3], 'Поговорить', () => this.startDialogue(villagerDialogue()));
    talk('v2', this.npcs[4], 'Поговорить', () => this.startDialogue(villagerDialogue()));

    add('kot', {
      pos: TARGETS.cat,
      r: 2.2,
      icon: '🐱',
      prompt: 'Подойти к Барсику',
      show: () => !this.state.catBack,
      do: () => {
        if (this.kotFollow && this.nearMilica()) this.executeEffect('returnCat');
        else this.startDialogue(kotDialogue(this.state));
      },
      npc: this.kot,
    });
    add('koza', { pos: [-34.5, 0, -41], r: 2.2, icon: '🐐', prompt: 'Подойти к Маланье', show: () => true, do: () => this.startDialogue(kozaDialogue()), npc: this.npcs[6] });

    this.world.getQuestLanterns().forEach((l, i) => {
      add(`lantern${i}`, {
        pos: l.pos,
        r: 2.4,
        icon: '🏮',
        prompt: 'Зажечь фонарь',
        show: () => !l.on,
        do: () => {
          l.set(true);
          this.state.lanterns++;
          this.audio.lantern();
          this.toast('🏮', `Фонарь зажжён (${this.state.lanterns}/5)`);
          if (this.state.lanterns >= 5) {
            this.world.startMill();
            this.audio.whoosh();
            this.banner('Ветер вернулся в долину!');
            this.toast('🌾', 'Крылья мельницы ожили');
          }
          this.save();
        },
      });
    });

    this.world.fireflyAnchors.forEach((a, i) => {
      add(`fly${i}`, {
        pos: [a.x, a.y + 1.1, a.z],
        r: 1.7,
        icon: '✨',
        prompt: 'Поймать светлячка',
        show: () => this.state.fireflies < 12 && this.sunDir.y < 0.14,
        do: () => {
          this.state.fireflies++;
          this.audio.pickup();
          this.fx.burst(new THREE.Vector3(a.x, a.y + 1.2, a.z), 0xffe9a0, 14, 1.6);
          this.toast('✨', `Светлячок пойман (${this.state.fireflies}/12)`);
          if (this.state.fireflies === 12) {
            this.banner('Все светлячки собраны!');
            this.toast('🫙', 'Расскажи Милице — у неё подарок');
          }
          this.save();
        },
      });
    });

    add('fire', {
      pos: this.world.firePos,
      r: 2.6,
      icon: '🔥',
      prompt: 'Погреться у костра',
      show: () => true,
      do: () => {
        this.audio.fireCrackle();
        this.fx.burst(new THREE.Vector3(this.world.firePos[0], this.world.firePos[1] + 1, this.world.firePos[2]), 0xffb347, 18, 1.4);
        this.toast('🔥', 'Тепло. Долина пахнет вечером и хвоей');
      },
    });

    add('well', {
      pos: TARGETS.well,
      r: 2.2,
      icon: '🪣',
      prompt: 'Заглянуть в колодец',
      show: () => true,
      do: () => {
        if (hasStanza(this.state, 0)) this.toast('🪣', 'Вода тихая. Первая строка теперь в журнале');
        else this.toast('🪣', 'В глубине что-то мерцает... Строка ждёт');
      },
    });

    add('fish', {
      pos: [30.4, 0, -16.4],
      r: 2.3,
      icon: '🎣',
      prompt: 'Порыбачить',
      show: () => this.fishCd <= 0 && this.fishing === null,
      do: () => this.startFishing(),
    });
  }

  private startFishing() {
    if (this.fishing || this.fishCd > 0) return;
    this.fishing = { phase: 'cast', t: 0 };
    this.audio.reel();
    this.toast('🎣', 'Удочка заброшена... жди поклёвку');
  }

  private fishingTick(dt: number) {
    if (!this.fishing) return;
    const f = this.fishing;
    f.t -= dt;
    if (f.phase === 'cast' && f.t <= 0) {
      f.phase = 'wait';
      f.t = 2.5 + Math.random() * 4;
    } else if (f.phase === 'wait' && f.t <= 0) {
      f.phase = 'bite';
      f.t = 1.15;
      this.audio.splash();
      this.world.makeSplash(30.4, -16.4);
      this.toast('🎣', 'Клюёт! Жми E!');
    } else if (f.phase === 'bite' && f.t <= 0) {
      f.phase = 'fail';
      f.t = 2;
      this.audio.splash();
      this.toast('🎣', 'Сорвалась... попробуй снова');
    } else if (f.phase === 'fail' && f.t <= 0) {
      this.fishing = null;
      this.fishCd = 2.5;
    }
  }

  private catchFish() {
    if (!this.fishing || this.fishing.phase !== 'bite') return;
    this.fishing.phase = 'success';
    this.fishing.t = 1.4;
    this.audio.reel();
    this.audio.pickup();
    const heal = Math.min(30, this.player.maxHp - this.player.hp);
    if (heal > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
      this.fx.burst(this.player.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0x9fd8ff, 12, 1.4);
      this.toast('🐟', `Серебряный карась! +${heal} здоровья`);
    } else {
      this.toast('🐟', 'Серебряный карась! Красивый — отпустил обратно');
    }
    this.pushHud(true);
  }

  private nearestInteract(): { id: string; def: InteractDef } | null {
    let best: { id: string; def: InteractDef } | null = null;
    let bd = Infinity;
    for (const [id, def] of this.interactables) {
      if (!def.show()) continue;
      let d: number;
      if (def.npc) d = (def.npc as Npc).group.position.distanceTo(this.player.pos);
      else d = Math.hypot(def.pos[0] - this.player.pos.x, def.pos[2] - this.player.pos.z);
      if (d < def.r && d < bd) { bd = d; best = { id, def }; }
    }
    return best;
  }

  doInteract() {
    const n = this.nearestInteract();
    if (!n) return;
    this.audio.click();
    n.def.do();
  }

  // ================= QUEST =================
  private nextStanza(): number {
    for (let i = 0; i < 6; i++) if (!hasStanza(this.state, i)) return i;
    return -1;
  }
  private nearMilica(): boolean {
    const m = this.npcs[1].group.position;
    return m.distanceTo(this.player.pos) < 4.5 || m.distanceTo(this.kot.group.position) < 4;
  }

  private collectStanza(i: number) {
    this.audio.whoosh();
    const [x, y, z] = this.world.getScrollPos(i);
    this.fx.burst(new THREE.Vector3(x, y, z), 0xffe9a8, 26, 2.4);
    this.audio.chime();
    this.world.getScroll(i).collect();
    this.playChapter(`ch${i}`, () => {
      this.state.stanzas.push(i);
      this.audio.setIntensity(this.state.stanzas.length / 6);
      this.toast('📜', `${STANZAS[i].title} — найдена`);
      if (i === 5) {
        this.playChapter('epilogue', () => {
          this.state.finale = true;
          this.banner('Сказка рассказана');
          this.toast('🕯️', 'Стихи снова вместе — открой журнал (J)');
          this.save();
        });
      } else this.save();
    });
  }

  executeEffect(id: string) {
    switch (id) {
      case 'metStarets':
        this.state.metStarets = true;
        this.audio.chime();
        this.toast('💬', 'Старец благословил тебя на путь');
        this.save(); break;
      case 'catQuest':
        this.state.catQuestStarted = true;
        this.toast('🐱', 'Барсик ждёт у пруда');
        this.save(); break;
      case 'takeCat':
        this.kotFollow = true;
        this.audio.purr();
        this.toast('🐱', 'Барсик доверчиво устроился за тобой'); break;
      case 'returnCat': {
        this.kotFollow = false;
        this.kot.setFollow(null);
        this.state.catBack = true;
        this.audio.purr();
        this.toast('🐱', 'Барсик вернулся к Милице');
        this.banner('Барсик дома!');
        this.save(); break;
      }
      case 'petCat':
        this.audio.purr();
        this.toast('🐱', 'Барсик мурчит. Похоже, он тебя помнит'); break;
      case 'petKoza':
        this.audio.bleat();
        this.toast('🐐', 'Маланья одобрительно мекает'); break;
      case 'fireflyQuest':
        this.toast('✨', 'Собери 12 светлячков: у пруда и на поляне'); break;
      case 'fireflyReward':
        this.state.fireflyReward = true;
        this.audio.chime();
        this.toast('🫙', 'Банка света — с тобой');
        this.save(); break;
      case 'millQuest':
        this.toast('🏮', 'Пять фонарей вдоль дороги к мельнице'); break;
      default: break;
    }
  }

  // ================= DIALOGUE =================
  private startDialogue(def: DialogueDef) {
    this.dialogue = { def, idx: 0 };
    this.audio.click();
    this.pushDialogueView();
  }
  private pushDialogueView() {
    if (!this.dialogue) return;
    const d = this.dialogue;
    const line = d.def.lines[d.idx];
    const view: DialogueView = {
      speaker: d.def.speaker,
      portrait: d.def.portrait,
      text: line.text,
      choices: (line.choices ?? []).map((c, i) => ({ label: c.label, idx: i })),
    };
    this.events.dialogue(view);
  }
  dialogueNext() {
    if (!this.dialogue) return;
    this.dialogue.idx++;
    if (this.dialogue.idx >= this.dialogue.def.lines.length) { this.closeDialogue(); return; }
    this.audio.click();
    this.pushDialogueView();
  }
  dialogueChoose(choiceIdx: number) {
    if (!this.dialogue) return;
    const line = this.dialogue.def.lines[this.dialogue.idx];
    const choice = line.choices?.[choiceIdx];
    if (choice) this.executeEffect(choice.effect);
    this.audio.click();
    this.closeDialogue();
  }
  private closeDialogue() {
    this.dialogue = null;
    this.events.dialogue(null);
  }

  // ================= CUTSCENES =================
  private playChapter(name: string, onEnd: () => void) {
    this.pendingCb = onEnd;
    this.audio.sting();
    this.banner(CHAPTER_NAMES[name] ?? name);
    this.audio.setDucking(true);
    this.fadeTo(1, () => {
      this.cutscene = { lines: getChapter(name), idx: 0, lineT: 0 };
      this.pushCutsceneView();
      this.fadeTo(0);
    });
  }
  private pushCutsceneView() {
    if (!this.cutscene) return;
    const line = this.cutscene.lines[this.cutscene.idx];
    const view: CutsceneView = {
      idx: this.cutscene.idx,
      total: this.cutscene.lines.length,
      speaker: line.speaker ?? (line.verse ? 'Строки' : 'Рассказчик'),
      portrait: line.portrait ?? '',
      text: line.text,
      verse: line.verse ?? null,
    };
    this.events.cutscene(view);
  }
  cutsceneNext() {
    if (!this.cutscene) return;
    const line = this.cutscene.lines[this.cutscene.idx];
    const dur = line.dur ?? 4 + line.text.length * 0.045;
    if (this.cutscene.lineT < dur * 0.85) { this.cutscene.lineT = dur * 0.85; return; }
    this.cutscene.idx++;
    this.cutscene.lineT = 0;
    if (this.cutscene.idx >= this.cutscene.lines.length) { this.endCutscene(); return; }
    this.audio.click();
    this.pushCutsceneView();
  }
  cutsceneSkip() {
    if (!this.cutscene) return;
    this.cutscene = null;
    this.events.cutscene(null);
    this.audio.setDucking(false);
    this.finishCutsceneCb();
  }
  private endCutscene() {
    if (!this.cutscene) return;
    this.cutscene = null;
    this.events.cutscene(null);
    this.audio.setDucking(false);
    this.fadeTo(1, () => { this.finishCutsceneCb(); this.fadeTo(0); });
  }
  private finishCutsceneCb() {
    const cb = this.pendingCb;
    this.pendingCb = null;
    if (cb) cb();
  }

  // ================= FADE =================
  private fadeTo(v: number, cb?: () => void) {
    this.fade.to = v;
    this.fade.cb = cb ?? null;
    this.fade.done = false;
  }
  private updateFade(dt: number) {
    const f = this.fade;
    if (f.done) return;
    const dir = f.to > f.v ? 1 : -1;
    f.v += dir * f.speed * dt;
    if ((dir > 0 && f.v >= f.to) || (dir < 0 && f.v <= f.to)) {
      f.v = f.to;
      f.done = true;
      this.events.fade(f.v);
      const cb = f.cb;
      f.cb = null;
      if (cb) cb();
      return;
    }
    this.events.fade(f.v);
  }

  // ================= HUD =================
  private toast(icon: string, text: string) { this.events.toast({ icon, text }); }
  private banner(text: string) { this.events.banner(text); }
  private timeLabel(): string {
    const elev = this.sunDir.y;
    if (elev < -0.04) return 'Ночь';
    if (elev < 0.12) return 'Сумерки';
    if (elev < 0.28) return 'Рассвет';
    return 'День';
  }

  private useBerry() {
    if (this.lootBerries <= 0) {
      this.toast('●', 'Рябиновых ягод пока нет');
      return;
    }
    if (this.player.hp >= this.player.maxHp) {
      this.toast('❤', 'Силы уже полны');
      return;
    }
    this.lootBerries--;
    const healed = Math.min(35, this.player.maxHp - this.player.hp);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
    this.audio.chime();
    this.fx.burst(this.player.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xd94a45, 15, 1.6);
    this.toast('●', `Рябина восстановила ${healed} здоровья`);
    this.pushHud(true);
    this.save();
  }

  private updateLoot(dt: number, t: number) {
    const pickups = this.loot.update(dt, t, this.player.pos);
    if (pickups.length === 0) return;

    for (const pickup of pickups) {
      if (pickup.kind === 'essence') this.lootEssence += pickup.amount;
      else if (pickup.kind === 'berry') this.lootBerries += pickup.amount;
      else if (pickup.kind === 'shard') this.lootShards += pickup.amount;
      else this.lootBark += pickup.amount;

      this.audio.pickup();
      this.fx.burst(pickup.position, pickup.rare ? 0xb7a8ff : 0xffe9a0, pickup.rare ? 18 : 8, pickup.rare ? 2.1 : 1.2);
      this.toast(pickup.icon, `${pickup.label} +${pickup.amount}`);
      if (pickup.rare) {
        this.audio.chime();
        this.banner('Лунный осколок');
      }
    }
    this.pushHud(true);
    this.save();
  }

  private pushHud(force = false) {
    const obj = computeObjective(this.state);
    let deg = 0, dist = 0;
    if (obj.target) {
      const tx = obj.target[0] - this.player.pos.x;
      const tz = obj.target[2] - this.player.pos.z;
      dist = Math.hypot(tx, tz);
      const fx = this.camPos.x - this.player.pos.x;
      const fz = this.camPos.z - this.player.pos.z;
      deg = (Math.atan2(fx * tz - fz * tx, fx * tx + fz * tz) * 180) / Math.PI;
    }
    const alive = this._aliveCount;
    const hud: HudState = {
      objectiveTitle: obj.title,
      objectiveText: obj.text,
      hasObjective: true,
      objDeg: deg,
      objDist: dist,
      stanzas: this.state.stanzas.length,
      totalStanzas: 6,
      fireflies: this.state.fireflies,
      totalFireflies: 12,
      lanterns: this.state.lanterns,
      totalLanterns: 5,
      prompt: this.activePrompt,
      hints: this.settings.hints,
      timeLabel: this.timeLabel(),
      day: this.day,
      finale: this.state.finale,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      enemies: alive,
      lootEssence: this.lootEssence,
      lootBerries: this.lootBerries,
      lootShards: this.lootShards,
      lootBark: this.lootBark,
      fishing: this.fishing,
    };
    const json = JSON.stringify(hud);
    if (force || json !== this.lastHud) {
      this.lastHud = json;
      this.events.hud(hud);
    }
  }

  // ================= SAVE =================
  private _lastSaveToast = 0;
  save(showIndicator = true) {
    try {
      const data: SaveData = {
        stanzas: this.state.stanzas,
        fireflies: this.state.fireflies,
        lanterns: this.state.lanterns,
        metStarets: this.state.metStarets,
        catBack: this.state.catBack,
        catQuestStarted: this.state.catQuestStarted,
        fireflyReward: this.state.fireflyReward,
        finale: this.state.finale,
        tDay: this.tDay,
        day: this.day,
        lootEssence: this.lootEssence,
        lootBerries: this.lootBerries,
        lootShards: this.lootShards,
        lootBark: this.lootBark,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      // Тонкий индикатор с throttle — не спамить пользователя тостами
      if (showIndicator && this.mode === 'play') {
        const now = performance.now();
        if (now - this._lastSaveToast > 3000) {
          this._lastSaveToast = now;
          this.toast('💾', 'Автосохранение');
        }
      }
    } catch { /* ignore */ }
  }

  wipeSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  }
  hasSave(): boolean { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }

  getMenuProgress(): { lines: number; finale: boolean } {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { lines: 0, finale: false };
      const d = JSON.parse(raw) as SaveData;
      return { lines: d.stanzas?.length ?? 0, finale: d.finale ?? false };
    } catch { return { lines: 0, finale: false }; }
  }
  private loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as SaveData;
      this.state = {
        stanzas: d.stanzas ?? [],
        fireflies: d.fireflies ?? 0,
        lanterns: d.lanterns ?? 0,
        metStarets: d.metStarets ?? false,
        catBack: d.catBack ?? false,
        catQuestStarted: d.catQuestStarted ?? false,
        fireflyReward: d.fireflyReward ?? false,
        finale: d.finale ?? false,
      };
      this.tDay = d.tDay ?? 0.37;
      this.day = d.day ?? 1;
      this.lootEssence = d.lootEssence ?? 0;
      this.lootBerries = d.lootBerries ?? 0;
      this.lootShards = d.lootShards ?? 0;
      this.lootBark = d.lootBark ?? 0;
      this.world.reset();
      this.state.stanzas.forEach((_, i) => this.world.getScroll(i).collect());
      this.world.getQuestLanterns().forEach((l, i) => { if (i < this.state.lanterns) l.set(true); });
      if (this.state.lanterns >= 5) this.world.startMill();
    } catch { /* ignore */ }
  }

  // ================= FLOW =================
  startMenu() {
    this.mode = 'menu';
    this.player.group.visible = false;
    this.wisp.visible = false;
    this.beam.visible = false;
    this.events.pause(false);
    this.events.journal(false);
    this.journalOpen = false;
    if (this.sunDir.y < 0.06 || this.sunDir.y > 0.32) this.tDay = 0.72;
  }
  newGame() {
    this.state = { ...DEFAULT_STATE };
    this.tDay = 0.36;
    this.day = 1;
    this.world.reset();
    this.loot.clear();
    this.lootEssence = 0;
    this.lootBerries = 0;
    this.lootShards = 0;
    this.lootBark = 0;
    this.spawnEnemies();
    this.kotFollow = false;
    this.kot.setFollow(null);
    this.playerDead = false;
    this.player.setPosition(0, 14);
    this.player.hp = this.player.maxHp;
    this.mode = 'play';
    this.paused = false;
    this.events.pause(false);
    this.player.group.visible = true;
    this.audio.setIntensity(0);
    this.audio.setDucking(false);
    this.fadeTo(1, () => {
      this.fadeTo(0);
      this.playChapter('prologue', () => {
        this.toast('✨', 'Следуй за огоньком — он знает дорогу');
      });
    });
  }
  continueGame() {
    this.loadSave();
    this.loot.clear();
    this.spawnEnemies();
    this.kotFollow = false;
    this.kot.setFollow(null);
    this.playerDead = false;
    this.player.setPosition(0, 14);
    this.player.hp = this.player.maxHp;
    this.mode = 'play';
    this.paused = false;
    this.events.pause(false);
    this.player.group.visible = true;
    this.audio.setIntensity(this.state.stanzas.length / 6);
    this.audio.setDucking(false);
    this.fadeTo(1, () => {
      this.fadeTo(0);
      this.banner(this.state.finale ? 'Долина помнит тебя' : 'С возвращением, Володька');
    });
  }
  toMenu() {
    this.save(false); // без тоста при выходе — сцена всё равно меняется
    this.mode = 'menu';
    this.paused = false;
    this.playerDead = false;
    this.journalOpen = false;
    this.dialogue = null;
    this.cutscene = null;
    this.pendingCb = null;
    this.fishing = null;
    this.fade.cb = null; // не зовём отложенный респавн/катсцену после выхода
    this.audio.setDucking(false); // сбрасываем приглушённую музыку, если вышли из катсцены
    this.events.dialogue(null);
    this.events.cutscene(null);
    this.events.journal(false);
    this.events.pause(false);
    this.player.group.visible = false;
    this.wisp.visible = false;
    this.beam.visible = false;
  }
  resume() { this.paused = false; this.events.pause(false); }
  setJournalOpen(v: boolean) { this.journalOpen = v; }
  setSettings(s: Settings) {
    this.settings = s;
    saveSettings(s);
    this.audio.setVolumes(s.music, s.sfx);
    this.applyQuality();
  }
  getSettings(): Settings { return { ...this.settings }; }
  private applyQuality() {
    const q = this.settings.quality;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === 'high' ? 2 : 1.3));
    this.renderer.shadowMap.enabled = q === 'high';
    const w = window.innerWidth, h = window.innerHeight;
    if (q === 'high' && !this.composer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.ssao = new SSAOPass(this.scene, this.camera, w, h);
      this.ssao.kernelRadius = 6;
      this.ssao.minDistance = 0.002;
      this.ssao.maxDistance = 0.12;
      this.ssao.output = SSAOPass.OUTPUT.Default;
      this.composer.addPass(this.ssao);
      this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.85, 0.72);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    } else if (q === 'low' && this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloom = null;
      this.ssao = null;
    }
    if (this.composer) this.composer.setSize(w, h);
  }
  getJournalData(): JournalData {
    return {
      stanzas: STANZAS.map((s, i) => ({ place: s.place, title: s.title, lines: s.lines, found: hasStanza(this.state, i) })),
      fireflies: this.state.fireflies,
      totalFireflies: 12,
      lanterns: this.state.lanterns,
      totalLanterns: 5,
      metStarets: this.state.metStarets,
      catBack: this.state.catBack,
      finale: this.state.finale,
      timeLabel: this.timeLabel(),
      day: this.day,
    };
  }

  // ================= LOOP =================
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.tGlobal;
    this.tGlobal += dt;

    if (!this.paused) {
      this.tDay += dt / 430;
      const elev = Math.sin((this.tDay - 0.22) * TAU);
      if (this.prevElev < 0 && elev >= 0) this.day++;
      this.prevElev = elev;
      this.sunDir.set(Math.cos((this.tDay - 0.22) * TAU) * 0.6, Math.max(elev, -0.3), 0.42).normalize();
      const day = smooth(-0.08, 0.18, elev);
      const night = 1 - smooth(-0.02, 0.24, elev);
      const dusk = (1 - day) * (1 - night);
      const gust = clamp(0.5 + 0.5 * Math.sin(t * 0.11 + 2.3) + 0.3 * Math.sin(t * 0.31 + 0.7), 0, 1);

      // ---------- погода ----------
      this.rainNext -= dt;
      if (this.rainNext <= 0 && this.rainDur <= 0) {
        this.rainDur = 40 + Math.random() * 30;
        this.rainNext = 140 + Math.random() * 130;
        if (this.mode === 'play') this.toast('🌧', 'Долина нахмурилась — начинается дождь');
      }
      if (this.rainDur > 0) {
        this.rainDur -= dt;
        this.rainLevel = lerp(this.rainLevel, this.rainDur > 7 ? 1 : Math.max(0, this.rainDur / 7), 1 - Math.exp(-2 * dt));
        if (this.rainDur <= 0) {
          this.rainLevel = lerp(this.rainLevel, 0, 1 - Math.exp(-2 * dt));
          if (this.mode === 'play') this.toast('☀', 'Дождь утих');
        }
      } else {
        this.rainLevel = lerp(this.rainLevel, 0, 1 - Math.exp(-2 * dt));
      }
      this.world.setRain(this.rainLevel);
      this.audio.setRain(this.rainLevel);
      this.thunderT -= dt;
      if (this.rainLevel > 0.65 && this.thunderT <= 0 && Math.random() < dt / 7) {
        this.thunderT = 14 + Math.random() * 18;
        this.audio.thunder();
        this.shakeT = 0.5;
        this.shakeStr = 0.14;
      }

      const fogC = this.scene.fog as THREE.FogExp2;
      fogC.color.set('#141a30').lerp(new THREE.Color('#6a5480'), dusk).lerp(new THREE.Color('#b8cfe0'), day * (1 - dusk * 0.5)).lerp(new THREE.Color('#5a6478'), this.rainLevel * 0.5);
      fogC.density = 0.0044 - day * 0.0011 + dusk * 0.0007 + this.rainLevel * 0.0013;
      this.renderer.toneMappingExposure = lerp(0.92, 1.25, day) + dusk * 0.12 - this.rainLevel * 0.12;
      this.world.update(t, day, dusk, night, gust, this.sunDir);
      this.fx.update(dt, t, night);
      this.audio.update(dt, night, gust);
      this.playerHurtCd = Math.max(0, this.playerHurtCd - dt);
      this.shakeT = Math.max(0, this.shakeT - dt);
      if (this.shakeT <= 0) this.shakeStr *= 0.9;

      if (this.mode === 'play' && !this.cutscene) {
        const ix = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
        const iz = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
        const blocked = this.journalOpen || this.dialogue !== null;
        const moveFromX = this.player.pos.x;
        const moveFromZ = this.player.pos.z;
        this.player.update(
          dt,
          {
            x: blocked ? 0 : ix,
            z: blocked ? 0 : iz,
            run: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
            jump: this.jumpQueued && !blocked,
            roll: this.rollQueued && !blocked,
            attack: this.attackQueued && !blocked,
          },
          this.camYaw,
          t,
        );
        this.jumpQueued = false;
        this.rollQueued = false;
        this.attackQueued = false;

        // Resolve the whole travelled segment after animation/physics. This is
        // what prevents fast rolls and knockback from tunnelling through props.
        const resolved = this.world.resolvePlayerMovement(
          moveFromX,
          moveFromZ,
          this.player.pos.x,
          this.player.pos.z,
          0.43,
        );
        const hitDuringRoll = resolved.blocked && this.player.getRolling();
        this.player.applyWorldCollision(resolved.x, resolved.z, resolved.blocked);
        if (hitDuringRoll) {
          this.audio.land();
          this.fx.burst(this.player.pos.clone().add(new THREE.Vector3(0, 0.35, 0)), 0x9a8a6a, 7, 1.2);
          this.shakeT = 0.1;
          this.shakeStr = 0.12;
        }

        // пыль из-под ног на бегу
        if (this.player.getSpeed() > 4.6 && this.player.getAirborne() === false) {
          this.dustT -= dt;
          if (this.dustT <= 0) {
            this.dustT = 0.22;
            this.fx.burst(this.player.pos.clone().add(new THREE.Vector3(0, 0.15, 0)), 0xb0a48c, 2, 0.7);
          }
        }

        // рыбалка — HUD обновляет только смену фазы, а не каждый кадр
        this.fishCd = Math.max(0, this.fishCd - dt);
        const prevPhase = this.fishing?.phase ?? null;
        this.fishingTick(dt);
        if (this.fishing && this.fishing.phase !== prevPhase) this.pushHud(true);

        // рыба плещется в пруду (реже пока ты ловишь — не путаем с поклёвкой)
        this.splashT -= dt;
        if (this.splashT <= 0) {
          this.splashT = (this.fishing ? 16 : 9) + Math.random() * (this.fishing ? 12 : 9);
          const dist = Math.hypot(this.player.pos.x - 32, this.player.pos.z + 16);
          if (dist < 70) {
            const a = Math.random() * TAU;
            const r = Math.random() * 6.5;
            this.world.makeSplash(32 + Math.cos(a) * r, -16 + Math.sin(a) * r);
            if (dist < 30 && !this.fishing) this.audio.splash();
          }
        }

        if (this.player.getMoving()) {
          this.stepT -= dt;
          if (this.stepT <= 0) {
            this.stepT = this.player.getSpeed() > 5 ? 0.3 : 0.45;
            this.audio.step(this.player.getSpeed() > 5);
          }
        }
        if (this.kotFollow && !this.state.catBack) {
          this.kotFollowPos.set(this.player.pos.x + Math.sin(this.camYaw) * 2.4, 0, this.player.pos.z + Math.cos(this.camYaw) * 2.4);
          this.kot.setFollow(this.kotFollowPos);
        }
        this.crackleT -= dt;
        if (this.crackleT <= 0) {
          this.crackleT = rand(0.4, 1.4);
          if (Math.hypot(this.player.pos.x - this.world.firePos[0], this.player.pos.z - this.world.firePos[2]) < 9) this.audio.fireCrackle();
        }

        // ------ BOEVKA ------
        // Игрок бьёт врагов
        const atk = this.player.getAttack();
        if (atk.active) {
          const weaponPos = this.player.getWeaponWorldPos(new THREE.Vector3());
          const fwd = this.player.getForward();
          for (let idx = 0; idx < this.enemies.length; idx++) {
            const e = this.enemies[idx];
            if (!e.isAlive()) continue;
            if (atk.hasHit(idx)) continue;
            const d = e.getPos().distanceTo(weaponPos);
            // чуть впереди игрока + конус
            const toEnemy = new THREE.Vector3().subVectors(e.getPos(), this.player.pos).setY(0).normalize();
            const dot = fwd.dot(toEnemy);
            if (d < atk.range + 0.4 && dot > 0.1) {
              const dir = new THREE.Vector3().subVectors(e.getPos(), this.player.pos).normalize();
              const dead = e.takeDamage(atk.power, dir);
              atk.markHit(idx);
              this.audio.hit();
              if (this.player.onHit) this.player.onHit();
              this.player.hitStop = atk.combo === 2 ? 0.11 : 0.06;
              this._tmpV.copy(e.getPos()).y += 1;
              this.fx.burst(this._tmpV, atk.combo === 2 ? 0x9fe8ff : 0xffe9a0, atk.combo === 2 ? 18 : 10, atk.combo === 2 ? 2.4 : 1.6);
              this.shakeT = atk.combo === 2 ? 0.2 : 0.12;
              this.shakeStr = atk.combo === 2 ? 0.35 : 0.18;
              if (dead) {
                this.audio.enemyDie();
                this._tmpV.copy(e.getPos()).y += 0.8;
                this.fx.burst(this._tmpV, e.kind === 'ten' ? 0x8fb8ff : 0xa8ff8a, 22, 2.6);
                // Луту нужен собственный вектор — он живёт долго
                this.loot.dropEnemy(e.kind, e.getPos().clone());
                this.toast('✦', e.kind === 'ten' ? 'Тень рассеялась' : 'Кустовый стражник отступил');
                this._aliveCount = Math.max(0, this._aliveCount - 1);
              } else {
                this.audio.enemyHurt();
              }
            }
          }
        }

        // Враги бьют игрока (используем закешированную функцию и скретч-вектор).
        // Если игрок уже мёртв (идёт fade респавна) — не бьём снова, иначе
        // будет каскад из нескольких schedule-respawn.
        if (!this.playerDead) {
          for (const e of this.enemies) {
            const dmg = e.update(dt, this.player.pos, this.player.getRolling(), this._heightFn, t);
            if (dmg > 0 && this.playerHurtCd <= 0 && !this.player.isInvulnerable()) {
              this._tmpV2.subVectors(this.player.pos, e.getPos()).normalize();
              const dead = this.player.takeDamage(dmg, this._tmpV2);
              this.playerHurtCd = 0.9;
              if (dead) {
                this.playerDead = true;
                this.audio.playerHurt();
                this.banner('Володька пал...');
                this.fadeTo(1, () => {
                  this.player.setPosition(0, 14);
                  this.player.hp = this.player.maxHp;
                  this.playerHurtCd = 0;
                  this.playerDead = false;
                  this.loot.clear();
                  this.spawnEnemies();
                  this.fadeTo(0);
                  this.toast('🕯️', 'Долина вернула тебя к костру');
                });
              }
            }
          }
        } else {
          // игрок мёртв — враги всё равно должны двигаться/оживать, но без урона
          for (const e of this.enemies) e.update(dt, this.player.pos, this.player.getRolling(), this._heightFn, t);
        }

        // Живой счётчик обновляется на киллах, здесь только проверяем тост-триггер
        if (this._aliveCount === 0 && !this.enemiesClearedToast && this.enemies.length > 0) {
          this.enemiesClearedToast = true;
          this.toast('🗡️', 'Долина очищена — тени отступили');
        }
        if (this._aliveCount > 0) this.enemiesClearedToast = false;

        this.updateLoot(dt, t);

      } else if (this.mode === 'play' && this.cutscene) {
        this.player.update(dt, { x: 0, z: 0, run: false, jump: false, roll: false, attack: false }, this.camYaw, t);
        this.updateCutscene(dt);
      }

      for (const n of this.npcs) n.update(dt, this.player.pos, t);

      if (this.mode === 'play') {
        this.updateWisp(dt, t);
        this.updatePrompt(dt);
      }
      if (this.mode === 'play') {
        this.hudTimer -= dt;
        if (this.hudTimer <= 0) { this.hudTimer = 0.35; this.pushHud(); }
      }
      this.updateFade(dt);
    }

    this.updateCamera(dt, t);

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  };

  private updateCutscene(dt: number) {
    const cs = this.cutscene;
    if (!cs) return;
    const line = cs.lines[cs.idx];
    cs.lineT += dt;
    const dur = line.dur ?? 4 + line.text.length * 0.045;
    if (cs.lineT >= dur) {
      cs.idx++;
      cs.lineT = 0;
      if (cs.idx >= cs.lines.length) { this.endCutscene(); return; }
      this.pushCutsceneView();
    }
  }

  private updateWisp(dt: number, t: number) {
    const obj = computeObjective(this.state);
    if (!obj.target) { this.wisp.visible = false; this.beam.visible = false; return; }
    const tx = obj.target[0]; const tz = obj.target[2];
    const ty = this.world.heightAt(tx, tz) + 2.4;
    const pd = Math.hypot(this.player.pos.x - tx, this.player.pos.z - tz);
    const lead = obj.lead && pd > 22;
    this.wisp.visible = true;
    const k = 1 - Math.exp(-4 * dt);
    if (lead) {
      const dx = tx - this.player.pos.x; const dz = tz - this.player.pos.z;
      const dl = Math.hypot(dx, dz) || 1;
      const wx = this.player.pos.x + (dx / dl) * 6;
      const wz = this.player.pos.z + (dz / dl) * 6;
      this.wisp.position.x += (wx - this.wisp.position.x) * k;
      this.wisp.position.z += (wz - this.wisp.position.z) * k;
      this.wisp.position.y = this.world.heightAt(this.wisp.position.x, this.wisp.position.z) + 2.5 + Math.sin(t * 2.4) * 0.3;
    } else {
      const ang = t * 1.4;
      this.wisp.position.x += (tx + Math.cos(ang) * 1.6 - this.wisp.position.x) * k;
      this.wisp.position.z += (tz + Math.sin(ang) * 1.6 - this.wisp.position.z) * k;
      this.wisp.position.y += (ty + Math.sin(t * 2.2) * 0.4 - this.wisp.position.y) * k;
    }
    this.wispLight.intensity = 1.1 + Math.sin(t * 3) * 0.25;
    this.trailT -= dt;
    if (this.trailT <= 0) { this.trailT = 0.09; this.fx.burst(this.wisp.position, 0xfff0b0, 1, 0.4); }
    this.beam.visible = pd > 24;
    if (this.beam.visible) {
      this.beam.position.set(tx, this.world.heightAt(tx, tz) + 23, tz);
      this.beamMat.opacity = 0.14 + Math.sin(t * 2.2) * 0.07;
    }
  }

  private updatePrompt(_dt: number) {
    if (this.cutscene || this.dialogue) {
      if (this.activePrompt) { this.activePrompt = null; this.pushHud(true); }
      return;
    }
    const n = this.nearestInteract();
    const next = n ? { icon: n.def.icon, text: n.def.prompt } : null;
    const changed = (next?.text ?? '') !== (this.activePrompt?.text ?? '');
    this.activePrompt = next;
    if (changed) this.pushHud(true);
  }

  private updateCamera(dt: number, t: number) {
    if (this.mode === 'menu') {
      const a = t * 0.045;
      const r = this.menuDist;
      this.camPos.set(Math.cos(a) * r, 9.5 + Math.sin(t * 0.03) * 1.6, Math.sin(a) * r);
      this.lookTarget.set(0, 2, 0);
      const k = 1 - Math.exp(-2 * dt);
      this.camera.position.lerp(this.camPos, k);
      this.camera.lookAt(this.lookTarget);
      return;
    }
    if (this.cutscene) {
      const line = this.cutscene.lines[this.cutscene.idx];
      if (line.cam) {
        const dur = line.dur ?? 5;
        const p = clamp(this.cutscene.lineT / (dur * 0.85), 0, 1);
        const e = ease(p);
        this.camPos.set(lerp(line.cam.from[0], line.cam.to[0], e), lerp(line.cam.from[1], line.cam.to[1], e), lerp(line.cam.from[2], line.cam.to[2], e));
        const minY = this.world.heightAt(this.camPos.x, this.camPos.z) + 1.0;
        if (this.camPos.y < minY) this.camPos.y = minY;
        this.camera.position.copy(this.camPos);
        this.camera.lookAt(new THREE.Vector3(line.cam.look[0], line.cam.look[1], line.cam.look[2]));
      } else {
        this.camera.position.lerp(this.camPos, 1 - Math.exp(-2.5 * dt));
        this.camera.lookAt(this.lookTarget);
      }
      return;
    }

    this.camDist = lerp(this.camDist, this.camTargetDist, 1 - Math.exp(-6 * dt));
    const target = this.player.pos.clone().add(new THREE.Vector3(0, 1.75, 0));
    // живое покачивание камеры на бегу
    const bob = this.player.getCameraBob();
    target.add(bob);
    const off = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch)).multiplyScalar(this.camDist);
    const desired = target.clone().add(off);
    const minY = this.world.heightAt(desired.x, desired.z) + 0.5;
    if (desired.y < minY) desired.y = minY;
    this.camPos.lerp(desired, 1 - Math.exp(-9 * dt));

    // шейк
    const shake = this.shakeT > 0 ? (Math.sin(t * 42) * this.shakeStr * this.shakeT) : 0;
    const shake2 = this.shakeT > 0 ? (Math.cos(t * 35 + 1) * this.shakeStr * this.shakeT) : 0;
    this.camera.position.copy(this.camPos).add(new THREE.Vector3(shake, shake2 * 0.5, shake * 0.3));
    this.lookTarget.lerp(target, 1 - Math.exp(-12 * dt));
    this.camera.lookAt(this.lookTarget);
    const targetFov = this.player.getRolling() ? 64 : this.player.getAttacking() ? 60 : 58;
    this.camera.fov = lerp(this.camera.fov, targetFov, 1 - Math.exp(-6 * dt));
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
