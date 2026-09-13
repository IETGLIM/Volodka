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

/**
 * Потолок дельты ИГРОКА (секунды). SIM_DELTA_MAX=0.05 клампит кадр, но на
 * слабом железе (FPS<20) это замедляет игру пропорционально: при 10 FPS
 * реальное время течёт вдвое быстрее игрового — движение/камера ощущаются
 * «замедленными». Игрок потребляет до 0.2 с реального времени за кадр —
 * безопасно, потому что интеграция KCC субшаговая
 * (computeKccMovementSubstepped: ≤MAX_PHYSICS_STEPS × MAX_PHYSICS_DT =
 * 6 × 1/30 = 0.2 с, аккумулирует смещение через rb.setTranslation).
 * Остальные системы (NPC/камера/анимации) остаются на SIM_DELTA_MAX —
 * их экспоненциальные пружины догоняют позицию игрока за кадр.
 */
export const PLAYER_SIM_DELTA_MAX = 0.2;
