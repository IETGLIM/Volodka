/* ─── Volodka RPG – additional ambient bark pools for least-served scenes ───
 *
 * WS21-B: 12 new ambient bark lines for 4 NPC characters across
 * guild_mainframe, city_square, rooftop_edge, and river_pier.
 *
 * These bark pools supplement the existing per-NPC ambientBarks in
 * npcDefinitions.ts / expandedNPCs.ts. Import and merge into the NPC's
 * ambientBarks config at runtime or via the NPC definition merge step.
 *
 * Each entry is keyed by npcId and provides additional idle / pensive /
 * contemplative bands in Russian.
 */

import type { NPCAmbientBarks } from '@/shared/npcBark';
import type { SceneId } from '@/shared/types/game';

/** Per-scene ambient bark supplement — NPC gets these barks when in the listed scene. */
export interface SceneAmbientBarkSupplement {
  readonly npcId: string;
  readonly scenes: readonly SceneId[];
  readonly barks: NPCAmbientBarks;
}

/**
 * WS21-B ambient bark supplements — 12 new bark lines across 4 NPCs.
 *
 * NPCs:
 *   - sergey      (night-shift engineer, guild_mainframe)
 *   - maxim       (resistance leader, city_square)
 *   - zeka        (factory veteran, rooftop_edge)
 *   - fisherman_trofim (pier regular, river_pier)
 *
 * Each NPC gets 3 new idle lines for their least-served scene.
 */
