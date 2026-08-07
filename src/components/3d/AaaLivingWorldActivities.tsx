/* ─── AAA Living World Activities — мир должен ощущаться живым ───
 * Каждая сцена — 8–12 тактильных занятий без квест-спама.
 * Inner monologue + едва заметная реактивность мира.
 * Показывай, не рассказывай. Игрок всегда находит, что потрогать.
 */

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';

const ACTIVITY_LINES: Record<string, string> = {
  // Room / Home — тёплые, интимные
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

  // Corridor — коммунальная ностальгия
  mailbox: 'Ящики хранят чужие письма. Твоё — пока пустое.',
  intercom: 'Треск и голоса. Кто-то зовёт кого-то домой.',
  mirror_corridor: 'Тусклое стекло. Ты выглядишь так же, как утром.',
  vent: 'Тёплый воздух. Город дышит под ногами.',

  // Cafe — социальный хаб
  guitar: 'Струна дрожит под пальцами. Не идеально, но честно.',
  jukebox: 'Мелодия из прошлого. Кто-то поставил твою любимую.',
  barista_counter: 'Кофеварка шипит ритмично. Ритм дня.',
  cafe_window: 'Неоновые отражения в лужах. Город красивее ночью.',
  ashtray: 'Пепел ещё тёплый. Кто-то только что ушёл.',

  // Office — гнетущая работа
  terminal: 'Терминал гудит. Код ждёт, когда его прочитают.',
  server_rack: 'Вентиляторы поют низко. Машины не спят.',
  coffee_office: 'Остывший кофе. Вкус усталости.',
  monitor: 'Экран мигает. Ошибка 404 в твоей жизни.',
  chair_office: 'Кресло скрипит. Долгий день впереди.',

  // Park / Nature — передышка
  bench: 'Скамейка помнит многих. Можно присесть, послушать тишину.',
  tree: 'Листья шуршат. Даже в городе есть ветер.',
  fountain: 'Вода журчит. Можно бросить монетку (в мыслях).',
  statue: 'Каменное лицо. Молчит, но слышит всё.',

  // Factory — индустриальная тоска
  conveyor: 'Лента движется. Работа без конца.',
  valve: 'Металл холодный. Можно повернуть — но не стоит.',
  crate: 'Ящик тяжёлый. Пахнет маслом и временем.',
  control_panel: 'Кнопки мигают. Система ждёт команды.',

  // Pier / CHK — романтика окраин
  boat: 'Лодка качается. Вода помнит старые истории.',
  fire_barrel: 'Огонь трещит. Тепло в холодном мире.',
  fishing_rod: 'Удочка заброшена. Можно подождать вместе.',
  guitar_pier: 'Гитара у костра. Песня про тех, кто ушёл.',
  pier_fire: 'Огонь шепчет. Можно согреться и послушать.',
  water_edge: 'Вода плещется. Холодная, но живая.',
  pier_crate: 'Ящик на пирсе. Пахнет солью и прошлым.',
  pier_lamp: 'Фонарь мигает над водой. Свет ловит туман.',

  // Library / Dream — тишина
  old_book: 'Страницы шуршат. Слова, которые уже нельзя изменить.',
  lamp_library: 'Абажур греет. Здесь можно остаться навсегда.',
  window_library: 'Дождь по стеклу. Мир за окном кажется далёким.',

  // Battle / Basement
  battle_debris: 'Обломки ещё тёплые. Битва оставила след.',
  library_basement_clutter: 'Пыльные ящики. Кто-то прятал здесь тайны.',

  // Intimate rooms
  albert_desk: 'Стол Альберта. Бумаги, пепел, следы долгой ночи.',
  solnysh_window: 'Окно в солнышке. Свет мягкий, как воспоминание.',
  zarema_plant: 'Цветок Заремы. Кто-то поливал его с любовью.',
  zarema_mirror: 'Зеркало Заремы. В нём видно больше, чем кажется.',

  // Dream — эфемерное
  dream_memory: 'Старый предмет. Он помнит то, что ты уже забыл.',

  // Rooftops / City / Forest
  rooftop_sky: 'Небо над крышами. Холодное, но зовёт.',
  city_neon: 'Неон в лужах. Город не спит.',
  forest_wind: 'Ветер в кронах. Шепчет то, что было.',
  campfire_story: 'Огонь рассказывает. Слушай внимательно.',
};

