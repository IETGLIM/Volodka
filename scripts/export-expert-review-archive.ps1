<#!
  Собирает zip для экспертного разбора: каталог src + корневые конфиги (без node_modules / .next).
  Запуск из корня репозитория:
    pwsh -File scripts/export-expert-review-archive.ps1
  Артефакт: archives/expert-review-src-<дата>.zip
#>
$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$Stage = Join-Path $RepoRoot "archives" "_stage_expert_review_$Stamp"
$ZipPath = Join-Path $RepoRoot "archives" "expert-review-src-$Stamp.zip"

New-Item -ItemType Directory -Force -Path (Split-Path $Stage) | Out-Null
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Stage | Out-Null

Write-Host "Staging -> $Stage"

Copy-Item -Path (Join-Path $RepoRoot "src") -Destination (Join-Path $Stage "src") -Recurse -Force

$rootFiles = @(
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "vitest.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "components.json",
  "worklog.md"
)
foreach ($f in $rootFiles) {
  $p = Join-Path $RepoRoot $f
  if (Test-Path $p) {
    Copy-Item $p $Stage -Force
  }
}

Copy-Item -Path (Join-Path $RepoRoot "archives" "EXPERT_REVIEW.md") -Destination (Join-Path $Stage "EXPERT_REVIEW.md") -Force -ErrorAction SilentlyContinue

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path (Join-Path $Stage "*") -DestinationPath $ZipPath -CompressionLevel Optimal

Remove-Item $Stage -Recurse -Force

Write-Host "Done: $ZipPath"
$bytes = (Get-Item $ZipPath).Length
Write-Host "Size: $bytes bytes"