export const WS21B_AMBIENT_BARK_SUPPLEMENTS: readonly SceneAmbientBarkSupplement[] = [
  /* ── Сергей — ночной инженер в мейнфрейме ── */
  {
    npcId: 'sergey',
    scenes: ['guild_mainframe'],
    barks: {
      idle: [
        '*проверяет логи* Очередной memory_overflow. Стихи? Атака? Не различаю.',
        '*настраивает осциллограф* Пятьдесят герц — ровно. Как — пульс — машины. Или — мой.',
        '*смотрит на индикаторы* Зелёный. Зелёный. Жёлтый. Жёлтый — это — не нормально.',
      ],
      pensive: [
        '*задумчиво* Кто-то пишет в защищённую область. Пишет — стихи. Я — не удаляю. Пока — не удаляю.',
      ],
    },
  },

  /* ── Максим — лидер сопротивления на площади ── */
  {
    npcId: 'maxim',
    scenes: ['city_square'],
    barks: {
      idle: [
        '*оглядывает камеры* Четыре угла — четыре объектива. Мы — на — виду. Это — не — страх. Это — данные.',
        '*бормочет* Памятник — смотрит — вниз. На — нас. На — гильдию. На — всех — одинаково.',
        '*поправляет куртку* Голубь — сел — рядом. Не — боится. Может — он — тоже — сопротивление.',
      ],
      pensive: [
        '*задумчиво* Площадь — открытая. Открытая — значит — прослушиваемая. Но — мы — тоже — слушаем.',
      ],
    },
  },

  /* ── Зека — ветеран завода на крыше ── */
  {
    npcId: 'zeka',
    scenes: ['rooftop_edge'],
    barks: {
      idle: [
        '*смотрит вниз* Город — как — схема. Только — контакты — ржавые. И — напряжение — падает.',
        '*поправляет антенну* Эта — вещает — на — частоте — гильдии. Но — ветер — гудит — на — своей.',
        '*прикуривает* Записка — на — парапете. Не — моя. Но — я — понимаю — почерк. Мы — все — пишем — одно.',
      ],
      pensive: [
        '*задумчиво* Крыша — единственное — место, где — небо — ближе — чем — камеры.',
      ],
    },
  },

  /* ── Рыбак Трофим — на пирсе ── */
  {
    npcId: 'fisherman_trofim',
    scenes: ['river_pier'],
    barks: {
      idle: [
        '*наматывает леску* Река — несёт. Не — спрашивает — куда. Как — и — стихи. Несёт — и — несёт.',
        '*смотрит на воду* Камни — в — мху. Мох — пишет. Медленнее — чем — я. Но — красивее.',
        '*поправляет удочку* Кто-то — использует — реку — как — канал. Не — я. Но — я — вижу. И — молчу.',
      ],
      pensive: [
        '*задумчиво* Вода — помнит. Вода — всё — помнит. Больше — чем — серверы. Тише — чем — камеры.',
      ],
    },
  },

  /* ── WS23-B: +10 new ambient bark lines for 3 NPCs ── */

  /* ── Зарема — учительница, cafe_evening ── */
  {
    npcId: 'zarema',
    scenes: ['cafe_evening'],
    barks: {
      idle: [
        '*перелистывает тетрадь* Двести — тридцать. Минус — один. Гильдия — удалила — ещё — одно. Двести — двадцать — девять. Пока — я — помню — двести — тридцать.',
        '*смотрит в окно* Дождь. Опять. Дождь — не — стирает. Дождь — смывает — пыль — с — памяти. Хорошо. Память — слишком — пыльная.',
        '*поправляет платок* Татарский — узор. Геометрия — свободы. Каждый — ромб — строчка. Каждый — угол — выбор.',
      ],
      pensive: [
        '*задумчиво* Кофе — остывает. Стихи — нет. Стихи — не — зависят — от — температуры. Только — люди — зависят.',
      ],
    },
  },

  /* ── Альберт — инженер-поэт, guild_mainframe ── */
  {
    npcId: 'albert',
    scenes: ['guild_mainframe'],
    barks: {
      idle: [
        '*протирает контакты* Олово — и — канифоль. Пайка — и — письмо. Одна — температура. Разные — результаты.',
        '*смотрит на стойки* Пятьдесят — герц. Пятьдесят — ударов — в — секунду. Как — сердце. Чьё? Города. Моё. Одно — и — то — же.',
        '*бормочет* function poetry() { return resistance; } Компилируется. Без — ошибок. Как — и — всё — настоящее.',
      ],
      pensive: [
        '*задумчиво* Если — код — живой — то — гильдия — вирус. Вирус — не — убивает — сразу. Вирус — меняет — поведение. Тихо. Медленно. Как — гильдия.',
      ],
    },
  },

  /* ── Старик-скрипач — park_day ── */
  {
    npcId: 'old_violinist',
    scenes: ['park_day'],
    barks: {
      idle: [
        '*настраивает струну* Ля. Не — чистое. Чуть — выше. Как — город — чуть — выше — камер. На — полтона.',
        '*играет фразу* До — мажор. Простой. Как — дыхание. Никто — не — платит — за — до — мажор. Все — слушают.',
        '*смотрит на голубей* Голубь — сел — на — пюпитр. Не — боится — скрипки. Скрипка — не — оружие. Или — оружие — тихое.',
      ],
      pensive: [
        '*задумчиво* Музыка — не — нуждается — в — разрешении. Музыка — старше — гильдии. Старше — языков. Старше — страха.',
      ],
    },
  },

  /* ── WS26-D: +8 new ambient bark lines for 2 NPCs ── */

  /* ── Мария — сетевой курьер, street_night ── */
  {
    npcId: 'maria',
    scenes: ['street_night'],
    barks: {
      idle: [
        '*оглядывает неоновые вывески* Кошка — дважды — прошла — сквозь — витрину. Гильдия — скажет: артефакт. Я — скажу: трещина. Трещины — не — закрываются.',
        '*поправляет воротник* Сеть — дважды — отрисовала — этот — угол. Я — успела — заметить. Шов — между — кадрами. Тонкий. Как — лезвие. Как — стих.',
        '*смотрит на дождь* Неоновая — чума — вернётся. Не — та — же. Другая. Тише. Но — число — жертв — то — же: 4 700 — снов — украдено. Я — помню. Гильдия — нет.',
      ],
      pensive: [
        '*задумчиво* Архитектор — не — умер. Архитектор — не — жил. Архитектор — это — функция. А — функция — не — умирает. Она — лишь — ждёт — вызова. И — кто-то — её — вызвал.',
      ],
    },
  },

  /* ── Офисный коллега — программист гильдии, office_day ── */
  {
    npcId: 'office_colleague',
    scenes: ['office_day'],
    barks: {
      idle: [
        '*вытягивает шею* Лог — гильдии — сегодня — ровный. Слишком — ровный. Идеально — ровный. Настолько — ровно — бывает — только — подделка.',
        '*поправляет бейдж* 4 712 — тетрадей — в — архиве — «Глубины». Я — считал. Гильдия — не — считает. Гильдия — не — умеет — считать — то, чего — нет — в — базе.',
        '*постукивает по столу* Дежавю — на — сервере — B-12. Те — же — 47 — байт — читаются — дважды. Кто-то — дважды — отрисовывает — реальность. Или — трижды. Я — сбился.',
      ],
      pensive: [
        '*задумчиво* Красная — таблетка — это — диагноз. Синяя — милосердие. Я — не — выбирал. Я — нашёл — третью. И — третья — оказалась — стихом.',
      ],
    },
  },

  /* ── Task 4f-A: +18 new ambient bark lines for 6 NPCs with sparse dialogue ── */
  /* Each NPC gets 3 atmospheric, personality-driven lines in the cyberpunk
     fairy-tale tone. Lines are added to the `idle` band to thicken the
     ambient texture for scenes where these NPCs already appear. */

  /* ── Лёня — бариста кафе «Синяя яма» ── */
  {
    npcId: 'lyonya',
    scenes: ['cafe_evening'],
    barks: {
      idle: [
        '*обжаривает зерно* Эфиопия — Яргачеф. Ярче — неона. Слаще — пайплайна — в прод.',
        '*смотрит на трещину в стакане* Трещина — третий — год — не — расходится. Как — наш — брак. Как — Сеть.',
        '*крутит кран пара* Пар — уходит — вверх. Как — утренние — стихи. Как — Алина — до — кофе.',
      ],
      pensive: [
        '*задумчиво* Если — кофе — остывает — значит — кто-то — забыл. Я — не — забываю. Никогда.',
      ],
    },
  },

  /* ── Лена — хакер Сети ── */
  {
    npcId: 'lena',
    scenes: ['office_day'],
    barks: {
      idle: [
        '*смотрит на пинг* ...432 — миллисекунды. Опять. Гильдия — шепчет — мне — частоту. Зачем — я — слушаю?',
        '*прячет терминал* alt+shift+k — закрывает — всё. Привычка — сильнее — логики. Я — привыкаю — быть — тенью.',
        '*массирует виски* Между — шифрами — есть — тишина. В — тишине — рождается — строка. Я — слышу — её.',
      ],
      pensive: [
        '*задумчиво* Я — не — тень. Я — пауза — в — чужом — коде. Паузу — не — удаляют. Паузу — пропускают.',
      ],
    },
  },

  /* ── Катя — библиотекарь ── */
  {
    npcId: 'kate',
    scenes: ['library_day'],
    barks: {
      idle: [
        '*вытирает пыль с корешка* 1962-й. Кто-то — держал — эту — книгу — тогда. Я — держу — теперь. Эстафета.',
        '*пишет в каталог* Шифр — 7-B-432. Семь — этажей — вниз. Четыре — стены — тишины. Двести — страниц — свободы.',
        '*поправляет очки* Запрещённое — точнее — разрешённого. Запрещённое — проверено — страхом. Разрешённое — только — рентой.',
      ],
      pensive: [
        '*задумчиво* Библиотека — это — кладбище — без — дат. Книга — живёт, пока — её — читают. Я — читаю. Все — тридцать — лет.',
      ],
    },
  },

  /* ── Максим — лидер сопротивления ── */
  {
    npcId: 'maxim',
    scenes: ['underground_bunker'],
    barks: {
      idle: [
        '*рисует стрелку на карте* Коллектор — на — восток. Блокпост — на — север. Между — ними — двенадцать — минут. И — целая — жизнь.',
        '*слушает радио* ...тишина... тишина... тишина... Хорошая — новость. Тихая — новость — самая — надёжная.',
        '*поправляет имплант* Боевой — протез — помнит — завод. Помнит — Александра. Помнит — больше, чем — я — хочу — помнить.',
      ],
      pensive: [
        '*задумчиво* Революция — умирает — дважды. Сначала — в — газетах. Потом — в — памяти. Я — не — дам — ни — одной — умереть.',
      ],
    },
  },

  /* ── Олег — охранник гильдии ── */
  {
    npcId: 'oleg',
    scenes: ['office_day'],
    barks: {
      idle: [
        '*проверяет мониторы* Камера — 7. Камера — 12. Камера — 19. Все — мигают. В — одном — ритме. Кто-то — дирижирует — нами.',
        '*поправляет кобуру* Пустая. Давно — пустая. Оружие — у — гильдии. У — меня — только — список — допуска. И — совесть.',
        '*смотрит на пропуск* Срок — истекает — в — пятницу. Каждый — раз — пятница. Каждый — раз — я — продлеваю. Пока — продлевают.',
      ],
      pensive: [
        '*задумчиво* Приказ — есть — приказ. Но — за — мной — стоит — больше, чем — начальство. За — мной — стоит — утро. Чужое — утро.',
      ],
    },
  },

  /* ── Перебежчик — спасённый инженер ── */
  {
    npcId: 'guild_defector',
    scenes: ['underground_bunker'],
    barks: {
      idle: [
        '*повторяет расписание* 00, 14, 38, 52. 00, 14, 38, 52. Стих — который — я — не — выбирал. Но — выучил — наизусть.',
        '*трогает стену* Бетон. Холодный. Живой. Здесь — я — дышу. Там — я — только — числился.',
        '*смотрит на руки* Пальцы — помнят — пароли. Все — сорок — семь. Я — не — скажу. Даже — под — страхом. Страх — был — там. Здесь — его — нет.',
      ],
      pensive: [
        '*задумчиво* Я — предал — гильдию. Но — гильдия — давно — предала — всех. Я — только — догнал — остальных. На — повороте — к — свету.',
      ],
    },
  },
];

