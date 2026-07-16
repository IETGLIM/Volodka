import { CloudSun, Moon, Sun } from 'lucide-react';

/**
 * Returns a text-shadow CSS value that tints based on time of day.
 * The containing element should apply `transition: text-shadow 1s ease;`.
 */
export function getTimeOfDayShadow(hour: number): string {
  if (hour >= 6 && hour < 10) {
    // Morning: warm amber
    return '0 0 8px rgba(255, 171, 0, 0.30)';
  }
  if (hour >= 10 && hour < 18) {
    // Day: neutral white (no extra shadow)
    return 'none';
  }
  if (hour >= 18 && hour < 22) {
    // Evening: warm orange
    return '0 0 8px rgba(255, 109, 0, 0.30)';
  }
  // Night (22-6): cool cyan
  return '0 0 6px rgba(0, 229, 255, 0.20)';
}

export function TimeIcon({ hour }: { hour: number }) {
  const shadow = getTimeOfDayShadow(hour);

  if (hour >= 6 && hour < 10) {
    return (
      <div style={{ textShadow: shadow, transition: 'text-shadow 1s ease' }}>
        <CloudSun className="size-4 text-amber-400" aria-hidden="true" />
      </div>
    );
  }
  if (hour >= 10 && hour < 18) {
    return (
      <div style={{ textShadow: shadow, transition: 'text-shadow 1s ease' }}>
        <Sun className="size-4 text-amber-300" aria-hidden="true" />
      </div>
    );
  }
  if (hour >= 18 && hour < 21) {
    return (
      <div style={{ textShadow: shadow, transition: 'text-shadow 1s ease' }}>
        <CloudSun className="size-4 text-orange-400" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div style={{ textShadow: shadow, transition: 'text-shadow 1s ease' }}>
      <Moon className="size-4 text-slate-300" aria-hidden="true" />
    </div>
  );
}