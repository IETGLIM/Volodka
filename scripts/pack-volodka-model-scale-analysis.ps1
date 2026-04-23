# Архив для разбора: код масштаба/GLB/сцен + списки public/models* + GLB из models-external.
# Запуск из корня репозитория: pwsh -File scripts/pack-volodka-model-scale-analysis.ps1
# Выход: exports/volodka-model-scale-analysis-bundle.zip

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $root 'package.json'))) {
  throw "package.json not found: $root"
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bundle = Join-Path $root "exports/volodka-model-scale-analysis-bundle-$stamp"
$zip = Join-Path $root "exports/volodka-model-scale-analysis-bundle-$stamp.zip"

if (Test-Path $bundle) { Remove-Item $bundle -Recurse -Force }
New-Item -ItemType Directory -Force -Path $bundle | Out-Null

function Ensure-Parent([string]$filePath) {
  $d = Split-Path $filePath -Parent
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

$codeFiles = @(
  'src/config/modelUrls.ts',
  'src/config/modelUrls.test.ts',
  'src/config/scenes.ts',
  'src/config/scenes.explorationScale.test.ts',
  'src/data/npcDefinitions.ts',
  'src/lib/playerScaleConstants.ts',
  'src/lib/playerScaleConstants.playerGlbUniform.test.ts',
  'src/data/modelMeta.ts',
  'src/data/modelMeta.test.ts',
  'src/lib/explorationDiagnostics.ts',
  'src/lib/explorationDiagnostics.test.ts',
  'src/lib/explorationInteriorReference.ts',
  'src/lib/explorationInteriorReference.test.ts',
  'src/lib/gltfCharacterMaterialPolicy.ts',
  'src/lib/gltfCharacterMaterialPolicy.test.ts',
  'src/lib/gltfModelCache.ts',
  'src/lib/gltfModelCache.test.ts',
  'src/lib/model-cache.ts',
  'src/lib/introVolodkaOpeningCutscene.ts',
  'src/lib/introVolodkaOpeningCutscene.playerScale.test.ts',
  'src/lib/introCutscenePlayerBridge.ts',
  'src/lib/stripExplorationPlayerRootMotionFromClips.ts',
  'src/lib/explorationPlayerDebugPrimitive.ts',
  'src/core/physics/CharacterController.ts',
  'src/components/game/PhysicsPlayer.tsx',
  'src/components/game/NPC.tsx',
  'src/components/game/RPGGameCanvas.tsx',
  'src/components/3d/ModelLoader.tsx',
  'src/components/3d/Player.tsx'
)

foreach ($rel in $codeFiles) {
  $src = Join-Path $root $rel
  if (-not (Test-Path $src)) { throw "Missing: $src" }
  $dest = Join-Path $bundle ('code/' + $rel)
  Ensure-Parent $dest
  Copy-Item $src $dest -Force
}

# Списки ассетов (без копирования всего public/models — может быть очень большим)
$invDir = Join-Path $bundle 'inventory'
New-Item -ItemType Directory -Force -Path $invDir | Out-Null
foreach ($sub in @('public/models', 'public/models-external')) {
  $p = Join-Path $root $sub
  if (-not (Test-Path $p)) { continue }
  $out = Join-Path $invDir (($sub -replace '[\\/]', '_') + '-files.txt')
  Get-ChildItem -Path $p -Recurse -File -ErrorAction SilentlyContinue |
    Sort-Object FullName |
    ForEach-Object { "{0}`t{1}" -f $_.FullName.Substring($root.Length + 1), $_.Length } |
    Set-Content -Path $out -Encoding utf8
}

# GLB из models-external (как в pack-model-blender-analysis)
$extDest = Join-Path $bundle 'public/models-external'
New-Item -ItemType Directory -Force -Path $extDest | Out-Null
$extSrc = Join-Path $root 'public/models-external'
if (Test-Path $extSrc) {
  Copy-Item (Join-Path $extSrc '*.glb') $extDest -Force -ErrorAction SilentlyContinue
  $readme = Join-Path $extSrc 'README.md'
  if (Test-Path $readme) { Copy-Item $readme $extDest -Force }
  $cc0 = Get-ChildItem (Join-Path $extSrc 'CC0*.md') -ErrorAction SilentlyContinue
  foreach ($f in $cc0) { Copy-Item $f.FullName $extDest -Force }
}

$readmeBundle = @"
Volodka — архив для разбора моделей и масштаба (собрано $stamp)

code/ — зеркало исходников: modelMeta (uniform по имени файла), сцены, npcDefinitions,
  PhysicsPlayer, NPC, RPGGameCanvas, кэш GLTF, материалы, интро, капсула игрока.

inventory/*-files.txt — полные относительные пути и размеры файлов в public/models и public/models-external.

public/models-external/*.glb — копии внешних GLB из репозитория (для Blender / сравнение с кодом).

Основной GLB игрока и сцены лежат в public/models (см. inventory); в архив не кладём из‑за объёма.

Пересборка: pwsh -File scripts/pack-volodka-model-scale-analysis.ps1
"@
Set-Content -Path (Join-Path $bundle 'README.txt') -Value $readmeBundle -Encoding utf8

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $bundle '*') -DestinationPath $zip -CompressionLevel Optimal -Force
Remove-Item $bundle -Recurse -Force

$item = Get-Item $zip
Write-Host "OK: $($item.FullName)"
Write-Host "Size MB: $([math]::Round($item.Length / 1MB, 2))"
