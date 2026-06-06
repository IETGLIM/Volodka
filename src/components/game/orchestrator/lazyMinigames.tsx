import { lazy } from 'react';

export const LazyCodeBreakerGame = lazy(() => import('../CodeBreakerGame').then((m) => ({ default: m.CodeBreakerGame })));
export const LazyOpenStackTerminalGame = lazy(() => import('../OpenStackTerminalGame').then((m) => ({ default: m.OpenStackTerminalGame })));
export const LazyBashTerminalGame = lazy(() => import('../BashTerminalGame').then((m) => ({ default: m.BashTerminalGame })));
export const LazyPoetryCompositionGame = lazy(() => import('../PoetryCompositionGame').then((m) => ({ default: m.PoetryCompositionGame })));
export const LazyHackingGame = lazy(() => import('../HackingGame').then((m) => ({ default: m.HackingGame })));
export const LazyMemoryPuzzleGame = lazy(() => import('../MemoryPuzzleGame').then((m) => ({ default: m.MemoryPuzzleGame })));
export const LazyQuizGame = lazy(() => import('../QuizGame').then((m) => ({ default: m.QuizGame })));
export const LazyRhythmGame = lazy(() => import('../RhythmGame').then((m) => ({ default: m.RhythmGame })));
