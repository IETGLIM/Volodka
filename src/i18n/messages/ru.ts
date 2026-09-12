/** Russian UI and ambience strings — default game locale. */
export const RU_MESSAGES: Readonly<Record<string, string>> = {
  'ambient.cafe.label': 'Кафе',
  'ambient.cafe.description': 'Тёплый гул кафе, звон посуды, приглушённый разговор',
  'ambient.cafe.accessibility': 'Слышен тёплый гул кафе, звон посуды и приглушённые разговоры',
  'ambient.office.label': 'Офис',
  'ambient.office.description': 'Гул серверов, кондиционер, щелчки клавиатуры',
  'ambient.office.accessibility': 'Слышен гул серверов и кондиционера, периодические щелчки клавиатуры',
  'ambient.park.label': 'Парк',
  'ambient.park.description': 'Птицы, ветер в листве, далёкий город',
  'ambient.park.accessibility': 'Слышны птицы, шелест листвы и далёкий городской фон',
  'ambient.library.label': 'Библиотека',
  'ambient.library.description': 'Тишина, шорох страниц, скрип половиц',
  'ambient.library.accessibility': 'Тихая атмосфера библиотеки, шорох страниц и скрип половиц',
  'ambient.street.label': 'Улица',
  'ambient.street.description': 'Гул трафика, неон, дождь на асфальте',
  'ambient.street.accessibility': 'Слышен городской гул, гудение неона и звук дождя',
  'ambient.home.label': 'Дом',
  'ambient.home.description': 'Тихая комната, тиканье часов, далёкий город',
  'ambient.home.accessibility': 'Тихая домашняя атмосфера с тиканием часов',
  'ambient.factory.label': 'Завод',
  'ambient.factory.description': 'Гул машин, металл, эхо цеха',
  'ambient.factory.accessibility': 'Слышен гул заводских машин и металлическое эхо',
  'ambient.basement.label': 'Подвал',
  'ambient.basement.description': 'Сырость, капли, гул проводов',
  'ambient.basement.accessibility': 'Слышны капли, гул проводов и приглушённое эхо подвала',
  'ambient.rooftop.label': 'Крыша',
  'ambient.rooftop.description': 'Ветер, город внизу, антенны',
  'ambient.rooftop.accessibility': 'Слышен ветер на крыше и далёкий городской гул',
  'ambient.corridor.label': 'Коридор',
  'ambient.corridor.description': 'Эхо шагов, скрип дверей, тишина соседей',
  'ambient.corridor.accessibility': 'Слышно эхо шагов и скрип дверей в коридоре',
  'ambient.combat.label': 'Бой',
  'ambient.combat.description': 'Напряжение, пульс, тревога',
  'ambient.combat.accessibility': 'Напряжённая боевая атмосфера',
  'ambient.rain.label': 'Дождь',
  'ambient.rain.description': 'Капли по стеклу, лужи, гул дождя',
  'ambient.rain.accessibility': 'Слышен дождь и капли по поверхностям',
  'ambient.snow.label': 'Снег',
  'ambient.snow.description': 'Тишина, ветер, хруст снега',
  'ambient.snow.accessibility': 'Тихая зимняя атмосфера со снегом и ветром',
  'ambient.pier.label': 'Пирс',
  'ambient.pier.description': 'Вода, чайки, скрип деревянных досок',
  'ambient.pier.accessibility': 'Слышен плеск воды, чайки и скрип пирса',

  /* HUD — строки HUD-виджетов (этап 115, волна 1).
   * Значения байт-в-байт совпадают с fallback-литералами в потребителях:
   * t(key, fallback) возвращает RU_MESSAGES[key] ?? fallback, поэтому вывод
   * на экран не меняется. Динамические (составные) строки HUD передают ключ
   * через константы и СОЗНАТЕЛЬНО не добавлены сюда: статичная запись
   * каталога перебила бы интерполяцию значений внутри fallback
   * (t() вернул бы шаблон вместо подставленных чисел/названий). */

  /* PlayerStatusFrame.tsx */
  'hud.playerStatus.aria': 'Состояние героя: энергия, стресс, карма',
  'hud.playerStatus.monogram': 'В',
  'hud.playerStatus.energyShort': 'ЭН',
  'hud.playerStatus.stressShort': 'СТР',
  'hud.playerStatus.karmaShort': 'КАР',
  /* Шаблоны aria-строк PlayerStatusFrame (этап 115, волна 2) */
  'hud.playerStatus.energyAria': 'Энергия: {n} из 100',
  'hud.playerStatus.stressAria': 'Стресс: {n} из 100',
  'hud.playerStatus.karmaAria': 'Карма: {karma}, {tier}',

  /* karmaTier.ts */
  'hud.karmaTier.positive': 'Позитивная',
  'hud.karmaTier.negative': 'Негативная',
  'hud.karmaTier.neutral': 'Нейтральная',

  /* TopBarDataTicker.tsx */
  'hud.ticker.datastream': 'ВОЛОДКА://DATASTREAM',
  'hud.ticker.badge.onAir': 'ЭФИР',

  /* SceneContextChip.tsx */
  'hud.sceneContext.street': 'Улица',
  'hud.sceneContext.indoor': 'Помещение',
  'hud.sceneContext.underground': 'Подземелье',
  'hud.sceneContext.dream': 'Сон',
  'hud.sceneContext.npcPrefix': 'NPC:',
  'hud.sceneContext.exitsPrefix': 'EX:',

  /* EnvironmentMoodIndicator.tsx */
  'hud.mood.storm': 'ШТОРМ',
  'hud.mood.rain': 'ДОЖДЬ',
  'hud.mood.night': 'НОЧЬ',
  'hud.mood.dusk': 'СУМЕРКИ',
  'hud.mood.dawn': 'РАССВЕТ',
  'hud.mood.cozy': 'УЮТ',
  'hud.mood.calm': 'ТИШИНА',
  'hud.mood.underground': 'ПОДЗЕМЬЕ',
  'hud.mood.neutral': 'НЕЙТРАЛЬ',

  /* QuestObjectiveCard.tsx */
  'hud.questCard.type.main': 'ОСНОВНОЙ',
  'hud.questCard.type.side': 'ПОБОЧНЫЙ',
  'hud.questCard.type.hidden': 'СКРЫТЫЙ',
  'hud.questCard.type.daily': 'ЕЖЕДНЕВНЫЙ',
  'hud.questCard.type.weekly': 'ЕЖЕДЕЛЬНЫЙ',
  'hud.questCard.difficulty.trivial': 'ТРИВИАЛЬНЫЙ',
  'hud.questCard.difficulty.easy': 'ЛЁГКИЙ',
  'hud.questCard.difficulty.normal': 'ОБЫЧНЫЙ',
  'hud.questCard.difficulty.hard': 'СЛОЖНЫЙ',
  'hud.questCard.difficulty.nightmare': 'КОШМАР',
  'hud.questCard.difficulty.impossible': 'НЕВОЗМОЖНЫЙ',
  'hud.questCard.timeUp': 'Время вышло!',
  'hud.questCard.objectiveHidden': 'Цель скрыта',
  'hud.questCard.hiddenMask': '???',
  'hud.questCard.optional': '(опционально)',
  'hud.questCard.progressLabel': 'Прогресс:',
  'hud.questCard.rewardsLabel': 'Награды:',
  'hud.questCard.untrack': 'Снять',
  'hud.questCard.track': 'Отслеж.',
  'hud.questCard.untrackAria': 'Снять отслеживание',
  'hud.questCard.trackAria': 'Отслеживать',
  'hud.questCard.collapse': 'Свернуть ▲',
  'hud.questCard.expand': 'Развернуть ▼',
  'hud.questCard.collapseAria': 'Свернуть',
  'hud.questCard.expandAria': 'Развернуть',

  /* ActiveQuestMiniTracker.tsx */
  'hud.questTracker.allDone': 'Все цели выполнены',
  'hud.questTracker.pinnedAria': 'Закреплено',
  'hud.questTracker.typeShort.main': 'ОСН',
  'hud.questTracker.typeShort.side': 'ПОБ',
  'hud.questTracker.typeShort.hidden': 'СКР',
  'hud.questTracker.typeShort.daily': 'ЕЖД',
  'hud.questTracker.poemWord.one': 'стихотворение',
  'hud.questTracker.poemWord.few': 'стихотворения',
  'hud.questTracker.poemWord.many': 'стихотворений',
  'hud.questTracker.unpin': 'Открепить',
  'hud.questTracker.pin': 'Закрепить',
  'hud.questTracker.unpinAria': 'Открепить',
  'hud.questTracker.pinAria': 'Закрепить',
  'hud.questTracker.journal': 'Журнал',
  'hud.questTracker.journalAria': 'Открыть журнал',
  'hud.questTracker.map': 'Карта',
  'hud.questTracker.mapAria': 'Показать цель на карте',

  /* HUDNotificationFeed.tsx */
  'hud.feed.aria': 'Лента уведомлений',

  /* StaminaBar.tsx */
  'hud.stamina.label': 'Выносливость',
  'hud.stamina.initialAria': 'Выносливость: 100%',

  /* EmergencyHelpButton.tsx */
  'hud.emergency.aria': 'Что делать?',
  'hud.emergency.title': 'Что делать?',
  'hud.emergency.activeQuestFallback': 'Активное задание — открой журнал [Q]',
  'hud.emergency.currentObjective': 'Текущая цель',
  'hud.emergency.hint': 'Подсказка',
  'hud.emergency.more': '…и другие',
  'hud.emergency.reset': 'Сбросить взаимодействие',
  'hud.emergency.lastResort': 'Если ничего не помогает — сохраните и загрузите игру',

  /* ExplorationHUD.tsx (индикатор сохранения) */
  'hud.save.toast': 'Запись сохранена',

  /* SceneTopBarHud.tsx */
  'hud.topBar.aria': 'Верхняя панель интерфейса: сцена, уровень, опыт, компас и время',

  /* QuickAccessToolbar.tsx */
  'hud.toolbar.aria': 'Быстрый доступ',
  'hud.toolbar.map': 'Карта',
  'hud.toolbar.inventory': 'Инвентарь',
  'hud.toolbar.quests': 'Задания',
  'hud.toolbar.codex': 'Кодекс',
  'hud.toolbar.journal': 'Журнал',
  'hud.toolbar.poems': 'Стихи',

  /* notificationToastConstants.ts — отображаемые имена навыков */
  'hud.skill.name.logic': 'Логика',
  'hud.skill.name.coding': 'Программирование',
  'hud.skill.name.empathy': 'Эмпатия',
  'hud.skill.name.persuasion': 'Убеждение',
  'hud.skill.name.intuition': 'Интуиция',
  'hud.skill.name.writing': 'Письмо',
  'hud.skill.name.rhythm': 'Ритм',

  /* notificationToastConstants.ts — подписи типов тостов */
  'hud.toast.type.karma': 'Карма',
  'hud.toast.type.energy': 'Энергия',
  'hud.toast.type.stress': 'Стресс',
  'hud.toast.type.skill': 'Навык',
  'hud.toast.type.poem': 'Стих',
  'hud.toast.type.quest': 'Квест',
  'hud.toast.type.crafting': 'Крафт',
  'hud.toast.type.item': 'Предмет',
  'hud.toast.type.achievement': 'Достижение',

  /* notificationToastConstants.ts — aria-подписи декоративных иконок */
  'hud.toast.icon.karma': 'Карма',
  'hud.toast.icon.energy': 'Энергия',
  'hud.toast.icon.stress': 'Стресс',
  'hud.toast.icon.skill': 'Навык',
  'hud.toast.icon.poem': 'Стих',
  'hud.toast.icon.quest': 'Квест',
  'hud.toast.icon.crafting': 'Крафт',
  'hud.toast.icon.item': 'Предмет',
  'hud.toast.icon.achievement': 'Достижение',

  /* notificationToastPresentation.ts (статичный фрагмент билдера награды) */
  'hud.toast.noRewards': 'нет',

  /* notificationToastPresentation.ts (этап 115, волна 2): шаблоны билдеров
   * с плейсхолдерами {name} — интерполяция в t(key, fallback, params).
   * Значения байт-в-байт повторяют прежние литералы-фолбэки. */
  'hud.toast.accessibleLabel': '{type}: {message}',
  'hud.toast.power': 'Способность: {name}',
  'hud.toast.combatDefeat': 'Поражение: -{n} энергии',
  'hud.toast.questReward': 'Награда за «{title}»: {rewards}',
  'hud.toast.karma': 'Карма {delta}',
  'hud.toast.energy': 'Энергия {delta}',
  'hud.toast.stress': 'Стресс {delta}',
  'hud.toast.skill': 'Навык: {name} {delta}',

  /* ─── Этап 115, волна 3: WeatherIndicator / DayNightCycleIndicator /
   * CompassHUD / MinimapComponent / QuickUseBar / MobileActionButtons /
   * AaaImmersiveGuide. Значения байт-в-байт совпадают с прежними
   * литералами — видимый вывод не изменился. ─── */

  /* WeatherIndicator.tsx */
  'hud.weather.title': 'Погода',
  'hud.weather.unit': 'Цельсий',
  'hud.weather.type.clear': 'Ясно',
  'hud.weather.type.rain': 'Дождь',
  'hud.weather.type.snow': 'Снег',
  'hud.weather.type.fog': 'Туман',
  'hud.weather.type.storm': 'Гроза',
  'hud.weather.wind.calm': 'Штиль',
  'hud.weather.wind.light': 'Лёгкий',
  'hud.weather.wind.strong': 'Сильный',
  'hud.weather.air.clean': 'Чистый',
  'hud.weather.air.dusty': 'Пыльный',
  'hud.weather.air.smoggy': 'Смог',

  /* DayNightCycleIndicator.tsx */
  'hud.dayNight.phase.morning': 'Утро',
  'hud.dayNight.phase.day': 'День',
  'hud.dayNight.phase.evening': 'Вечер',
  'hud.dayNight.phase.night': 'Ночь',
  'hud.dayNight.aria': 'Время суток: {phase}, {time}',
  'hud.dayNight.next': 'Следующий:',
  'hud.dayNight.nextIn': 'через {hours}ч',

  /* CompassHUD.tsx — буквы направлений и полные названия для aria */
  'hud.compass.n': 'С',
  'hud.compass.ne': 'СВ',
  'hud.compass.e': 'В',
  'hud.compass.se': 'ЮВ',
  'hud.compass.s': 'Ю',
  'hud.compass.sw': 'ЮЗ',
  'hud.compass.w': 'З',
  'hud.compass.nw': 'СЗ',
  'hud.compass.aria': 'Компас: направление {dir}',
  'hud.compass.heading.north': 'Север',
  'hud.compass.heading.northeast': 'Северо-восток',
  'hud.compass.heading.east': 'Восток',
  'hud.compass.heading.southeast': 'Юго-восток',
  'hud.compass.heading.south': 'Юг',
  'hud.compass.heading.southwest': 'Юго-запад',
  'hud.compass.heading.west': 'Запад',
  'hud.compass.heading.northwest': 'Северо-запад',

  /* MinimapComponent.tsx */
  'hud.minimap.aria': 'Миникарта',
  'hud.minimap.collapse': 'Свернуть миникарту',
  'hud.minimap.expand': 'Развернуть миникарту',
  'hud.minimap.zoomGroupAria': 'Масштаб миникарты',
  'hud.minimap.zoomOut': 'Отдалить миникарту',
  'hud.minimap.zoomOutTitle': 'Отдалить обзор',
  'hud.minimap.zoomIn': 'Приблизить миникарту',
  'hud.minimap.zoomInTitle': 'Приблизить обзор',
  'hud.minimap.distance': '{n} м',
  'hud.minimap.zoom.far': 'Обзор',
  'hud.minimap.zoom.normal': 'Обычный',
  'hud.minimap.zoom.close': 'Крупный',

  /* QuickUseBar.tsx */
  'hud.quickUse.assignTitle': 'Слот {slot} — Назначить',
  'hud.quickUse.noConsumables': 'Нет расходуемых',
  'hud.quickUse.remove': 'Убрать из слота',
  'hud.quickUse.used': 'Использовано',
  'hud.quickUse.useToast': '{item}: {effects}',
  'hud.quickUse.skillGain': '{name} +{delta}',
  'hud.quickUse.useAria': 'Использовать {item} [{slot}] (ПКМ — назначить)',
  'hud.quickUse.emptyAria': 'Пустой слот {slot} (ПКМ — назначить)',
  'hud.quickUse.assignTooltip': '{item} [{slot}] — ПКМ для назначения',
  'hud.quickUse.emptyTooltip': 'Слот {slot} — ПКМ для назначения',

  /* MobileActionButtons.tsx */
  'hud.mobileActions.aria': 'Экранные кнопки действий',
  'hud.mobileActions.interact': 'Взаимодействовать',
  'hud.mobileActions.interactLabel': 'Действие',
  'hud.mobileActions.strike': 'Опережающий удар',
  'hud.mobileActions.strikeLabel': 'Удар',
  'hud.mobileActions.useItem': 'Использовать предмет',
  'hud.mobileActions.itemLabel': 'Предмет',
  'hud.mobileActions.runOnAria': 'Бег выключен',
  'hud.mobileActions.runOffAria': 'Бег включён',
  'hud.mobileActions.runOn': 'Бег вкл',
  'hud.mobileActions.runOff': 'Бег выкл',
  'hud.mobileActions.jump': 'Прыжок',
  'hud.mobileActions.jumpLabel': 'Прыжок',
  'hud.mobileActions.inventory': 'Инвентарь',
  'hud.mobileActions.bagLabel': 'Сумка',
  'hud.mobileActions.journal': 'Журнал',
  'hud.mobileActions.journalLabel': 'Журнал',
  'hud.mobileActions.saveGroupAria': 'Сохранение и загрузка',
  'hud.mobileActions.quickSave': 'Быстрое сохранение',
  'hud.mobileActions.saveLabel': 'Сохранить',
  'hud.mobileActions.quickLoad': 'Быстрая загрузка',
  'hud.mobileActions.loadLabel': 'Загрузить',
  'hud.mobileActions.noStamina': 'Не хватает выносливости для удара',

  /* AaaImmersiveGuide.tsx — строки внутреннего голоса (шёпот/мысль/память) */
  'hud.guide.firstInteract': 'Руки помнят — нажми, потяни, послушай, что ответит.',
  'hud.guide.firstNpc': 'Кто-то рядом. Слова иногда открывают двери лучше ключей.',
  'hud.guide.firstPoem': 'Строки на бумаге теплее, чем кажется. Прочитай — и мир ответит.',
  'hud.guide.lowEnergy': 'Дыхание сбилось. Кофе, пауза, строка стиха — тоже путь.',
  'hud.guide.highStress': 'Шум в голове. Остановись. Послушай тишину между мыслями.',
  'hud.guide.combatNear': 'Тень сгустилась. Не обязательно драться, но будь готов.',
  'hud.guide.questNew': 'Новая нить. Потянет — посмотрим, куда приведет.',
  'hud.guide.sceneChka': 'ЧК. Запах дешевого кофе и старых историй.',
  'hud.guide.sceneOffice': 'Офис. Гул машин и чужие разговоры за стеной.',
  'hud.guide.sceneLibrary': 'Пыль, книги, тихий шепот страниц.',
  'hud.guide.sceneFactory': 'Металл и пар. Здесь что-то большое дышит.',
  'hud.guide.scenePier': 'Вода тихо плещет. Можно бросить мысли в реку.',
  'hud.guide.sceneRoof': 'Ветер сильный. Город выглядит меньше сверху.',
  'hud.guide.sceneBunker': 'Зелёный свет. Машины помнят имена.',
  'hud.guide.scenePark': 'Листья шепчут. Здесь когда-то было тихо.',
  'hud.guide.firstExploreHub': 'Можно просто ходить. Мир сам расскажет, если послушать.',
  'hud.guide.karmaHigh': 'Ты стал чуть светлее. Люди это чувствуют.',
  'hud.guide.karmaLow': 'Тяжесть в груди. Мир отвечает тем же.',
  'hud.guide.poemPower': 'Стихи шевелятся внутри. Можно выпустить их наружу.',
  'hud.guide.nightCity': 'Неон мигает. Город не спит, только притворяется.',
  'hud.guide.sleepDream': 'Звёзды шепчут. Это не просто сон — это память.',
  'hud.guide.dreamMemory': 'Старый предмет плывёт. Он помнит тебя.',
  'hud.guide.rooftopSky': 'Ветер сильный. Здесь можно оставить всё позади.',
  'hud.guide.chkCampfire': 'Огонь трещит. Истории в нём старше нас.',
  'hud.guide.battleAfter': 'Тишина после. Обломки помнят.',
  'hud.guide.libraryBasement': 'Пыль тяжёлая. Секреты не любят свет.',
  'hud.guide.albertRoom': 'Тёплый свет. Здесь можно остаться навсегда.',
  'hud.guide.solnyshRoom': 'Солнце в окне. Даже в темноте светит.',
  'hud.guide.zaremaRoom': 'Цветы и зеркала. Кто-то любил это место.',
  'hud.guide.cityPlaza': 'Неон в лужах. Город дышит неоном.',
  'hud.guide.forestNight': 'Деревья помнят. Шепчут то, что ты забыл.',
};
