'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/state';
import { QUEST_DEFINITIONS } from '@/data/quests';

// ============================================
// КОМПОНЕНТ НАСЛЕДИЯ — Финальный экран
// ============================================
// Показывается после концовки.
// Отражает, что Володька оставил после себя —
// на основе завершённых квестов и собранных стихов.

interface LegacyScreenProps {
  endingType: string;
  endingTitle: string;
  onRestart: () => void;
}

interface LegacyItem {
  icon: string;
  label: string;
  detail: string;
  unlocked: boolean;
}

export default function LegacyScreen({ endingType, endingTitle, onRestart }: LegacyScreenProps) {
  const completedQuestIds = useGameStore(s => s.completedQuestIds);
  const collectedPoemIds = useGameStore(s => s.collectedPoemIds);
  const playerState = useGameStore(s => s.playerState);

  // Вычисляем наследие
  const legacyItems = useMemo((): LegacyItem[] => {
    const items: LegacyItem[] = [];

    // Стихи
    const poemCount = collectedPoemIds.length;
    items.push({
      icon: '📜',
      label: poemCount >= 10 ? 'Сборник стихов' : poemCount >= 5 ? 'Черновики' : 'Обрывки',
      detail: `${poemCount}/18 стихотворений собрано`,
      unlocked: poemCount > 0,
    });

    // Квесты
    const completedCount = completedQuestIds.length;
    items.push({
      icon: completedCount >= 8 ? '⭐' : completedCount >= 4 ? '📋' : '📝',
      label: completedCount >= 8 ? 'Полное прохождение' : completedCount >= 4 ? 'Частичное прохождение' : 'Начало пути',
      detail: `${completedCount} квестов завершено`,
      unlocked: completedCount > 0,
    });

    // IT-мастер
    const itQuests = ['auth_crisis', 'kubernetes_orchestrator', 'database_pool_exhausted', 'openstack_server_find', 'rabbitmq_overflow', 'ssl_certificate_renewal', 'microservice_memory_leak', 'whitehat_uat_sprint'];
    const itCompleted = itQuests.filter(q => completedQuestIds.includes(q)).length;
    items.push({
      icon: itCompleted >= 4 ? '🖥️' : '⌨️',
      label: itCompleted >= 4 ? 'IT-эксперт' : itCompleted >= 1 ? 'IT-специалист' : 'Новичок',
      detail: `${itCompleted}/${itQuests.length} IT-квестов`,
      unlocked: itCompleted > 0,
    });

    // Виктория
    const hasVictoria = completedQuestIds.includes('maria_connection');
    items.push({
      icon: hasVictoria ? '💜' : '🚪',
      label: hasVictoria ? 'Связь с Викторией' : 'Одиночество',
      detail: hasVictoria ? 'Нашёл того, кто услышит' : 'Дверь осталась закрытой',
      unlocked: true,
    });

    // Мир снов
    const hasDreams = completedQuestIds.includes('lost_memories');
    const hasStars = completedQuestIds.includes('star_connection');
    items.push({
      icon: hasStars ? '🌟' : hasDreams ? '🌙' : '💤',
      label: hasStars ? 'Звёздная связь' : hasDreams ? 'Странник снов' : 'Обычный сон',
      detail: hasStars ? 'Созвездия раскрыли тайну' : hasDreams ? 'Видел потерянные воспоминания' : 'Сны — просто сны',
      unlocked: true,
    });

    // Публичное выступление
    const hasReading = completedQuestIds.includes('first_reading');
    items.push({
      icon: hasReading ? '🎤' : '🤫',
      label: hasReading ? 'Публичное чтение' : 'Тишина',
      detail: hasReading ? 'Голос был услышан' : 'Стихи остались в блокноте',
      unlocked: true,
    });

    return items;
  }, [completedQuestIds, collectedPoemIds]);

  // Итоговый титул
  const legacyTitle = useMemo(() => {
    switch (endingType) {
      case 'creator': return 'Создатель';
      case 'reconciliation': return 'Примирённый';
      case 'observer': return 'Наблюдатель';
      case 'seeker': return 'Искатель';
      case 'broken': return 'Камень';
      default: return 'Неизвестный';
    }
  }, [endingType]);

  // Цветовая схема концовки
  const endingColors: Record<string, { border: string; text: string; glow: string }> = {
    creator: { border: 'border-amber-500/50', text: 'text-amber-400', glow: 'rgba(245, 158, 11, 0.3)' },
    reconciliation: { border: 'border-purple-500/50', text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.3)' },
    observer: { border: 'border-blue-500/50', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.3)' },
    seeker: { border: 'border-emerald-500/50', text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.3)' },
    broken: { border: 'border-slate-500/50', text: 'text-slate-400', glow: 'rgba(100, 116, 139, 0.3)' },
  };

  const colors = endingColors[endingType] || endingColors.broken;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <div className="max-w-lg w-full mx-4 text-center">
        {/* Титул */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>
            {endingTitle}
          </h1>
          <p className="text-slate-500 text-sm font-mono">
            {legacyTitle}
          </p>
        </motion.div>

        {/* Наследие */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="space-y-3 mb-10"
        >
          <p className="text-slate-400 text-sm mb-4">Что Володька оставил после себя:</p>
          {legacyItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.5 + i * 0.3, duration: 0.5 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
                item.unlocked
                  ? `bg-slate-900/60 ${colors.border}`
                  : 'bg-slate-950/40 border-slate-800/30 opacity-40'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="text-left flex-1">
                <p className={`text-sm font-medium ${item.unlocked ? colors.text : 'text-slate-600'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 font-mono">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Статы */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 1 }}
          className="grid grid-cols-4 gap-2 mb-10"
        >
          {[
            { label: 'Настроение', value: playerState.mood },
            { label: 'Креативность', value: playerState.creativity },
            { label: 'Стабильность', value: playerState.stability },
            { label: 'Карма', value: playerState.karma },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/40 rounded-lg p-2">
              <p className="text-slate-500 text-[10px] font-mono">{stat.label}</p>
              <p className={`text-lg font-bold ${colors.text}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Кнопка рестарта */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5, duration: 1 }}
          onClick={onRestart}
          className={`px-8 py-3 rounded-lg border ${colors.border} ${colors.text} bg-transparent hover:bg-slate-900/50 transition-all text-sm font-mono`}
        >
          Начать заново
        </motion.button>
      </div>
    </motion.div>
  );
}
