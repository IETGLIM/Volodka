/**
 * Heuristic GPU buffer / texture byte estimates for budget tracking.
 * Browsers do not expose actual VRAM — these are conservative CPU-side proxies.
 */

import * as THREE from 'three';

/** Mip chain adds ~33% over base level. */
const MIP_CHAIN_FACTOR = 4 / 3;

const MATERIAL_TEXTURE_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'displacementMap',
  'alphaMap',
  'lightMap',
  'envMap',
] as const;

function bytesPerPixel(format: number, type: number): number {
  if (format === THREE.RedFormat) return type === THREE.FloatType ? 4 : 1;
  if (format === THREE.RGFormat) return type === THREE.FloatType ? 8 : 2;
  if (format === THREE.RGBFormat) return type === THREE.FloatType ? 12 : 3;
  if (format === THREE.RGBAFormat) return type === THREE.FloatType ? 16 : 4;
  if (format === THREE.DepthFormat) return 4;
  return 4;
}

function estimateImageBytes(
  width: number,
  height: number,
  format: number,
  type: number,
  mipmaps: boolean,
): number {
  if (width <= 0 || height <= 0) return 0;
  const base = width * height * bytesPerPixel(format, type);
  return mipmaps ? Math.ceil(base * MIP_CHAIN_FACTOR) : base;
}

export function estimateBufferGeometryBytes(geometry: THREE.BufferGeometry): number {
  let bytes = 0;
  for (const attr of Object.values(geometry.attributes)) {
    if (attr?.array) {
      bytes += attr.array.byteLength;
    }
  }
  if (geometry.index?.array) {
    bytes += geometry.index.array.byteLength;
  }
  if (geometry.morphAttributes) {
    for (const morph of Object.values(geometry.morphAttributes)) {
      for (const attr of morph) {
        if (attr?.array) bytes += attr.array.byteLength;
      }
    }
  }
  return bytes;
}

export function estimateTextureBytes(texture: THREE.Texture): number {
  const image = texture.image as
    | { width?: number; height?: number; videoWidth?: number; videoHeight?: number }
    | undefined;
  if (!image) return 0;

  const width = image.width ?? image.videoWidth ?? 0;
  const height = image.height ?? image.videoHeight ?? 0;
  if (width <= 0 || height <= 0) return 0;

  return estimateImageBytes(
    width,
    height,
    texture.format,
    texture.type,
    texture.generateMipmaps !== false,
  );
}

export function estimateMaterialBytes(material: THREE.Material): number {
  let bytes = 512;
  const record = material as unknown as Record<string, unknown>;
  for (const key of MATERIAL_TEXTURE_KEYS) {
    const texture = record[key];
    if (texture instanceof THREE.Texture) {
      bytes += estimateTextureBytes(texture);
    }
  }
  return bytes;
}

/** Scene mesh VRAM proxy from triangle count (position + normal + uv). */
export function estimateSceneGeometryBytesFromTriangles(triangleCount: number): number {
  if (triangleCount <= 0) return 0;
  const vertices = triangleCount * 3;
  const bytesPerVertex = 12 + 12 + 8;
  return vertices * bytesPerVertex;
}

/** Fallback when texture dimensions are unknown — 512² RGBA + mips. */
export const DEFAULT_TEXTURE_BYTES_ESTIMATE = estimateImageBytes(
  512,
  512,
  THREE.RGBAFormat,
  THREE.UnsignedByteType,
  true,
);
