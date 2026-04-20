'use client';

/**
 * Единственный игровой IT-терминал: команды, подсказки, частичное совпадение, обновление `questProgress` и флагов.
 * Ранее существовал отдельный `SSHTerminal` без связи с квестами — удалён как дубликат; сценарии покрываются здесь и в 💻 панели.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// ============================================
// ТИПЫ
// ============================================

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
  timestamp: number;
}

type QuestObjectivePatch = { questId: string; objectiveId: string; value?: number };

interface CommandResult {
  output: string[];
  effect?: {
    flag?: string;
    questObjective?: QuestObjectivePatch;
    /** Несколько целей за один «заклинание» терминала (например openstack show → сервер + консоль). */
    questObjectives?: QuestObjectivePatch[];
  };
}

// ============================================
// СИМУЛИРОВАННЫЕ КОМАНДЫ IT-КВЕСТОВ
// ============================================

const COMMANDS: Record<string, (args: string[]) => CommandResult> = {
  help: () => ({
    output: [
      'Доступные команды (успешные шаги обновляют цели в 📋 «Квесты»):',
      '  kubectl get nodes                    — Статус кластера Kubernetes',
      '  kubectl logs <pod> -n <ns>           — Логи пода',
      '  kubectl rollout undo deploy/<name>   — Откат деплоя',
      '  kubectl rollout restart deploy/<name> — Перезапуск деплоя',
      '  kubectl top pods -n <ns>             — Ресурсы подов',
      '  openstack server list                — Список серверов OpenStack',
      '  openstack server show <id>           — Информация о сервере',
      '  rabbitmqctl list_queues              — Состояние очередей RabbitMQ',
      '  mysql -h <host> -e "SHOW PROCESSLIST" — Активные соединения MySQL',
      '  openssl s_client -connect <host:port> — Проверка SSL-сертификата',
      '  journalctl -u auth-service …         — Журнал службы (свиток инцидента)',
      '  incident close 4729 --note resolved  — Закрыть тикет',
      '  aws s3 ls s3://banking-vault/        — Реликварий бэкапов',
      '  sha256sum -c manifest.sha256         — Печать целостности',
      '  npm audit --production               — Сигил зависимостей',
      '  npm uninstall phantom-left-pad --save — Снять проклятие',
      '  clear                                — Очистить экран',
    ],
  }),

  'kubectl get nodes': () => ({
    output: [
      'NAME           STATUS   ROLES           AGE    VERSION',
      'k8s-master-01  Ready    control-plane   342d   v1.28.4',
      'k8s-worker-01  Ready    <none>          342d   v1.28.4',
      'k8s-worker-02  Ready    <none>          342d   v1.28.4',
      'k8s-worker-03  NotReady <none>          342d   v1.28.4',
      '',
      '⚠ k8s-worker-03: NotReady — проверьте логи оркестратора',
    ],
    effect: {
      questObjective: { questId: 'kubernetes_orchestrator', objectiveId: 'check_status', value: 1 },
    },
  }),

  'kubectl logs orchestrator -n kube-system': () => ({
    output: [
      '2026-04-15T03:12:01Z FATAL: Out of memory: allocated 4096MB',
      '2026-04-15T03:12:01Z ERROR: Failed to reconcile node k8s-worker-03',
      '2026-04-15T03:12:02Z INFO: Restarting controller loop...',
      '2026-04-15T03:12:05Z ERROR: Leader election failed — lock timeout',
      '2026-04-15T03:12:10Z FATAL: Giving up after 3 retries',
      '',
      '⚠ Причина: OOM kill. Оркестратор упал из-за нехватки памяти.',
    ],
    effect: {
      questObjective: { questId: 'kubernetes_orchestrator', objectiveId: 'check_logs', value: 1 },
    },
  }),

  'kubectl rollout restart deployment/orchestrator -n internal-cloud': () => ({
    output: [
      'deployment.apps/orchestrator restarted',
      '',
      'Waiting for rollout to finish: 0 of 1 updated pods are available...',
      'deployment.apps/orchestrator successfully rolled out',
      '',
      '✓ k8s-worker-03: Ready — узел восстановлен',
    ],
    effect: {
      flag: 'orchestrator_restarted',
      questObjective: { questId: 'kubernetes_orchestrator', objectiveId: 'restart_orchestrator', value: 1 },
    },
  }),

  'openstack server list': () => ({
    output: [
      '+--------------------------------------+-------------------+--------+-------------------+',
      '| ID                                   | Name              | Status | Networks          |',
      '+--------------------------------------+-------------------+--------+-------------------+',
      '| a1b2c3d4-e5f6-7890-abcd-ef1234567890 | banking-prod-01   | ACTIVE | 10.0.1.15         |',
      '| b2c3d4e5-f6a7-8901-bcde-f12345678901 | banking-prod-02   | ACTIVE | 10.0.1.16         |',
      '| c3d4e5f6-a7b8-9012-cdef-123456789012 | monitoring-01     | ACTIVE | 10.0.2.10         |',
      '+--------------------------------------+-------------------+--------+-------------------+',
      '',
      'Найдено 3 сервера. Используйте openstack server show <ID> для деталей.',
    ],
    effect: {
      questObjective: { questId: 'openstack_server_find', objectiveId: 'use_cli', value: 1 },
    },
  }),

  'openstack server show': () => ({
    output: [
      '+--------------------------------------+',
      '| Field            | Value             |',
      '+--------------------------------------+',
      '| id               | a1b2c3d4-...7890 |',
      '| name             | banking-prod-01 |',
      '| status           | ACTIVE            |',
      '| addresses        | 10.0.1.15         |',
      '| console_url      | https://horizon.internal/vnc/banking-prod-01/console |',
      '+--------------------------------------+',
      '',
      '✓ Сервер найден; ссылка на консоль в поле console_url',
    ],
    effect: {
      questObjectives: [
        { questId: 'openstack_server_find', objectiveId: 'find_server', value: 1 },
        { questId: 'openstack_server_find', objectiveId: 'get_console', value: 1 },
      ],
    },
  }),

  'rabbitmqctl list_queues': () => ({
    output: [
      'Timeout: 60.0 seconds ...',
      'Listing queues for vhost / ...',
      'name\t\t\tmessages\tconsumers',
      'banking.events\t\t42\t\t3',
      'billing.process\t\t156\t\t1',
      'notifications.send\t\t107843\t\t0',
      'loyalty.points.update\t24\t\t2',
      '',
      '⚠ notifications.send: 107,843 сообщений без потребителей!',
      '  Возможная причина: потребитель упал или ACK не отправляется',
    ],
    effect: {
      questObjective: { questId: 'rabbitmq_overflow', objectiveId: 'detect_overflow', value: 1 },
    },
  }),

  'mysql -h auth-db-prod-03 -e "SHOW PROCESSLIST"': () => ({
    output: [
      '+----+------+-----------------+-----------+---------+------+-------+------------------+',
      '| Id | User | Host            | db        | Command | Time | State | Info             |',
      '+----+------+-----------------+-----------+---------+------+-------+------------------+',
      '| 1  | app  | 10.0.1.15:52341 | auth_db   | Query   | 0    | exec  | SELECT * FROM... |',
      '| .. |      |                 |           |         |      |       |                  |',
      '| 847| svc  | 10.0.3.22:41002 | auth_db   | Sleep   | 342  |       | NULL             |',
      '+----+------+-----------------+-----------+---------+------+-------+------------------+',
      '',
      '847 активных соединений (лимит: 800)',
      '⚠ loyalty-points сервис держит 200+ спящих соединений',
    ],
    effect: {
      questObjective: { questId: 'database_pool_exhausted', objectiveId: 'check_processlist', value: 1 },
    },
  }),

  'openssl s_client -connect banking.example.com:443': () => ({
    output: [
      'CONNECTED(00000003)',
      'depth=2 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Global Root CA',
      'verify return:1',
      'depth=1 C = US, O = DigiCert Inc, CN = DigiCert SHA2 Extended Validation Server CA',
      'verify return:1',
      'depth=0 businessCategory = Private Organization, CN = banking.example.com',
      'verify return:1',
      '---',
      'Certificate chain',
      ' 0 s: CN = banking.example.com',
      '   i: CN = DigiCert SHA2 Extended Validation Server CA',
      '   a = KEY, b = 48',
      ' 1 s: CN = DigiCert SHA2 Extended Validation Server CA',
      '   i: CN = DigiCert Global Root CA',
      '---',
      'SSL handshake has read 3629 bytes and written 415 bytes',
      '---',
      'New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384',
      'notBefore=Apr 15 00:00:00 2025 GMT',
      'notAfter=Apr 17 12:00:00 2026 GMT',
      '',
      '⚠ Сертификат истекает через 2 дня!',
    ],
    effect: {
      flag: 'ssl_warning',
      questObjective: { questId: 'ssl_certificate_renewal', objectiveId: 'check_expiry', value: 1 },
    },
  }),

  'kubectl top pods -n banking-prod': () => ({
    output: [
      'NAME                              CPU(cores)   MEMORY(bytes)',
      'loyalty-points-7d9f8c6b4-x2k1j   120m         8192Mi',
      'auth-service-5c7d4e3b2-m8n3p      85m          512Mi',
      'banking-api-6f8e5d4c3-l9o2q       200m         1024Mi',
      'notifications-8a7b6c5d4-k4p7r      30m          256Mi',
      '',
      '⚠ loyalty-points: 8GB RAM и продолжает расти — утечка памяти!',
    ],
    effect: {
      questObjective: { questId: 'microservice_memory_leak', objectiveId: 'check_memory', value: 1 },
    },
  }),

  'kubectl rollout undo deployment/loyalty-points -n banking-prod': () => ({
    output: [
      'deployment.apps/loyalty-points rolled back to revision 42',
      '✓ Pool соединений освобождается — auth-db дышит',
    ],
    effect: {
      questObjective: { questId: 'auth_crisis', objectiveId: 'apply_fix', value: 1 },
    },
  }),

  'journalctl -u auth-service -n 40 --no-pager': () => ({
    output: [
      'Apr 15 03:47:12 auth-service[1842]: ERROR: HikariPool-1 - Connection is not available',
      'Apr 15 03:47:13 auth-service[1842]: WARN: request timeout /oauth/token client=loyalty-points',
      'Apr 15 03:48:01 auth-service[1842]: FATAL: thread blocked 600s on loyalty-points healthcheck',
      '',
      '⚠ Виновник в цепочке вызовов — loyalty-points держит пул открытым',
    ],
    effect: {
      questObjective: { questId: 'incident_scroll_4729', objectiveId: 'read_service_journal', value: 1 },
    },
  }),

  'journalctl -u auth-service': () => ({
    output: [
      '-- Logs begin at ...',
      'auth-service: pool exhausted, upstream loyalty-points',
      '',
      '(Сокращённая выжимка — для полного лога см. journalctl … -n 40 --no-pager)',
    ],
    effect: {
      questObjective: { questId: 'incident_scroll_4729', objectiveId: 'read_service_journal', value: 1 },
    },
  }),

  'incident close 4729 --note resolved': () => ({
    output: [
      'ticket INC-4729 → RESOLVED',
      'customer: Северный Капитал — уведомление отправлено',
      '✓ SLA восстановлено. Можно выдохнуть — до следующего деплоя.',
    ],
    effect: {
      questObjective: { questId: 'incident_scroll_4729', objectiveId: 'close_incident_rune', value: 1 },
    },
  }),

  'incident close 4729': () => ({
    output: [
      'ticket INC-4729 → RESOLVED (краткая форма — заметка по умолчанию: resolved)',
    ],
    effect: {
      questObjective: { questId: 'incident_scroll_4729', objectiveId: 'close_incident_rune', value: 1 },
    },
  }),

  'aws s3 ls s3://banking-vault/': () => ({
    output: [
      '                           PRE daily/',
      '                           PRE weekly/',
      '2026-04-14 22:01:12   2145783690 manifest-20260414.json.sha256',
      '2026-04-14 22:01:08      1048576 manifest-20260414.json',
      '',
      '✓ Реликварий на месте — проверь печать: sha256sum -c manifest.sha256',
    ],
    effect: {
      questObjective: { questId: 'vault_backup_trial', objectiveId: 'list_reliquary', value: 1 },
    },
  }),

  'sha256sum -c manifest.sha256': () => ({
    output: [
      'manifest-20260414.json: OK',
      '✓ Печать целостности сошлась — бэкап не подменён злой копией',
    ],
    effect: {
      questObjective: { questId: 'vault_backup_trial', objectiveId: 'verify_manifest_sigil', value: 1 },
    },
  }),

  'npm audit --production': () => ({
    output: [
      '# npm audit report',
      '',
      'phantom-left-pad  1.0.0  critical  prototype pollution',
      '  Depends on vulnerable versions of shadow-json-merge',
      '',
      '1 critical severity vulnerability',
      '',
      '⚠ Рекомендация: npm uninstall phantom-left-pad --save',
    ],
    effect: {
      questObjective: { questId: 'dependency_sigil', objectiveId: 'cast_audit_sigil', value: 1 },
    },
  }),

  'npm uninstall phantom-left-pad --save': () => ({
    output: [
      'removed 1 package, and audited 842 packages in 3s',
      '✓ Проклятый транзитив изгнан из package-lock',
    ],
    effect: {
      questObjective: { questId: 'dependency_sigil', objectiveId: 'banish_transitive', value: 1 },
    },
  }),
};

