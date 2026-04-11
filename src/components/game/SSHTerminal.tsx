"use client";

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// ТИПЫ
// ============================================

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
  timestamp?: number;
}

interface TechTask {
  id: string;
  title: string;
  category: 'openstack' | 'rabbitmq' | 'kubernetes' | 'database' | 'ssl';
  description: string;
  commands: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

// ============================================
// ТЕХНИЧЕСКИЕ ЗАДАНИЯ
// ============================================

const TECH_TASKS: TechTask[] = [
  {
    id: 'openstack_find_server',
    title: '🖥️ OpenStack: Найти сервер по IP',
    category: 'openstack',
    description: 'Найти сервер по IP-адресу, получить имя и ссылку на консоль',
    commands: [
      'openstack server list --all-projects',
      'openstack server show <ID> --format json',
      'openstack console url show <ID>',
    ],
    status: 'pending',
  },
  {
    id: 'rabbitmq_overflow',
    title: '🐰 RabbitMQ: Накопление сообщений',
    category: 'rabbitmq',
    description: 'Очередь переполнена — более 100000 сообщений. Принять решение.',
    commands: [
      'rabbitmqctl list_queues name messages',
      'rabbitmqctl list_queues name consumers',
      '# Вопрос: Собирать ACK? Спросить админов? Писать владельцам?',
    ],
    status: 'pending',
  },
  {
    id: 'kubernetes_orchestrator',
    title: '☸️ Kubernetes: Перезапуск оркестратора',
    category: 'kubernetes',
    description: 'Оркестратор упал. Проверить причину и перезапустить.',
    commands: [
      'kubectl get nodes',
      'kubectl logs -n kube-system <pod>',
      'kubectl rollout restart deployment/orchestrator -n internal-cloud',
    ],
    status: 'pending',
  },
  {
    id: 'database_pool',
    title: '🗄️ База данных: Пул соединений',
    category: 'database',
    description: '847 соединений при лимите 800. Найти виновника.',
    commands: [
      'SHOW PROCESSLIST',
      'SELECT * FROM information_schema.processlist WHERE TIME > 10',
      '# Микросервис loyalty-points не возвращает соединения',
    ],
    status: 'pending',
  },
  {
    id: 'ssl_renewal',
    title: '🔐 SSL: Обновление сертификата',
    category: 'ssl',
    description: 'Сертификат истекает через 48 часов. Обновить без простоя.',
    commands: [
      'openssl s_client -connect banking.example.com:443',
      'kubectl create secret tls banking-cert --cert=... --key=...',
      'kubectl rollout restart deployment/banking -n prod',
    ],
    status: 'pending',
  },
  {
    id: 'memory_leak',
    title: '🧠 Микросервис: Утечка памяти',
    category: 'kubernetes',
    description: 'loyalty-points потребляет 8GB RAM и растёт.',
    commands: [
      'kubectl top pods -n banking-prod',
      'kubectl exec -it <pod> -- jmap -dump:format=b,file=heap.bin 1',
      '# Анализ через VisualVM или MAT',
    ],
    status: 'pending',
  },
  {
    id: 'auth_crisis',
    title: '🔥 Кризис авторизации',
    category: 'database',
    description: 'Банк "Северный Капитал" — 5000+ пользователей не могут войти.',
    commands: [
      'SHOW PROCESSLIST',
      'kubectl logs deployment/auth-service -n banking-prod',
      'kubectl rollout undo deployment/loyalty-points -n banking-prod',
    ],
    status: 'pending',
  },
  {
    id: 'openstack_migrate',
    title: '🖥️ OpenStack: Миграция ВМ',
    category: 'openstack',
    description: 'Мигрировать виртуальные машины между хостами.',
    commands: [
      'openstack server list --host compute-01',
      'openstack server migrate <ID> --host compute-02',
      'openstack server migrate confirm <ID>',
    ],
    status: 'pending',
  },
];

// ============================================
// КОМПОНЕНТ ТЕРМИНАЛА
// ============================================

interface SSHTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask?: (taskId: string) => void;
}

