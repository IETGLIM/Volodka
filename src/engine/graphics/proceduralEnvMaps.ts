/**
 * Baked procedural environment maps for hero scenes — replaces stock drei HDRI
 * with intentional neon-night / warm-apartment lighting response.
 */

import { AmbientLight, BoxGeometry, Color, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PMREMGenerator, PlaneGeometry, PointLight, Scene, Texture, WebGLRenderer } from 'three';

export type HeroEnvKind = 'neon_night' | 'warm_apartment' | 'cool_lobby';

const cache = new Map<string, Texture>();

function buildBakeScene(kind: HeroEnvKind): Scene {
  const scene = new Scene();

  if (kind === 'neon_night') {
    scene.background = new Color('#050510');
    scene.add(new AmbientLight('#1a2038', 0.35));
    scene.add(new HemisphereLight('#334466', '#0a0810', 0.55));

    const panels: Array<{ color: string; pos: [number, number, number]; scale: [number, number, number] }> = [
      { color: '#ff2288', pos: [-4, 1.2, -2], scale: [0.15, 3.5, 6] },
      { color: '#22ffdd', pos: [4.2, 1.0, -1], scale: [0.15, 3.2, 5] },
      { color: '#8844ff', pos: [0, 2.5, -5], scale: [8, 0.2, 0.2] },
      { color: '#ffaa33', pos: [1.5, 0.4, 3], scale: [3, 0.8, 0.12] },
      { color: '#4488ff', pos: [-2, 3.2, 2], scale: [0.2, 0.2, 5] },
    ];
    for (const p of panels) {
      const mesh = new Mesh(
        new BoxGeometry(...p.scale),
        new MeshBasicMaterial({ color: p.color }),
      );
      mesh.position.set(...p.pos);
      scene.add(mesh);
      const light = new PointLight(p.color, 2.2, 18);
      light.position.set(...p.pos);
      scene.add(light);
    }

    // Wet ground bounce plate
    const ground = new Mesh(
      new PlaneGeometry(24, 24),
      new MeshStandardMaterial({
        color: '#12121c',
        roughness: 0.25,
        metalness: 0.55,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    scene.add(ground);
    return scene;
  }

  if (kind === 'warm_apartment') {
    scene.background = new Color('#1a120c');
    scene.add(new AmbientLight('#3a3028', 0.4));
    scene.add(new HemisphereLight('#ffcc88', '#1a1008', 0.7));
    const lamp = new PointLight('#ffaa66', 3.5, 12);
    lamp.position.set(1.2, 1.6, 0.5);
    scene.add(lamp);
    const windowFill = new PointLight('#6688aa', 2.4, 14);
    windowFill.position.set(-2.5, 1.4, 0);
    scene.add(windowFill);
    const monitor = new PointLight('#44ff99', 1.8, 8);
    monitor.position.set(0.8, 1.1, -1.5);
    scene.add(monitor);
    const warmPanel = new Mesh(
      new PlaneGeometry(3.5, 2.2),
      new MeshBasicMaterial({ color: '#ffbb77' }),
    );
    warmPanel.position.set(0, 1.5, -3);
    scene.add(warmPanel);
    return scene;
  }

  // cool_lobby
  scene.background = new Color('#0c1018');
  scene.add(new AmbientLight('#2a3040', 0.45));
  scene.add(new HemisphereLight('#88aacc', '#101018', 0.65));
  const overhead = new PointLight('#ccddee', 2.8, 16);
  overhead.position.set(0, 3.5, 0);
  scene.add(overhead);
  const accent = new PointLight('#66aaff', 1.6, 10);
  accent.position.set(-2, 1.5, 2);
  scene.add(accent);
  return scene;
}

/** Bake a PMREM env map for a hero lighting kind. Cached per renderer identity. */
export function getOrBakeHeroEnvMap(
  gl: WebGLRenderer,
  kind: HeroEnvKind,
): Texture {
  const key = `${kind}:${gl.domElement.width}x${gl.domElement.height}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const pmrem = new PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();
  const bakeScene = buildBakeScene(kind);
  const rt = pmrem.fromScene(bakeScene, 0.04, 0.1, 100);
  const texture = rt.texture;
  cache.set(key, texture);

  // Dispose bake helpers (keep rt.texture alive in cache)
  bakeScene.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
  });
  pmrem.dispose();

  return texture;
}

export function clearHeroEnvMapCache(): void {
  for (const tex of cache.values()) {
    tex.dispose();
  }
  cache.clear();
}

export function resolveHeroEnvKind(sceneId: string): HeroEnvKind | null {
  switch (sceneId) {
    case 'street_night':
    case 'city_square':
    case 'cafe_evening':
      return 'neon_night';
    case 'volodka_room':
    case 'volodka_corridor':
    case 'home_evening':
    case 'solnysh_room':
    case 'zarema_albert_room':
      return 'warm_apartment';
    case 'library_day':
    case 'office_day':
    case 'library_basement':
      return 'cool_lobby';
    default:
      return null;
  }
}