const COZY_ACTIVITIES = new Set(['coffee_machine', 'bench', 'plant', 'window', 'fridge', 'lamp_library', 'old_book']);

function resolveActivityKey(lower: string, sceneId: string): string | null {
  // Coffee — highest priority
  if (lower.includes('coffee')) return 'coffee_machine';
  if (lower.includes('radio')) return 'radio';
  if (lower.includes('guitar')) {
    if (sceneId.includes('pier') || sceneId.includes('river')) return 'guitar_pier';
    return 'guitar';
  }
  if (lower.includes('bookshelf') || lower.includes('old_book')) return 'old_book';
  if (lower.includes('book') && !lower.includes('bookshelf')) return 'old_book';

  // Scene-specific lamps before generic
  if (lower.includes('lamp') && (sceneId.includes('pier') || sceneId.includes('river'))) return 'pier_lamp';
  if (lower.includes('lamp') || lower.includes('light')) return 'desk_lamp';

  if (lower.includes('mirror')) {
    if (sceneId.includes('zarema')) return 'zarema_mirror';
    if (sceneId.includes('corridor')) return 'mirror_corridor';
    return 'mirror';
  }
  if (lower.includes('plant') || lower.includes('flower')) {
    if (sceneId.includes('zarema')) return 'zarema_plant';
    return 'plant';
  }
  if (lower.includes('fridge') || lower.includes('холодильник')) return 'fridge';
  if (lower.includes('bed') || lower.includes('кровать')) return 'bed';
  if (lower.includes('poster') || lower.includes('плакат')) return 'poster';
  if (lower.includes('mail') || lower.includes('ящик')) {
    if (sceneId.includes('pier') || sceneId.includes('river')) return 'pier_crate';
    if (sceneId.includes('library_basement')) return 'library_basement_clutter';
    return 'mailbox';
  }
  if (lower.includes('intercom') || lower.includes('домофон')) return 'intercom';
  if (lower.includes('vent') || lower.includes('вентиляц')) return 'vent';
  if (lower.includes('jukebox') || lower.includes('музыка')) return 'jukebox';
  if (lower.includes('counter') || lower.includes('стойка')) {
    if (lower.includes('barista') || lower.includes('кофевар')) return 'barista_counter';
    return 'barista_counter';
  }
  if (lower.includes('ashtray') || lower.includes('пепельниц')) return 'ashtray';
  if (lower.includes('rack') || lower.includes('server')) return 'server_rack';
  if (lower.includes('monitor') || lower.includes('экран')) return 'monitor';
  if (lower.includes('chair')) return 'chair_office';
  if (lower.includes('tree') || lower.includes('дерево')) return 'tree';
  if (lower.includes('fountain') || lower.includes('фонтан')) return 'fountain';
  if (lower.includes('statue') || lower.includes('памятник')) return 'statue';
  if (lower.includes('conveyor') || lower.includes('лента')) return 'conveyor';
  if (lower.includes('valve') || lower.includes('вентиль')) return 'valve';
  if (lower.includes('crate')) {
    if (sceneId.includes('pier') || sceneId.includes('river')) return 'pier_crate';
    if (sceneId.includes('library_basement')) return 'library_basement_clutter';
    return 'crate';
  }
  if (lower.includes('panel') || lower.includes('панель')) return 'control_panel';
  if (lower.includes('boat') || lower.includes('лодка')) return 'boat';
  if (lower.includes('barrel') || lower.includes('бочка')) {
    if (sceneId.includes('pier') || sceneId.includes('river')) return 'pier_fire';
    return 'fire_barrel';
  }
  if (lower.includes('fishing') || lower.includes('удочка')) return 'fishing_rod';

  // Window variations
  if (lower.includes('window') || lower.includes('окно')) {
    if (sceneId.includes('solnysh')) return 'solnysh_window';
    if (sceneId.includes('library')) return 'window_library';
    if (sceneId.includes('cafe')) return 'cafe_window';
    return 'window';
  }

  // Terminal last — generic fallback
  if (lower.includes('terminal') || lower.includes('server')) return 'terminal';

  // Special ambient
  if (lower.includes('water') || lower.includes('вода')) return 'water_edge';
  if (lower.includes('battle') || lower.includes('debris') || lower.includes('shell')) return 'battle_debris';
  if ((lower.includes('desk') || lower.includes('стол') || lower.includes('albert')) && sceneId.includes('albert_backroom')) return 'albert_desk';
  if (lower.includes('solnysh') && sceneId.includes('solnysh')) return 'solnysh_window';
  if ((lower.includes('memory') || lower.includes('sd_') || lower.includes('dream')) && sceneId.includes('sleep_dream')) return 'dream_memory';
  if ((lower.includes('rooftop') || lower.includes('sky') || lower.includes('edge')) && sceneId.includes('rooftop')) return 'rooftop_sky';
  if ((lower.includes('neon') || lower.includes('city') || lower.includes('square')) && sceneId.includes('city_square')) return 'city_neon';
  if ((lower.includes('forest') || lower.includes('wind')) && (sceneId.includes('chk') || sceneId.includes('park'))) return 'forest_wind';
  if ((lower.includes('camp') || lower.includes('fire') || lower.includes('chk')) && sceneId.includes('chk_campfire')) return 'campfire_story';
  if (lower.includes('bench')) return 'bench';

  return null;
}

