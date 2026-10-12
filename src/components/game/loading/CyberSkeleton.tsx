/* v4.48: единственный живой экспорт полутрупа CyberLoadingScreen —
 * лёгкий скелетон загрузки. Перенесён в loading/ (живой пайплайн
 * загрузки), сам CyberLoadingScreen удалён как мёртвый код (0 импортов
 * самого компонента). */

export function CyberSkeleton({
  width = 'w-full',
  height = 'h-4',
  variant = 'default',
}: {
  width?: string;
  height?: string;
  variant?: 'default' | 'rounded' | 'circular' | 'text';
}) {
  const variants = {
    default: 'rounded',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-sm',
  };

  return (
    <div
      className={`skeleton-cyber ${variants[variant]} ${width} ${height}`}
    />
  );
}
