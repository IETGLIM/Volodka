import { BufferAttribute, BufferGeometry, CanvasTexture, ClampToEdgeWrapping, SRGBColorSpace } from 'three';
import { seededRand } from '@/shared/utils/seededRand';

const skyCache = new Map<string, CanvasTexture>();

/**
 * All 14 procedural sky dome textures are static (seeded canvas draws, no per-frame updates).
 * Geometry helpers (`createDreamGalaxyStarGeometry`, `createRooftopHorizonStarGeometry`) are not cached.
 */
function getOrCreateSkyTexture(
  key: string,
  build: () => CanvasTexture,
): CanvasTexture {
  const cached = skyCache.get(key);
  if (cached) return cached;
  const tex = build();
  // Canvas pixels are sRGB-encoded; force sRGB color space so the renderer's
  // color pipeline decodes sky gradients correctly. Without this, skies
  // render ~2.2× too dark (especially noticeable on dream_galaxy and
  // street_night_synthwave which rely on saturated color ramps).
  if (tex.colorSpace !== SRGBColorSpace) {
    tex.colorSpace = SRGBColorSpace;
  }
  tex.needsUpdate = true;
  skyCache.set(key, tex);
  tex.addEventListener('dispose', () => {
    if (skyCache.get(key) === tex) skyCache.delete(key);
  });
  return tex;
}

/** Test helper and quality/HMR cleanup — dispose cached sky textures. */
export function clearSkyTextureCache(): void {
  for (const tex of skyCache.values()) {
    tex.dispose();
  }
  skyCache.clear();
}

/** Procedural vertical gradient + nebula wisps for the sleep_dream galaxy dome. */
export function createDreamGalaxySkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('dream_galaxy', buildDreamGalaxySkyTexture);
}

function buildDreamGalaxySkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#020008'); // void zenith
  grad.addColorStop(0.22, '#0a0420'); // deep violet
  grad.addColorStop(0.42, '#1a0850'); // indigo nebula
  grad.addColorStop(0.58, '#3a1868'); // magenta band
  grad.addColorStop(0.74, '#122848'); // cyan whisper
  grad.addColorStop(0.9, '#0a1028'); // horizon haze
  grad.addColorStop(1.0, '#060210'); // floor blend
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft nebula wisps — seeded for stable visuals across remounts
  for (let i = 0; i < 6; i++) {
    const cx = seededRand(i * 17 + 9001) * w;
    const cy = 20 + seededRand(i * 31 + 9001) * (h * 0.55);
    const radius = 12 + seededRand(i * 53 + 9001) * 28;
    const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const huePick = seededRand(i * 71 + 9001);
    if (huePick < 0.33) {
      nebula.addColorStop(0, 'rgba(80, 40, 160, 0.35)');
      nebula.addColorStop(1, 'rgba(10, 4, 30, 0)');
    } else if (huePick < 0.66) {
      nebula.addColorStop(0, 'rgba(0, 120, 160, 0.28)');
      nebula.addColorStop(1, 'rgba(4, 8, 24, 0)');
    } else {
      nebula.addColorStop(0, 'rgba(180, 60, 140, 0.25)');
      nebula.addColorStop(1, 'rgba(16, 4, 32, 0)');
    }
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Noir sunset dome with galaxy wisps at zenith — rooftop_edge horizon drama. */
export function createRooftopSunsetGalaxySkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('rooftop_sunset_galaxy', buildRooftopSunsetGalaxySkyTexture);
}

function buildRooftopSunsetGalaxySkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#080418'); // galaxy violet zenith
  grad.addColorStop(0.18, '#12082a'); // deep indigo nebula
  grad.addColorStop(0.38, '#1a2a3a'); // dusty teal mid
  grad.addColorStop(0.58, '#4a2838'); // magenta smog band
  grad.addColorStop(0.74, '#7a4028'); // warm smog
  grad.addColorStop(0.88, '#c86a28'); // sunset orange
  grad.addColorStop(1.0, '#e8a040'); // horizon glow
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const cx = seededRand(i * 19 + 7101) * w;
    const cy = 8 + seededRand(i * 37 + 7101) * (h * 0.28);
    const radius = 10 + seededRand(i * 59 + 7101) * 22;
    const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const huePick = seededRand(i * 83 + 7101);
    if (huePick < 0.5) {
      nebula.addColorStop(0, 'rgba(60, 30, 120, 0.32)');
      nebula.addColorStop(1, 'rgba(8, 4, 20, 0)');
    } else {
      nebula.addColorStop(0, 'rgba(140, 50, 100, 0.22)');
      nebula.addColorStop(1, 'rgba(12, 6, 24, 0)');
    }
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Sparse upper-hemisphere stars for rooftop sunset — slow-rotatable, fog-exempt. */
export function createRooftopHorizonStarGeometry(starCount = 90): BufferGeometry {
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = seededRand(i * 11 + 3107) * Math.PI * 2;
    const phi = seededRand(i * 23 + 3107) * Math.PI * 0.42;
    const r = 52 + seededRand(i * 37 + 3107) * 5;
    positions[i * 3] = Math.cos(theta) * Math.sin(phi + 0.1) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.65 + 14;
    positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi + 0.1) * r;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  return geo;
}

