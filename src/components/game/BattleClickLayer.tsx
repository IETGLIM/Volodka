'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { rollStrikeDamage } from '@/lib/combatDamage';

type EnemySlot = { id: string; position: [number, number, number]; hp: number; maxHp: number };

const INITIAL_ENEMIES: EnemySlot[] = [
  { id: 'battle_shard_1', position: [-3.2, 0.55, -5.5], hp: 42, maxHp: 42 },
  { id: 'battle_shard_2', position: [0, 0.55, -6.2], hp: 48, maxHp: 48 },
  { id: 'battle_shard_3', position: [3.2, 0.55, -5.5], hp: 40, maxHp: 40 },
];

interface BattleClickLayerProps {
  /** Слой активен только на сцене боя. */
  active: boolean;
}

const BattleEnemyMesh = memo(function BattleEnemyMesh({
  enemy,
  onHit,
}: {
  enemy: EnemySlot;
  onHit: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const alive = enemy.hp > 0;

  return (
    <group position={enemy.position}>
      <mesh
        userData={{ battleEnemyId: enemy.id }}
        castShadow
        receiveShadow
        onClick={(ev) => {
          ev.stopPropagation();
          if (alive) onHit(enemy.id);
        }}
        onPointerOver={() => {
          if (!alive) return;
          setHovered(true);
          document.body.style.cursor = 'crosshair';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[0.88, 1.08, 0.88]} />
        <meshStandardMaterial
          color={alive ? (hovered ? '#b8455f' : '#8b2942') : '#2d3436'}
          metalness={alive ? 0.18 : 0}
          roughness={alive ? 0.44 : 0.9}
          emissive={alive ? '#3a0a18' : '#000000'}
          emissiveIntensity={alive ? (hovered ? 0.48 : 0.3) : 0}
        />
      </mesh>
      {alive && (
        <Billboard follow position={[0, 1.38, 0]}>
          <Html center style={{ pointerEvents: 'none' }}>
            <div className="rounded border border-red-500/35 bg-black/78 px-2 py-0.5 font-mono text-[10px] text-red-100/95 tabular-nums shadow-md">
              {enemy.hp} / {enemy.maxHp}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
});

/**
 * Прототип боя: клик / тап по цели — урон от навыков; HP-лейбл и hover-эмиссия для читаемости.
 */
export const BattleClickLayer = memo(function BattleClickLayer({ active }: BattleClickLayerProps) {
  const skills = useGameStore((s) => s.playerState.skills);
  const addSkill = useGameStore((s) => s.addSkill);
  const [enemies, setEnemies] = useState(() => INITIAL_ENEMIES.map((e) => ({ ...e })));

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  useEffect(() => {
    if (active) {
      setEnemies(INITIAL_ENEMIES.map((e) => ({ ...e })));
    }
  }, [active]);

  const onHit = useCallback(
    (id: string) => {
      const dmg = rollStrikeDamage(skills);
      setEnemies((prev) => {
        const cur = prev.find((x) => x.id === id);
        if (!cur || cur.hp <= 0) return prev;
        const next = prev.map((e) => (e.id === id ? { ...e, hp: Math.max(0, e.hp - dmg) } : e));
        const alive = next.filter((e) => e.hp > 0).length;
        eventBus.emit('ui:exploration_message', {
          text: `Удар по цели: ${dmg} урона. Осталось врагов: ${alive}.`,
        });
        if (alive === 0) {
          addSkill('logic', 2);
          addSkill('coding', 1);
          eventBus.emit('ui:exploration_message', {
            text: 'Волна снята. Награда прототипа: +2 логики, +1 кодинга.',
          });
        }
        return next;
      });
    },
    [skills, addSkill],
  );

  if (!active) return null;

  return (
    <group>
      {enemies.map((e) => (
        <BattleEnemyMesh key={e.id} enemy={e} onHit={onHit} />
      ))}
    </group>
  );
});
