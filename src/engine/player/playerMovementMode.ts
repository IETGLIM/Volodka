/** Global player movement backend — read by e2e bridge and dev HUD. */
export type PlayerMovementMode = 'kcc' | 'kcc_degraded' | 'simple';

let movementMode: PlayerMovementMode = 'kcc';

export function setPlayerMovementMode(mode: PlayerMovementMode): void {
  movementMode = mode;
}

export function getPlayerMovementMode(): PlayerMovementMode {
  return movementMode;
}

export function resetPlayerMovementModeForTests(): void {
  movementMode = 'kcc';
}
