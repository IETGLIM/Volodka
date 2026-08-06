/* ─── AAA Living World Activities — world feels alive, lots to do ───
 * Rich emergent interactions across hubs. Show-don't-tell guidance.
 * Every major scene has 8–12 ambient activities (push, read, listen, observe).
 * Inner monologues + subtle world reactivity (no quest spam).
 * Perfect for "куча занятий" — player always has something to touch/observe.
 */

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { dispatchGameAction } from '@/store/gameStore';

const ACTIVITY_LINES: Record<string, string> = {
  // Room / Home
  coffee_machine: 'Кофе шипит. Пар поднимается, как мысли — медленно, но верно.',
  radio: 'Шипение, обрывки голоса. Город говорит, даже когда молчит.',
  window: 'За окном — город. Дождь или нет, он всё равно ждёт.',
  bookshelf: 'Пыль на корешках. Кто-то здесь искал ответы до тебя.',
  mirror: 'Отражение усталое. Глаза говорят больше, чем слова.',
  desk_lamp: 'Тёплый круг света. Можно посидеть в тишине.',
  plant: 'Листья слегка дрожат. Жизнь продолжается даже здесь.',
  fridge: 'Холодный гул. Внутри — остатки вчерашнего вечера.',
  bed: 'Простыни помнят сны. Можно прилечь на минуту.',
  poster: 'Выцветший плакат. Старые мечты всё ещё шепчут.',

  // Corridor / Communal
  mailbox: 'Ящики хранят чужие письма. Твоё — пока пустое.',
  intercom: 'Треск и голоса. Кто-то зовёт кого-то домой.',
  mirror_corridor: 'Тусклое стекло. Ты выглядишь так же, как утром.',
  vent: 'Тёплый воздух. Город дышит под ногами.',

  // Cafe / Social
  guitar: 'Струна дрожит под пальцами. Не идеально, но честно.',
  jukebox: 'Мелодия из прошлого. Кто-то поставил твою любимую.',
  barista_counter: 'Кофеварка шипит ритмично. Ритм дня.',
  cafe_window: 'Неоновые отражения в лужах. Город красивее ночью.',
  ashtray: 'Пепел ещё тёплый. Кто-то только что ушёл.',

  // Office / Work
  terminal: 'Терминал гудит. Код ждёт, когда его прочитают.',
  server_rack: 'Вентиляторы поют низко. Машины не спят.',
  coffee_office: 'Остывший кофе. Вкус усталости.',
  monitor: 'Экран мигает. Ошибка 404 в твоей жизни.',
  chair_office: 'Кресло скрипит. Долгий день впереди.',

  // Park / Nature
  bench: 'Скамейка помнит многих. Можно присесть, послушать тишину.',
  tree: 'Листья шуршат. Даже в городе есть ветер.',
  fountain: 'Вода журчит. Можно бросить монетку (в мыслях).',
  statue: 'Каменное лицо. Молчит, но слышит всё.',

  // Factory / Industrial
  conveyor: 'Лента движется. Работа без конца.',
  valve: 'Металл холодный. Можно повернуть — но не стоит.',
  crate: 'Ящик тяжёлый. Пахнет маслом и временем.',
  control_panel: 'Кнопки мигают. Система ждёт команды.',

  // Pier / CHK
  boat: 'Лодка качается. Вода помнит старые истории.',
  fire_barrel: 'Огонь трещит. Тепло в холодном мире.',
  fishing_rod: 'Удочка заброшена. Можно подождать вместе.',
  guitar_pier: 'Гитара у костра. Песня про тех, кто ушёл.',
  // AAA Phase A: richer pier/river living world (fire + water + mist reactivity)
  pier_fire: 'Огонь шепчет. Можно согреться и послушать.',
  water_edge: 'Вода плещется. Холодная, но живая.',
  pier_crate: 'Ящик на пирсе. Пахнет солью и прошлым.',
  pier_lamp: 'Фонарь мигает над водой. Свет ловит туман.',

  // Library / Dream
  old_book: 'Страницы шуршат. Слова, которые уже нельзя изменить.',
  lamp_library: 'Абажур греет. Здесь можно остаться навсегда.',
  window_library: 'Дождь по стеклу. Мир за окном кажется далёким.',

  // AAA Phase A: battle debris + library basement (post-fight / dusty tactile living world)
  battle_debris: 'Обломки ещё тёплые. Битва оставила след.',
  library_basement_clutter: 'Пыльные ящики. Кто-то прятал здесь тайны.',

  // AAA Phase A/C: intimate domestic rooms (Albert, Solnysh, Zarema) — lived-in, show-don't-tell
  albert_desk: 'Стол Альберта. Бумаги, пепел, следы долгой ночи.',
  solnysh_window: 'Окно в солнышке. Свет мягкий, как воспоминание.',
  zarema_plant: 'Цветок Заремы. Кто-то поливал его с любовью.',
  zarema_mirror: 'Зеркало Заремы. В нём видно больше, чем кажется.',

  // AAA Phase A: dream memory fragments — poetic remnants of the past (ethereal, floating)
  dream_memory: 'Старый предмет. Он помнит то, что ты уже забыл.',

  // AAA: rooftops, city, forest — more poetic living world density
  rooftop_sky: 'Небо над крышами. Холодное, но зовёт.',
  city_neon: 'Неон в лужах. Город не спит.',
  forest_wind: 'Ветер в кронах. Шепчет то, что было.',
  campfire_story: 'Огонь рассказывает. Слушай внимательно.',
};

