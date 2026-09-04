/* ─── Volodka RPG – искры опережающего удара (реал-тайм FX) ───
 *                                                              (v4.8.7)
 *
 * Единственный потребитель пула combatHitSparkPool в рантайме (до сих пор
 * пул разминался только тестом): подписка на combat:melee_strike → acquire
 * искры → императивное добавление в группу (без React-состояния на удар) →
 * анимация «вспышка + подъём + растворение» в useFrameTick → release.
 *
 * Экономика: удары редки (кулдаун 0.9 с), пул 8/16 — бюджет draw calls
 * (battle ≤ 420) не чувствует одну transient-сферу 0.5 с.
 */

import { useEffect, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { eventBus } from '@/engine/EventBus';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  acquireCombatHitSpark,
  releaseCombatHitSpark,
} from '@/engine/combat/combatTransientPool';

/** Длительность жизни одной искры (сек). */
const SPARK_LIFETIME_S = 0.45;
/** Одновременно анимируемых искр (кулдаун удара 0.9 с > 2 × lifetime). */
const MAX_LIVE_SPARKS = 3;

interface LiveSpark {
  mesh: import('three').Mesh;
  ageS: number;
}

const _impact = new Vector3();

export function MeleeStrikeFx() {
  const groupRef = useRef<Group>(null);
  const liveRef = useRef<LiveSpark[]>([]);

  useEffect(() => {
    // v4.8.8: добивание читается крупнее — искра ярче и размашистее.
    const unsub = eventBus.on('combat:melee_strike', ({ x, y, z, finished }) => {
      const group = groupRef.current;
      if (!group) return;
      const mesh = acquireCombatHitSpark();
      if (!mesh) return; // пул исчерпан — пропускаем FX без ошибок

      _impact.set(x, y + 0.6, z);
      mesh.position.copy(_impact);
      mesh.scale.setScalar(finished ? 1.0 : 0.6);
      const material = mesh.material as import('three').MeshBasicMaterial;
      material.opacity = finished ? 1 : 0.9;

      group.add(mesh);
      liveRef.current.push({ mesh, ageS: 0 });
      if (liveRef.current.length > MAX_LIVE_SPARKS) {
        // Перестраховка: самая старая искра уходит немедленно.
        const oldest = liveRef.current.shift();
        if (oldest) releaseSpark(oldest, group);
      }
    });
    return unsub;
  }, []);

  useFrameTick('misc', ({ delta }) => {
    const group = groupRef.current;
    const live = liveRef.current;
    if (!group || live.length === 0) return;

    for (let i = live.length - 1; i >= 0; i--) {
      const spark = live[i]!;
      spark.ageS += delta;
      const t = spark.ageS / SPARK_LIFETIME_S;

      if (t >= 1) {
        live.splice(i, 1);
        releaseSpark(spark, group);
        continue;
      }

      // Вспышка: быстрый рост → подъём → растворение.
      const material = spark.mesh.material as import('three').MeshBasicMaterial;
      spark.mesh.scale.setScalar(0.6 + t * 2.4);
      spark.mesh.position.y += delta * 0.8;
      material.opacity = 0.9 * (1 - t) * (1 - t);
    }
  });

  return <group ref={groupRef} />;
}

function releaseSpark(spark: LiveSpark, group: Group): void {
  try {
    group.remove(spark.mesh);
  } catch {
    /* группа уже размонтирована */
  }
  releaseCombatHitSpark(spark.mesh);
}
