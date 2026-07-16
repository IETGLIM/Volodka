/* ─── Volodka RPG – Enhanced HUD Components Barrel Export ───
 * 
 * New components added in Session 3 (2026-07-17):
 * - ComboCounter: Combat combo display with escalating tiers
 * - SkillRechargeHUD: Skill cooldown tracking
 * - EnvironmentalEffectsOverlay: Weather/time/location effects
 * - DamageFloatSystem: Floating damage numbers
 * 
 * Import individual components:
 *   import { ComboCounter } from './index-enhanced';
 *   import { SkillRechargeHUD } from './index-enhanced';
 */

// Combat feedback components
export { ComboCounter, default as ComboCounterDefault } from './ComboCounter';
export type { ComboCounterProps } from './ComboCounter';

// Skill tracking components  
export { SkillRechargeHUD, default as SkillRechargeHUDDefault } from './SkillRechargeHUD';
export type { SkillSlot, SkillRechargeHUDProps } from './SkillRechargeHUD';

// Environmental effects overlay (default export)
export { EnvironmentalEffectsCSS } from './EnvironmentalEffectsOverlay';
// Note: EnvironmentalEffectsOverlay is a default export, use:
//   import EnvironmentalEffectsOverlay from './EnvironmentalEffectsOverlay';
export type { 
  WeatherType, 
  LocationType, 
  EnvironmentalEffectsOverlayProps 
} from './EnvironmentalEffectsOverlay';

// Floating damage numbers system
export { 
  DamageFloatSystem,
  createDamageEvent,
  createStatusEvent,
  createLevelUpEvent,
  createXPEvent,
  isEventExpired,
  filterActiveEvents,
  DamageEventUtils,
  default as DamageFloatSystemDefault,
} from './DamageFloatSystem';
export type {
  DamageType,
  HitType,
  DamageEvent,
  DamageFloatSystemProps,
} from './DamageFloatSystem';
