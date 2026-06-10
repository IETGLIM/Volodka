
/* ─── Volodka RPG – Volodka's room procedural 3D visual ─── */

import { useMemo, useRef, useEffect, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { Lamp, Rug, Radiator } from './lazyInteriorModels';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { VolodkaRoomClutter } from './sceneChunks/volodkaRoom';

/* ─── Desk monitor screen textures (Grafana · terminal · Zabbix) ─── */

function seededSeries(count: number, seed: number, min: number, max: number): number[] {
  const out: number[] = [];
  let s = seed % 233280;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(min + (s / 233280) * (max - min));
  }
  return out;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  fill: string,
  seed: number,
): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 4; gx++) {
    ctx.beginPath();
    ctx.moveTo(x + (w / 4) * gx, y);
    ctx.lineTo(x + (w / 4) * gx, y + h);
    ctx.stroke();
  }
  for (let gy = 0; gy <= 3; gy++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / 3) * gy);
    ctx.lineTo(x + w, y + (h / 3) * gy);
    ctx.stroke();
  }
  const pts = seededSeries(16, seed, 0.15, 0.92);
  const px = (i: number) => x + (w / (pts.length - 1)) * i;
  const py = (v: number) => y + h - v * h;
  ctx.beginPath();
  pts.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))));
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  pts.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

function makeScreenCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 176;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function createGrafanaTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeScreenCanvas();
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, 256, 176);
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, 0, 256, 20);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(11, 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cdd6e4';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('GRAFANA · node-01', 22, 14);
  ctx.fillStyle = '#7d8aa0';
  ctx.font = '8px monospace';
  ctx.fillText('CPU usage %', 8, 32);
  drawChart(ctx, 8, 36, 240, 48, '#22d3ee', 'rgba(34,211,238,0.18)', 73);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('63%', 214, 33);
  ctx.fillStyle = '#7d8aa0';
  ctx.font = '8px monospace';
  ctx.fillText('Network I/O', 8, 100);
  drawChart(ctx, 8, 104, 240, 48, '#34d399', 'rgba(52,211,153,0.18)', 191);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('12MB/s', 196, 101);
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, 162, 256, 14);
  ctx.fillStyle = '#34d399';
  ctx.font = '8px monospace';
  ctx.fillText('● live · refresh 5s', 8, 172);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createZabbixTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeScreenCanvas();
  ctx.fillStyle = '#0a0f0a';
  ctx.fillRect(0, 0, 256, 176);
  ctx.fillStyle = '#3a0d0d';
  ctx.fillRect(0, 0, 256, 20);
  ctx.fillStyle = '#e8413a';
  ctx.beginPath();
  ctx.arc(11, 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e6ede6';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('ZABBIX · triggers', 22, 14);
  ctx.fillStyle = '#8aa08a';
  ctx.font = '8px monospace';
  ctx.fillText('Response time (ms)', 8, 32);
  drawChart(ctx, 8, 36, 240, 44, '#f59e0b', 'rgba(245,158,11,0.16)', 53);
  const rows: Array<[string, string, string]> = [
    ['web-01', 'OK', '#34d399'],
    ['db-02', 'PROBLEM', '#e8413a'],
    ['node-7', 'OK', '#34d399'],
    ['disk /', '87%', '#f59e0b'],
  ];
  rows.forEach(([host, status, color], i) => {
    const y = 96 + i * 17;
    ctx.fillStyle = '#0f150f';
    ctx.fillRect(8, y, 240, 14);
    ctx.fillStyle = '#c7d2c7';
    ctx.font = '8px monospace';
    ctx.fillText(host, 14, y + 10);
    ctx.fillStyle = color;
    ctx.font = 'bold 8px monospace';
    ctx.fillText(status, 200, y + 10);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTerminalScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#03110a';
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = '#00ff66';
  ctx.font = '11px monospace';
  const lines = [
    'volodka@neurosys:~$ tail -f /var/log/sys',
    '[14:02:11] INFO  scheduler tick ok',
    '[14:02:12] WARN  latency p99=812ms',
    '[14:02:13] INFO  node-7 heartbeat ok',
    '[14:02:14] ERROR db-02 connection reset',
    '[14:02:14] INFO  retry 1/3 ...',
    '[14:02:15] INFO  retry ok, restored',
    '[14:02:16] INFO  deploy build #4729',
    '[14:02:17] INFO  poem fragment found',
    '[14:02:18] INFO  "Смерть есть лишь",',
    '[14:02:18] INFO  "      начало..."',
    '[14:02:19] WARN  unknown signature',
    '[14:02:20] INFO  rotating logs',
    '[14:02:21] INFO  uptime 412d 06:11',
    'volodka@neurosys:~$ ./watch.sh',
    'monitoring 3 hosts ... press ^C',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 6, 16 + i * 19));
  ctx.fillRect(6, 16 + lines.length * 19, 8, 11);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1.6);
  return tex;
}

