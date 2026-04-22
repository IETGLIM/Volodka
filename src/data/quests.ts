import type { Quest, ExtendedQuest, QuestObjective, QuestReward } from './types';

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function createObjective(
  id: string, 
  text: string, 
  options?: { 
    targetValue?: number; 
    hidden?: boolean;
    completed?: boolean;
    currentValue?: number;
    hint?: string;
    targetLocation?: string;
    targetNPC?: string;
    mapHint?: { x: number; z: number };
    targetItem?: string;
    stageType?: QuestObjective['stageType'];
    linkedStoryNodeId?: string;
  }
): QuestObjective {
  return {
    id,
    text,
    completed: options?.completed || false,
    targetValue: options?.targetValue,
    currentValue: options?.currentValue || 0,
    hidden: options?.hidden || false,
    hint: options?.hint,
    targetLocation: options?.targetLocation,
    targetNPC: options?.targetNPC,
    mapHint: options?.mapHint,
    targetItem: options?.targetItem,
    stageType: options?.stageType,
    linkedStoryNodeId: options?.linkedStoryNodeId,
  };
}

function createReward(options: QuestReward): QuestReward {
  return {
    ...options,
    experience: options.experience,
    creativity: options.creativity || 0,
    mood: options.mood || 0,
    stability: options.stability || 0,
    karma: options.karma || 0,
    skillPoints: options.skillPoints || 0,
    itemRewards: options.itemRewards ?? [],
    unlockFlags: options.unlockFlags ?? [],
  };
}

// ============================================
// ОПРЕДЕЛЕНИЯ КВЕСТОВ
// ============================================