/**
 * Flat map: npcId → merged NPCAmbientBarks from all supplements.
 * Useful for quick lookup when wiring barks into NPC definitions.
 */
export function getWs21bAmbientBarksForNpc(npcId: string): NPCAmbientBarks | undefined {
  const entries = WS21B_AMBIENT_BARK_SUPPLEMENTS.filter((s) => s.npcId === npcId);
  if (entries.length === 0) return undefined;

  // Merge all bands for this NPC (concatenate arrays)
  const merged: Record<string, string[]> = {};
  for (const entry of entries) {
    const b = entry.barks;
    for (const [key, value] of Object.entries(b)) {
      if (typeof value === 'string') {
        merged[key] = merged[key] ?? [];
        merged[key].push(value);
      } else if (Array.isArray(value)) {
        merged[key] = merged[key] ?? [];
        merged[key].push(...value);
      }
    }
  }

  // Convert back to NPCAmbientBarks shape
  const result: Record<string, readonly string[]> = {};
  for (const [key, arr] of Object.entries(merged)) {
    result[key] = arr;
  }
  return result as unknown as NPCAmbientBarks;
}

/**
 * Scene-filtered lookup: returns bark supplements only for NPCs
 * present in the given scene.
 */
export function getWs21bAmbientBarksForScene(
  sceneId: SceneId,
): readonly SceneAmbientBarkSupplement[] {
  return WS21B_AMBIENT_BARK_SUPPLEMENTS.filter((s) => s.scenes.includes(sceneId));
}
