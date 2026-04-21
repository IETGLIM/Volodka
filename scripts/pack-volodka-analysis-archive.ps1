# Сбор ZIP для разбора: интро, обход, сюжетные триггеры, UI.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outName = "volodka-analysis-archive-$stamp.zip"
$archDir = Join-Path $root "archives"
if (-not (Test-Path $archDir)) { New-Item -ItemType Directory -Path $archDir -Force | Out-Null }
$outPath = Join-Path $archDir $outName
$staging = Join-Path $env:TEMP "volodka-analysis-staging-$stamp"
New-Item -ItemType Directory -Path $staging -Force | Out-Null

$files = @(
  "CHANGELOG.md",
  "src\lib\introVolodkaOpeningCutscene.ts",
  "src\lib\explorationNarrativeTeleport.ts",
  "src\components\Cutscenes\IntroCutscene.tsx",
  "src\components\Cutscenes\IntroCutsceneOverlays.tsx",
  "src\hooks\useGameSessionFlow.ts",
  "src\hooks\useGameRuntime.ts",
  "src\store\gamePhaseStore.ts",
  "src\store\gameStore.ts",
  "src\components\game\GameOrchestrator.tsx",
  "src\components\game\RPGGameCanvas.tsx",
  "src\components\game\IntroScreen.tsx",
  "src\components\game\LoadingScreen.tsx",
  "src\components\game\exploration\ExplorationBriefingOverlay.tsx",
  "src\components\game\DialogueRenderer.tsx",
  "src\components\game\PhysicsPlayer.tsx",
  "src\components\game\FollowCamera.tsx",
  "src\components\game\PhysicsSceneColliders.tsx",
  "src\components\game\QuestAcceptedGlitchToast.tsx",
  "src\components\ui\MemoryLog.tsx",
  "src\core\memory\MemoryEngine.ts",
  "src\data\storyNodes.ts",
  "src\data\triggerZones.ts",
  "src\data\animeCutscenes.ts",
  "src\config\scenes.ts"
)

$readme = @"
VOLodka analysis bundle
Generated: $(Get-Date -Format "o")

Included: intro 3D pipeline (gamePhaseStore, IntroCutscene*, introVolodkaOpeningCutscene),
session flow (useGameSessionFlow), orchestration (GameOrchestrator, RPGGameCanvas),
story triggers (storyNodes kitchen_table etc., triggerZones, animeCutscenes),
exploration physics/UI (PhysicsPlayer, FollowCamera, PhysicsSceneColliders, DialogueRenderer,
MemoryLog, MemoryEngine, scenes config), CHANGELOG.

Screenshot note: overlay text 'Стол — как staging...' is story node id 'kitchen_table' in storyNodes.ts,
not the intro cutscene subtitles. If that text appears while 3D shows wrong room / void, check
currentNodeId vs exploration.currentSceneId and StoryRenderer visibility (GameOrchestrator).
"@

Set-Content -Path (Join-Path $staging "README-ANALYSIS-BUNDLE.txt") -Value $readme -Encoding UTF8

foreach ($rel in $files) {
  $src = Join-Path $root $rel
  if (-not (Test-Path $src)) { Write-Warning "Missing: $rel"; continue }
  $destDir = Join-Path $staging (Split-Path -Parent $rel)
  if ($destDir -and -not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item -LiteralPath $src -Destination (Join-Path $staging $rel) -Force
}

if (Test-Path $outPath) { Remove-Item $outPath -Force }
Compress-Archive -Path $staging -DestinationPath $outPath -CompressionLevel Optimal
Remove-Item -LiteralPath $staging -Recurse -Force
Write-Host "Created: $outPath"