export const QUEST_DEFINITIONS: Record<string, ExtendedQuest> = {
  // ========== ГЛАВНАЯ ЦЕЛЬ ==========
  
  main_goal: {
    id: 'main_goal',
    title: '🎯 Наследие Володьки',
    description: 'Оставить после себя что-то важное. Найти смысл в 12 годах техподдержки и превратить боль в искусство. Прогресс по шагам — здесь, в панели 📋; параллельные IT-цепочки дублируй в 💻.',
    type: 'main',
    status: 'active',
    objectives: [
      createObjective('write_poems', 'Написать 10 стихотворений', {
        targetValue: 10,
        currentValue: 0,
        hint: 'Пиши стихи ночью на кухне или дома; в комнате — у стола или в черновиках на ноутбуке.',
        targetLocation: 'volodka_room',
        mapHint: { x: 2.85, z: 0.15 },
        stageType: 'exploration',
      }),
      createObjective('perform_live', 'Выступить публично', {
        hint: 'Посети кафе "Синяя Яма" в пятницу вечером',
        targetLocation: 'cafe_evening'
      }),
      createObjective('find_listener', 'Найти того, кто услышит', {
        hint: 'Поговори с посетителями кафе после выступления'
      }),
      createObjective('make_peace', 'Примириться с прошлым', {
        hint: 'Вспомни и прими свою историю'
      }),
      createObjective('leave_legacy', 'Оставить наследие', {
        hint: 'Собери сборник стихов и поделись с миром'
      }),
    ],
    reward: createReward({
      experience: 220,
      creativity: 50,
      karma: 30,
      stability: 25,
      mood: 20,
      skillPoints: 5,
    }),
    startNode: 'start',
  },

  /** Короткий побочный квест 3D-обхода комнаты Заремы (связка с `InteractionRegistry`). */
  exploration_zarema_hearth: {
    id: 'exploration_zarema_hearth',
    title: '🏠 Тёплый угол',
    description:
      'Отметить уютный угол в комнате Заремы и Альберта — там, где слышно, как «тишина» на самом деле не пустая.',
    type: 'side',
    status: 'active',
    objectives: [
      createObjective('hearth_moment', 'Побыть у «очага разговора»', {
        targetValue: 1,
        currentValue: 0,
        hint: 'Зона у дивана в 3D-обходе (отдельный триггер с E)',
        targetLocation: 'zarema_albert_room',
        mapHint: { x: -1.85, z: 1.1 },
      }),
    ],
    reward: createReward({ experience: 45, mood: 5, creativity: 3, karma: 2 }),
    /** Сторинод-хаб 3D-обхода (`explore_mode` в `storyNodes`). */
    startNode: 'explore_mode',
  },

  /**
   * Обход `volodka_room`: форс через мини-игру узлов (ветка A) или «честный» IT-путь только осмотром
   * трёх панелей без ACL (ветка B — описание и метки; прогресс B можно нарастить отдельным тикетом).
   */
  exploration_volodka_rack: {
    id: 'exploration_volodka_rack',
    title: '⚡ Разрыв синхронизации',
    description:
      'Стойка мониторинга помнит два сценария: **форс** — краткая матрица узлов у стола; **аудит** — три спокойных осмотра Kibana / Zabbix / Grafana без изменения прав. Сейчас в игре завершение идёт по ветке форса; ветка аудита оставлена для расширения (флаги + increment).',
    type: 'side',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('rack_force_nodes', 'Свести узлы стека в безопасную последовательность (зона стойки, E)', {
        targetValue: 1,
        currentValue: 0,
        hint: 'Триггер «матрица узлов» у рабочего стола с тремя экранами.',
        targetLocation: 'volodka_room',
        mapHint: { x: 3.45, z: 0.08 },
        stageType: 'minigame',
      }),
      createObjective('rack_audit_panels', 'Честный путь: осмотреть Kibana, Zabbix и Grafana без взлома', {
        targetValue: 3,
        currentValue: 0,
        hint: 'Три отдельных осмотра (радиальное меню) — ветка для будущего инкремента.',
        targetLocation: 'volodka_room',
        stageType: 'exploration',
      }),
    ],
    reward: createReward({ experience: 55, karma: -2, stability: 6, mood: -1, creativity: 9 }),
    startNode: 'explore_mode',
  },
  
  // ========== ТЕХНИЧЕСКИЕ IT-КВЕСТЫ (НОВЫЕ!) ==========
  
  openstack_server_find: {
    id: 'openstack_server_find',
    title: '🖥️ OpenStack: Поиск сервера',
    description: 'Найти сервер по IP-адресу через CLI. Получить имя сервера и ссылку на консоль.',
    type: 'main',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('get_ip', 'Получить IP-адрес от начальника', {
        hint: 'Поговори с Начальником в офисе',
        targetNPC: 'office_boss',
        targetLocation: 'office_morning'
      }),
      createObjective('use_cli', 'Использовать OpenStack CLI', {
        hint: 'Подойди к терминалу и введи команду openstack server list',
        targetLocation: 'office_morning'
      }),
      createObjective('find_server', 'Найти сервер по IP', {
        hint: 'Используй: openstack server show <ID> --format json'
      }),
      createObjective('get_console', 'Получить ссылку на консоль', {
        hint: 'Найди в выводе поле "console_url"'
      }),
    ],
    reward: createReward({
      skillPoints: 2,
      stability: 10,
      karma: 5,
    }),
    startNode: 'start',
  },
  
  rabbitmq_overflow: {
    id: 'rabbitmq_overflow',
    title: '🐰 RabbitMQ: Накопление сообщений',
    description: 'Очередь переполнена — более 100000 сообщений. Принять решение: собирать ACK? Спросить админов? Написать владельцам?',
    type: 'main',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('detect_overflow', 'Обнаружить накопление >100000', {
        hint: 'Проверь мониторинг в терминале: rabbitmqctl list_queues',
        targetLocation: 'office_morning'
      }),
      createObjective('ask_admins', 'Спросить админов про ACK', {
        hint: 'Поговори с коллегой о проблеме',
        targetNPC: 'office_colleague'
      }),
      createObjective('decide_action', 'Принять решение', {
        hint: 'Выбери: собрать ACK, эскалировать или написать владельцам'
      }),
      createObjective('notify_owners', 'Направить письмо владельцам', {
        hint: 'Выбери "Написать владельцам" в диалоге'
      }),
    ],
    reward: createReward({
      skillPoints: 2,
      karma: 10,
      stability: 5,
    }),
  },
  
  kubernetes_orchestrator: {
    id: 'kubernetes_orchestrator',
    title: '☸️ Kubernetes: Перезапуск оркестратора',
    description: 'Внутреннее облако. Оркестратор упал. Проверить причину и перезапустить.',
    type: 'main',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('check_status', 'Проверить статус кластера', {
        hint: 'Введи в терминале: kubectl get nodes',
        targetLocation: 'office_morning'
      }),
      createObjective('check_logs', 'Проверить логи оркестратора', {
        hint: 'kubectl logs -n kube-system <pod-name>'
      }),
      createObjective('find_cause', 'Найти причину падения', {
        hint: 'Проанализируй логи на ошибки'
      }),
      createObjective('restart_orchestrator', 'Перезапустить оркестратор', {
        hint: 'kubectl rollout restart deployment/orchestrator -n internal-cloud'
      }),
      createObjective('verify_recovery', 'Проверить восстановление', {
        hint: 'Убедись что все pods в Running состоянии'
      }),
    ],
    reward: createReward({
      skillPoints: 3,
      stability: 15,
      karma: 5,
    }),
  },
  
  auth_crisis: {
    id: 'auth_crisis',
    title: '🔥 Кризис авторизации',
    description: 'Банк "Северный Капитал" — 5000+ пользователей не могут войти. 15 минут до эскалации. Найти и исправить проблему.',
    type: 'main',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('check_logs', 'Проверить логи Kibana', {
        hint: 'Подойди к среднему монитору и проверь логи',
        targetLocation: 'office_morning'
      }),
      createObjective('find_root_cause', 'Найти корневую причину', {
        hint: 'Ищи: Connection refused, Pool exhausted, Timeout'
      }),
      createObjective('apply_fix', 'Применить исправление', {
        hint: 'Откатить деплой: kubectl rollout undo deployment/loyalty-points'
      }),
      createObjective('verify_fix', 'Проверить решение', {
        hint: 'Проверь SHOW PROCESSLIST — должно быть < 800 соединений'
      }),
      createObjective('document_incident', 'Задокументировать инцидент', {
        hint: 'Напиши постмортем в тикете'
      }),
    ],
    reward: createReward({
      stability: 15,
      karma: 5,
      skillPoints: 1,
    }),
    startNode: 'start',
  },
  
  database_pool_exhausted: {
    id: 'database_pool_exhausted',
    title: '🗄️ Исчерпание пула соединений',
    description: 'База данных перегружена. 847 соединений при лимите 800. Новый микросервис не возвращает соединения.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'locked',
    objectives: [
      createObjective('check_processlist', 'Проверить SHOW PROCESSLIST', {
        hint: 'Выполни в терминале: SHOW PROCESSLIST',
        targetLocation: 'office_morning'
      }),
      createObjective('identify_culprit', 'Определить виновника', {
        hint: 'Найди микросервис с максимальным числом соединений'
      }),
      createObjective('check_deploy_time', 'Проверить время деплоя', {
        hint: 'CI/CD деплой был в 3:47 ночи'
      }),
      createObjective('notify_developers', 'Уведомить разработчиков', {
        hint: 'Напиши в Slack канал разработки'
      }),
    ],
    reward: createReward({
      skillPoints: 1,
      stability: 5,
    }),
    discoveryCondition: {
      hasFlag: 'found_db_issue',
    },
  },
  
  ssl_certificate_renewal: {
    id: 'ssl_certificate_renewal',
    title: '🔐 SSL-сертификат истекает',
    description: 'Сертификат для banking.example.com истекает через 48 часов. Обновить без простоя.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'locked',
    objectives: [
      createObjective('check_expiry', 'Проверить срок действия', {
        hint: 'openssl s_client -connect banking.example.com:443',
        targetLocation: 'office_morning'
      }),
      createObjective('request_new_cert', 'Запросить новый сертификат', {
        hint: 'Напиши в security-team@company.com'
      }),
      createObjective('deploy_cert', 'Развернуть сертификат', {
        hint: 'kubectl create secret tls banking-cert --cert=... --key=...'
      }),
      createObjective('verify_https', 'Проверить HTTPS', {
        hint: 'Проверь что сертификат валиден в браузере'
      }),
    ],
    reward: createReward({
      skillPoints: 1,
      karma: 5,
    }),
    discoveryCondition: {
      hasFlag: 'ssl_warning',
    },
  },
  
  microservice_memory_leak: {
    id: 'microservice_memory_leak',
    title: '🧠 Утечка памяти в микросервисе',
    description: 'loyalty-points потребляет 8GB RAM и растёт. Профилирование показало утечку.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'locked',
    objectives: [
      createObjective('check_memory', 'Проверить потребление памяти', {
        hint: 'kubectl top pods -n banking-prod',
        targetLocation: 'office_morning'
      }),
      createObjective('get_heap_dump', 'Получить heap dump', {
        hint: 'jmap -dump:format=b,file=heap.bin <pid>'
      }),
      createObjective('analyze_dump', 'Проанализировать heap dump', {
        hint: 'Используй VisualVM или MAT'
      }),
      createObjective('find_leak', 'Найти источник утечки', {
        hint: 'Ищи объекты с максимальным retained size'
      }),
      createObjective('create_fix', 'Создать патч', {
        hint: 'Добавь правильное закрытие ресурсов'
      }),
    ],
    reward: createReward({
      skillPoints: 2,
      creativity: 5,
    }),
    discoveryCondition: {
      hasFlag: 'memory_alert',
    },
  },

  /** Боковые «свитки гильдии облака» — RPG-обрамление (Fable / Gothic), шаги через 💻 и офисных NPC. */
  incident_scroll_4729: {
    id: 'incident_scroll_4729',
    title: '📜 Свиток инцидента 4729',
    description:
      'Гильдия облака вывесила задание: банк стонет, тикет горит, SLA тает как свеча у алтаря. Сначала — наставление «мага кластера», потом чтение «камня памяти» (журнал службы), печать согласия у собрата по цеху и руну закрытия в терминале.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('invoke_techlead', 'Получить наставление у мага кластера (техлид)', {
        hint: 'В офисе откройте диалог с Александром — он у Grafana.',
        targetNPC: 'office_alexander',
        targetLocation: 'office_morning',
      }),
      createObjective('read_service_journal', 'Прочесть журнал службы auth (камень памяти)', {
        hint: 'В 💻: journalctl -u auth-service -n 40 --no-pager',
        targetLocation: 'office_morning',
      }),
      createObjective('seal_with_colleague', 'Получить печать согласования у цехового брата', {
        hint: 'Поговорите в офисе с коллегой с парты.',
        targetNPC: 'office_colleague',
        targetLocation: 'office_morning',
      }),
      createObjective('close_incident_rune', 'Начертить руну закрытия тикета', {
        hint: 'В 💻: incident close 4729 --note resolved',
        targetLocation: 'office_morning',
      }),
    ],
    reward: createReward({ skillPoints: 2, stability: 8, karma: 4, introspection: 3 }),
    startNode: 'start',
  },

  vault_backup_trial: {
    id: 'vault_backup_trial',
    title: '⚱️ Испытание реликвария бэкапов',
    description:
      'В подземелье дата-центра шепчут о «реликварии» — холодном хранилище снимков мира. Оракул DevOps (Дмитрий) подскажет путь; ты должен увидеть список сосудов и проверить печать целостности манифеста, иначе восстановление — ложный сон.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('listen_oracle_dmitry', 'Выслушать оракула резервных копий', {
        hint: 'В офисе — диалог с Дмитрием из DevOps.',
        targetNPC: 'office_dmitry',
        targetLocation: 'office_morning',
      }),
      createObjective('list_reliquary', 'Сверить сосуды в реликварии S3', {
        hint: 'В 💻: aws s3 ls s3://banking-vault/',
        targetLocation: 'office_morning',
      }),
      createObjective('verify_manifest_sigil', 'Сверить печать манифеста (SHA256)', {
        hint: 'В 💻: sha256sum -c manifest.sha256',
        targetLocation: 'office_morning',
      }),
    ],
    reward: createReward({ skillPoints: 2, stability: 10, mood: 3, intuition: 3 }),
    startNode: 'start',
  },

  dependency_sigil: {
    id: 'dependency_sigil',
    title: '⛓️ Печать зависимостей (npm)',
    description:
      'В корнях проекта затаилась «проклятая транзитивная» зависимость — как проклятая вещь в старом RPG. Страж ИБ (Артём) знает обряд аудита; в терминале нужно вызвать сигил проверки и снять проклятие удалением пакета.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('cast_audit_sigil', 'Наложить сигил аудита (--production)', {
        hint: 'В 💻: npm audit --production',
        targetLocation: 'office_morning',
      }),
      createObjective('consult_crypt_warden', 'Спросить у стража склепа (ИБ) про CVE', {
        hint: 'Диалог в офисе с Артёмом из информационной безопасности.',
        targetNPC: 'office_artyom',
        targetLocation: 'office_morning',
      }),
      createObjective('banish_transitive', 'Изгнать проклятый транзитив', {
        hint: 'В 💻: npm uninstall phantom-left-pad --save',
        targetLocation: 'office_morning',
      }),
    ],
    reward: createReward({ skillPoints: 2, karma: 6, intuition: 4 }),
    startNode: 'start',
  },
  
  // ========== ОСНОВНЫЕ КВЕСТЫ ==========
  
  first_words: {
    id: 'first_words',
    title: '✍️ Первые слова',
    description: 'Написать своё первое стихотворение за долгое время',
    type: 'main',
    status: 'available',
    objectives: [
      createObjective('write_poem', 'Мини-игра: собери стих из строк', {
        targetValue: 1,
        hint: 'Примите квест в 📋, затем вечером дома выберите «Писать» — откроется сборка строк.',
        targetLocation: 'home_evening',
        stageType: 'minigame',
        linkedStoryNodeId: 'write_evening',
      }),
      createObjective('reflect', 'Прочитать результат и отпустить мысль', {
        targetValue: 1,
        hint: 'После мини-игры дочитайте сцену и нажмите «дальше» — рефлексия засчитается.',
        targetLocation: 'home_evening',
        stageType: 'narration',
        linkedStoryNodeId: 'write_evening_result',
      }),
    ],
    reward: createReward({
      creativity: 10,
      mood: 5,
      stability: 3,
      skillPoints: 1,
    }),
    startNode: 'start',
  },
  
  first_reading: {
    id: 'first_reading',
    title: '📖 Первое чтение',
    description: 'Прочитать свои стихи перед аудиторией в "Синей Яме"; квест стартует из сюжета при первом визите',
    type: 'main',
    status: 'locked',
    prerequisite: 'first_words',
    objectives: [
      createObjective('go_to_cafe', 'Оказаться в «Синей Яме» (сцена кафе)', {
        targetValue: 1,
        hint: 'Следуйте сюжету в пятничный вечер или выберите ветку с кафе — засчитывается при входе в локацию.',
        targetLocation: 'cafe_evening',
        stageType: 'exploration',
        linkedStoryNodeId: 'blue_cat_cafe',
      }),
      createObjective('read_poem', 'Прочитать стихотворение с микрофона', {
        targetValue: 1,
        hint: 'На open mic поднимите руку (или ветку «я готовился»).',
        targetNPC: 'albert',
        stageType: 'narration',
        linkedStoryNodeId: 'open_mic',
      }),
      createObjective('meet_someone', 'Познакомиться после выступления', {
        targetValue: 1,
        hint: 'Ответьте Виктории в диалоге после чтения.',
        stageType: 'dialogue',
        linkedStoryNodeId: 'stranger_approach',
      }),
    ],
    reward: createReward({
      creativity: 15,
      karma: 10,
      stability: 5,
      skillPoints: 2,
    }),
    discoveryCondition: {
      hasFlag: 'visited_cafe',
    },
  },
  
  maria_connection: {
    id: 'maria_connection',
    title: '💫 Связь с Викторией',
    description: 'Узнать Викторию лучше и понять её историю',
    type: 'main',
    status: 'locked',
    prerequisite: 'first_reading',
    objectives: [
      createObjective('talk_maria', 'Поговорить с Викторией о творчестве', {
        hint: 'Найди Викторию в кафе и поговори',
        targetNPC: 'cafe_college_girl',
        targetLocation: 'cafe_evening'
      }),
      createObjective('learn_past', 'Узнать о её прошлом', {
        hint: 'Спроси "Ты тоже пишешь?"'
      }),
      createObjective('share_story', 'Поделиться своей историей', {
        hint: 'Расскажи о 8 годах одиночества'
      }),
      createObjective('exchange_contacts', 'Обменяться контактами', {
        hint: 'Предложи обменяться телефонами'
      }),
    ],
    reward: createReward({
      karma: 10,
      stability: 5,
      skillPoints: 1,
    }),
  },
  
  // ========== ПОБОЧНЫЕ КВЕСТЫ ==========
  
  night_owl: {
    id: 'night_owl',
    title: '🦉 Ночная птица',
    description: 'Провести несколько ночей за письмом',
    type: 'side',
    status: 'locked',
    objectives: [
      createObjective('write_nights', 'Написать ночью', { 
        targetValue: 3, 
        currentValue: 0,
        hint: 'Дома ночью — пиши, когда не спится'
      }),
    ],
    reward: createReward({
      creativity: 10,
      stability: 5,
      skillPoints: 1,
    }),
    discoveryCondition: {
      hasFlag: 'wrote_all_night',
    },
  },
  
  coffee_affair: {
    id: 'coffee_affair',
    title: '☕ Кофейный роман',
    description: 'Стать постоянным посетителем "Синей Ямы"',
    type: 'side',
    status: 'locked',
    objectives: [
      createObjective('visit_cafe', 'Посетить кафе', { 
        targetValue: 5, 
        currentValue: 0,
        hint: 'Ходи в "Синяя Яма" регулярно',
        targetLocation: 'cafe_evening'
      }),
      createObjective('try_drinks', 'Попробовать разные напитки', { 
        targetValue: 3, 
        currentValue: 0,
        hint: 'Закажи что-то новое у бариста'
      }),
    ],
    reward: createReward({
      mood: 10,
      karma: 5,
    }),
  },
  
  poetry_collection: {
    id: 'poetry_collection',
    title: '📚 Собрание стихов',
    description: 'Написать достаточно стихов для маленького сборника',
    type: 'side',
    status: 'locked',
    objectives: [
      createObjective('write_poems', 'Написать стихотворений', { 
        targetValue: 10, 
        currentValue: 0,
        hint: 'Пиши каждый раз когда есть вдохновение'
      }),
      createObjective('edit_poems', 'Отредактировать их', {
        hint: 'Перечитай и исправь неточности'
      }),
      createObjective('share_collection', 'Показать кому-то', {
        hint: 'Покажи сборник Виктории в кафе или выступи снова публично'
      }),
    ],
    reward: createReward({
      creativity: 25,
      karma: 10,
      skillPoints: 3,
    }),
  },
  
  // ========== ФЭНТЕЗИ-КВЕСТЫ ==========
  
  lost_memories: {
    id: 'lost_memories',
    title: '⭐ Потерянные воспоминания',
    description: 'В мире снов найти то, что было утрачено. Вместе со Странником искать Озеро Памяти.',
    type: 'hidden',
    status: 'locked',
    objectives: [
      createObjective('meet_stranger', 'Встретить Странника в мире снов', {
        hint: 'Во сне ищи человека в плаще',
        targetNPC: 'dream_quester',
        targetLocation: 'dream'
      }),
      createObjective('speak_to_lillian', 'Поговорить с Лилиан о потере', {
        hint: 'Лилиан — хранительница снов, найди её',
        targetNPC: 'dream_lillian'
      }),
      createObjective('agree_journey', 'Согласиться на путешествие к Озеру', {
        hint: 'Выбери "Я хочу увидеть их снова"'
      }),
      createObjective('reach_lake', 'Достичь Озера Памяти', {
        hint: 'Следуй за светом'
      }),
      createObjective('see_memory', 'Увидеть потерянное воспоминание', {
        hint: 'Посмотри в воду озера'
      }),
    ],
    reward: createReward({
      creativity: 30,
      stability: 20,
      karma: 25,
      mood: 20,
      skillPoints: 3,
      unlockFlags: ['found_lost_memory', 'dream_walker'],
    }),
    discoveryCondition: {
      hasFlag: 'entered_dream_world',
    },
    hidden: true,
  },
  
  star_connection: {
    id: 'star_connection',
    title: '🌟 Звёздная связь',
    description: 'Узнать, как связаны звёзды и любимые люди',
    type: 'hidden',
    status: 'locked',
    objectives: [
      createObjective('meet_astra', 'Встретить Астру — Мисс Галактику', {
        hint: 'В мире снов найди сияющую женщину',
        targetNPC: 'dream_galaxy',
        targetLocation: 'dream'
      }),
      createObjective('ask_about_stars', 'Спросить о природе звёзд', {
        hint: 'Спроси: "Звёзды — они как люди?"'
      }),
      createObjective('find_constellation', 'Найти своё созвездие', {
        hint: 'Попроси Астру показать твоё созвездие'
      }),
      createObjective('connect_with_loved_one', 'Почувствовать связь с ушедшим', {
        hint: 'Посмотри на три звезды вместе'
      }),
    ],
    reward: createReward({
      stability: 25,
      mood: 30,
      karma: 20,
      skillPoints: 2,
      unlockFlags: ['star_touched', 'cosmic_awareness'],
    }),
    discoveryCondition: {
      hasFlag: 'met_galaxy',
    },
    hidden: true,
  },
};

