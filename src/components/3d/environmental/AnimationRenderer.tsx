import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { LightFlickerAnim } from './lightFlickerAnim';
import { MonitorScanAnim } from './monitorScanAnim';
import { CurtainSwayAnim } from './curtainSwayAnim';
import { SteamRiseAnim } from './steamRiseAnim';
import { NeonPulseAnim } from './neonPulseAnim';
import { DripAnim } from './dripAnim';
import { FanSpinAnim } from './fanSpinAnim';
import { NeonFlickerAnim } from './neonFlickerAnim';
import { CRTMonitorAnim } from './crtMonitorAnim';
import { LampSwayAnim } from './lampSwayAnim';
import { RadiatorSteamAnim } from './radiatorSteamAnim';

export function AnimationRenderer({ anim }: { anim: EnvAnimation }) {
  switch (anim.type) {
    case 'light_flicker':
      return <LightFlickerAnim anim={anim} />;
    case 'monitor_scan':
      return <MonitorScanAnim anim={anim} />;
    case 'curtain_sway':
      return <CurtainSwayAnim anim={anim} />;
    case 'steam_rise':
      return <SteamRiseAnim anim={anim} />;
    case 'neon_pulse':
      return <NeonPulseAnim anim={anim} />;
    case 'drip':
      return <DripAnim anim={anim} />;
    case 'fan_spin':
      return <FanSpinAnim anim={anim} />;
    case 'neon_flicker':
      return <NeonFlickerAnim anim={anim} />;
    case 'crt_monitor':
      return <CRTMonitorAnim anim={anim} />;
    case 'lamp_sway':
      return <LampSwayAnim anim={anim} />;
    case 'radiator_steam':
      return <RadiatorSteamAnim anim={anim} />;
    default: {
      const _exhaustive: never = anim.type;
      return _exhaustive;
    }
  }
}

export { LightFlickerAnim } from './lightFlickerAnim';
export { MonitorScanAnim } from './monitorScanAnim';
export { CurtainSwayAnim } from './curtainSwayAnim';
export { SteamRiseAnim } from './steamRiseAnim';
export { NeonPulseAnim } from './neonPulseAnim';
export { DripAnim } from './dripAnim';
export { FanSpinAnim } from './fanSpinAnim';
export { NeonFlickerAnim } from './neonFlickerAnim';
export { CRTMonitorAnim } from './crtMonitorAnim';
export { LampSwayAnim } from './lampSwayAnim';
export { RadiatorSteamAnim } from './radiatorSteamAnim';
