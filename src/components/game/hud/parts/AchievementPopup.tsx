import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';

export interface SkillAchievementNotice {
  title: string;
  description: string;
  icon?: string;
}

interface AchievementPopupProps {
  achievement: SkillAchievementNotice | null;
}

export function AchievementPopup({ achievement }: AchievementPopupProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <>
          <AriaLiveRegion
            message={`${achievement.title}. ${achievement.description}`}
            priority="polite"
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ zIndex: UI_LAYERS.TOASTS + 2 }}
            role="status"
            aria-live="polite"
          >
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.85) 100%)',
                borderColor: 'rgba(251,191,36,0.4)',
                boxShadow: '0 0 30px rgba(251,191,36,0.15), 0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="size-10 rounded-lg flex items-center justify-center text-xl"
                style={{
                  background: 'rgba(251,191,36,0.15)',
                  boxShadow: '0 0 12px rgba(251,191,36,0.2)',
                }}
                aria-hidden="true"
              >
                {achievement.icon ? achievement.icon : <Star className="size-5 text-amber-400" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-200 font-mono">{achievement.title}</div>
                <div className="text-xs text-slate-400">{achievement.description}</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