/** Overcast gothic haze dome for park_day — soft grey-green zenith to warm horizon. */
export function createParkHazySkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('park_hazy', buildParkHazySkyTexture);
}

function buildParkHazySkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#4a5a52'); // muted green-grey zenith
  grad.addColorStop(0.35, '#6a7a6e'); // hazy mid
  grad.addColorStop(0.62, '#8a9488'); // pale mist
  grad.addColorStop(0.82, '#b0a898'); // warm haze band
  grad.addColorStop(1.0, '#c8b8a0'); // dusty horizon
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 29 + 5201) * w;
    const cy = 30 + seededRand(i * 47 + 5201) * (h * 0.5);
    const radius = 18 + seededRand(i * 61 + 5201) * 30;
    const mist = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    mist.addColorStop(0, 'rgba(180, 190, 175, 0.18)');
    mist.addColorStop(1, 'rgba(90, 100, 88, 0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Rainy synthwave night sky — street_night horizon haze + neon zenith band. */
export function createStreetNightSynthwaveSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('street_night_synthwave', buildStreetNightSynthwaveSkyTexture);
}

function buildStreetNightSynthwaveSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#0a0820'); // deep violet zenith
  grad.addColorStop(0.2, '#121830'); // indigo smog
  grad.addColorStop(0.42, '#283048'); // rainy blue-grey
  grad.addColorStop(0.62, '#3a3858'); // wet haze mid
  grad.addColorStop(0.78, '#484868'); // street fog lift
  grad.addColorStop(0.92, '#585878'); // horizon glow
  grad.addColorStop(1.0, '#686888'); // wet pavement bounce
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const cx = seededRand(i * 23 + 8103) * w;
    const cy = 12 + seededRand(i * 41 + 8103) * (h * 0.35);
    const radius = 14 + seededRand(i * 67 + 8103) * 24;
    const smog = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const huePick = seededRand(i * 89 + 8103);
    if (huePick < 0.5) {
      smog.addColorStop(0, 'rgba(40, 80, 180, 0.28)');
      smog.addColorStop(1, 'rgba(16, 20, 40, 0)');
    } else {
      smog.addColorStop(0, 'rgba(180, 40, 120, 0.18)');
      smog.addColorStop(1, 'rgba(20, 16, 36, 0)');
    }
    ctx.fillStyle = smog;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Blue-neon ceiling wash for cafe_evening — hazy interior HDR ambience. */
export function createCafeEveningNeonSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('cafe_evening_neon', buildCafeEveningNeonSkyTexture);
}

function buildCafeEveningNeonSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#080818'); // dark ceiling void
  grad.addColorStop(0.25, '#0c1028'); // deep blue-black
  grad.addColorStop(0.48, '#142040'); // neon spill mid
  grad.addColorStop(0.68, '#1a2850'); // hazy blue band
  grad.addColorStop(0.85, '#201838'); // warm bar spill
  grad.addColorStop(1.0, '#181018'); // floor blend
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 31 + 6207) * w;
    const cy = 20 + seededRand(i * 43 + 6207) * (h * 0.45);
    const radius = 16 + seededRand(i * 59 + 6207) * 26;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, 'rgba(30, 80, 220, 0.22)');
    glow.addColorStop(1, 'rgba(8, 12, 28, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Sterile overcast wash for office_day ceiling — cold fluorescent haze. */
export function createOfficeDayOvercastSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('office_day_overcast', buildOfficeDayOvercastSkyTexture);
}

function buildOfficeDayOvercastSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#8898a8'); // cool zenith
  grad.addColorStop(0.3, '#a0b0c0'); // overcast mid
  grad.addColorStop(0.55, '#b8c4d0'); // flat cloud bank
  grad.addColorStop(0.78, '#c8d4e0'); // window spill
  grad.addColorStop(1.0, '#d8e4f0'); // floor bounce
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 27 + 9101) * w;
    const cy = 20 + seededRand(i * 43 + 9101) * (h * 0.55);
    const radius = 14 + seededRand(i * 61 + 9101) * 28;
    const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    haze.addColorStop(0, 'rgba(200, 220, 240, 0.22)');
    haze.addColorStop(1, 'rgba(140, 160, 180, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Dusty amber-green dome for library_day — gothic reading light through high windows. */
export function createLibraryDayWarmSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('library_day_warm', buildLibraryDayWarmSkyTexture);
}

function buildLibraryDayWarmSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#1a1408'); // dark rafters
  grad.addColorStop(0.28, '#2a2010'); // aged wood shadow
  grad.addColorStop(0.52, '#4a3820'); // dusty mid
  grad.addColorStop(0.72, '#6a5030'); // warm shaft light
  grad.addColorStop(0.88, '#8a6840'); // amber spill
  grad.addColorStop(1.0, '#3a2818'); // floor blend
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const cx = seededRand(i * 33 + 7203) * w;
    const cy = 16 + seededRand(i * 47 + 7203) * (h * 0.5);
    const radius = 12 + seededRand(i * 59 + 7203) * 24;
    const dust = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    dust.addColorStop(0, 'rgba(180, 140, 70, 0.2)');
    dust.addColorStop(1, 'rgba(40, 28, 12, 0)');
    ctx.fillStyle = dust;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Warm amber ceiling wash for home_evening — cozy kitchen/living mood with city-blue spill. */
export function createHomeEveningWarmSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('home_evening_warm', buildHomeEveningWarmSkyTexture);
}

function buildHomeEveningWarmSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#120c06'); // dark ceiling void
  grad.addColorStop(0.22, '#201408'); // warm shadow
  grad.addColorStop(0.45, '#382818'); // amber mid
  grad.addColorStop(0.65, '#503820'); // lamp spill
  grad.addColorStop(0.82, '#302848'); // city-blue window leak
  grad.addColorStop(1.0, '#181018'); // floor blend
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 29 + 8305) * w;
    const cy = 24 + seededRand(i * 41 + 8305) * (h * 0.42);
    const radius = 14 + seededRand(i * 67 + 8305) * 22;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const warm = seededRand(i * 79 + 8305) < 0.65;
    if (warm) {
      glow.addColorStop(0, 'rgba(255, 180, 80, 0.18)');
      glow.addColorStop(1, 'rgba(32, 16, 8, 0)');
    } else {
      glow.addColorStop(0, 'rgba(40, 60, 140, 0.12)');
      glow.addColorStop(1, 'rgba(12, 8, 24, 0)');
    }
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Matrix monitor glow ceiling wash for volodka_room — noir apartment HDR. */
export function createVolodkaRoomNightSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('volodka_room_night', buildVolodkaRoomNightSkyTexture);
}

function buildVolodkaRoomNightSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#060810');
  grad.addColorStop(0.2, '#0a1018');
  grad.addColorStop(0.42, '#101828');
  grad.addColorStop(0.62, '#142030');
  grad.addColorStop(0.8, '#183828');
  grad.addColorStop(1.0, '#0c1018');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const cx = seededRand(i * 31 + 8401) * w;
    const cy = 18 + seededRand(i * 47 + 8401) * (h * 0.4);
    const radius = 12 + seededRand(i * 59 + 8401) * 20;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const huePick = seededRand(i * 73 + 8401);
    if (huePick < 0.45) {
      glow.addColorStop(0, 'rgba(0, 255, 136, 0.16)');
      glow.addColorStop(1, 'rgba(8, 16, 24, 0)');
    } else if (huePick < 0.75) {
      glow.addColorStop(0, 'rgba(68, 136, 238, 0.14)');
      glow.addColorStop(1, 'rgba(8, 12, 24, 0)');
    } else {
      glow.addColorStop(0, 'rgba(255, 200, 120, 0.1)');
      glow.addColorStop(1, 'rgba(12, 10, 16, 0)');
    }
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Dim rainy corridor ceiling wash for volodka_corridor — communal noir. */
export function createVolodkaCorridorRainySkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('volodka_corridor_rainy', buildVolodkaCorridorRainySkyTexture);
}

function buildVolodkaCorridorRainySkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#101018');
  grad.addColorStop(0.28, '#181820');
  grad.addColorStop(0.52, '#242430');
  grad.addColorStop(0.72, '#303038');
  grad.addColorStop(0.88, '#383840');
  grad.addColorStop(1.0, '#1a1a22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 27 + 8503) * w;
    const cy = 20 + seededRand(i * 41 + 8503) * (h * 0.45);
    const radius = 14 + seededRand(i * 53 + 8503) * 22;
    const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    haze.addColorStop(0, 'rgba(255, 220, 140, 0.12)');
    haze.addColorStop(1, 'rgba(24, 24, 32, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Rust industrial ceiling wash for abandoned_factory — gothic decay. */
export function createAbandonedFactoryIndustrialSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('abandoned_factory_industrial', buildAbandonedFactoryIndustrialSkyTexture);
}

function buildAbandonedFactoryIndustrialSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#0a0806');
  grad.addColorStop(0.25, '#1a1410');
  grad.addColorStop(0.5, '#2a2018');
  grad.addColorStop(0.72, '#3a2820');
  grad.addColorStop(0.88, '#4a3028');
  grad.addColorStop(1.0, '#1a1008');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const cx = seededRand(i * 33 + 8605) * w;
    const cy = 16 + seededRand(i * 49 + 8605) * (h * 0.5);
    const radius = 16 + seededRand(i * 61 + 8605) * 26;
    const rust = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    rust.addColorStop(0, 'rgba(180, 80, 40, 0.14)');
    rust.addColorStop(1, 'rgba(20, 12, 8, 0)');
    ctx.fillStyle = rust;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** «Заря-М» core glow ceiling wash for factory_basement — machine confession mood. */
export function createFactoryBasementCoreGlowTexture(): CanvasTexture {
  return getOrCreateSkyTexture('factory_basement_core_glow', buildFactoryBasementCoreGlowTexture);
}

function buildFactoryBasementCoreGlowTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#060a08');
  grad.addColorStop(0.22, '#0a1410');
  grad.addColorStop(0.45, '#102018');
  grad.addColorStop(0.65, '#183028');
  grad.addColorStop(0.82, '#204838');
  grad.addColorStop(1.0, '#101818');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 29 + 8707) * w;
    const cy = 20 + seededRand(i * 43 + 8707) * (h * 0.42);
    const radius = 14 + seededRand(i * 57 + 8707) * 24;
    const pulse = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    pulse.addColorStop(0, 'rgba(0, 220, 120, 0.2)');
    pulse.addColorStop(1, 'rgba(8, 16, 12, 0)');
    ctx.fillStyle = pulse;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Cozy domestic ceiling wash for zarema_albert_room — warm tea-and-pie mood. */
export function createZaremaAlbertWarmSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('zarema_albert_warm', buildZaremaAlbertWarmSkyTexture);
}

function buildZaremaAlbertWarmSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#181008');
  grad.addColorStop(0.25, '#282018');
  grad.addColorStop(0.5, '#403020');
  grad.addColorStop(0.72, '#584838');
  grad.addColorStop(0.88, '#685848');
  grad.addColorStop(1.0, '#302820');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const cx = seededRand(i * 31 + 8809) * w;
    const cy = 22 + seededRand(i * 47 + 8809) * (h * 0.4);
    const radius = 14 + seededRand(i * 59 + 8809) * 20;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, 'rgba(255, 200, 120, 0.16)');
    glow.addColorStop(1, 'rgba(32, 24, 16, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Cold overcast winter sky dome for street_winter — desolate departure road. */
export function createStreetWinterColdSkyTexture(): CanvasTexture {
  return getOrCreateSkyTexture('street_winter_cold', buildStreetWinterColdSkyTexture);
}

function buildStreetWinterColdSkyTexture(): CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#506070');
  grad.addColorStop(0.22, '#607080');
  grad.addColorStop(0.45, '#708898');
  grad.addColorStop(0.65, '#8098a8');
  grad.addColorStop(0.82, '#90a8b8');
  grad.addColorStop(1.0, '#a0b0c0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const cx = seededRand(i * 23 + 8911) * w;
    const cy = 12 + seededRand(i * 37 + 8911) * (h * 0.35);
    const radius = 16 + seededRand(i * 51 + 8911) * 28;
    const snow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    snow.addColorStop(0, 'rgba(220, 230, 240, 0.2)');
    snow.addColorStop(1, 'rgba(96, 112, 128, 0)');
    ctx.fillStyle = snow;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

/** Upper-hemisphere starfield for sleep_dream — fog-exempt, slow-rotatable. */
export function createDreamGalaxyStarGeometry(starCount = 220): BufferGeometry {
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = seededRand(i * 13 + 4242) * Math.PI * 2;
    const phi = seededRand(i * 29 + 4242) * Math.PI * 0.48;
    const r = 48 + seededRand(i * 41 + 4242) * 6;
    positions[i * 3] = Math.cos(theta) * Math.sin(phi + 0.12) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.72 + 10;
    positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi + 0.12) * r;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  return geo;
}