// ============================================
// КОМПОНЕНТ
// ============================================

interface ITTerminalProps {
  onClose: () => void;
}

export default function ITTerminal({ onClose }: ITTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: '☁ Cloud Operations Terminal v3.2.1', timestamp: Date.now() },
    { type: 'system', text: 'Подключение к internal-cloud... OK', timestamp: Date.now() },
    { type: 'system', text: 'Введите help — список команд. Часть команд продвигает параллельные IT-квесты (см. 📋).', timestamp: Date.now() },
    { type: 'system', text: '—', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setFlag = useGameStore(s => s.setFlag);
  const updateQuestObjective = useGameStore(s => s.updateQuestObjective);
  const incrementQuestObjective = useGameStore(s => s.incrementQuestObjective);

  // Автоскролл
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Фокус на инпут
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const addLine = (type: TerminalLine['type'], text: string) => {
      setLines(prev => [...prev, { type, text, timestamp: Date.now() }]);
    };

    // Добавляем ввод
    addLine('input', `$ ${cmd}`);

    if (trimmed === 'clear') {
      setLines([]);
      return;
    }

    if (trimmed === 'exit' || trimmed === 'quit') {
      onClose();
      return;
    }

    setIsProcessing(true);

    // Ищем команду — сначала точное совпадение, потом частичное
    let result: CommandResult | null = null;
    
    // Точное совпадение
    if (COMMANDS[trimmed]) {
      result = COMMANDS[trimmed]([]);
    } else {
      // Частичное совпадение: сначала более длинные ключи (чтобы «openstack server show» не съел «list»).
      const keys = Object.keys(COMMANDS)
        .filter((k) => k !== 'help')
        .sort((a, b) => b.length - a.length || b.localeCompare(a));
      for (const key of keys) {
        if (trimmed.startsWith(key)) {
          result = COMMANDS[key]([]);
          break;
        }
      }
    }

    if (!result) {
      // Симулируем задержку
      setTimeout(() => {
        addLine('error', `bash: ${cmd.split(' ')[0]}: команда не найдена`);
        addLine('system', 'Введите "help" для списка доступных команд.');
        setIsProcessing(false);
      }, 300);
      return;
    }

    // Симулируем выполнение с задержкой
    setTimeout(() => {
      result!.output.forEach((line, i) => {
        const type = line.startsWith('✓') ? 'success' 
          : line.startsWith('⚠') ? 'error' 
          : 'output';
        setTimeout(() => addLine(type, line), i * 50);
      });

      // Применяем эффекты
      if (result!.effect) {
        if (result!.effect.flag) {
          setFlag(result!.effect.flag);
        }
        const applyQuest = (p: QuestObjectivePatch) => {
          if (p.value !== undefined) {
            updateQuestObjective(p.questId, p.objectiveId, p.value);
          } else {
            incrementQuestObjective(p.questId, p.objectiveId);
          }
        };
        for (const p of result!.effect.questObjectives ?? []) {
          applyQuest(p);
        }
        if (result!.effect.questObjective) {
          applyQuest(result!.effect.questObjective);
        }
      }

      setTimeout(() => setIsProcessing(false), result!.output.length * 50 + 200);
    }, 500 + Math.random() * 500);
  }, [setFlag, updateQuestObjective, incrementQuestObjective, onClose]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    executeCommand(input);
    setInput('');
  }, [input, isProcessing, executeCommand]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="mx-auto flex max-h-[85vh] w-full max-w-[min(95vw,48rem)] flex-col overflow-hidden rounded-lg border border-green-500/30 bg-slate-950 shadow-2xl shadow-green-900/20"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-green-500/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-green-400 font-mono text-sm">
              ☁ internal-cloud — bash
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center px-2 font-mono text-sm text-green-500/60 transition-colors hover:text-green-400 sm:min-w-0 sm:px-3"
          >
            <span className="hidden sm:inline">[ESC] Закрыть</span>
            <span className="sm:hidden">✕</span>
          </button>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4 font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap ${
                line.type === 'input' ? 'text-green-300' :
                line.type === 'output' ? 'text-slate-300' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'success' ? 'text-emerald-400' :
                line.type === 'system' ? 'text-green-500/60' :
                'text-slate-300'
              }`}
            >
              {line.text}
            </div>
          ))}

          {isProcessing && (
            <div className="text-green-500/60 animate-pulse">▌</div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center border-t border-green-500/20 bg-slate-900/50">
          <span className="text-green-400 font-mono text-sm pl-4 pr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-green-300 font-mono text-sm py-3 pr-4 outline-none placeholder-green-800"
            placeholder={isProcessing ? 'Выполняется...' : 'Введите команду...'}
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </motion.div>
    </motion.div>
  );
}
