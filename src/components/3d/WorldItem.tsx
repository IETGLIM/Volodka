import { useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Mesh, Vector3 } from 'three';
import { getLiveCurrentSceneId, getLivePlayerPosition } from '@/store/stores/explorationStore';
import { eventBus } from '@/engine/EventBus';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { getActiveCutsceneId } from '@/store/stores/cutsceneStore';

/** FIX v4.46: потолок дистанции для прямого клика по мешу предмета.
 *  FIX v4.48.13: замер от ИГРОКА, а не от камеры — отведённая назад
 *  third-person-камера раздувала дистанцию до ~2×; и проверка стала
 *  fail-closed: если позиция игрока недоступна, клик отклоняется
 *  (раньше отсутствие замера пропускало взаимодействие с любого расстояния). */
const WORLD_ITEM_MAX_PICKUP_DISTANCE_M = 2.6;

/** Shared scratch — avoids per-click Vector3 allocation. */
const _scratch = new Vector3();
const _scratchPlayer = new Vector3();

/** World item that can be picked up — bobs up and down */
export function WorldItem({
  id,
  position,
  label: _label,
  onPickup,
}: {
  id: string;
  position: [number, number, number];
  label: string;
  onPickup?: (id: string) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const baseY = position[1];
  const time = useRef(0);
  const [picked, setPicked] = useState(false);

  useFrameTick('interaction', ({ delta }) => {
    if (!meshRef.current || picked) return;
    time.current += delta;
    // Bob animation
    meshRef.current.position.y = baseY + Math.sin(time.current * 2) * 0.08;
    // Slow rotation
    meshRef.current.rotation.y += delta * 0.5;
  });

  if (picked) return null;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          // FIX v4.46 («взаимодействие кликом на любом расстоянии», «предметы
          // поднимаются бесконечно»): прямой клик по мешу раньше срабатывал с
          // любого расстояния и в любой фазе игры. Теперь — только из чистого
          // исследования, только рядом с игроком (замер от игрока до предмета,
          // fail-closed), и подбор идёт через штатный object:interact-контроллер,
          // который уважает isOneTime/interactiveObjectStates.
          if (isInteractionLocked()) return;
          if (isCinematicTimelineActive()) return;
          if (getActiveCutsceneId()) return;

          const playerPos = getLivePlayerPosition();
          if (!playerPos) return;
          _scratch.set(position[0], position[1], position[2]);
          if (_scratch.distanceTo(_scratchPlayer.set(playerPos[0], playerPos[1], playerPos[2])) > WORLD_ITEM_MAX_PICKUP_DISTANCE_M) {
            return;
          }

          setPicked(true);
          onPickup?.(id);
          eventBus.emit('object:interact', {
            objectId: id,
            sceneId: getLiveCurrentSceneId(),
          });
        }}
      >
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ffaa44"
          emissive="#ff8800"
          emissiveIntensity={0.55}
        />
      </mesh>
    </group>
  );
}
