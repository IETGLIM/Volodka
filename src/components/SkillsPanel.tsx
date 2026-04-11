'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerSkills } from '../data/types';

interface SkillsPanelProps {
  skills: PlayerSkills;
  onClose?: () => void;
}

// Конфигурация навыков для отображения
const SKILL_CONFIG: Record<keyof Omit<PlayerSkills, 'skillPoints'>, {
  name: string;
  icon: string;
  color: string;
  description: string;
}> = {
  writing: {
    name: 'Письмо',
    icon: '✍️',
    color: 'from-amber-500 to-orange-400',
    description: 'Качество стихов и текстов'
  },
  perception: {
    name: 'Восприятие',
    icon: '👁️',
    color: 'from-cyan-500 to-blue-400',
    description: 'Замечать детали и скрытое'
  },
  empathy: {
    name: 'Эмпатия',
    icon: '💜',
    color: 'from-purple-500 to-pink-400',
    description: 'Понимать чувства других'
  },
  imagination: {
    name: 'Воображение',
    icon: '✨',
    color: 'from-violet-500 to-purple-400',
    description: 'Яркость 3D сцен и идей'
  },
  logic: {
    name: 'Логика',
    icon: '🧩',
    color: 'from-green-500 to-emerald-400',
    description: 'Взлом терминалов, аргументы'
  },
  coding: {
    name: 'Программирование',
    icon: '💻',
    color: 'from-slate-500 to-zinc-400',
    description: 'Дебаггинг памяти'
  },
  persuasion: {
    name: 'Убеждение',
    icon: '🗣️',
    color: 'from-rose-500 to-red-400',
    description: 'Влиять на решения других'
  },
  intuition: {
    name: 'Интуиция',
    icon: '🔮',
    color: 'from-indigo-500 to-violet-400',
    description: 'Чувствовать правильный путь'
  },
  resilience: {
    name: 'Стрессоустойчивость',
    icon: '🛡️',
    color: 'from-emerald-500 to-teal-400',
    description: 'Сопротивление стрессу'
  },
  introspection: {
    name: 'Самопознание',
    icon: '🪞',
    color: 'from-sky-500 to-cyan-400',
    description: 'Понимать себя'
  }
};

const SkillsPanel = memo(function SkillsPanel({ skills, onClose }: SkillsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md p-4 bg-slate-800/95 rounded-lg backdrop-blur-sm border border-slate-700/50"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🎯</span> Навыки
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Skill Points */}
      {skills.skillPoints > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg"
        >
          <p className="text-amber-300 text-sm font-medium">
            ✨ Очков навыков: {skills.skillPoints}
          </p>
        </motion.div>
      )}

      {/* Skills Grid */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {Object.entries(SKILL_CONFIG).map(([key, config]) => {
          const skillKey = key as keyof typeof SKILL_CONFIG;
          const value = skills[skillKey] as number;
          
          return (
            <div key={key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <span className="text-sm font-medium text-slate-200">{config.name}</span>
                </div>
                <span className="text-xs text-slate-400">{value}/100</span>
              </div>
              
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {config.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          💡 Навыки растут от выборов и влияют на доступные опции
        </p>
      </div>
    </motion.div>
  );
});

// Компактный индикатор навыков для верхней панели
export const SkillsMiniBar = memo(function SkillsMiniBar({ skills }: { skills: PlayerSkills }) {
  // Показываем только 4 ключевых навыка
  const keySkills: Array<keyof typeof SKILL_CONFIG> = ['empathy', 'logic', 'imagination', 'writing'];
  
  return (
    <div className="flex items-center gap-2">
      {keySkills.map(skillKey => {
        const config = SKILL_CONFIG[skillKey];
        const value = skills[skillKey] as number;
        
        return (
          <div key={skillKey} className="flex items-center gap-1" title={`${config.name}: ${value}`}>
            <span className="text-xs">{config.icon}</span>
            <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default SkillsPanel;
