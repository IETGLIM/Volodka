import * as React from "react"

/** До `lg` в Tailwind и ниже: телефоны в ландшафте (ширина > 768) остаются «мобильными». */
const MOBILE_BREAKPOINT_PX = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const query = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`
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
 * Показывать тач-панель в 3D: узкий экран или основной ввод — грубый указатель (планшеты, телефоны).
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
