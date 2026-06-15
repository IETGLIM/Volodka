import * as THREE from 'three';
import { seededRand } from '@/shared/utils/seededRand';

/** Procedural vertical gradient + nebula wisps for the sleep_dream galaxy dome. */
export function createDreamGalaxySkyTexture(): THREE.CanvasTexture {
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

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Upper-hemisphere starfield for sleep_dream — fog-exempt, slow-rotatable. */
export function createDreamGalaxyStarGeometry(starCount = 220): THREE.BufferGeometry {
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = seededRand(i * 13 + 4242) * Math.PI * 2;
    const phi = seededRand(i * 29 + 4242) * Math.PI * 0.48;
    const r = 48 + seededRand(i * 41 + 4242) * 6;
    positions[i * 3] = Math.cos(theta) * Math.sin(phi + 0.12) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.72 + 10;
    positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi + 0.12) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}
