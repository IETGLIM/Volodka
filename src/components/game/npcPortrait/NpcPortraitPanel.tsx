import { memo } from 'react';
import { PortraitPlaceholder } from '@/components/game/npcPortrait/PortraitPlaceholder';
import { useNpcPortrait } from '@/components/game/npcPortrait/useNpcPortrait';
import {
  NPC_PORTRAIT_SIZE_CLASSES,
  type NpcPortraitSize,
} from '@/engine/portrait/npcPortraitConstants';
import { getPortraitFrameStyle } from '@/engine/portrait/npcPortraitPresentation';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import type { NPCAppearance } from '@/shared/types/game';

export type NpcPortraitProps = {
  npcId: string;
  name: string;
  appearance?: NPCAppearance;
  size?: NpcPortraitSize;
  className?: string;
  /** When true, portrait is decorative (dialogue shows the name separately). */
  decorative?: boolean;
};

export const NpcPortrait = memo(function NpcPortrait({
  npcId,
  name,
  appearance,
  size = 'md',
  className,
  decorative = false,
}: NpcPortraitProps) {
  const { colorBlindMode } = useAccessibilitySettings();
  const { imageUrl, initial, resolved } = useNpcPortrait({
    npcId,
    name,
    appearance,
    colorBlindMode,
  });

  const sizeClass = NPC_PORTRAIT_SIZE_CLASSES[size];
  const frameStyle = getPortraitFrameStyle(resolved.glowColor);

  if (!imageUrl) {
    return (
      <PortraitPlaceholder
        initial={initial}
        glowColor={resolved.glowColor}
        name={name}
        sizeClass={sizeClass}
        frameStyle={frameStyle}
        decorative={decorative}
        className={className}
      />
    );
  }

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden border ${className ?? ''}`} style={frameStyle}>
      <img
        src={imageUrl}
        alt={decorative ? '' : name}
        aria-hidden={decorative ? true : undefined}
        role="img"
        loading="lazy"
        decoding="async"
        className="npc-portrait-image h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
});

export type { NpcPortraitSize } from '@/engine/portrait/npcPortraitConstants';
