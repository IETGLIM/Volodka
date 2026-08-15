import { Material, MeshStandardMaterial, MeshStandardMaterialParameters } from 'three';

export interface AnimatedTerrainMaterialUniforms {
  uAnimTime: { value: number };
  uAnimTimeScale: { value: number };
}

export interface AnimatedTerrainMaterial extends MeshStandardMaterial {
  userData: MeshStandardMaterial['userData'] & {
    animUniforms: AnimatedTerrainMaterialUniforms;
  };
}

/** CPU mirror of the GPU wave displacement — visual-only; static heightmap used for gameplay. */
export function computeAnimatedTerrainWaveOffset(
  x: number,
  z: number,
  elapsedTime: number,
  timeScale = 0.15,
): number {
  const t = elapsedTime * timeScale;
  return Math.sin(x * 0.1 + t) * 0.3 + Math.cos(z * 0.08 + t * 0.7) * 0.2;
}

export function createAnimatedTerrainMaterial(
  options: Partial<MeshStandardMaterialParameters> & { timeScale?: number } = {},
): AnimatedTerrainMaterial {
  const { timeScale = 0.15, ...matParams } = options;
  const animUniforms: AnimatedTerrainMaterialUniforms = {
    uAnimTime: { value: 0 },
    uAnimTimeScale: { value: timeScale },
  };

  const material = new MeshStandardMaterial(matParams) as AnimatedTerrainMaterial;
  material.userData.animUniforms = animUniforms;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAnimTime = animUniforms.uAnimTime;
    shader.uniforms.uAnimTimeScale = animUniforms.uAnimTimeScale;

    shader.vertexShader = `
      uniform float uAnimTime;
      uniform float uAnimTimeScale;
    ${shader.vertexShader}`
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
      float animT = uAnimTime * uAnimTimeScale;
      transformed.y += sin(transformed.x * 0.1 + animT) * 0.3 + cos(transformed.z * 0.08 + animT * 0.7) * 0.2;`,
      )
      .replace(
        '#include <defaultnormal_vertex>',
        `float animTNorm = uAnimTime * uAnimTimeScale;
      float dwdx = cos(position.x * 0.1 + animTNorm) * 0.03;
      float dwdz = -sin(position.z * 0.08 + animTNorm * 0.7) * 0.016;
      objectNormal = normalize(vec3(-dwdx, 1.0, -dwdz));`,
      );
  };

  material.customProgramCacheKey = () => `animatedTerrain:${timeScale}`;
  return material;
}

export function setAnimatedTerrainTime(material: Material, elapsedTime: number): void {
  const uniforms = (material as AnimatedTerrainMaterial).userData?.animUniforms;
  if (!uniforms) return;
  uniforms.uAnimTime.value = elapsedTime;
}
