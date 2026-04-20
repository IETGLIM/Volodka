export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
  interact: boolean;
}

export const DEFAULT_PLAYER_CONTROLS: PlayerControls = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  interact: false,
};
