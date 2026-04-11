// ============================================
// ISOMORPHIC LAYOUT EFFECT HOOK
// ============================================
// Используйте этот хук вместо useLayoutEffect для SSR-совместимости
// На сервере он работает как useEffect, на клиенте - как useLayoutEffect

import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
