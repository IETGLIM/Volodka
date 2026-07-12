import { BOOT_LINES } from '@/engine/loading/loadingConstants';

function pluralRuPercent(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'процент';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'процента';
  return 'процентов';
}

export function formatPercentRu(value: number): string {
  return `${value} ${pluralRuPercent(value)}`;
}

export function clampLoadingProgress(progress: number | undefined): number | undefined {
  if (progress === undefined) return undefined;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function formatLoadingStatusText(message: string, progress: number | undefined): string {
  if (progress === undefined) return message;
  return `${message}, ${formatPercentRu(progress)}`;
}

export function pickDeterministicIndex(seed: number, length: number): number {
  if (length <= 0) return 0;
  let state = seed >>> 0;
  state ^= state << 13;
  state ^= state >> 17;
  state ^= state << 5;
  return Math.abs(state) % length;
}

/** Deterministic hex dump generator using xorshift32 PRNG. */
export function generateHexDumpLines(seed: number, count: number): string[] {
  let s = seed;
  const next = () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return s >>> 0;
  };
  return Array.from({ length: count }, (_, index) => {
    const addr = (0x7f000000 + index * 0x10).toString(16).padStart(8, '0');
    const hex = Array.from({ length: 16 }, () => (next() % 256).toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from({ length: 16 }, () => String.fromCharCode((next() % 95) + 32)).join('');
    return `${addr}  ${hex}  |${ascii}|`;
  });
}

export function getBootTextDismissMs(): number {
  return BOOT_LINES.length * 60 + 3000;
}

export function getBootLineColor(line: string): string {
  if (line.includes('OK')) return 'rgba(52,211,153,0.5)';
  if (line.includes('██')) return 'rgb(var(--cyber-cyan-rgb) / 0.7)';
  if (line.includes('error') || line.includes('FAIL')) return 'rgba(251,113,133,0.5)';
  return 'rgba(0,255,65,0.3)';
}

export function getBootLineShadow(line: string): string {
  return line.includes('██') ? '0 0 10px rgb(var(--cyber-cyan-rgb) / 0.4)' : 'none';
}
