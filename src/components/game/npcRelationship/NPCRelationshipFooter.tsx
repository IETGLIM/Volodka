import { Shield, Skull } from 'lucide-react';
import { NPC_RELATIONSHIP_LABELS } from '@/engine/npcRelationship/npcRelationshipConstants';
import type { RelationFooterCounts } from '@/engine/npcRelationship/npcRelationshipPresentation';

type NPCRelationshipFooterProps = {
  counts: RelationFooterCounts;
};

export function NPCRelationshipFooter({ counts }: NPCRelationshipFooterProps) {
  return (
    <div className="border-t border-cyan-900/20 bg-black/20 px-4 py-2.5">
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{NPC_RELATIONSHIP_LABELS.knownCount(counts.total)}</span>
        <div className="flex items-center gap-3">
          {counts.allies > 0 && (
            <span className="flex items-center gap-1 text-emerald-500/70">
              <Shield className="size-2.5" aria-hidden="true" />
              {NPC_RELATIONSHIP_LABELS.alliesCount(counts.allies)}
            </span>
          )}
          {counts.enemies > 0 && (
            <span className="flex items-center gap-1 text-red-500/70">
              <Skull className="size-2.5" aria-hidden="true" />
              {NPC_RELATIONSHIP_LABELS.enemiesCount(counts.enemies)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
