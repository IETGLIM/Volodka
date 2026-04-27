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
        targetLocation: 'cafe_evening',
        stageType: 'narration',
      }),
      createObjective('find_listener', 'Найти того, кто услышит', {
        hint: 'Поговори с посетителями кафе после выступления',
        stageType: 'dialogue',
      }),
      createObjective('make_peace', 'Примириться с прошлым', {
        hint: 'Вспомни и прими свою историю',
        stageType: 'narration',
      }),
      createObjective('leave_legacy', 'Оставить наследие', {
        hint: 'Собери сборник стихов и поделись с миром',
        stageType: 'narration',
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

  /**
   * **Референс «обход» (мин.)** — хаб → сцена `zarema_albert_room` → E у «очага». См. `docs/quest-reference-template.md`.
   * Побочный 3D-обход; связка с `InteractionRegistry`.
   */
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
        hint: 'Зона у дивана в 3D-обходе (отдельный триггер с E); якорь сюжета — узел explore_hub_welcome после интро.',
        targetLocation: 'zarema_albert_room',
        mapHint: { x: -1.85, z: 1.1 },
        stageType: 'exploration',
        linkedStoryNodeId: 'explore_hub_welcome',
      }),
    ],
    reward: createReward({
      experience: 45,
      mood: 5,
      creativity: 3,
      karma: 2,
      /** Связка награды с этапом: после «тёплого угла» в инвентаре появляется осмысленный расходник, счётчик HUD не вечно 0. */
      itemRewards: ['tea'],
    }),
    /** Вход в 3D-хаб (`explore_hub_welcome`); игровой хаб без оверлея — `explore_mode`. */
    startNode: 'explore_hub_welcome',
  },

  /**
   * **Референс «обход+ветки»** — форс (minigame) vs аудит (exploration) в `volodka_room`. См. `docs/quest-reference-template.md`.
   * Логика ветвления: `explorationQuestGraphs` / `explorationQuestGraph` + `volodkaRackQuestBranch`.
   */
  exploration_volodka_rack: {
    id: 'exploration_volodka_rack',
    title: '⚡ Разрыв синхронизации',
    description:
      'Две ветки на выбор (в журнале обе цели — завершается **одна**): **форс** — мини-игра «матрица узлов» у стойки (E в зоне подсказки), в духе ночного дежурства, когда хочется «просто починить»; **аудит** — три раза «Осмотреть» экраны Kibana, Zabbix и Grafana, без мини-игры. Начал аудит — форс до конца квеста недоступен; прошёл форс — честный аудит закрыт.',
    type: 'side',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('rack_force_nodes', 'Свести узлы стека в безопасную последовательность (зона стойки, E)', {
        targetValue: 1,
        currentValue: 0,
        hint: 'Зона «матрица узлов» у стойки с мониторами; недоступно, если уже начат осмотр панелей (аудит). Вход в ветку — с узла explore_hub_welcome.',
        targetLocation: 'volodka_room',
        mapHint: { x: 3.45, z: 0.08 },
        stageType: 'minigame',
        linkedStoryNodeId: 'explore_hub_welcome',
      }),
      createObjective('rack_audit_panels', 'Честный путь: осмотреть Kibana, Zabbix и Grafana без взлома', {
        targetValue: 3,
        currentValue: 0,
        hint: 'Радиальное меню → «Осмотреть» на каждом из трёх экранов; мини-игра форса после первого осмотра отключена. Точка входа в квест — explore_hub_welcome.',
        targetLocation: 'volodka_room',
        stageType: 'exploration',
        linkedStoryNodeId: 'explore_hub_welcome',
      }),
    ],
    reward: createReward({ experience: 55, karma: -2, stability: 6, mood: -1, creativity: 9 }),
    startNode: 'explore_hub_welcome',
  },

  /**
   * Побочный 3D: район, лавка у Сергеича. Граф `DISTRICT_CHRONICLE_EXPLORATION_QUEST_GRAPH`.
   * Тон: Gothic (устные хроники) × быт.
   */
  exploration_district_chronicle: {
    id: 'exploration_district_chronicle',
    title: '🧱 Хроника двора',
    description:
      'Сергеич помнит больше, чем любой Jira-лог. Трижды у лавки — слушай, как район копит «квитанции на серость».',
    type: 'side',
    faction: 'Район',
    status: 'active',
    objectives: [
      createObjective('chronicle_whisper', 'Услышать фрагменты «хроники двора»', {
        targetValue: 3,
        currentValue: 0,
        hint: 'Сцена «Район»: зона у лавки; после старта квеста — E три раза.',
        targetLocation: 'district',
        mapHint: { x: 2, z: -0.5 },
        stageType: 'exploration',
        linkedStoryNodeId: 'explore_mode',
      }),
    ],
    reward: createReward({ experience: 40, mood: 4, karma: 3, creativity: 5 }),
    startNode: 'explore_mode',
  },

  /**
   * Побочный 3D: МВД, бюрократия. Граф `MVD_BUREAU_EXPLORATION_QUEST_GRAPH`.
   */
  exploration_mvd_bureau: {
    id: 'exploration_mvd_bureau',
    title: '📋 Бумажный circuit breaker',
    description:
      'Очередь, печать, ещё одна очередь. Три раза — и ты снова веришь, что бюрократия замкнулась на саму себя.',
    type: 'side',
    status: 'active',
    objectives: [
      createObjective('bureau_stamp', 'Получить «ход» по бумагам (печать ×3)', {
        targetValue: 3,
        currentValue: 0,
        hint: 'Сцена «МВД»: зона у стойки; E ×3.',
        targetLocation: 'mvd',
        mapHint: { x: 0, z: -0.5 },
        stageType: 'exploration',
        linkedStoryNodeId: 'explore_mode',
      }),
    ],
    reward: createReward({ experience: 38, stability: 6, karma: -1, mood: -3 }),
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
        targetLocation: 'office_morning',
        stageType: 'dialogue',
      }),
      createObjective('use_cli', 'Использовать OpenStack CLI', {
        hint: 'Подойди к терминалу и введи команду openstack server list',
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('find_server', 'Найти сервер по IP', {
        hint: 'Используй: openstack server show <ID> --format json',
        stageType: 'terminal',
      }),
      createObjective('get_console', 'Получить ссылку на консоль', {
        hint: 'Найди в выводе поле "console_url"',
        stageType: 'terminal',
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
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('ask_admins', 'Спросить админов про ACK', {
        hint: 'Поговори с коллегой о проблеме',
        targetNPC: 'office_colleague',
        stageType: 'dialogue',
      }),
      createObjective('decide_action', 'Принять решение', {
        hint: 'Выбери: собрать ACK, эскалировать или написать владельцам',
        stageType: 'narration',
      }),
      createObjective('notify_owners', 'Направить письмо владельцам', {
        hint: 'Выбери "Написать владельцам" в диалоге',
        stageType: 'dialogue',
      }),
    ],
    reward: createReward({
      skillPoints: 2,
      karma: 10,
      stability: 5,
    }),
    startNode: 'start',
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
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('check_logs', 'Проверить логи оркестратора', {
        hint: 'kubectl logs -n kube-system <pod-name>',
        stageType: 'terminal',
      }),
      createObjective('find_cause', 'Найти причину падения', {
        hint: 'Проанализируй логи на ошибки',
        stageType: 'narration',
      }),
      createObjective('restart_orchestrator', 'Перезапустить оркестратор', {
        hint: 'kubectl rollout restart deployment/orchestrator -n internal-cloud',
        stageType: 'terminal',
      }),
      createObjective('verify_recovery', 'Проверить восстановление', {
        hint: 'Убедись что все pods в Running состоянии',
        stageType: 'terminal',
      }),
    ],
    reward: createReward({
      skillPoints: 3,
      stability: 15,
      karma: 5,
    }),
    startNode: 'start',
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
        targetLocation: 'office_morning',
        stageType: 'narration',
      }),
      createObjective('find_root_cause', 'Найти корневую причину', {
        hint: 'Ищи: Connection refused, Pool exhausted, Timeout',
        stageType: 'narration',
      }),
      createObjective('apply_fix', 'Применить исправление', {
        hint: 'Откатить деплой: kubectl rollout undo deployment/loyalty-points',
        stageType: 'terminal',
      }),
      createObjective('verify_fix', 'Проверить решение', {
        hint: 'Проверь SHOW PROCESSLIST — должно быть < 800 соединений',
        stageType: 'terminal',
      }),
      createObjective('document_incident', 'Задокументировать инцидент', {
        hint: 'Напиши постмортем в тикете',
        stageType: 'narration',
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
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('identify_culprit', 'Определить виновника', {
        hint: 'Найди микросервис с максимальным числом соединений',
        stageType: 'narration',
      }),
      createObjective('check_deploy_time', 'Проверить время деплоя', {
        hint: 'CI/CD деплой был в 3:47 ночи',
        stageType: 'narration',
      }),
      createObjective('notify_developers', 'Уведомить разработчиков', {
        hint: 'Напиши в Slack канал разработки',
        stageType: 'narration',
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
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('request_new_cert', 'Запросить новый сертификат', {
        hint: 'Напиши в security-team@company.com',
        stageType: 'narration',
      }),
      createObjective('deploy_cert', 'Развернуть сертификат', {
        hint: 'kubectl create secret tls banking-cert --cert=... --key=...',
        stageType: 'terminal',
      }),
      createObjective('verify_https', 'Проверить HTTPS', {
        hint: 'Проверь что сертификат валиден в браузере',
        stageType: 'narration',
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
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('get_heap_dump', 'Получить heap dump', {
        hint: 'jmap -dump:format=b,file=heap.bin <pid>',
        stageType: 'terminal',
      }),
      createObjective('analyze_dump', 'Проанализировать heap dump', {
        hint: 'Используй VisualVM или MAT',
        stageType: 'narration',
      }),
      createObjective('find_leak', 'Найти источник утечки', {
        hint: 'Ищи объекты с максимальным retained size',
        stageType: 'narration',
      }),
      createObjective('create_fix', 'Создать патч', {
        hint: 'Добавь правильное закрытие ресурсов',
        stageType: 'narration',
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
        stageType: 'dialogue',
      }),
      createObjective('read_service_journal', 'Прочесть журнал службы auth (камень памяти)', {
        hint: 'В 💻: journalctl -u auth-service -n 40 --no-pager',
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('seal_with_colleague', 'Получить печать согласования у цехового брата', {
        hint: 'Поговорите в офисе с коллегой с парты.',
        targetNPC: 'office_colleague',
        targetLocation: 'office_morning',
        stageType: 'dialogue',
      }),
      createObjective('close_incident_rune', 'Начертить руну закрытия тикета', {
        hint: 'В 💻: incident close 4729 --note resolved',
        targetLocation: 'office_morning',
        stageType: 'terminal',
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
        stageType: 'dialogue',
      }),
      createObjective('list_reliquary', 'Сверить сосуды в реликварии S3', {
        hint: 'В 💻: aws s3 ls s3://banking-vault/',
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('verify_manifest_sigil', 'Сверить печать манифеста (SHA256)', {
        hint: 'В 💻: sha256sum -c manifest.sha256',
        targetLocation: 'office_morning',
        stageType: 'terminal',
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
        stageType: 'terminal',
      }),
      createObjective('consult_crypt_warden', 'Спросить у стража склепа (ИБ) про CVE', {
        hint: 'Диалог в офисе с Артёмом из информационной безопасности.',
        targetNPC: 'office_artyom',
        targetLocation: 'office_morning',
        stageType: 'dialogue',
      }),
      createObjective('banish_transitive', 'Изгнать проклятый транзитив', {
        hint: 'В 💻: npm uninstall phantom-left-pad --save',
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
    ],
    reward: createReward({ skillPoints: 2, karma: 6, intuition: 4 }),
    startNode: 'start',
  },

  /**
   * **Референс «офис» (прод-ритм):** white-hat UAT — согласование, терминал, handoff. См. `docs/quest-reference-template.md`.
   * Пентест / Burp / white-hat в **реалистичном** банковском смысле: заказной прогон по scope, UAT, отчёт в Jira/ИБ.
   * Не «хакер из кино», а контроль + инструмент (Burp Suite) в песочнице и ответственное раскрытие.
   */
  whitehat_uat_sprint: {
    id: 'whitehat_uat_sprint',
    title: '🛡️ Scope: UAT и белая фуражка',
    description:
      'Внутренний заказ на **контролируемую** проверку веб-контура: письмо от ИБ, список хостов, окно в Change. Вне scope — не спрашивать, на прод — не смотреть. В лабе разрешён **Burp** (Proxy/Repeater — как рабочие калибры, не культ); итог — в тикет, не в чат. Двенадцать лет в саппорте: сначала бумага и границы, потом «рука на клавиатуре».',
    type: 'side',
    faction: 'Работа · IT',
    status: 'active',
    objectives: [
      createObjective('read_scope_brief', 'Сверить письмо и scope с Артёмом (ИБ)', {
        hint: 'Офис: диалог с Артёмом из ИБ — что можно трогать, что нет, куда писать находки.',
        targetNPC: 'office_artyom',
        targetLocation: 'office_morning',
        stageType: 'dialogue',
      }),
      createObjective('verify_uat_boundary', 'Убедиться, что касаемся UAT, а не прода (HTTP-заголовки)', {
        hint: 'В 💻: curl — проверь ответ UAT-стенда; если видишь prod-имя — остановись и в ИБ.',
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('burp_session_log', 'Зафиксировать сессию проверки (экспорт в рамках лабы)', {
        hint: 'В 💻: команда с пометкой burp export — как отчётный снимок, не селфи «я вломал».',
        targetLocation: 'office_morning',
        stageType: 'terminal',
      }),
      createObjective('jira_handoff_ibs', 'Передать пакет находок в цепочку Jira/ИБ через коллегу', {
        hint: 'Офис: коллега с парты подтвердит, что пакет ушёл в нужную очередь — без выложенных наружу критиков.',
        targetNPC: 'office_colleague',
        targetLocation: 'office_morning',
        stageType: 'dialogue',
      }),
    ],
    reward: createReward({ skillPoints: 2, karma: 7, stability: 6, intuition: 2 }),
    startNode: 'start',
  },
  
  // ========== ОСНОВНЫЕ КВЕСТЫ ==========
  
  /**
   * **Референс «дом»:** мини-игра стиха + рефлексия. См. `docs/quest-reference-template.md`.
   */
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
  
  /**
   * **Референс «кафе / open mic»:** `blue_pit` → `open_mic` → знакомство. См. `docs/quest-reference-template.md`.
   */
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
        targetLocation: 'blue_pit',
        stageType: 'exploration',
        linkedStoryNodeId: 'blue_pit',
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
        targetLocation: 'cafe_evening',
        stageType: 'dialogue',
      }),
      createObjective('learn_past', 'Узнать о её прошлом', {
        hint: 'Спроси "Ты тоже пишешь?"',
        stageType: 'dialogue',
      }),
      createObjective('share_story', 'Поделиться своей историей', {
        hint: 'Расскажи о 8 годах одиночества',
        stageType: 'dialogue',
      }),
      createObjective('exchange_contacts', 'Обменяться контактами', {
        hint: 'Предложи обменяться телефонами',
        stageType: 'dialogue',
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
        hint: 'Дома ночью — пиши, когда не спится',
        stageType: 'minigame',
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
        targetLocation: 'cafe_evening',
        stageType: 'exploration',
      }),
      createObjective('try_drinks', 'Попробовать разные напитки', { 
        targetValue: 3, 
        currentValue: 0,
        hint: 'Закажи что-то новое у бариста',
        stageType: 'dialogue',
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
        hint: 'Пиши каждый раз когда есть вдохновение',
        stageType: 'minigame',
      }),
      createObjective('edit_poems', 'Отредактировать их', {
        hint: 'Перечитай и исправь неточности',
        stageType: 'narration',
      }),
      createObjective('share_collection', 'Показать кому-то', {
        hint: 'Покажи сборник Виктории в кафе или выступи снова публично',
        stageType: 'dialogue',
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
        targetLocation: 'dream',
        stageType: 'dialogue',
      }),
      createObjective('speak_to_lillian', 'Поговорить с Лилиан о потере', {
        hint: 'Лилиан — хранительница снов, найди её',
        targetNPC: 'dream_lillian',
        stageType: 'dialogue',
      }),
      createObjective('agree_journey', 'Согласиться на путешествие к Озеру', {
        hint: 'Выбери "Я хочу увидеть их снова"',
        stageType: 'narration',
      }),
      createObjective('reach_lake', 'Достичь Озера Памяти', {
        hint: 'Следуй за светом',
        stageType: 'exploration',
      }),
      createObjective('see_memory', 'Увидеть потерянное воспоминание', {
        hint: 'Посмотри в воду озера',
        stageType: 'narration',
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
        targetLocation: 'dream',
        stageType: 'dialogue',
      }),
      createObjective('ask_about_stars', 'Спросить о природе звёзд', {
        hint: 'Спроси: "Звёзды — они как люди?"',
        stageType: 'dialogue',
      }),
      createObjective('find_constellation', 'Найти своё созвездие', {
        hint: 'Попроси Астру показать твоё созвездие',
        stageType: 'narration',
      }),
      createObjective('connect_with_loved_one', 'Почувствовать связь с ушедшим', {
        hint: 'Посмотри на три звезды вместе',
        stageType: 'narration',
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