const COZY_ACTIVITIES = new Set(['coffee_machine', 'bench', 'plant', 'window', 'fridge', 'lamp_library']);

export function AaaLivingWorldActivities() {
  useEffect(() => {
    const unsubs = [
      eventBus.on('interaction:start', ({ propId, sceneId }: any) => {
        const id = (propId ?? '') as string;
        const lower = id.toLowerCase();
        let key: keyof typeof ACTIVITY_LINES | null = null;

        // Smart matching — robust across scenes
        if (lower.includes('coffee')) key = 'coffee_machine';
        else if (lower.includes('radio')) key = 'radio';
        else if (lower.includes('guitar')) key = 'guitar';
        else if (lower.includes('bookshelf') || lower.includes('book')) key = 'bookshelf';
        else if (lower.includes('window')) key = 'window';
        else if (lower.includes('bench')) key = 'bench';
        else if (lower.includes('terminal') || lower.includes('server')) key = 'terminal';
        else if (lower.includes('mirror')) key = 'mirror';
        else if (lower.includes('lamp') || lower.includes('light')) key = 'desk_lamp';
        else if (lower.includes('plant') || lower.includes('flower')) key = 'plant';
        else if (lower.includes('fridge') || lower.includes('холодильник')) key = 'fridge';
        else if (lower.includes('bed') || lower.includes('кровать')) key = 'bed';
        else if (lower.includes('poster') || lower.includes('плакат')) key = 'poster';
        else if (lower.includes('mail') || lower.includes('ящик')) key = 'mailbox';
        else if (lower.includes('intercom') || lower.includes('домофон')) key = 'intercom';
        else if (lower.includes('vent') || lower.includes('вентиляц')) key = 'vent';
        else if (lower.includes('jukebox') || lower.includes('музыка')) key = 'jukebox';
        else if (lower.includes('counter') || lower.includes('стойка')) key = 'barista_counter';
        else if (lower.includes('ashtray') || lower.includes('пепельниц')) key = 'ashtray';
        else if (lower.includes('rack') || lower.includes('стойка')) key = 'server_rack';
        else if (lower.includes('monitor') || lower.includes('экран')) key = 'monitor';
        else if (lower.includes('chair')) key = 'chair_office';
        else if (lower.includes('tree') || lower.includes('дерево')) key = 'tree';
        else if (lower.includes('fountain') || lower.includes('фонтан')) key = 'fountain';
        else if (lower.includes('statue') || lower.includes('памятник')) key = 'statue';
        else if (lower.includes('conveyor') || lower.includes('лента')) key = 'conveyor';
        else if (lower.includes('valve') || lower.includes('вентиль')) key = 'valve';
        else if (lower.includes('crate') || lower.includes('ящик')) key = 'crate';
        else if (lower.includes('panel') || lower.includes('панель')) key = 'control_panel';
        else if (lower.includes('boat') || lower.includes('лодка')) key = 'boat';
        else if (lower.includes('barrel') || lower.includes('бочка')) key = 'fire_barrel';
        else if (lower.includes('fishing') || lower.includes('удочка')) key = 'fishing_rod';
        else if (lower.includes('old_book') || lower.includes('книга')) key = 'old_book';
        else if (lower.includes('barrel') || lower.includes('fire') || lower.includes('костёр')) key = 'fire_barrel';
        else if (lower.includes('boat') || lower.includes('лодка')) key = 'boat';
        else if (lower.includes('fishing') || lower.includes('удочка')) key = 'fishing_rod';
        else if (lower.includes('pier') && (lower.includes('fire') || lower.includes('barrel'))) key = 'pier_fire';
        else if (lower.includes('water') || lower.includes('edge') || lower.includes('вода')) key = 'water_edge';
        else if (lower.includes('crate') && (sceneId.includes('pier') || sceneId.includes('river'))) key = 'pier_crate';
        else if (lower.includes('lamp') && (sceneId.includes('pier') || sceneId.includes('river'))) key = 'pier_lamp';
        // AAA: battle debris + library basement clutter (post-fight / dusty tactile)
        else if (lower.includes('battle') || lower.includes('debris') || lower.includes('shell') || lower.includes('баррель')) key = 'battle_debris';
        else if ((lower.includes('book') || lower.includes('книга') || lower.includes('crate') || lower.includes('can')) && sceneId.includes('library_basement')) key = 'library_basement_clutter';
        // AAA cozy intimate rooms
        else if ((lower.includes('desk') || lower.includes('стол') || lower.includes('albert')) && sceneId.includes('albert_backroom')) key = 'albert_desk';
        else if ((lower.includes('window') || lower.includes('окно') || lower.includes('solnysh')) && sceneId.includes('solnysh_room')) key = 'solnysh_window';
        else if ((lower.includes('plant') || lower.includes('цветок') || lower.includes('zarema')) && sceneId.includes('zarema')) key = 'zarema_plant';
        else if ((lower.includes('mirror') || lower.includes('зеркало')) && sceneId.includes('zarema')) key = 'zarema_mirror';
        // AAA dream memory fragments — poetic, ethereal inner voice (show-don't-tell the past)
        else if ((lower.includes('memory') || lower.includes('sd_') || lower.includes('dream')) && sceneId.includes('sleep_dream')) key = 'dream_memory';
        // AAA extra living world on rooftops/city/forest/campfire
        else if ((lower.includes('rooftop') || lower.includes('sky') || lower.includes('edge')) && sceneId.includes('rooftop')) key = 'rooftop_sky';
        else if ((lower.includes('neon') || lower.includes('city') || lower.includes('square')) && sceneId.includes('city_square')) key = 'city_neon';
        else if ((lower.includes('forest') || lower.includes('tree') || lower.includes('wind')) && (sceneId.includes('chk') || sceneId.includes('park'))) key = 'forest_wind';
        else if ((lower.includes('camp') || lower.includes('fire') || lower.includes('chk')) && sceneId.includes('chk_campfire')) key = 'campfire_story';

        if (key && ACTIVITY_LINES[key]) {
          const line = ACTIVITY_LINES[key];
          // Rich inner monologue — show, don't tell
          eventBus.emit('volodka:thought' as any, { 
            text: line, 
            source: key,
            scene: sceneId 
          } as any);

          // Subtle world reactivity + tiny rewards for cozy moments
          if (COZY_ACTIVITIES.has(key)) {
            try {
              const snap = getGameSnapshot();
              if (snap.playerState.energy < 92) {
                dispatchGameAction({ 
                  type: 'player/energy', 
                  delta: 2 + Math.floor(Math.random() * 2) 
                });
              }
              // Gentle karma nudge for contemplative acts
              if (['window', 'bench', 'plant', 'old_book'].includes(key)) {
                dispatchGameAction({ 
                  type: 'player/karma', 
                  delta: 1 
                });
              }
            } catch {}
          }

          // Dynamic world feedback — lights flicker, props react
          if (key.includes('lamp') || key === 'terminal' || key === 'control_panel') {
            eventBus.emit('world:ambient_event', { 
              type: 'light_flicker', 
              intensity: 0.6 + Math.random() * 0.3,
              duration: 800 
            });
          }
          if (key === 'radio' || key === 'jukebox') {
            eventBus.emit('audio:ambient_stinger', { cue: 'static' });
          }
        }
      }),

      // Additional ambient world life (not just on E-press)
      eventBus.on('exploration:footstep', ({ sceneId }: any) => {
        // Occasional living world whispers on movement (very rare, atmospheric)
        if (Math.random() < 0.018) {
          const whispers = [
            'Город шепчет.',
            'Кто-то прошёл здесь недавно.',
            'Ветер несёт запахи прошлого.',
          ];
          const w = whispers[Math.floor(Math.random() * whispers.length)];
          eventBus.emit('volodka:thought' as any, { text: w, source: 'ambient' } as any);
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return null;
}
