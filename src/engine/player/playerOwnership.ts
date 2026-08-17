/**
 * AAA locomotion ownership — one writer per signal per phase.
 *
 * Position (sim):  KCC / RigidBody in pre_physics (main|locked|degraded)
 * Position (read): finalizePlayerFrame in post_physics → livePlayerPositionRef
 * Body yaw:        player locomotion (main|locked) OR Align phase only
 * Look yaw:        FollowCamera → sharedCameraYawRef (independent in TP)
 * Velocity intent: player velocityRef; Approach injects via setPlayerExternalVelocity only
 * Store pos/rot:   scene transitions / cinematics / save — never per-frame gameplay
 */

/** Shared sim/camera/interaction delta clamp (seconds). Prevents hitch desync. */
export const SIM_DELTA_MAX = 0.05;
