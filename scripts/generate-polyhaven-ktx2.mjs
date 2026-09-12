/**
 * Этап 133: KTX2-кодирование внешних PBR-карт PolyHaven (public/textures/polyhaven).
 *
 * Политика кодирования — ИЗМЕРЕНА, не выбрана на вкус (ktx --compare-psnr/--compare-ssim,
 * источники asphalt_02 2k, KTX-Software 4.4.2):
 *  - diff     → basis-lz (ETC1S), sRGB transfer — PSNR 49.4 dB (визуально прозрачно),
 *               ~2.9 MB на весь набор 1k; лучший размер.
 *  - rough/ao → basis-lz (ETC1S), линейный UNORM — низкочастотные grayscale,
 *               качество аналогично diff.
 *  - nor_gl   → ОСТАЮТСЯ WebP, измерения против KTX2:
 *               (a) ETC1S q255: PSNR 30.1 dB / SSIM 0.81 на базовом mip — блочность
 *                   в зеркальных бликах, ОТБРАКОВКА по качеству (подтверждает опасение ROADMAP);
 *               (b) UASTC q2+RDO+zstd12: PSNR 100 dB, но 8bpp-пол: 5.1 MB на одну 2k
 *                   (18.2 MB на 7 нормалей против 4.0 MB WebP) — ОТБРАКОВКА по размеру.
 *  - mip-цепочка обязательна (RepeatWrapping-тайлинг на дистанции).
 *
 * Дополнительный выигрыш KTX2 помимо скачивания: цветовые карты занимают 4 bpp
 * в VRAM против 32 bpp RGBA8 (×8), mip-цепочки встроены в файл.
 *
 * Синтаксис KTX-Software 4.x: `ktx create --format <VkFormat> ... in.png out.ktx2`
 * (старый `toktx --t2 --bcmp` с KTX 4.x удалён). Источники на диске — WebP,
 * поэтому перед ktx create делается байт-точный WebP → PNG раунд-трип через sharp.
 *
 * Проверка результата — по заголовку KTX2 (магия, vkFormat, mips,
 * supercompressionScheme), без внешних зависимостей.
 *
 * Требования: ktx CLI >= 4.3 на PATH (в CI/Vercel отсутствует — скрипт там
 * НЕ выполняется, как и etc1s-пасс gltf-transform; runtime-фолбэк на WebP
 * сохранён до первой браузерной QA).
 *
 * Usage: npm run assets:polyhaven-ktx2 [-- --force]
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEXTURES_DIR = path.join(ROOT, 'public', 'textures', 'polyhaven');
const FORCE = process.argv.includes('--force');

/** Политика кодирования по типу карты — единый источник для скрипта и документации. */
const ENCODING_POLICY = {
  diff: {
    format: 'R8G8B8A8_SRGB',
    encode: 'basis-lz',
    args: ['--clevel', '2', '--qlevel', '200'],
    supercompression: 1,
  },
  nor_gl: {
    format: 'R8G8B8A8_UNORM',
    encode: 'uastc',
    // RDO обязателен: без него UASTC+zstd даёт ~1.1 MB на 1k (хуже WebP);
    // с RDO (lambda 1.0 — консервативно для нормалей) zstd сжимает блоки эффективно.
    args: ['--uastc-quality', '2', '--uastc-rdo', '--uastc-rdo-l', '1.0', '--normalize', '--zstd', '12'],
    supercompression: 2,
  },
  rough: {
    format: 'R8G8B8A8_UNORM',
    encode: 'basis-lz',
    args: ['--clevel', '2', '--qlevel', '191'],
    supercompression: 1,
  },
  ao: {
    format: 'R8G8B8A8_UNORM',
    encode: 'basis-lz',
    args: ['--clevel', '2', '--qlevel', '191'],
    supercompression: 1,
  },
};

const MAP_KINDS = Object.keys(ENCODING_POLICY);

/** Нормали намеренно НЕ кодируются в KTX2 — см. шапку файла (измерения PSNR/размер).
 *  Скрипт пропускает их с явным сообщением, runtime берёт их по WebP-пути. */
const SKIPPED_KINDS = new Set(['nor_gl']);

