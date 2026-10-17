/**
 * v4.56.4 — регресс-тесты нормализации базы относительного резолва ассетов.
 *
 * Баг: в маунте «…/game» (Next.js rewrite /game → /game/index.html) baseURI =
 * «http://host/game» — без завершающего слэша WHATWG URL считает его файлом,
 * new URL('/models/x', base) съедал сегмент game → http://host/models/x → 404.
 * В дѣвлоге песочницы: 404 на /models/interiors/*.glb и /basis/basis_transcoder.js
 * (KTX2-транскодер не грузился → текстуры стен/пола не транскодились).
 */
import { describe, expect, it } from 'vitest';
import {
  isMountedPublicPath,
  normalizeBaseForRelativeResolve,
} from './relativePublicAssets';

/** Зеркало прод-поведения: three.js resolveURL для корневых путей. */
function resolve(path: string, base: string): string {
  return new URL(path.slice(1), normalizeBaseForRelativeResolve(base)).toString();
}

describe('normalizeBaseForRelativeResolve', () => {
  it('маунт «…/game» (Next.js /game → index.html): сегмент без точки = каталог', () => {
    expect(normalizeBaseForRelativeResolve('http://localhost:3000/game')).toBe(
      'http://localhost:3000/game/',
    );
    expect(normalizeBaseForRelativeResolve('https://example.io/volodka')).toBe(
      'https://example.io/volodka/',
    );
  });

  it('файл-база (itch.io index.html) не трогается', () => {
    expect(normalizeBaseForRelativeResolve('https://html-classic.itch.zone/a1b2/v7/index.html')).toBe(
      'https://html-classic.itch.zone/a1b2/v7/index.html',
    );
  });

  it('корень и bare-хост уже корректны (не удваиваем слэш)', () => {
    expect(normalizeBaseForRelativeResolve('https://volodka.vercel.app/')).toBe(
      'https://volodka.vercel.app/',
    );
    // bare-хост = корень: new URL и так резолвит от «/», слэш не нужен.
    expect(normalizeBaseForRelativeResolve('https://volodka.vercel.app')).toBe(
      'https://volodka.vercel.app',
    );
  });

  it('сквозной резолв: /basis/ и /models/ остаются внутри маунта, itch — рядом с index.html', () => {
    expect(resolve('/basis/basis_transcoder.js', 'http://localhost:3000/game')).toBe(
      'http://localhost:3000/game/basis/basis_transcoder.js',
    );
    expect(resolve('/models/interiors/pier.glb', 'http://localhost:3000/game')).toBe(
      'http://localhost:3000/game/models/interiors/pier.glb',
    );
    expect(resolve('/models/interiors/pier.glb', 'https://html-classic.itch.zone/a1b2/v7/index.html')).toBe(
      'https://html-classic.itch.zone/a1b2/v7/models/interiors/pier.glb',
    );
    expect(resolve('/hdri/lebombo_1k.hdr', 'https://volodka.vercel.app/')).toBe(
      'https://volodka.vercel.app/hdri/lebombo_1k.hdr',
    );
  });
});

describe('isMountedPublicPath (v4.56.5 — publicAsset-пути не ре-резолвятся)', () => {
  it('маунт /game: уже собранные BASE_URL-пути пропускаются как есть', () => {
    expect(isMountedPublicPath('/game/textures/polyhaven/wood_floor/wood_floor_diff_1k.webp', '/game')).toBe(true);
    expect(isMountedPublicPath('/game/models/animations/working.glb', '/game')).toBe(true);
    expect(isMountedPublicPath('/game', '/game')).toBe(true);
  });

  it('корневые URL (сырые константы) — на резолв', () => {
    expect(isMountedPublicPath('/basis/basis_transcoder.js', '/game')).toBe(false);
    expect(isMountedPublicPath('/models/interiors/pier.glb', '/game')).toBe(false);
    expect(isMountedPublicPath('/gameplay-sneak/x', '/game')).toBe(false); // префикс-сосед, не маунт
  });

  it('корневой билд (BASE \'\') — ре-резолв всего (поведение Vercel/itch)', () => {
    expect(isMountedPublicPath('/models/interiors/pier.glb', '')).toBe(false);
  });
});
