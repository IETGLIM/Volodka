import * as THREE from 'three';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uTint;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float scan = sin(uv.y * 320.0 + uTime * 2.4) * 0.5 + 0.5;
  float tear = sin(uv.y * 90.0 - uTime * 5.1) * 0.012;
  uv.x += tear + sin(uv.y * 48.0 + uTime * 1.7) * 0.006;

  float grid = smoothstep(0.92, 1.0, max(abs(fract(uv.x * 24.0) - 0.5), abs(fract(uv.y * 18.0) - 0.5)) * 2.0);
  vec3 base = vec3(0.02, 0.06, 0.04);
  vec3 neon = uTint * (0.35 + 0.65 * scan);
  vec3 rgbShift = vec3(
    0.08 * sin(uTime * 8.2 + uv.y * 30.0),
    0.04 * sin(uTime * 6.1 + uv.x * 24.0),
    0.12 * cos(uTime * 7.4 + uv.y * 22.0)
  );
  vec3 col = base + neon * (0.22 + 0.55 * grid) + rgbShift;
  float alpha = 0.78 + 0.12 * scan;
  gl_FragColor = vec4(col, alpha);
}
`;

export type GlitchDataPlaneMaterial = THREE.ShaderMaterial;

export function createGlitchDataPlaneMaterial(tintHex = '#22d3ee'): GlitchDataPlaneMaterial {
  const uTint = new THREE.Color(tintHex);
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Vector3(uTint.r, uTint.g, uTint.b) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    toneMapped: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
