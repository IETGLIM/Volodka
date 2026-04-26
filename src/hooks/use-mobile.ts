import * as React from "react"

/** До `lg` в Tailwind и ниже: телефоны в ландшафте (ширина > 768) остаются «мобильными». */
export const MOBILE_BREAKPOINT_PX = 1024

/**
 * Один источник правды для ширины «мобильного» слоя (см. `useMobileVisualPerf`, `useTouchGameControls`).
 * `lg` в Tailwind = 1024px → мобильный диапазон до 1023px включительно.
 */
export const MOBILE_MAX_WIDTH_MEDIA = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)` as const

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const query = MOBILE_MAX_WIDTH_MEDIA
    const mql = window.matchMedia(query)
    const onChange = () => {
      setIsMobile(window.matchMedia(query).matches)
    }
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}

/**
 * Показывать тач-панель в 3D (`ExplorationMobileHud`): узкий экран или грубый указатель.
 * Узкая ширина = та же граница, что у `useIsMobile` / `MOBILE_MAX_WIDTH_MEDIA`.
 * Для облегчённых шейдеров без тача см. `useMobileVisualPerf` (+ reduced-motion).
 */
export function useTouchGameControls(): boolean {
  const narrow = useIsMobile()
  const [coarsePointer, setCoarsePointer] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    const sync = () => setCoarsePointer(mql.matches)
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  return narrow || coarsePointer
}
