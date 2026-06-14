import { getPoemThemeClass, resolvePoemThemeLabel } from '@/engine/poetryBook/poetryBookPresentation';

export function PoemThemeTag({ theme }: { theme: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${getPoemThemeClass(theme)}`}
    >
      {resolvePoemThemeLabel(theme)}
    </span>
  );
}
