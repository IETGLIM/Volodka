/**
 * Pillar 4 — AAA surface shader (parallax occlusion, anisotropy, Voronoi wear, dirt/rain).
 * Unity custom surface shader → Three.js ShaderMaterial / onBeforeCompile.
 */

import * as THREE from 'three';
import type { ProceduralAaaParams } from './params';

const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying mat3 vTBN;

attribute vec4 tangent;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);

  vec3 T = normalize(mat3(modelMatrix) * tangent.xyz);
  vec3 B = cross(vNormalW, T) * tangent.w;
  vTBN = mat3(T, B, vNormalW);

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform sampler2D uRough;
uniform sampler2D uMetal;
uniform sampler2D uHeight;
uniform float uParallaxScale;
uniform float uParallaxLayers;
uniform float uAnisotropy;
uniform float uWear;
uniform float uDirt;
uniform float uRainWash;
uniform float uSpectrum; // audio-visual sync flicker
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying mat3 vTBN;

// Hash / FBM / Worley — GLSL mirrors of noise.ts
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += valueNoise(p) * a;
    p *= 2.0;
    a *= 0.5;
  }
  return s;
}

float worley(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float md = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash21(i + g), hash21(i + g + 17.0));
      vec2 r = g + o - f;
      md = min(md, dot(r, r));
    }
  }
  return sqrt(md);
}

/** Parallax occlusion — ray march height field in tangent space. */
vec2 parallaxOcclusion(vec2 uv, vec3 viewTS) {
  float layers = max(4.0, uParallaxLayers);
  float layerDepth = 1.0 / layers;
  float currentDepth = 0.0;
  vec2 delta = viewTS.xy / max(0.1, viewTS.z) * uParallaxScale / layers;
  vec2 cur = uv;
  float h = texture2D(uHeight, cur).r;
  for (int i = 0; i < 32; i++) {
    if (float(i) >= layers) break;
    if (currentDepth >= h) break;
    cur -= delta;
    h = texture2D(uHeight, cur).r;
    currentDepth += layerDepth;
  }
  // Linear refine between last two samples
  vec2 prev = cur + delta;
  float after = h - currentDepth;
  float before = texture2D(uHeight, prev).r - currentDepth + layerDepth;
  float w = after / max(1e-4, after - before);
  return mix(cur, prev, clamp(w, 0.0, 1.0));
}

