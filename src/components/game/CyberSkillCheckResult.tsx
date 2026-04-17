'use client';

import { motion } from 'framer-motion';

export type SkillCheckBannerPayload = {
  success: boolean;
  skill: string;
  roll: number;
  difficulty: number;
};

export function CyberSkillCheckResult({ result }: { result: SkillCheckBannerPayload }) {
  return (
    <motion.div
      className={`mx-4 mt-3 px-4 py-2 font-mono text-sm border ${
        result.success
          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
          : 'bg-red-950/50 text-red-300 border-red-500/30'
      }`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        boxShadow: result.success
          ? '0 0 10px rgba(16, 185, 129, 0.15)'
          : '0 0 10px rgba(239, 68, 68, 0.15)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {result.success ? (
        <span>✅ Проверка {result.skill}: успех! ({result.roll} + навык ≥ {result.difficulty})</span>
      ) : (
        <span>❌ Проверка {result.skill}: неудача ({result.roll} + навык &lt; {result.difficulty})</span>
      )}
    </motion.div>
  );
}
