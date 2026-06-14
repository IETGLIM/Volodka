import { CloudSun, Moon, Sun } from 'lucide-react';

export function TimeIcon({ hour }: { hour: number }) {
  if (hour >= 6 && hour < 10) return <CloudSun className="size-4 text-amber-400" aria-hidden="true" />;
  if (hour >= 10 && hour < 18) return <Sun className="size-4 text-amber-300" aria-hidden="true" />;
  if (hour >= 18 && hour < 21) return <CloudSun className="size-4 text-orange-400" aria-hidden="true" />;
  return <Moon className="size-4 text-slate-300" aria-hidden="true" />;
}
