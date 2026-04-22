# Сборка архива: все GLB из public/models-external + код масштаба/загрузки моделей.
# Выход: exports/volodka-models-blender-analysis.zip (и распакованная папка с тем же именем)

$ErrorActionPreference = 'Stop'
# Репозиторий: родитель каталога scripts/
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $root 'package.json'))) {
  throw "package.json not found under root: $root"
}

$bundle = Join-Path $root 'exports/volodka-models-blender-analysis'
$zip = Join-Path $root 'exports/volodka-models-blender-analysis.zip'

if (Test-Path $bundle) { Remove-Item $bundle -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $bundle 'public/models-external') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $bundle 'code/src/config') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $bundle 'code/src/lib') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $bundle 'code/src/data') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $bundle 'code/src/components/game') | Out-Null

Copy-Item (Join-Path $root 'public/models-external/*.glb') (Join-Path $bundle 'public/models-external') -Force
Copy-Item (Join-Path $root 'public/models-external/README.md') (Join-Path $bundle 'public/models-external') -Force
$readme = Join-Path $root 'exports/README-MODEL-BUNDLE.md'
if (Test-Path $readme) {
  Copy-Item $readme (Join-Path $bundle 'README-MODEL-BUNDLE.md') -Force
}

$codeFiles = @(
  'src/config/modelUrls.ts',
  'src/config/modelUrls.test.ts',
  'src/config/scenes.ts',
  'src/config/scenes.explorationScale.test.ts',
  'src/data/npcDefinitions.ts',
  'src/lib/playerScaleConstants.ts',
  'src/lib/playerScaleConstants.playerGlbUniform.test.ts',
  'src/lib/explorationPropNormalize.ts',
  'src/lib/gltfSkinnedBoundingHeight.ts',
  'src/lib/stripExplorationPlayerRootMotionFromClips.ts',
  'src/lib/gltfCharacterMaterialPolicy.ts',
  'src/lib/gltfModelCache.ts',
  'src/lib/introVolodkaOpeningCutscene.ts',
  'src/lib/introVolodkaOpeningCutscene.playerScale.test.ts',
  'src/components/game/PhysicsPlayer.tsx',
  'src/components/game/NPC.tsx'
)

foreach ($rel in $codeFiles) {
  $src = Join-Path $root $rel
  if (-not (Test-Path $src)) { throw "Missing: $src" }
  $dest = Join-Path $bundle ('code/' + $rel)
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
  Copy-Item $src $dest -Force
}

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $bundle '*') -DestinationPath $zip -CompressionLevel Optimal -Force

$item = Get-Item $zip
Write-Host "OK: $($item.FullName) size MB: $([math]::Round($item.Length / 1MB, 2))"
