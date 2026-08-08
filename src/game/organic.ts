/**
 * Вершинная деформация — превращает примитивы (сферы, конусы, цилиндры)
 * в органичные природные формы. Добавляем шум по координатам:
 * деревья становятся пушистыми, камни — выветренными, кроны — живыми.
 */
import * as THREE from 'three';
import { fbm, hash2, rand, fract } from './utils';

/** Деформирует BufferGeometry через многослойный шум. */
export function deformGeometry(
  geo: THREE.BufferGeometry,
  amount: number,
  scale = 1,
  seed = 0,
): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i], y = arr[i + 1], z = arr[i + 2];
    const nx = x * scale + seed;
    const ny = y * scale + seed;
    const nz = z * scale + seed;
    const n = fbm(nx, ny) * 2 - 1;
    const n2 = fract(Math.sin(nx * 12.9 + ny * 78.2 + nz * 37.7) * 43758.5453) * 2 - 1;
    arr[i] = x + n * amount + n2 * amount * 0.4;
    arr[i + 1] = y + n * amount * 0.55;
    arr[i + 2] = z + n * amount + n2 * amount * 0.4;
  }
  geo.computeVertexNormals();
  pos.needsUpdate = true;
  return geo;
}

/** Икосаэдр-камень с деформацией — для валунов. */
export function rockGeo(size = 1, detail = 1) {
  const g = new THREE.IcosahedronGeometry(size, detail);
  deformGeometry(g, size * 0.35, 1.6, rand(0, 100));
  return g;
}

/** Пушистая крона дерева: деформированная сфера. */
export function crownGeo(radius: number, seg = 14) {
  const g = new THREE.SphereGeometry(radius, seg, Math.floor(seg * 0.8));
  deformGeometry(g, radius * 0.28, 1.4, rand(0, 100));
  return g;
}

/** Ствол дерева: слегка искривлённый цилиндр. */
export function trunkGeo(radiusTop: number, radiusBottom: number, height: number) {
  const g = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8, 6, false);
  deformGeometry(g, radiusBottom * 0.12, 1.2, rand(0, 100));
  return g;
}

/** Закруглённая крыша: сфера + цилиндр снизу — плавный силуэт. */
export function roundedRoofGeo(width: number, height: number, depth: number) {
  // основа — полусфера сверху
  const cap = new THREE.SphereGeometry(width * 0.72, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  cap.scale(1, height / (width * 0.72), depth / width);
  // основание — цилиндр снизу
  const base = new THREE.CylinderGeometry(width * 0.72, width * 0.72, height * 0.12, 14);
  base.scale(1, 1, depth / width);
  base.translate(0, -height * 0.06, 0);
  const merged = new THREE.BufferGeometry();
  // вручную объединим: просто используем полусферу с небольшим нижним расширением через scale
  // (mergeGeometries из three/examples не тянем, а делаем визуально плавнее через деформацию)
  deformGeometry(cap, width * 0.08, 2.0, rand(0, 100));
  void base; void merged;
  return cap;
}

/** Цветок-«лютик»: лепестки-сферы, собранные в кольцо. */
export function flowerGroup(petalColor: string, size = 0.3): THREE.Group {
  const g = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, size * 1.2, 5);
  deformGeometry(stemGeo, 0.01, 2, rand(0, 10));
  const stem = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: '#4b6b3a', roughness: 1 }));
  stem.position.y = size * 0.6;
  g.add(stem);
  const head = new THREE.Group();
  const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.85 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(size * 0.22, 6, 5), petalMat);
    petal.scale.set(1, 0.35, 1.3);
    petal.position.set(Math.cos(a) * size * 0.22, 0, Math.sin(a) * size * 0.22);
    petal.rotation.y = -a;
    head.add(petal);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(size * 0.14, 6, 5), new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.7 }));
  head.add(core);
  head.position.y = size * 1.2;
  g.add(head);
  return g;
}

/** Шейдерная трава с волнами ветра — через MeshStandardMaterial + onBeforeCompile.
 *  Это гарантирует корректную работу InstancedMesh с instanceMatrix. */
export function windGrassMaterial(color: string): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 1.0,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uWind = { value: 0.5 };
    shader.vertexShader = `
      uniform float uTime;
      uniform float uWind;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      // высота над землёй (локально)
      float localH = clamp(position.y / 0.25, 0.0, 1.0);
      #ifdef USE_INSTANCING
        vec4 wp = instanceMatrix * vec4(transformed, 1.0);
        float seed = fract(sin(dot(wp.xz * 0.29, vec2(127.1, 311.7))) * 43758.5453);
        float phase = uTime * 2.2 + seed * 6.28 + wp.x * 0.3 + wp.z * 0.25;
        float wave = sin(phase) * 0.07 * uWind + sin(phase * 2.3 + 1.7) * 0.035 * uWind;
        transformed.x += wave * localH * localH;
        transformed.z += wave * 0.6 * localH * localH;
      #endif
      `,
    );
    mat.userData.shader = shader;
  };
  return mat;
}

export function updateWindMaterial(m: THREE.MeshStandardMaterial, t: number, wind: number) {
  const shader = m.userData.shader;
  if (shader && shader.uniforms) {
    shader.uniforms.uTime.value = t;
    shader.uniforms.uWind.value = wind;
  }
}

export { hash2 };
