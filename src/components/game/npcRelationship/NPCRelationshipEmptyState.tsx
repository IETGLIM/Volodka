import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { NPC_RELATIONSHIP_LABELS } from '@/engine/npcRelationship/npcRelationshipConstants';

type NPCRelationshipEmptyStateProps = {
  reducedMotion: boolean;
};

export function NPCRelationshipEmptyState({ reducedMotion }: NPCRelationshipEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
      >
        <Users className="mx-auto mb-4 size-12 text-slate-700/50" aria-hidden="true" />
        <p className="mb-1 text-sm text-slate-500">{NPC_RELATIONSHIP_LABELS.emptyTitle}</p>
        <p className="max-w-[220px] text-xs text-slate-600">{NPC_RELATIONSHIP_LABELS.emptyBody}</p>
      </motion.div>
    </div>
  );
}