void main() {
  vec3 viewTS = normalize(transpose(vTBN) * normalize(cameraPosition - vWorldPos));
  // Flip Y for typical view
  viewTS.y *= -1.0;
  vec2 uv = parallaxOcclusion(vUv * 4.0, viewTS);

  vec3 albedo = texture2D(uAlbedo, uv).rgb;
  float rough = texture2D(uRough, uv).r;
  float metal = texture2D(uMetal, uv).r;
  vec3 nTS = texture2D(uNormal, uv).xyz * 2.0 - 1.0;
  vec3 N = normalize(vTBN * nTS);

  // Voronoi wear — «потёртости» по рёбрам (curvature ≈ |dFdx N|+|dFdy N|)
  float curvature = length(fwidth(N)) * 10.0;
  float wearMask = clamp(worley(uv * 7.0) * uWear + curvature * 0.45 + (1.0 - abs(N.y)) * 0.2 * uWear, 0.0, 1.0);
  albedo = mix(albedo, albedo * vec3(1.22, 1.14, 1.06) + vec3(0.04), wearMask * 0.55);
  rough = mix(rough, min(1.0, rough + 0.32), wearMask);

  // Dirt height gradient + rain wash (more visible at defaults)
  float heightGrad = clamp(1.0 - vWorldPos.y * 0.12, 0.0, 1.0);
  float dirt = heightGrad * uDirt * (0.55 + fbm(uv * 3.2) * 0.9);
  albedo = mix(albedo, albedo * vec3(0.32, 0.29, 0.25), dirt * 0.85);
  float wash = uRainWash * (0.35 + (1.0 - heightGrad) * 0.65) * fbm(uv * 5.0 + uTime * 0.02);
  rough = mix(rough, rough * 0.48, wash);
  albedo *= 1.0 - wash * 0.22;
  // Specular wet glints on washed tops
  metal = mix(metal, min(1.0, metal + 0.08), wash * 0.4);

  // Anisotropic metal highlight (Kajiya-Kay-ish along tangent)
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 H = normalize(L + V);
  vec3 T = normalize(vTBN[0]);
  float TdotH = dot(T, H);
  float aniso = pow(sqrt(max(0.0, 1.0 - TdotH * TdotH)), 48.0) * uAnisotropy * metal;

  float ndl = max(0.0, dot(N, L));
  float ndv = max(0.05, dot(N, V));
  // Specular GGX-ish
  float a = max(0.02, rough * rough);
  float a2 = a * a;
  float ndh = max(0.0, dot(N, H));
  float d = a2 / (3.14159 * pow(ndh * ndh * (a2 - 1.0) + 1.0, 2.0));
  vec3 F0 = mix(vec3(0.04), albedo, metal);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(0.0, dot(H, V)), 5.0);
  vec3 spec = d * F * (0.5 + aniso);

  // Spectrum flicker (AnalyserNode → uniform)
  float flicker = 1.0 + uSpectrum * 0.15 * sin(uTime * 12.0 + vWorldPos.x);

  vec3 ambient = albedo * 0.18;
  vec3 diffuse = albedo * (1.0 - metal) * ndl * uLightColor;
  vec3 color = (ambient + diffuse + spec * ndl * uLightColor) * flicker;

  // Cheap tone map
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(1.0 / 2.2));
  gl_FragColor = vec4(color, 1.0);
}
`;

export function createAaaSurfaceMaterial(
  maps: {
    albedo: THREE.Texture;
    normal: THREE.Texture;
    roughness: THREE.Texture;
    metalness: THREE.Texture;
    height: THREE.Texture;
  },
  params: ProceduralAaaParams,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uAlbedo: { value: maps.albedo },
      uNormal: { value: maps.normal },
      uRough: { value: maps.roughness },
      uMetal: { value: maps.metalness },
      uHeight: { value: maps.height },
      uParallaxScale: { value: params.parallaxScale },
      uParallaxLayers: { value: params.parallaxLayers },
      uAnisotropy: { value: params.anisotropyStrength },
      uWear: { value: params.wearAmount },
      uDirt: { value: params.dirtAmount },
      uRainWash: { value: params.rainWash },
      uSpectrum: { value: 0 },
      uLightDir: { value: new THREE.Vector3(0.35, 0.85, 0.25).normalize() },
      uLightColor: { value: new THREE.Color('#c8d0ff') },
      uTime: { value: 0 },
    },
  });
}

export function updateAaaSurfaceFromParams(
  mat: THREE.ShaderMaterial,
  params: ProceduralAaaParams,
): void {
  mat.uniforms.uParallaxScale!.value = params.parallaxScale;
  mat.uniforms.uParallaxLayers!.value = params.parallaxLayers;
  mat.uniforms.uAnisotropy!.value = params.anisotropyStrength;
  mat.uniforms.uWear!.value = params.wearAmount;
  mat.uniforms.uDirt!.value = params.dirtAmount;
  mat.uniforms.uRainWash!.value = params.rainWash;
}

/** Ensure geometry has tangents for TBN / parallax. */
export function ensureTangents(geo: THREE.BufferGeometry): void {
  if (geo.getAttribute('tangent')) return;
  // computeTangents требует index — строим naive fan-index по треугольникам
  if (!geo.getIndex()) {
    const pos = geo.getAttribute('position');
    if (!pos) return;
    const indices = new Uint32Array(pos.count);
    for (let i = 0; i < pos.count; i++) indices[i] = i;
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  try {
    geo.computeTangents();
  } catch {
    // Fallback: synthetic tangents along +X
    const pos = geo.getAttribute('position')!;
    const tangents = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      tangents[i * 4] = 1;
      tangents[i * 4 + 1] = 0;
      tangents[i * 4 + 2] = 0;
      tangents[i * 4 + 3] = 1;
    }
    geo.setAttribute('tangent', new THREE.BufferAttribute(tangents, 4));
  }
}
