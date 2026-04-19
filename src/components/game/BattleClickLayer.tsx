'use client';

import { memo, useCallback, useEffect, useState } from 'react';
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

/**
 * Прототип боя: клик / тап по «врагу» (примитив) — урон от навыков, без анимаций.
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
        <mesh
          key={e.id}
          position={e.position}
          userData={{ battleEnemyId: e.id }}
          castShadow
          onClick={(ev) => {
            ev.stopPropagation();
            onHit(e.id);
          }}
          onPointerOver={() => {
            document.body.style.cursor = e.hp > 0 ? 'crosshair' : 'default';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <boxGeometry args={[0.85, 1.05, 0.85]} />
          <meshStandardMaterial
            color={e.hp > 0 ? '#8b2942' : '#2d3436'}
            roughness={e.hp > 0 ? 0.55 : 0.9}
            emissive={e.hp > 0 ? '#2a0610' : '#000000'}
            emissiveIntensity={e.hp > 0 ? 0.25 : 0}
          />
        </mesh>
      ))}
    </group>
  );
});
