import type { DeviceTier } from '@/hooks/useDeviceTier';
import {
  MATRIX_RAIN_CHARS,
  MATRIX_RAIN_CHARS_PER_COLUMN_MIN,
  MATRIX_RAIN_CHARS_PER_COLUMN_RANGE,
  MATRIX_RAIN_COLUMN_COUNT,
  MATRIX_RAIN_COLUMN_WIDTH_PX,
  MATRIX_RAIN_DELAY_MAX_S,
  MATRIX_RAIN_DURATION_MIN_S,
  MATRIX_RAIN_DURATION_RANGE_S,
} from '@/engine/matrixQuote/matrixQuoteConstants';

export type MatrixColumnSpec = {
  id: number;
  x: number;
  chars: string[];
  duration: number;
  delay: number;
};

const ACT_THEME_COLORS: Record<number, string> = {
  1: '#00ffee',
  2: '#00ff66',
  3: '#ff6644',
  4: '#ffcc00',
  5: '#cc88ff',
  6: '#ff88cc',
  7: '#aaddff',
};

export function getActThemeColor(actNumber: number): string {
  return ACT_THEME_COLORS[actNumber] ?? ACT_THEME_COLORS[1]!;
}

export function getMatrixColumnCount(viewportWidth: number, tier: DeviceTier): number {
  const raw = Math.ceil(viewportWidth / MATRIX_RAIN_COLUMN_WIDTH_PX);
  return Math.min(raw, MATRIX_RAIN_COLUMN_COUNT[tier]);
}

export function buildChapterSubtitle(actNumber: number, chapterTitle: string): string {
  return `Акт ${actNumber} — ${chapterTitle}`;
}

export function buildActFooterLabel(actNumber: number, chapterTitle?: string): string {
  const base = `АКТ ${actNumber}`;
  return chapterTitle ? `${base} · ${chapterTitle.toUpperCase()}` : base;
}

export function buildQuoteAriaLabel(actNumber: number, chapterTitle?: string): string {
  return chapterTitle ? `Акт ${actNumber}: ${chapterTitle}` : `Акт ${actNumber}`;
}

export function buildMatrixColumnSpecs(count: number): MatrixColumnSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: i * MATRIX_RAIN_COLUMN_WIDTH_PX,
    chars: Array.from(
      { length: MATRIX_RAIN_CHARS_PER_COLUMN_MIN + Math.floor(Math.random() * MATRIX_RAIN_CHARS_PER_COLUMN_RANGE) },
      () => MATRIX_RAIN_CHARS[Math.floor(Math.random() * MATRIX_RAIN_CHARS.length)]!,
    ),
    duration: MATRIX_RAIN_DURATION_MIN_S + Math.random() * MATRIX_RAIN_DURATION_RANGE_S,
    delay: Math.random() * MATRIX_RAIN_DELAY_MAX_S,
  }));
}