/** KTX2 идентификатор: «AB KTX 20» + \r\n\x1a\n */
const KTX2_MAGIC = Buffer.from([
  0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function probeKtxCli() {
  const probe = spawnSync('ktx', ['--version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    fail(
      'ktx CLI не найден на PATH. Установите KTX-Software >= 4.3 (синтаксис `ktx create`), ' +
        'например: export PATH=/home/z/ktx-software/bin:$PATH; ' +
        'export LD_LIBRARY_PATH=/home/z/ktx-software/lib:$LD_LIBRARY_PATH',
    );
  }
  return (probe.stdout || '').trim().split('\n')[0];
}

/** Разбор имени <materialId>_<map>_<res>.webp (materialId содержит подчёркивания). */
function parseTextureName(basename) {
  for (const kind of MAP_KINDS) {
    const suffix = `_${kind}_`;
    const idx = basename.lastIndexOf(suffix);
    if (idx > 0) {
      const materialId = basename.slice(0, idx);
      const rest = basename.slice(idx + suffix.length); // "<res>" до расширения убрано вызывающим
      if (rest === '1k' || rest === '2k') {
        return { materialId, map: kind, res: rest };
      }
    }
  }
  return null;
}

/** Чтение заголовка KTX2 (KTX2 spec §2.1, фиксированные первые 48 байт). */
function readKtx2Header(file) {
  const fd = readFileSync(file);
  if (fd.length < 48 || !fd.subarray(0, 12).equals(KTX2_MAGIC)) {
    return null;
  }
  return {
    vkFormat: fd.readUInt32LE(12),
    pixelWidth: fd.readUInt32LE(20),
    pixelHeight: fd.readUInt32LE(24),
    layerCount: fd.readUInt32LE(32),
    faceCount: fd.readUInt32LE(36),
    levelCount: fd.readUInt32LE(40),
    supercompressionScheme: fd.readUInt32LE(44),
    bytes: fd.length,
  };
}

function collectSources() {
  const sources = [];
  if (!existsSync(TEXTURES_DIR)) fail(`Каталог не найден: ${TEXTURES_DIR}`);
  for (const materialDir of readdirSync(TEXTURES_DIR, { withFileTypes: true })) {
    if (!materialDir.isDirectory()) continue;
    for (const entry of readdirSync(path.join(TEXTURES_DIR, materialDir.name))) {
      if (!entry.endsWith('.webp')) continue;
      const parsed = parseTextureName(entry.slice(0, -'.webp'.length));
      if (!parsed) continue;
      if (SKIPPED_KINDS.has(parsed.map)) continue; // нормали — WebP (решение по измерениям)
      sources.push({
        materialId: parsed.materialId,
        map: parsed.map,
        res: parsed.res,
        src: path.join(TEXTURES_DIR, materialDir.name, entry),
        out: path.join(TEXTURES_DIR, materialDir.name, `${entry.slice(0, -'.webp'.length)}.ktx2`),
        policy: ENCODING_POLICY[parsed.map],
      });
    }
  }
  return sources;
}

async function main() {
  const ktxVersion = probeKtxCli();
  const sources = collectSources();
  if (sources.length === 0) fail('WebP-источники PolyHaven не найдены');
  console.log(
    `ktx ${ktxVersion}; источников: ${sources.length} (nor_gl пропускается — WebP; политика: ${MAP_KINDS.join('/')})`,
  );

  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'volodka-ktx2-'));
  let skipped = 0;
  let totalWebp = 0;
  let totalKtx2 = 0;
  const failures = [];
  const report = [];

  for (const job of sources) {
    const srcStat = statSync(job.src);
    if (
      !FORCE &&
      existsSync(job.out) &&
      statSync(job.out).mtimeMs >= srcStat.mtimeMs
    ) {
      skipped += 1;
      totalKtx2 += statSync(job.out).size;
      continue;
    }

    try {
      const pngPath = path.join(
        tmpDir,
        `${job.materialId}_${job.map}_${job.res}.png`,
      );
      await sharp(job.src).png({ compressionLevel: 6 }).toFile(pngPath);

      const args = [
        'create',
        '--format', job.policy.format,
        '--encode', job.policy.encode,
        ...job.policy.args,
        '--generate-mipmap',
        pngPath,
        job.out,
      ];
      const run = spawnSync('ktx', args, { encoding: 'utf8' });
      if (run.error || run.status !== 0) {
        throw new Error(
          `ktx create вернул ${run.status ?? run.error?.code}: ${(run.stderr || run.stdout || '').slice(-400)}`,
        );
      }

      const header = readKtx2Header(job.out);
      if (!header) throw new Error('выходной файл не является валидным KTX2 (магия не совпала)');
      if (header.pixelWidth !== header.pixelHeight) {
        throw new Error(`неквадратная текстура ${header.pixelWidth}×${header.pixelHeight}`);
      }
      if (header.pixelWidth !== 1024 && header.pixelWidth !== 2048) {
        throw new Error(`неожиданное разрешение ${header.pixelWidth} (ожидалось 1024/2048)`);
      }
      if (header.levelCount < 4) {
        throw new Error(`mip-цепочка не сгенерирована (levelCount=${header.levelCount})`);
      }
      if (header.supercompressionScheme !== job.policy.supercompression) {
        throw new Error(
          `supercompressionScheme=${header.supercompressionScheme}, ожидалось ${job.policy.supercompression}`,
        );
      }
      if (header.layerCount > 0 || header.faceCount !== 1) {
        throw new Error('неожиданная топология текстуры (слои/cubemap)');
      }

      const webpBytes = srcStat.size;
      totalWebp += webpBytes;
      totalKtx2 += header.bytes;
      report.push(
        `${path.relative(TEXTURES_DIR, job.out)}: ${header.pixelWidth}×${header.pixelHeight} ` +
          `${job.policy.encode}${job.policy.supercompression === 2 ? '+zstd' : ''} ` +
          `mips=${header.levelCount} ${fmtBytes(webpBytes)} → ${fmtBytes(header.bytes)}`,
      );
    } catch (err) {
      failures.push(`${path.relative(TEXTURES_DIR, job.src)}: ${err.message}`);
    }
  }

  rmSync(tmpDir, { recursive: true, force: true });

  for (const line of report) console.log(`  ${line}`);
  console.log(
    `\nИтог: готово ${report.length}, пропущено (свежие) ${skipped}, ошибок ${failures.length}; ` +
      `WebP ${fmtBytes(totalWebp)} → KTX2 ${fmtBytes(totalKtx2)}`,
  );
  if (failures.length > 0) {
    for (const line of failures) console.error(`✖ ${line}`);
    fail('есть непокодированные карты — деплой не должен включать частичный набор');
  }
  console.log('✔ Все внешние карты PolyHaven закодированы в KTX2 и проверены по заголовкам.');
}

function fmtBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

await main();
