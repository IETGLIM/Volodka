/* ─── Poem definitions ─── */

export interface Poem {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly lines: string[];
  readonly themes: string[];
  readonly unlocksAt: string;
  readonly order: number;
  readonly intro?: string;
  readonly subtitle?: string;
  readonly bonus?: boolean;
}