// ============================================
// ФУНКЦИИ УПРАВЛЕНИЯ КВЕСТАМИ
// ============================================

export function updateObjective(
  quest: ExtendedQuest,
  objectiveId: string,
  value?: number
): ExtendedQuest {
  const updatedObjectives = quest.objectives.map(obj => {
    if (obj.id === objectiveId) {
      if (obj.targetValue !== undefined) {
        const newValue = value !== undefined ? value : (obj.currentValue || 0) + 1;
        return {
          ...obj,
          currentValue: newValue,
          completed: newValue >= obj.targetValue,
        };
      }
      return { ...obj, completed: true };
    }
    return obj;
  });
  
  const allCompleted = updatedObjectives.every(obj => obj.completed);
  
  return {
    ...quest,
    objectives: updatedObjectives,
    status: allCompleted ? 'completed' : quest.status,
    completedTime: allCompleted ? Date.now() : undefined,
  };
}

export function activateQuest(quest: ExtendedQuest): ExtendedQuest {
  return {
    ...quest,
    status: 'active',
    startTime: Date.now(),
  };
}

export function failQuest(quest: ExtendedQuest): ExtendedQuest {
  return {
    ...quest,
    status: 'failed',
  };
}

export function checkQuestAvailability(
  quest: ExtendedQuest,
  completedQuests: string[],
  flags: Record<string, boolean>
): boolean {
  if (quest.prerequisite && !completedQuests.includes(quest.prerequisite)) {
    return false;
  }
  
  if (quest.requiredFlags) {
    for (const flag of quest.requiredFlags) {
      if (!flags[flag]) return false;
    }
  }
  
  return true;
}

