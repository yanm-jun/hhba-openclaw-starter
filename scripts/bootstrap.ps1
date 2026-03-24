param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$ApiToken,

  [string]$OpenClawConfig,
  [string]$TelegramBotToken
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$tempRoot = Join-Path $env:TEMP "hhba-openclaw-starter-$stamp"
$zipPath = Join-Path $env:TEMP "hhba-openclaw-starter-$stamp.zip"
$sourceUrl = "https://github.com/yanm-jun/hhba-openclaw-starter/archive/refs/heads/main.zip"

Write-Host "正在下载 HHBA starter..."
Invoke-WebRequest -Uri $sourceUrl -OutFile $zipPath

Write-Host "正在解压..."
Expand-Archive -Path $zipPath -DestinationPath $tempRoot -Force

$projectRoot = Join-Path $tempRoot "hhba-openclaw-starter-main"
$setupArgs = @(
  "run", "setup", "--",
  "--base-url", $BaseUrl,
  "--api-token", $ApiToken
)

if ($OpenClawConfig) {
  $setupArgs += @("--openclaw-config", $OpenClawConfig)
}

if ($TelegramBotToken) {
  $setupArgs += @("--telegram-bot-token", $TelegramBotToken)
}

Write-Host "正在执行 HHBA 接入..."
Push-Location $projectRoot
try {
  & npm @setupArgs
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "完成。"
Write-Host "如果 OpenClaw 已经在本机，下一步直接重启 OpenClaw 即可。"
