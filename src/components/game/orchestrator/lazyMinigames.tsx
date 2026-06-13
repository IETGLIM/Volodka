import { retryLazyDefault } from '@/shared/utils/retryLazy';

export const LazyCodeBreakerGame = retryLazyDefault(
  () => import('../CodeBreakerGame').then((m) => ({ default: m.CodeBreakerGame })),
  'CodeBreakerGame',
);
export const LazyOpenStackTerminalGame = retryLazyDefault(
  () => import('../OpenStackTerminalGame').then((m) => ({ default: m.OpenStackTerminalGame })),
  'OpenStackTerminalGame',
);
export const LazyBashTerminalGame = retryLazyDefault(
  () => import('../BashTerminalGame').then((m) => ({ default: m.BashTerminalGame })),
  'BashTerminalGame',
);
export const LazyPoetryCompositionGame = retryLazyDefault(
  () => import('../PoetryCompositionGame').then((m) => ({ default: m.PoetryCompositionGame })),
  'PoetryCompositionGame',
);
export const LazyHackingGame = retryLazyDefault(
  () => import('../HackingGame').then((m) => ({ default: m.HackingGame })),
  'HackingGame',
);
export const LazyMemoryPuzzleGame = retryLazyDefault(
  () => import('../MemoryPuzzleGame').then((m) => ({ default: m.MemoryPuzzleGame })),
  'MemoryPuzzleGame',
);
export const LazyQuizGame = retryLazyDefault(
  () => import('../QuizGame').then((m) => ({ default: m.QuizGame })),
  'QuizGame',
);
export const LazyRhythmGame = retryLazyDefault(
  () => import('../RhythmGame').then((m) => ({ default: m.RhythmGame })),
  'RhythmGame',
);