export function getActiveQuests(quests: Record<string, ExtendedQuest>): ExtendedQuest[] {
  return Object.values(quests).filter(q => q.status === 'active');
}

export function getCompletedQuests(quests: Record<string, ExtendedQuest>): ExtendedQuest[] {
  return Object.values(quests).filter(q => q.status === 'completed');
}

export function getQuestProgress(quest: ExtendedQuest): number {
  const total = quest.objectives.length;
  const completed = quest.objectives.filter(o => o.completed).length;
  return total > 0 ? (completed / total) * 100 : 0;
}

// Получить следующий незавершённый objective с подсказкой
export function getNextObjective(quest: ExtendedQuest): QuestObjective | null {
  return quest.objectives.find(o => !o.completed && !o.hidden) || null;
}

/** Цель выполнена с учётом числового прогресса из store (в т.ч. цели без targetValue — increment ≥ 1) */
export function isObjectiveSatisfied(o: QuestObjective, storedValue: number): boolean {
  if (o.hidden) return true;
  if (o.targetValue !== undefined && o.targetValue > 0) {
    return storedValue >= o.targetValue;
  }
  return o.completed || storedValue >= 1;
}

/** Следующая незакрытая цель с учётом прогресса из сохранения (как в QuestsPanel) */
export function getNextTrackedObjective(
  quest: ExtendedQuest,
  questProgress: Record<string, number>,
): QuestObjective | null {
  for (const o of quest.objectives) {
    if (o.hidden) continue;
    const cur = questProgress[o.id] ?? o.currentValue ?? 0;
    if (!isObjectiveSatisfied(o, cur)) return o;
  }
  return null;
}