export function AaaLivingWorldActivities() {
  useEffect(() => {
    const unsubs = [
      eventBus.on('interaction:start', ({ propId, sceneId }: any) => {
        const id = (propId ?? '') as string;
        const sid = (sceneId ?? '') as string;
        const lower = id.toLowerCase();
        const key = resolveActivityKey(lower, sid);

        if (!key || !ACTIVITY_LINES[key]) return;

        const line = ACTIVITY_LINES[key];
        eventBus.emit('volodka:thought' as any, { text: line, source: key, scene: sid } as any);

        // Cozy — tiny energy + karma nudge (no spam, only if not full)
        if (COZY_ACTIVITIES.has(key)) {
          try {
            const snap = getGameSnapshot();
            if (snap.playerState.energy < 92) {
              dispatchGameAction({ type: 'player/addEnergy', amount: 2 + Math.floor(Math.random() * 2) });
            }
            if (['window', 'bench', 'plant', 'old_book'].includes(key)) {
              dispatchGameAction({ type: 'player/addKarma', amount: 1 });
            }
          } catch {
            // snapshot not ready — silent
          }
        }

        // World reactivity — light flicker for tech props
        if (key.includes('lamp') || key === 'terminal' || key === 'control_panel') {
          eventBus.emit('world:ambient_event' as any, {
            type: 'light_flicker',
            intensity: 0.6 + Math.random() * 0.3,
            duration: 800,
          } as any);
        }
        if (key === 'radio' || key === 'jukebox') {
          eventBus.emit('audio:ambient_stinger' as any, { cue: 'static' } as any);
        }
      }),

      eventBus.on('exploration:footstep' as any, (() => {
        let lastWhisper = 0;
        return () => {
          const now = performance.now();
          if (now - lastWhisper < 18000) return; // throttle whispers
          if (Math.random() < 0.022) {
            lastWhisper = now;
            const whispers = [
              'Город шепчет.',
              'Кто-то прошёл здесь недавно.',
              'Ветер несёт запахи прошлого.',
              'Тишина тоже говорит.',
            ];
            const w = whispers[Math.floor(Math.random() * whispers.length)];
            eventBus.emit('volodka:thought' as any, { text: w, source: 'ambient' } as any);
          }
        };
      })()),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return null;
}