interface VolodkaRoomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Procedural 3D room for Volodka's apartment (5×7m) */
export function VolodkaRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: VolodkaRoomVisualProps) {
  // Canvas textures created synchronously via useMemo
  const floorTexture = useCachedCanvasTexture('volodka_room:floor', createFloorTexture);
  const wallTexture = useCachedCanvasTexture('volodka_room:wall', createWallTexture);
  const { lod } = useEnvironmentLod();

  // ── Animated elements refs ──
  const fanGroupRef = useRef<THREE.Group>(null);
  const ledRef = useRef<THREE.MeshStandardMaterial>(null);
  const ledTimeRef = useRef(0);
  const terminalTexRef = useRef<THREE.CanvasTexture | null>(null);
  const zabbixAlertRef = useRef<THREE.MeshStandardMaterial>(null);

  // ── Interactive object animation refs ──
  const roomDoorRef = useRef<THREE.Group>(null);
  const roomWardrobeDoorRef = useRef<THREE.Group>(null);

  const W = 5; // width (x)
  const D = 7; // depth (z)
  const H = 3; // height (y)

  // ── Desk monitor screen textures (Grafana · terminal · Zabbix) ──
  const terminalTexture = useMemo(() => createTerminalScreenTexture(), []);
  const grafanaTexture = useMemo(() => createGrafanaTexture(), []);
  const zabbixTexture = useMemo(() => createZabbixTexture(), []);

  // Sync animated (terminal) texture ref outside of render
  useEffect(() => {
    terminalTexRef.current = terminalTexture;
  }, [terminalTexture]);

  useEffect(() => {
    return () => {
      terminalTexture.dispose();
      grafanaTexture.dispose();
      zabbixTexture.dispose();
    };
  }, [terminalTexture, grafanaTexture, zabbixTexture]);

  // Dispose floor and wall textures on unmount to prevent GPU memory leak
  useEffect(() => {
    const ft = floorTexture;
    const wt = wallTexture;
    return () => {
      ft.dispose();
      wt.dispose();
    };
  }, [floorTexture, wallTexture]);

  // ── Listen for object:interact events to toggle interactive objects ──
  useEffect(() => {
    const unsub = eventBus.on('object:interact', (payload) => {
      if (payload.objectId === 'room_door' || payload.objectId === 'room_wardrobe') {
        useGameStore.getState().toggleInteractiveObject(payload.objectId);
      }
    });
    return unsub;
  }, []);

  // ── Animations via useFrame ──
  useFrameTick('misc', ({ delta }) => {
    // Fan rotation
    if (fanGroupRef.current) {
      fanGroupRef.current.rotation.y += delta * 4.0;
    }

    // LED blink (fast blink ~2Hz, short on duration)
    ledTimeRef.current += delta;
    if (ledRef.current) {
      const phase = (ledTimeRef.current * 2) % 1; // 2 blinks per second
      ledRef.current.emissiveIntensity = phase < 0.15 ? 3.0 : 0.3; // short bright flash
    }

    // Terminal monitor scroll + Zabbix alert blink
    if (terminalTexRef.current) {
      terminalTexRef.current.offset.y += delta * 0.04;
      if (terminalTexRef.current.offset.y > 1.0) {
        terminalTexRef.current.offset.y -= 1.0;
      }
    }
    if (zabbixAlertRef.current) {
      const blink = (ledTimeRef.current * 1.5) % 1;
      zabbixAlertRef.current.emissiveIntensity = blink < 0.5 ? 3.2 : 0.4;
    }

    // Interactive object animations — smooth lerp toward target rotation
    const states = useGameStore.getState().interactiveObjectStates;

    // Room door: swings open (rotation Y from 0 to -PI/2)
    if (roomDoorRef.current) {
      const doorOpen = states['room_door'] ?? false;
      const targetY = doorOpen ? -Math.PI / 2 : 0;
      roomDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        roomDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    // Room wardrobe left door: swings open (rotation Y from 0 to PI/3)
    if (roomWardrobeDoorRef.current) {
      const wardrobeOpen = states['room_wardrobe'] ?? false;
      const targetY = wardrobeOpen ? Math.PI / 3 : 0;
      roomWardrobeDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        roomWardrobeDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }
  });

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#5a4a3a"
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1a1820" roughness={0.95} emissive="#0a0810" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Back Wall (z = -D/2) ── */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Front Wall (z = +D/2) ── */}
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Left Wall (x = -W/2) ── */}
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Right Wall (x = +W/2) ── */}
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERACTIVE ANIMATED OBJECTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Room Door (front wall, swings open) ── */}
      {/* Door frame */}
      <mesh position={[0, 1.1, D / 2 - 0.01]} rotation-y={Math.PI}>
        <boxGeometry args={[1.0, 2.2, 0.06]} />
        <meshStandardMaterial color="#3a2820" roughness={0.85} />
      </mesh>
      {/* Door frame border */}
      <mesh position={[-0.5, 1.1, D / 2 - 0.015]} rotation-y={Math.PI}>
        <boxGeometry args={[0.05, 2.2, 0.08]} />
        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 1.1, D / 2 - 0.015]} rotation-y={Math.PI}>
        <boxGeometry args={[0.05, 2.2, 0.08]} />
        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.2, D / 2 - 0.015]} rotation-y={Math.PI}>
        <boxGeometry args={[1.0, 0.05, 0.08]} />
        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      {/* Animated door panel — pivot on left edge */}
      <group position={[-0.45, 0, D / 2 - 0.03]} ref={roomDoorRef}>
        <mesh position={[0.45, 1.1, 0]}>
          <boxGeometry args={[0.9, 2.15, 0.04]} />
          <meshStandardMaterial color="#5a4030" roughness={0.75} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.78, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Door panel detail — inset rectangle */}
        <mesh position={[0.45, 1.4, 0.025]}>
          <boxGeometry args={[0.5, 0.6, 0.005]} />
          <meshStandardMaterial color="#4a3525" roughness={0.85} />
        </mesh>
        <mesh position={[0.45, 0.7, 0.025]}>
          <boxGeometry args={[0.5, 0.6, 0.005]} />
          <meshStandardMaterial color="#4a3525" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Wardrobe (left wall, near bed) ── */}
      <group position={[-2.2, 0, 2.5]}>
        {/* Wardrobe body */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.8, 2.0, 0.55]} />
          <meshStandardMaterial color="#4a3828" roughness={0.8} />
        </mesh>
        {/* Wardrobe top */}
        <mesh position={[0, 2.01, 0]}>
          <boxGeometry args={[0.84, 0.03, 0.58]} />
          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        {/* Wardrobe shelf */}
        <mesh position={[0, 1.0, 0.01]}>
          <boxGeometry args={[0.76, 0.03, 0.5]} />
          <meshStandardMaterial color="#3a2818" roughness={0.85} />
        </mesh>
        {/* Animated wardrobe left door — pivot on left edge */}
        <group position={[-0.38, 0, 0.28]} ref={roomWardrobeDoorRef}>
          <mesh position={[0.19, 1.0, 0]}>
            <boxGeometry args={[0.38, 1.94, 0.03]} />
            <meshStandardMaterial color="#5a4530" roughness={0.8} />
          </mesh>
          {/* Door handle */}
          <mesh position={[0.32, 1.0, 0.02]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Door panel detail */}
          <mesh position={[0.19, 1.3, 0.02]}>
            <boxGeometry args={[0.24, 0.5, 0.005]} />
            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
          <mesh position={[0.19, 0.65, 0.02]}>
            <boxGeometry args={[0.24, 0.5, 0.005]} />
            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
        </group>
        {/* Wardrobe right door (static) */}
        <mesh position={[0.19, 1.0, 0.295]}>
          <boxGeometry args={[0.38, 1.94, 0.03]} />
          <meshStandardMaterial color="#5a4530" roughness={0.8} />
        </mesh>
        <mesh position={[0.06, 1.0, 0.315]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Desk ── */}
      <group position={[0, 0, -2.5]}>
        {/* Table top */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.05, 0.8]} />
          <meshStandardMaterial color="#4a3a28" roughness={0.7} />
        </mesh>
        {/* Legs */}
        {[[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.375, z]} castShadow>
            <boxGeometry args={[0.04, 0.75, 0.04]} />
            <meshStandardMaterial color="#3a2a18" />
          </mesh>
        ))}
        {/* ── Triple monitor rig: Grafana · terminal · Zabbix ── */}
        {([
          { id: 'grafana', tex: grafanaTexture, x: -0.62, rotY: 0.24 },
          { id: 'terminal', tex: terminalTexture, x: 0, rotY: 0 },
          { id: 'zabbix', tex: zabbixTexture, x: 0.62, rotY: -0.24 },
        ] as const).map(({ id, tex, x, rotY }) => (
          <group key={id} position={[x, 1.12, -0.18]} rotation={[0, rotY, 0]}>
            {/* Bezel */}
            <mesh castShadow>
              <boxGeometry args={[0.54, 0.38, 0.04]} />
              <meshStandardMaterial color="#08080b" roughness={0.4} metalness={0.4} />
            </mesh>
            {/* Screen — unlit map so the dashboards stay crisp and readable */}
            <mesh position={[0, 0, 0.0225]}>
              <planeGeometry args={[0.5, 0.34]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
            {/* Zabbix blinking alert LED */}
            {id === 'zabbix' && (
              <mesh position={[0.205, 0.145, 0.03]}>
                <circleGeometry args={[0.012, 14]} />
                <meshStandardMaterial
                  ref={zabbixAlertRef}
                  color="#e8413a"
                  emissive="#e8413a"
                  emissiveIntensity={2.5}
                  toneMapped={false}
                />
              </mesh>
            )}
            {/* Stand */}
            <mesh position={[0, -0.27, -0.02]}>
              <boxGeometry args={[0.05, 0.16, 0.05]} />
              <meshStandardMaterial color="#15151a" />
            </mesh>
            <mesh position={[0, -0.35, 0]}>
              <boxGeometry args={[0.2, 0.02, 0.12]} />
              <meshStandardMaterial color="#15151a" />
            </mesh>
          </group>
        ))}

        {/* Monitor glow — keeps the room lit (the screens are the primary source) */}
        <pointLight position={[0, 1.25, 0.15]} color="#00ff88" intensity={3.2} distance={9} />
        <pointLight position={[-0.62, 1.1, 0.1]} color="#22d3ee" intensity={1.3} distance={5} />
        <pointLight position={[0.62, 1.1, 0.1]} color="#f59e0b" intensity={1.0} distance={5} />
        {/* Keyboard */}
        <mesh position={[0, 0.78, 0.1]}>
          <boxGeometry args={[0.4, 0.02, 0.15]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#00ff44" emissiveIntensity={0.02} />
        </mesh>
        {/* Keyboard LED indicators */}
        <mesh position={[0.15, 0.795, 0.02]}>
          <boxGeometry args={[0.008, 0.004, 0.008]} />
          <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={3.0} />
        </mesh>
        <mesh position={[0.17, 0.795, 0.02]}>
          <boxGeometry args={[0.008, 0.004, 0.008]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2.0} />
        </mesh>
        {/* Mouse pad */}
        <mesh position={[0.6, 0.775, 0.1]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.25, 0.005, 0.2]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.95} />
        </mesh>
        {/* Mouse */}
        <mesh position={[0.6, 0.79, 0.1]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.02, 0.06]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>
        {/* Coffee mug on desk */}
        <group position={[-0.55, 0.78, -2.2]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.032, 0.028, 0.08, 8]} />
            <meshStandardMaterial color="#6b3a1a" roughness={0.7} />
          </mesh>
          {/* Mug handle */}
          <mesh position={[0.04, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.018, 0.005, 4, 8, Math.PI]} />
            <meshStandardMaterial color="#6b3a1a" roughness={0.7} />
          </mesh>
          {/* Coffee surface */}
          <mesh position={[0, 0.075, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.005, 8]} />
            <meshStandardMaterial color="#2a1508" roughness={0.3} />
          </mesh>
        </group>
        {/* Scattered papers/documents on desk */}
        <mesh position={[0.3, 0.78, -2.15]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.15, 0.003, 0.2]} />
          <meshStandardMaterial color="#e8dcc8" roughness={0.95} />
        </mesh>
        <mesh position={[0.35, 0.785, -2.35]} rotation={[0, -0.2, 0.02]}>
          <boxGeometry args={[0.12, 0.003, 0.18]} />
          <meshStandardMaterial color="#f0e8d8" roughness={0.95} />
        </mesh>
        <mesh position={[-0.2, 0.78, -2.1]} rotation={[0, 0.7, -0.01]}>
          <boxGeometry args={[0.1, 0.003, 0.14]} />
          <meshStandardMaterial color="#ddd4c0" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Chair ── */}
      <group position={[0, 0, -1.5]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#2a2a30" roughness={0.8} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.75, -0.22]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.04]} />
          <meshStandardMaterial color="#2a2a30" roughness={0.8} />
        </mesh>
        {/* Legs */}
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.225, z]}>
            <boxGeometry args={[0.03, 0.45, 0.03]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
      </group>

      {/* ── Bookshelf ── */}
      <group position={[-2.2, 0, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.8, 2.0, 0.35]} />
          <meshStandardMaterial color="#5a4030" roughness={0.8} />
        </mesh>
        {/* Shelf dividers */}
        {[0.5, 1.0, 1.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]}>
            <boxGeometry args={[0.78, 0.03, 0.33]} />
            <meshStandardMaterial color="#4a3525" />
          </mesh>
        ))}
        {/* Books on shelves — multiple thin colored spines per shelf */}
        {/* Shelf 1 (bottom) */}
        {[
          { x: -0.25, w: 0.04, c: '#8b2020' }, { x: -0.18, w: 0.05, c: '#204080' },
          { x: -0.10, w: 0.03, c: '#208020' }, { x: -0.04, w: 0.06, c: '#806020' },
          { x: 0.06, w: 0.04, c: '#602080' }, { x: 0.14, w: 0.05, c: '#804020' },
          { x: 0.22, w: 0.03, c: '#208080' },
        ].map((b, i) => (
          <mesh key={`s1-${i}`} position={[b.x, 0.27, 0.02]}>
            <boxGeometry args={[b.w, 0.2, 0.18]} />
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
        {/* Shelf 2 */}
        {[
          { x: -0.22, w: 0.05, c: '#a03020' }, { x: -0.12, w: 0.04, c: '#304090' },
          { x: -0.04, w: 0.06, c: '#307030' }, { x: 0.08, w: 0.03, c: '#907030' },
          { x: 0.15, w: 0.05, c: '#703090' },
        ].map((b, i) => (
          <mesh key={`s2-${i}`} position={[b.x, 0.77, 0.02]}>
            <boxGeometry args={[b.w, 0.18, 0.18]} />
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
        {/* Shelf 3 */}
        {[
          { x: -0.20, w: 0.04, c: '#b04030' }, { x: -0.10, w: 0.06, c: '#2050a0' },
          { x: 0.02, w: 0.03, c: '#30a040' }, { x: 0.10, w: 0.05, c: '#a08030' },
          { x: 0.18, w: 0.04, c: '#8040a0' }, { x: 0.25, w: 0.03, c: '#30a0a0' },
        ].map((b, i) => (
          <mesh key={`s3-${i}`} position={[b.x, 1.27, 0.02]}>
            <boxGeometry args={[b.w, 0.2, 0.18]} />
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
        {/* Shelf 4 (top) — a few books, leaning */}
        {[
          { x: -0.15, w: 0.05, c: '#c05040', lean: 0.05 },
          { x: -0.05, w: 0.04, c: '#3060b0', lean: -0.08 },
          { x: 0.06, w: 0.06, c: '#40b050', lean: 0.02 },
        ].map((b, i) => (
          <mesh key={`s4-${i}`} position={[b.x, 1.77, 0.02]} rotation={[0, 0, b.lean]}>
            <boxGeometry args={[b.w, 0.18, 0.18]} />
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* ── Bed ── */}
      <group position={[1.8, 0, 2.0]}>
        {/* Mattress */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.0, 0.3, 2.0]} />
          <meshStandardMaterial color="#2a3040" roughness={0.9} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 0.6, -0.95]} castShadow>
          <boxGeometry args={[1.0, 0.5, 0.08]} />
          <meshStandardMaterial color="#3a2a20" roughness={0.8} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.55, -0.7]}>
          <boxGeometry args={[0.5, 0.1, 0.3]} />
          <meshStandardMaterial color="#aaaacc" roughness={0.95} />
        </mesh>
        {/* Blanket */}
        <mesh position={[0, 0.52, 0.2]}>
          <boxGeometry args={[0.9, 0.05, 1.2]} />
          <meshStandardMaterial color="#303050" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Window (right wall, emissive blue — nighttime city glow) ── */}
      <group position={[W / 2 - 0.01, 1.5, -2.0]}>
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[1.2, 1.0]} />
          <meshStandardMaterial
            color="#0a0a30"
            emissive="#4488ee"
            emissiveIntensity={4.0}
            toneMapped={false}
          />
        </mesh>
        {/* Window frame */}
        <mesh rotation-y={-Math.PI / 2} position={[0.01, 0, 0]}>
          <boxGeometry args={[0.05, 1.05, 1.25]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Window blue light spill into room */}
        <pointLight position={[-0.8, 0, 0.5]} color="#4488ee" intensity={3.0} distance={5} />
      </group>

      {/* ── Second Window (back wall, emissive blue — nighttime city) ── */}
      <group position={[-1.0, 1.5, -D / 2 + 0.01]}>
        <mesh>
          <planeGeometry args={[1.0, 1.0]} />
          <meshStandardMaterial
            color="#0a0a30"
            emissive="#3366cc"
            emissiveIntensity={3.5}
            toneMapped={false}
          />
        </mesh>
        {/* Window frame */}
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[1.05, 1.05, 0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Window blue light spill */}
        <pointLight position={[0, 0, 0.8]} color="#3366cc" intensity={2.0} distance={5} />
      </group>

      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING (lazy chunk) ── */}
      <VolodkaRoomClutter lod={lod} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANIMATED DESK ELEMENTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Small desk fan (rotating) ── */}
      <group position={[-0.7, 0.78, -2.3]}>
        {/* Fan base */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.08, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Fan cage (static outer ring) */}
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.003, 4, 16]} />
          <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Rotating fan blades */}
        <group ref={fanGroupRef} position={[0, 0.12, 0.02]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
              <boxGeometry args={[0.06, 0.015, 0.01]} />
              <meshStandardMaterial color="#666666" metalness={0.3} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* Fan hub */}
          <mesh>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 6]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ── PC case with blinking LED ── */}
      <group position={[0.9, 0, -2.8]}>
        {/* Case body */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.2, 0.5, 0.4]} />
          <meshStandardMaterial color="#1a1a1e" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Front panel line */}
        <mesh position={[-0.1, 0.25, 0]}>
          <boxGeometry args={[0.002, 0.45, 0.35]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
        {/* Blinking power LED */}
        <mesh position={[-0.101, 0.42, 0.12]}>
          <sphereGeometry args={[0.005, 4, 4]} />
          <meshStandardMaterial
            ref={ledRef}
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={3.0}
          />
        </mesh>
        {/* HDD activity LED */}
        <mesh position={[-0.101, 0.42, 0.08]}>
          <sphereGeometry args={[0.004, 4, 4]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={1.5} />
        </mesh>
        {/* Ventilation grill lines */}
        {[0.05, 0.1, 0.15, 0.2].map((y, i) => (
          <mesh key={`vent-${i}`} position={[-0.101, y, -0.05]}>
            <boxGeometry args={[0.002, 0.008, 0.15]} />
            <meshStandardMaterial color="#2a2a2e" />
          </mesh>
        ))}
      </group>

      {/* ── Desk lamp — warm accent light (NOT primary — monitor is primary) ── */}
      <pointLight
        position={[0.3, 1.5, -2.3]}
        color="#ffcc88"
        intensity={2.5}
        distance={8}
        castShadow={false}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-bias={-0.003}
        shadow-normalBias={0.04}
      />

      {/* ── Subtle warm fill near bed area ── */}
      <pointLight
        position={[-1.5, 1.8, 2.5]}
        color="#8877aa"
        intensity={0.8}
        distance={4}
      />

      {/* ── Ceiling ambient glow panel (dim — noir apartment) ── */}
      <mesh position={[0, H - 0.02, -1]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[1.0, 0.4]} />
        <meshStandardMaterial color="#151515" emissive="#ffcc88" emissiveIntensity={0.2} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL ROOM DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Posters on back wall ── */}
      <group position={[-1.0, 1.8, -D / 2 + 0.02]}>
        {/* Poster 1 — dark with neon accent */}
        <mesh>
          <boxGeometry args={[0.5, 0.7, 0.005]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
        </mesh>
        {/* Poster design — colored rectangles */}
        <mesh position={[0, 0.1, 0.004]}>
          <boxGeometry args={[0.35, 0.15, 0.002]} />
          <meshStandardMaterial color="#001133" emissive="#0088ff" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0, -0.1, 0.004]}>
          <boxGeometry args={[0.3, 0.1, 0.002]} />
          <meshStandardMaterial color="#110033" emissive="#aa44ff" emissiveIntensity={0.6} />
        </mesh>
      </group>

      <group position={[1.5, 1.6, -D / 2 + 0.02]}>
        {/* Poster 2 — punk band poster */}
        <mesh>
          <boxGeometry args={[0.45, 0.6, 0.005]} />
          <meshStandardMaterial color="#2a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.08, 0.004]}>
          <boxGeometry args={[0.3, 0.12, 0.002]} />
          <meshStandardMaterial color="#1a0000" emissive="#ff2244" emissiveIntensity={0.8} />
        </mesh>
        {/* Tape on corners */}
        <mesh position={[-0.2, 0.28, 0.005]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.06, 0.02, 0.001]} />
          <meshStandardMaterial color="#c8c0a0" roughness={0.9} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.2, -0.28, 0.005]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.06, 0.02, 0.001]} />
          <meshStandardMaterial color="#c8c0a0" roughness={0.9} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ── Headphones on desk ── */}
      <group position={[0.5, 0.78, -2.6]}>
        {/* Headband */}
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.005, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>
        {/* Left ear cup */}
        <mesh position={[-0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
        {/* Right ear cup */}
        <mesh position={[0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
        {/* Cable */}
        <mesh position={[0, -0.04, 0.15]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.3, 4]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Laundry pile on floor near bed ── */}
      <group position={[1.5, 0, 3.5]}>
        {/* T-shirt shape */}
        <mesh position={[0, 0.05, 0]} rotation={[0.2, 0.5, 0.1]}>
          <boxGeometry args={[0.3, 0.06, 0.25]} />
          <meshStandardMaterial color="#3a4a5a" roughness={0.95} />
        </mesh>
        {/* Jeans */}
        <mesh position={[0.15, 0.03, 0.1]} rotation={[0, -0.3, 0.15]}>
          <boxGeometry args={[0.25, 0.04, 0.12]} />
          <meshStandardMaterial color="#1a2a4a" roughness={0.9} />
        </mesh>
        {/* Sock */}
        <mesh position={[-0.1, 0.02, 0.15]} rotation={[0.5, 0.8, 0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.12, 4]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Nightstand beside bed ── */}
      <group position={[2.2, 0, 2.0]}>
        {/* Nightstand body */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.4, 0.5, 0.35]} />
          <meshStandardMaterial color="#4a3828" roughness={0.8} />
        </mesh>
        {/* Drawer */}
        <mesh position={[0, 0.3, 0.18]}>
          <boxGeometry args={[0.36, 0.18, 0.02]} />
          <meshStandardMaterial color="#5a4535" roughness={0.8} />
        </mesh>
        {/* Drawer handle */}
        <mesh position={[0, 0.3, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.1, 4]} />
          <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Phone on nightstand */}
        <mesh position={[0, 0.52, 0.05]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.07, 0.008, 0.14]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Phone screen */}
        <mesh position={[0, 0.525, 0.05]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.003, 0.12]} />
          <meshStandardMaterial color="#001122" emissive="#3355aa" emissiveIntensity={0.5} />
        </mesh>
        {/* Charging cable */}
        <mesh position={[0.05, 0.51, -0.05]} rotation={[0.8, 0.2, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.3, 4]} />
          <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
        {/* Water glass on nightstand */}
        <mesh position={[-0.1, 0.56, -0.05]}>
          <cylinderGeometry args={[0.025, 0.02, 0.08, 8]} />
          <meshStandardMaterial color="#c0d0e0" transparent opacity={0.4} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Slippers on floor near bed ── */}
      <mesh position={[1.3, 0.015, 3.0]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.08, 0.03, 0.18]} />
        <meshStandardMaterial color="#5a4050" roughness={0.95} />
      </mesh>
      <mesh position={[1.5, 0.015, 2.9]} rotation={[0, -0.15, 0.05]}>
        <boxGeometry args={[0.08, 0.03, 0.18]} />
        <meshStandardMaterial color="#5a4050" roughness={0.95} />
      </mesh>

      {/* ── Window with city view detail (right wall) ── */}
      <group position={[W / 2 - 0.01, 1.5, -2.0]}>
        {/* City building silhouettes through window */}
        <mesh rotation-y={-Math.PI / 2} position={[-0.01, -0.15, -0.3]}>
          <planeGeometry args={[0.12, 0.25]} />
          <meshStandardMaterial color="#0a0a20" emissive="#1a1a30" emissiveIntensity={1.5} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[-0.01, -0.1, 0.2]}>
          <planeGeometry args={[0.08, 0.35]} />
          <meshStandardMaterial color="#0a0a20" emissive="#1a1a30" emissiveIntensity={1.5} />
        </mesh>
        {/* Tiny window lights on buildings */}
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.2, -0.3]}>
          <planeGeometry args={[0.02, 0.02]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={3.0} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.05, 0.2]}>
          <planeGeometry args={[0.02, 0.02]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={3.0} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.12, 0.22]}>
          <planeGeometry args={[0.015, 0.015]} />
          <meshStandardMaterial color="#aaccff" emissive="#aaccff" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ── Backpack on floor near door ── */}
      <group position={[-1.5, 0, 2.8]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
          <meshStandardMaterial color="#2a3a2a" roughness={0.9} />
        </mesh>
        {/* Straps */}
        <mesh position={[-0.08, 0.25, 0.08]}>
          <boxGeometry args={[0.03, 0.3, 0.01]} />
          <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
        </mesh>
        <mesh position={[0.08, 0.25, 0.08]}>
          <boxGeometry args={[0.03, 0.3, 0.01]} />
          <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
        </mesh>
        {/* Zipper */}
        <mesh position={[0, 0.35, 0.08]}>
          <boxGeometry args={[0.15, 0.005, 0.005]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Poster on left wall ── */}
      <group position={[-W / 2 + 0.02, 1.6, -1.0]} rotation-y={Math.PI / 2}>
        <mesh>
          <boxGeometry args={[0.6, 0.8, 0.005]} />
          <meshStandardMaterial color="#1a2a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0.004]}>
          <boxGeometry args={[0.4, 0.2, 0.002]} />
          <meshStandardMaterial color="#002200" emissive="#00ff44" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Desk Lamp on nightstand ── */}
      <Lamp position={[2.0, 0.5, 2.2]} scale={[0.6, 0.6, 0.6]} />

      {/* ── Rug on floor near bed ── */}
      <Rug position={[1.8, 0.002, 2.0]} scale={[0.8, 1, 0.7]} color="#2a2840" />

      {/* ── Radiator on left wall near bed ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 1.5]} rotation={[0, Math.PI / 2, 0]} color="#a0a0a0" />
    </group>
  );
}

/* ─── Canvas Texture Helpers ─── */

function createFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Brighter wood base
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(0, 0, size, size);

  // Wood plank lines
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Subtle grain
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = Math.random() > 0.5 ? '#4a3a2a' : '#2a1a0a';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  return tex;
}

function createWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Brighter wall base
  ctx.fillStyle = '#4a4050';
  ctx.fillRect(0, 0, size, size);

  // Subtle plaster variation
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 10;
    ctx.fillStyle = Math.random() > 0.5 ? '#5a5058' : '#3a3038';
    ctx.fillRect(x, y, r, r);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}
