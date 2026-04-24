'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SceneVisualConfig } from '@/engine/SceneManager';

/** Сброс состояния при смене URL через remount (`key`) — без setState в эффекте */
const SceneBackgroundPhotoInner = memo(function SceneBackgroundPhotoInner({
  src,
  opacity,
  blend,
}: {
  src: string;
  opacity: number;
  blend: React.CSSProperties['mixBlendMode'];
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <motion.img
      src={src}
      alt=""
      decoding="async"
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? opacity : 0 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
      style={{ mixBlendMode: blend }}
    />
  );
});

/** Фото между градиентом и оверлеями; при ошибке загрузки — не рендерится (остаётся градиент) */
export const SceneBackgroundPhoto = memo(function SceneBackgroundPhoto({
  config,
}: {
  config: SceneVisualConfig;
}) {
  const isMobile = useIsMobile();

  const src = isMobile && config.mobilePhotoUrl ? config.mobilePhotoUrl : config.photoUrl ?? config.mobilePhotoUrl;

  const opacity = Math.min(0.95, Math.max(0.15, config.photoOpacity ?? 0.55));
  const blend = (config.photoBlendMode ?? 'overlay') as React.CSSProperties['mixBlendMode'];

  if (!src) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[0] overflow-hidden">
      <SceneBackgroundPhotoInner key={src} src={src} opacity={opacity} blend={blend} />
    </div>
  );
});
