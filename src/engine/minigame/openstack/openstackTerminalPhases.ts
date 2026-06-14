import type { OpenStackPhaseConfig } from '@/engine/minigame/openstack/openstackTerminalTypes';

export const OPENSTACK_TERMINAL_PHASES: OpenStackPhaseConfig[] = [
  {
    id: 'diagnose',
    title: 'ДИАГНОСТИКА',
    prompt: 'Обнаружена критическая ошибка сервера. Запустите команду диагностики:',
    options: [
      {
        command: 'nova list',
        isCorrect: true,
        successOutput:
          '+----+----------+--------+------------+-------------+----------+\n'
          + '| ID | Name     | Status | Task State | Power State | Networks |\n'
          + '+----+----------+--------+------------+-------------+----------+\n'
          + '| 1  | srv-prod | ERROR  | -          | Running     | int-net  |\n'
          + '| 2  | srv-back | ACTIVE | -          | Running     | int-net  |\n'
          + '+----+----------+--------+------------+-------------+----------+\n'
          + '>>> Сервер srv-prod в состоянии ERROR. Требуется проверка.',
        errorOutput: '',
      },
      {
        command: 'glance image-list',
        isCorrect: false,
        errorOutput:
          'ERROR: glance — Образы не помогут диагностировать сбой сервера.\n'
          + '>>> Неверная команда. Нужна диагностика вычислительных ресурсов.',
      },
      {
        command: 'cinder list',
        isCorrect: false,
        errorOutput:
          'ERROR: cinder — Томы данных не связаны с текущим сбоем.\n'
          + '>>> Неверная команда. Проверьте состояние инстансов.',
      },
    ],
  },
  {
    id: 'isolate',
    title: 'ИЗОЛЯЦИЯ',
    prompt: 'Сервер srv-prod в состоянии ERROR. Определите причину сбоя:',
    options: [
      {
        command: 'neutron net-list',
        isCorrect: false,
        errorOutput:
          'ERROR: neutron — Сеть работает исправно. Проблема не в сети.\n'
          + '>>> Неверная команда. Проверьте детали сервера.',
      },
      {
        command: 'openstack server show srv-prod',
        isCorrect: true,
        successOutput:
          '  OS-EXT-SRV-ATTR: hypervisor_hostname  :  kvm-node-03\n'
          + '  fault.message    :  Virtualization driver crash\n'
          + '  fault.code       :  500\n'
          + '  status           :  ERROR\n'
          + '  vm_state         :  error\n'
          + '>>> Причина: краш драйвера виртуализации на kvm-node-03.\n'
          + '>>> Рекомендация: перезагрузка инстанса.',
      },
      {
        command: 'openstack network create',
        isCorrect: false,
        errorOutput:
          'ERROR: Создание сети не решит проблему сервера.\n'
          + '>>> Неверная команда. Нужно определить причину сбоя.',
      },
      {
        command: 'openstack server delete srv-prod',
        isCorrect: false,
        errorOutput:
          'ERROR: Удаление продакшн-сервера?! Вы с ума сошли?!\n'
          + '>>> Неверная команда. Нужно диагностировать, а не уничтожать.',
      },
    ],
  },
  {
    id: 'repair',
    title: 'ВОССТАНОВЛЕНИЕ',
    prompt: 'Причина найдена: краш драйвера виртуализации. Выполните ремонт:',
    options: [
      {
        command: 'nova reboot srv-prod',
        isCorrect: true,
        successOutput:
          'Request to reboot server srv-prod has been accepted.\n'
          + '... ожидание ...\n'
          + '+----+----------+--------+------------+-------------+----------+\n'
          + '| ID | Name     | Status | Task State | Power State | Networks |\n'
          + '+----+----------+--------+------------+-------------+----------+\n'
          + '| 1  | srv-prod | ACTIVE | -          | Running     | int-net  |\n'
          + '| 2  | srv-back | ACTIVE | -          | Running     | int-net  |\n'
          + '+----+----------+--------+------------+-------------+----------+\n'
          + '>>> Сервер srv-prod успешно перезагружен. Статус: ACTIVE.\n'
          + '>>> Кризис предотвращён!',
      },
      {
        command: 'openstack server delete srv-prod',
        isCorrect: false,
        errorOutput:
          'ERROR: Удаление продакшн-сервера — это катастрофа!\n'
          + '>>> Неверная команда. Нужна перезагрузка, не удаление!',
      },
      {
        command: 'openstack network create fallback',
        isCorrect: false,
        errorOutput:
          'ERROR: Создание новой сети не починит краш драйвера.\n'
          + '>>> Неверная команда. Перезагрузите инстанс!',
      },
    ],
  },
];
