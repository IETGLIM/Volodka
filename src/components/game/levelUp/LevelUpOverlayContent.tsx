import { motion } from 'framer-motion';
import {
  formatPerkPointsLabel,
  formatSkillPointsLabel,
  type LevelUpViewState,
  type ParticleSpec,
} from '@/engine/levelUp/levelUpPresentation';
import { LevelUpParticles } from '@/components/game/levelUp/LevelUpParticles';

type LevelUpOverlayContentProps = {
  levelUp: LevelUpViewState;
  particles: ParticleSpec[];
};

function LevelUpTextCard({ levelUp }: { levelUp: LevelUpViewState }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-px w-[180px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
        }}
      />

      <div
        className="px-8 py-3 rounded-xl relative bg-black/60 backdrop-blur-md border border-amber-400/40"
        style={{
          boxShadow:
            '0 0 40px rgba(251,191,36,0.2), 0 0 80px rgba(251,191,36,0.08), inset 0 0 20px rgba(251,191,36,0.05)',
        }}
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-400/40 rounded-tl-md" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-400/40 rounded-tr-md" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-400/40 rounded-bl-md" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-400/40 rounded-br-md" />

        <p
          className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-[0.15em] text-center text-amber-400"
          style={{
            textShadow: '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)',
          }}
        >
          УРОВЕНЬ {levelUp.newLevel}!
        </p>
      </div>

      <div
        className="h-px w-[180px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
        }}
      />

      <div className="flex items-center gap-2">
        <p className="text-sm font-mono tracking-wider text-amber-300/60">
          {formatSkillPointsLabel(levelUp.levelsGained)}
        </p>
        {levelUp.perkPointsGained > 0 && (
          <p className="text-sm font-mono tracking-wider text-cyan-300/70">
            ★ {formatPerkPointsLabel(levelUp.perkPointsGained)}
          </p>
        )}
      </div>
    </div>
  );
}

export function LevelUpStaticOverlay({ levelUp }: { levelUp: LevelUpViewState }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <LevelUpTextCard levelUp={levelUp} />
    </div>
  );
}

export function LevelUpAnimatedOverlay({ levelUp, particles }: LevelUpOverlayContentProps) {
  return (
    <>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.15) 40%, rgba(251,191,36,0.05) 70%, transparent 100%)',
        }}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.25, 0.15, 0.2, 0] }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 50%, transparent 80%)',
        }}
      />

      <LevelUpParticles particles={particles} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
            }}
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          <motion.div
            className="px-8 py-3 rounded-xl relative bg-black/60 backdrop-blur-md border border-amber-400/40"
            style={{
              boxShadow:
                '0 0 40px rgba(251,191,36,0.2), 0 0 80px rgba(251,191,36,0.08), inset 0 0 20px rgba(251,191,36,0.05)',
            }}
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-400/40 rounded-tl-md" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-400/40 rounded-tr-md" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-400/40 rounded-bl-md" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-400/40 rounded-br-md" />

            <motion.p
              className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-[0.15em] text-center text-amber-400"
              style={{
                textShadow:
                  '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.15)',
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)',
                  '0 0 30px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.4), 0 0 80px rgba(251,191,36,0.2)',
                  '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)',
                ],
              }}
              transition={{ duration: 1.5, repeat: 1, ease: 'easeInOut' }}
            >
              УРОВЕНЬ {levelUp.newLevel}!
            </motion.p>
          </motion.div>

          <motion.div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
            }}
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <motion.p
              className="text-sm font-mono tracking-wider text-amber-300/60"
              style={{ textShadow: '0 0 8px rgba(251,191,36,0.3)' }}
            >
              {formatSkillPointsLabel(levelUp.levelsGained)}
            </motion.p>
            {levelUp.perkPointsGained > 0 && (
              <motion.p
                className="text-sm font-mono tracking-wider text-cyan-300/70"
                style={{ textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.4)' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                ★ {formatPerkPointsLabel(levelUp.perkPointsGained)}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.05) 50%, transparent 100%)',
        }}
        initial={{ y: '-100%' }}
        animate={{ y: '100%' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
    </>
  );
}
