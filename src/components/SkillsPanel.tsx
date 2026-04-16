'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { PlayerSkills } from '../data/types';

interface SkillsPanelProps {
  skills: PlayerSkills;
  onClose?: () => void;
}

// Киберпанк конфигурация навыков
const SKILL_CONFIG: Record<keyof Omit<PlayerSkills, 'skillPoints'>, {
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  category: 'creative' | 'mental' | 'social';
}> = {
  writing: {
    name: 'Письмо',
    icon: '✍️',
    color: 'from-amber-400 to-orange-500',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    description: 'Качество стихов и текстов',
    category: 'creative'
  },
  perception: {
    name: 'Восприятие',
    icon: '👁️',
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(34, 211, 238, 0.5)',
    description: 'Замечать детали и скрытое',
    category: 'mental'
  },
  empathy: {
    name: 'Эмпатия',
    icon: '💜',
    color: 'from-purple-400 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    description: 'Понимать чувства других',
    category: 'social'
  },
  imagination: {
    name: 'Воображение',
    icon: '✨',
    color: 'from-violet-400 to-purple-500',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    description: 'Яркость 3D сцен и идей',
    category: 'creative'
  },
  logic: {
    name: 'Логика',
    icon: '🧩',
    color: 'from-emerald-400 to-green-500',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    description: 'Взлом терминалов, аргументы',
    category: 'mental'
  },
  coding: {
    name: 'Кодинг',
    icon: '💻',
    color: 'from-slate-400 to-zinc-500',
    glowColor: 'rgba(100, 116, 139, 0.5)',
    description: 'Дебаггинг памяти',
    category: 'mental'
  },
  persuasion: {
    name: 'Убеждение',
    icon: '🗣️',
    color: 'from-rose-400 to-red-500',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    description: 'Влиять на решения других',
    category: 'social'
  },
  intuition: {
    name: 'Интуиция',
    icon: '🔮',
    color: 'from-indigo-400 to-violet-500',
    glowColor: 'rgba(129, 140, 248, 0.5)',
    description: 'Чувствовать правильный путь',
    category: 'creative'
  },
  resilience: {
    name: 'Стойкость',
    icon: '🛡️',
    color: 'from-teal-400 to-cyan-500',
    glowColor: 'rgba(20, 184, 166, 0.5)',
    description: 'Сопротивление стрессу',
    category: 'mental'
  },
  introspection: {
    name: 'Самопознание',
    icon: '🪞',
    color: 'from-sky-400 to-blue-500',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    description: 'Понимать себя',
    category: 'creative'
  }
};

const CATEGORY_LABELS = {
  creative: { name: 'Творчество', icon: '🎨' },
  mental: { name: 'Разум', icon: '🧠' },
  social: { name: 'Социальные', icon: '💬' },
};

const SkillsPanel = memo(function SkillsPanel({ skills, onClose }: SkillsPanelProps) {
  // Группируем по категориям
  const skillsByCategory = {
    creative: Object.entries(SKILL_CONFIG).filter(([, v]) => v.category === 'creative'),
    mental: Object.entries(SKILL_CONFIG).filter(([, v]) => v.category === 'mental'),
    social: Object.entries(SKILL_CONFIG).filter(([, v]) => v.category === 'social'),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      className="w-full max-w-sm relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.97) 0%, rgba(20, 20, 35, 0.97) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 0 30px rgba(34, 211, 238, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Cyberpunk corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/50" />
      
      {/* Scanlines effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
        }}
      />

      {/* Header */}
      <div className="relative p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <span className="text-cyan-400">⚡</span>
            </div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              НАВЫКИ
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-700/50 hover:bg-red-500/30 text-slate-400 hover:text-red-400 transition-all border border-slate-600/50 hover:border-red-500/50"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Skill Points */}
      {skills.skillPoints > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 p-3 rounded-lg border relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
            borderColor: 'rgba(251, 191, 36, 0.3)',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl">✨</span>
            <div>
              <p className="text-amber-300 text-sm font-bold">
                Очков для распределения: {skills.skillPoints}
              </p>
              <p className="text-amber-400/60 text-xs">Кликните на навык для улучшения</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Skills by category */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS].icon}
              </span>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS].name}
              </h4>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
            </div>
            
            {/* Skills in category */}
            <div className="space-y-2">
              {categorySkills.map(([key, config]) => {
                const skillKey = key as keyof typeof SKILL_CONFIG;
                const value = skills[skillKey] as number;
                
                return (
                  <div 
                    key={key} 
                    className="group relative p-2 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-all cursor-pointer border border-transparent hover:border-slate-600/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base w-5 text-center">{config.icon}</span>
                        <span className="text-sm font-medium text-slate-200">{config.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {skills.skillPoints > 0 && (
                          <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            +1
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">{value}</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="relative h-2 bg-slate-900/50 rounded-full overflow-hidden">
                      {/* Background glow */}
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `linear-gradient(90deg, ${config.glowColor}, transparent)`,
                        }}
                      />
                      
                      {/* Fill */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${config.color} rounded-full relative`}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      </motion.div>
                      
                      {/* Tick marks */}
                      <div className="absolute inset-0 flex justify-between">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-px h-full bg-slate-600/30" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Description on hover */}
                    <p className="text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {config.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-cyan-500/20 bg-slate-900/30">
        <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
          <span className="text-cyan-500">▶</span> Навыки влияют на доступные опции в диалогах
        </p>
      </div>
    </motion.div>
  );
});

// Компактный индикатор навыков для верхней панели
export const SkillsMiniBar = memo(function SkillsMiniBar({ skills }: { skills: PlayerSkills }) {
  const keySkills: Array<keyof typeof SKILL_CONFIG> = ['empathy', 'logic', 'imagination', 'writing'];
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
      {keySkills.map(skillKey => {
        const config = SKILL_CONFIG[skillKey];
        const value = skills[skillKey] as number;
        
        return (
          <div key={skillKey} className="flex items-center gap-1" title={`${config.name}: ${value}`}>
            <span className="text-xs">{config.icon}</span>
            <div className="w-8 h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
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
