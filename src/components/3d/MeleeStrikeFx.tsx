/* ─── Volodka RPG – искры опережающего удара (реал-тайм FX) ───
 *                                                              (v4.12.0)
 *
 * Единственный потребитель пула combatHitSparkPool в рантайме (до сих пор
 * пул разминался только тестом): подписка на combat:melee_strike → acquire
 * искры → императивное добавление в группу (без React-состояния на удар) →
 * анимация «вспышка + подъём + растворение» в useFrameTick → release.
 *
 * v4.11.0: удар в спину — фиолетовая (#c084fc) искра КРУПНЕЕ обычной.
 * v4.12.0: промах — серо-белая (#d1d5db) искра МЕНЬШЕ обычной; цвет и
 * размер задаются при КАЖДОМ acquire (resetHitSpark цвет не трогает):
 * иначе стелс-цвет «протекал» бы в обычные удары при переиспользовании
 * мешей пула. Анимация растёт от базового размера искры (baseScale):
 * обычная 0.6 → прежняя траектория 0.6 + t × 2.4 без изменений.
 *
 * Экономика: удары редки (кулдаун 0.9 с), пул 8/16 — бюджет draw calls
 * (battle ≤ 420) не чувствует одну transient-сферу 0.5 с.
 */

import { useEffect, useRef } from 'react';
import { Color, Group, Vector3 } from 'three';
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

/** Базовый цвет искры (пул создаёт мешы с #ff6644). */
const BASE_SPARK_COLOR = new Color('#ff6644');
/** v4.11.0: стелс-фиолетовый удара в спину (рифма с чипом «Мир Снов»). */
const BACKSTAB_SPARK_COLOR = new Color('#c084fc');
/** v4.12.0: серо-белый промаха — сорванный замах почти не заметен. */
const MISS_SPARK_COLOR = new Color('#d1d5db');

/** Базовые размеры искр: обычная 0.6, добивание 1.0, стелс 0.85,
 *  промах 0.4 (v4.12.0 — меньше обычной). */
const BASE_SPARK_SCALE = 0.6;
const FINISHED_SPARK_SCALE = 1.0;
const BACKSTAB_SPARK_SCALE = 0.85;
const MISS_SPARK_SCALE = 0.4;

interface LiveSpark {
  mesh: import('three').Mesh;
  ageS: number;
  /** Размер при acquire — анимация растёт от него (×5 к концу жизни). */
  baseScale: number;
}

const _impact = new Vector3();

/** Императивный спавн одной искры из пула (цвет/размер — на каждый acquire). */
function spawnSpark(
  group: Group,
  live: LiveSpark[],
  x: number,
  y: number,
  z: number,
  color: Color,
  baseScale: number,
  opacity: number,
): void {
  const mesh = acquireCombatHitSpark();
  if (!mesh) return; // пул исчерпан — пропускаем FX без ошибок

  _impact.set(x, y + 0.6, z);
  mesh.position.copy(_impact);
  mesh.scale.setScalar(baseScale);
  const material = mesh.material as import('three').MeshBasicMaterial;
  material.color.copy(color);
  material.opacity = opacity;

  group.add(mesh);
  live.push({ mesh, ageS: 0, baseScale });
  if (live.length > MAX_LIVE_SPARKS) {
    // Перестраховка: самая старая искра уходит немедленно.
    const oldest = live.shift();
    if (oldest) releaseSpark(oldest, group);
  }
}

export function MeleeStrikeFx() {
  const groupRef = useRef<Group>(null);
  const liveRef = useRef<LiveSpark[]>([]);

  useEffect(() => {
    // v4.8.8: добивание читается крупнее — искра ярче и размашистее.
    // v4.11.0: удар в спину — фиолетовая и крупнее обычной; цвет
    // переустанавливается на каждом acquire (пул не сбрасывает его сам).
    // v4.12.0: промах — маленькая серо-белая искра по событию
    // combat:melee_miss (combat:melee_strike при промахе не эмитится).
    const unsubStrike = eventBus.on('combat:melee_strike', ({ x, y, z, finished, backstab }) => {
      const group = groupRef.current;
      if (!group) return;
      const baseScale = finished
        ? FINISHED_SPARK_SCALE
        : backstab
          ? BACKSTAB_SPARK_SCALE
          : BASE_SPARK_SCALE;
      const color = backstab && !finished ? BACKSTAB_SPARK_COLOR : BASE_SPARK_COLOR;
      spawnSpark(group, liveRef.current, x, y, z, color, baseScale, finished ? 1 : 0.9);
    });

    const unsubMiss = eventBus.on('combat:melee_miss', ({ x, y, z }) => {
      const group = groupRef.current;
      if (!group) return;
      spawnSpark(group, liveRef.current, x, y, z, MISS_SPARK_COLOR, MISS_SPARK_SCALE, 0.7);
    });

    return () => {
      unsubStrike();
      unsubMiss();
    };
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

      // Вспышка: рост от базового размера → подъём → растворение
      // (baseScale 0.6 даёт прежнюю траекторию 0.6 + t × 2.4).
      const material = spark.mesh.material as import('three').MeshBasicMaterial;
      spark.mesh.scale.setScalar(spark.baseScale * (1 + t * 4));
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
