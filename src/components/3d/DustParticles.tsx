/* ─── Volodka RPG – Environmental Dust Particles ───
 * Ambient floating dust motes in Volodka's room.
 * Thin wrapper around the generic AmbientParticles component.
 */

import { AmbientParticles } from './AmbientParticles';

export function DustParticles() {
  return (
    <AmbientParticles
      count={400}
      boundsX={[-2.4, 2.4]}
      boundsY={[0, 2.8]}
      boundsZ={[-3.3, 3.3]}
      driftSpeed={0.03}
      swayAmp={0.18}
      swayFreq={0.4}
      sizeMin={0.02}
      sizeMax={0.055}
      color="#ffd8a8"
      opacity={0.28}
    />
  );
}