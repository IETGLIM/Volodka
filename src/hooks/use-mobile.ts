import * as React from "react"

/** До `lg` в Tailwind и ниже: телефоны в ландшафте (ширина > 768) остаются «мобильными». */
export const MOBILE_BREAKPOINT_PX = 1024

/**
 * Один источник правды для ширины «мобильного» слоя (см. `useMobileVisualPerf`, `useTouchGameControls`).
 * `lg` в Tailwind = 1024px → мобильный диапазон до 1023px включительно.
 */
export const MOBILE_MAX_WIDTH_MEDIA = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)` as const

/**
 * `undefined` до первого `matchMedia` в `useEffect` (после гидрации на клиенте) — не трактовать как «десктоп»,
 * если нужно избежать мигания тач-HUD при SSR/resize: используйте `=== true` / `=== false` или `?? false` только там,
 * где безопасен дефолт «широкий экран» (например капы WebGL).
 */
export function useIsMobile(): boolean | undefined {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const query = MOBILE_MAX_WIDTH_MEDIA
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(window.matchMedia(query).matches)
    }
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return matches
}

/**
 * Показывать тач-панель в 3D (`ExplorationMobileHud`): узкий экран или грубый указатель.
 * Узкая ширина = та же граница, что у `useIsMobile` / `MOBILE_MAX_WIDTH_MEDIA`.
 * Для облегчённых шейдеров без тача см. `useMobileVisualPerf` (+ reduced-motion).
 *
 * `undefined`, пока не известны **и** ширина, **и** `(pointer: coarse)` — не включать тач-HUD по `||` с «ложным» стартом.
 */
export function useTouchGameControls(): boolean | undefined {
  const narrow = useIsMobile()
  const [coarsePointer, setCoarsePointer] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    const sync = () => setCoarsePointer(mql.matches)
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  if (narrow === undefined || coarsePointer === undefined) return undefined
  return narrow || coarsePointer
}
