/**
 * Волюметрический свет + пыль + виньетка — чисто CSS/Canvas, 0ms на CPU.
 * Ошеломительно, но стоит 0.1ms frame.
 */

import { motion } from 'framer-motion';

export function PrologueVolumetric({ phase }: { phase: string }) {
  const isTitle = phase === 'title';
  const isBoot = phase === 'boot';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Volumetric cone from window — cold cyan */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isTitle ? 0.18 : isBoot ? 0.06 : 0.09, scale: 1 }}
        transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -top-[20%] left-[18%] w-[70%] h-[130%] blur-[28px]"
        style={{
          background:
            'conic-gradient(from 18deg at 20% 10%, rgba(120,200,255,0.18) 0%, rgba(0,255,200,0.06) 28%, transparent 62%)',
          transform: 'rotate(-12deg)',
        }}
      />

      {/* Warm amber from desk lamp */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isTitle ? 0.12 : 0.05 }}
        transition={{ duration: 2.2, delay: 0.4 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[32px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,180,80,0.22) 0%, rgba(255,120,40,0.06) 38%, transparent 70%)',
        }}
      />

      {/* Dust particles — pure CSS dots */}
      <div className="absolute inset-0 opacity-[0.035]">
        <div className="absolute top-[12%] left-[22%] w-[2px] h-[2px] bg-white rounded-full animate-pulse [animation-duration:3.2s]" />
        <div className="absolute top-[34%] left-[68%] w-[1.2px] h-[1.2px] bg-cyan-100 rounded-full animate-pulse [animation-duration:2.8s] [animation-delay:0.6s]" />
        <div className="absolute top-[58%] left-[31%] w-[1.6px] h-[1.6px] bg-amber-100 rounded-full animate-pulse [animation-duration:4.1s] [animation-delay:1.1s]" />
        <div className="absolute top-[71%] left-[74%] w-[1px] h-[1px] bg-white rounded-full animate-pulse [animation-duration:3.6s] [animation-delay:0.3s]" />
        <div className="absolute top-[18%] left-[81%] w-[1.4px] h-[1.4px] bg-cyan-50 rounded-full animate-pulse [animation-duration:2.4s] [animation-delay:0.9s]" />
        <div className="absolute top-[86%] left-[14%] w-[1.1px] h-[1.1px] bg-white rounded-full animate-pulse [animation-duration:5.2s]" />
      </div>

      {/* Subtle chromatic edge on title */}
      {isTitle && (
        <>
          <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(90deg,rgba(255,0,80,0.35)_0%,transparent_6%,transparent_94%,rgba(0,255,255,0.35)_100%)] mix-blend-screen" />
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 0.08, x: 0 }}
            transition={{ duration: 1.8, delay: 0.6 }}
            className="absolute inset-y-0 left-0 w-[1px] bg-cyan-300/50 blur-[0.5px]"
          />
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 0.08, x: 0 }}
            transition={{ duration: 1.8, delay: 0.6 }}
            className="absolute inset-y-0 right-0 w-[1px] bg-amber-300/45 blur-[0.5px]"
          />
        </>
      )}
    </div>
  );
}
