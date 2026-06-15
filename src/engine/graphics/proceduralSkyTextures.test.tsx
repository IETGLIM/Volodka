import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createCafeEveningNeonSkyTexture,
  createDreamGalaxySkyTexture,
  createDreamGalaxyStarGeometry,
  createHomeEveningWarmSkyTexture,
  createLibraryDayWarmSkyTexture,
  createOfficeDayOvercastSkyTexture,
  createParkHazySkyTexture,
  createRooftopHorizonStarGeometry,
  createRooftopSunsetGalaxySkyTexture,
  createStreetNightSynthwaveSkyTexture,
  createStreetWinterColdSkyTexture,
  createVolodkaCorridorRainySkyTexture,
  createVolodkaRoomNightSkyTexture,
  createAbandonedFactoryIndustrialSkyTexture,
  createFactoryBasementCoreGlowTexture,
  createZaremaAlbertWarmSkyTexture,
} from './proceduralSkyTextures';

describe('proceduralSkyTextures', () => {
  it('creates dream galaxy sky canvas texture with clamp wrapping', () => {
    const tex = createDreamGalaxySkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect((tex.image as HTMLCanvasElement).width).toBe(64);
    expect((tex.image as HTMLCanvasElement).height).toBe(256);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates deterministic dream star geometry on upper hemisphere', () => {
    const a = createDreamGalaxyStarGeometry(64);
    const b = createDreamGalaxyStarGeometry(64);
    const posA = a.getAttribute('position').array as Float32Array;
    const posB = b.getAttribute('position').array as Float32Array;
    expect(posA.length).toBe(64 * 3);
    expect(Array.from(posA)).toEqual(Array.from(posB));
    for (let i = 0; i < 64; i++) {
      expect(posA[i * 3 + 1]).toBeGreaterThan(8);
    }
    a.dispose();
    b.dispose();
  });

  it('creates rooftop sunset galaxy sky with clamp wrapping', () => {
    const tex = createRooftopSunsetGalaxySkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates deterministic rooftop horizon stars on upper hemisphere', () => {
    const geo = createRooftopHorizonStarGeometry(32);
    const pos = geo.getAttribute('position').array as Float32Array;
    expect(pos.length).toBe(32 * 3);
    for (let i = 0; i < 32; i++) {
      expect(pos[i * 3 + 1]).toBeGreaterThan(10);
    }
    geo.dispose();
  });

  it('creates park hazy sky texture with clamp wrapping', () => {
    const tex = createParkHazySkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates street night synthwave sky with clamp wrapping', () => {
    const tex = createStreetNightSynthwaveSkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates cafe evening neon ceiling wash with clamp wrapping', () => {
    const tex = createCafeEveningNeonSkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates office day overcast ceiling wash with clamp wrapping', () => {
    const tex = createOfficeDayOvercastSkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates library day warm ceiling wash with clamp wrapping', () => {
    const tex = createLibraryDayWarmSkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates home evening warm ceiling wash with clamp wrapping', () => {
    const tex = createHomeEveningWarmSkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates hero interior and industrial ceiling washes with clamp wrapping', () => {
    for (const create of [
      createVolodkaRoomNightSkyTexture,
      createVolodkaCorridorRainySkyTexture,
      createAbandonedFactoryIndustrialSkyTexture,
      createFactoryBasementCoreGlowTexture,
      createZaremaAlbertWarmSkyTexture,
      createStreetWinterColdSkyTexture,
    ]) {
      const tex = create();
      expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
      expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
      tex.dispose();
    }
  });
});
