export type InteractionCandidate = {
  id: string;
  distance: number;
};

export function resolveNearest(candidates: InteractionCandidate[]): InteractionCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => a.distance - b.distance)[0] ?? null;
}
