import { useEffect, useMemo, useState } from 'react';

export function AmbientParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const s = (seed: number) => {
          const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          id: i,
          left: `${(10 + s(i * 7 + 100) * 80).toFixed(1)}%`,
          top: `${(20 + s(i * 11 + 200) * 70).toFixed(1)}%`,
          delay: `${(s(i * 13 + 300) * 6).toFixed(1)}s`,
          duration: `${(4 + s(i * 17 + 400) * 4).toFixed(1)}s`,
          size: `${(1 + s(i * 19 + 500) * 1.5).toFixed(1)}px`,
        };
      }),
    [],
  );

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