export const SSHTerminal = memo(function SSHTerminal({ 
  isOpen, 
  onClose,
  onCompleteTask 
}: SSHTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', text: 'SSH-терминал. Привычные команды.' },
    { type: 'output', text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedTask, setSelectedTask] = useState<TechTask | null>(null);
  const [commandIndex, setCommandIndex] = useState(0);

  const handleCommand = useCallback((cmd: string) => {
    const newLines: TerminalLine[] = [
      ...lines,
      { type: 'input', text: `$ ${cmd}` },
    ];

    // Симуляция ответов на команды
    if (cmd.includes('SHOW PROCESSLIST')) {
      newLines.push({
        type: 'output',
        text: `Id: 847 активных соединений
+----+------+-----------+--------+---------+------+-------+------------------+
| Id | User | Host      | db     | Command | Time | State | Info             |
+----+------+-----------+--------+---------+------+-------+------------------+
| 1  | app  | localhost | banking| Sleep   | 120  |       | NULL             |
| 2  | app  | localhost | banking| Query   | 0    | init  | SHOW PROCESSLIST |
...
847 rows in set (0.01 sec)
⚠️ Максимум — 800 соединений! Пул исчерпан!`,
      });
      newLines.push({
        type: 'error',
        text: 'Новый микросервис "loyalty-points" не возвращает соединения',
      });
    } else if (cmd.includes('openstack server list')) {
      newLines.push({
        type: 'output',
        text: `+--------------------------------------+-------------------+--------+---------------------------------------+
| ID                                   | Name              | Status | Networks                              |
+--------------------------------------+-------------------+--------+---------------------------------------+
| a1b2c3d4-e5f6-7890-abcd-ef1234567890 | banking-prod-01   | ACTIVE | internal=192.168.1.100               |
| b2c3d4e5-f6a7-8901-bcde-f12345678901 | banking-prod-02   | ACTIVE | internal=192.168.1.101               |
| c3d4e5f6-a7b8-9012-cdef-123456789012 | auth-service      | ACTIVE | internal=192.168.1.50                |
+--------------------------------------+-------------------+--------+---------------------------------------+`,
      });
    } else if (cmd.includes('rabbitmqctl list_queues')) {
      newLines.push({
        type: 'output',
        text: `Timeout: 60.0 seconds ...
Listing queues for vhost / ...
name    messages
notifications.email  124567
notifications.sms    89234
banking.transactions 52341
loyalty.points       100234 ⚠️
...done.`,
      });
      newLines.push({
        type: 'error',
        text: '⚠️ loyalty.points: более 100000 сообщений! Требуется действие!',
      });
    } else if (cmd.includes('kubectl get nodes')) {
      newLines.push({
        type: 'output',
        text: `NAME           STATUS   ROLES           AGE   VERSION
master-01      Ready    control-plane   365d  v1.28.4
master-02      Ready    control-plane   365d  v1.28.4
master-03      Ready    control-plane   365d  v1.28.4
worker-01      Ready    <none>          365d  v1.28.4
worker-02      Ready    <none>          365d  v1.28.4
worker-03      NotReady ⚠️ <none>        365d  v1.28.4`,
      });
      newLines.push({
        type: 'error',
        text: '⚠️ worker-03 в статусе NotReady! Проверить kubelet!',
      });
    } else if (cmd.includes('rollout undo') || cmd.includes('rollout restart')) {
      newLines.push({
        type: 'success',
        text: 'deployment.apps/loyalty-points rolled back',
      });
      newLines.push({
        type: 'success',
        text: '✓ Соединения освобождены. SLA соблюдён.',
      });
      if (selectedTask && onCompleteTask) {
        onCompleteTask(selectedTask.id);
      }
    } else if (cmd === 'clear') {
      setLines([
        { type: 'output', text: 'SSH-терминал. Привычные команды.' },
        { type: 'output', text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
      ]);
      return;
    } else if (cmd === 'help') {
      newLines.push({
        type: 'output',
        text: `Доступные команды:
  SHOW PROCESSLIST     - Показать активные соединения БД
  openstack server list - Список серверов OpenStack
  rabbitmqctl list_queues - Очереди RabbitMQ
  kubectl get nodes    - Статус нод Kubernetes
  kubectl rollout undo - Откатить деплой
  kubectl rollout restart - Перезапустить сервис
  clear                - Очистить терминал
  help                 - Эта справка`,
      });
    } else {
      newLines.push({
        type: 'output',
        text: `bash: ${cmd.split(' ')[0]}: command not found`,
      });
    }

    setLines(newLines);
    setCurrentInput('');
  }, [lines, selectedTask, onCompleteTask]);

  const selectTask = useCallback((task: TechTask) => {
    setSelectedTask(task);
    setCommandIndex(0);
    setLines([
      { type: 'output', text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` },
      { type: 'output', text: `📋 Задание: ${task.title}` },
      { type: 'output', text: task.description },
      { type: 'output', text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` },
      { type: 'output', text: 'Команды для выполнения:' },
      ...task.commands.map(cmd => ({ type: 'output' as const, text: `  $ ${cmd}` })),
      { type: 'output', text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` },
    ]);
  }, []);

  const executeNextCommand = useCallback(() => {
    if (selectedTask && commandIndex < selectedTask.commands.length) {
      const cmd = selectedTask.commands[commandIndex].replace('# ', '');
      if (!cmd.startsWith('#')) {
        handleCommand(cmd);
      }
      setCommandIndex(prev => prev + 1);
    }
  }, [selectedTask, commandIndex, handleCommand]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-[600px] bg-slate-950/95 rounded-lg border border-slate-700 shadow-2xl z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-green-400">➜</span>
          <span className="text-cyan-400 font-mono text-sm">SSH-терминал</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">banking-prod@example.com</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded bg-red-600/50 hover:bg-red-500 text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Task Selector */}
      <div className="flex gap-1 p-2 border-b border-slate-700 overflow-x-auto">
        {TECH_TASKS.map(task => (
          <button
            key={task.id}
            onClick={() => selectTask(task)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedTask?.id === task.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {task.title}
          </button>
        ))}
      </div>

      {/* Terminal Output */}
      <div className="h-64 overflow-y-auto p-3 font-mono text-xs space-y-1 bg-black/50">
        {lines.map((line, i) => (
          <div 
            key={i} 
            className={
              line.type === 'input' ? 'text-cyan-300' :
              line.type === 'error' ? 'text-red-400' :
              line.type === 'success' ? 'text-green-400' :
              'text-slate-300'
            }
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t border-slate-700">
        <span className="text-green-400">$</span>
        <input
          type="text"
          id="ssh-terminal-input"
          name="sshCommand"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && currentInput.trim()) {
              handleCommand(currentInput.trim());
            }
          }}
          placeholder="Введите команду..."
          className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
          autoComplete="off"
          aria-label="Команда терминала"
        />
        {selectedTask && commandIndex < selectedTask.commands.length && (
          <button
            onClick={executeNextCommand}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white"
          >
            ▶ Далее
          </button>
        )}
      </div>
    </motion.div>
  );
});

export default SSHTerminal;
