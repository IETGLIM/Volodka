"use client";

import { useInteractionHintStore } from '@/state/interactionHintStore';

export function InteractionHintOverlay() {
  const { visible, text } = useInteractionHintStore();

  if (!visible) return null;

  return (
    <div
      className={`
        pointer-events-none fixed bottom-24 left-1/2 z-[15] -translate-x-1/2
        rounded-md bg-black/60 px-3 py-1 text-sm text-white backdrop-blur
        transition-opacity duration-150
      `}
    >
      {text}
    </div>
  );
}
