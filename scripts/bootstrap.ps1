param(
  [string]$BaseUrl,

  [string]$ApiToken,

  [string]$DeployLink,
  [string]$OpenClawConfig,
  [string]$TelegramBotToken,
  [string]$InstallDir = (Join-Path $HOME ".hhba-openclaw-starter")
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$tempRoot = Join-Path $env:TEMP "hhba-openclaw-starter-$stamp"
$zipPath = Join-Path $env:TEMP "hhba-openclaw-starter-$stamp.zip"
$sourceUrl = "https://github.com/yanm-jun/hhba-openclaw-starter/archive/refs/heads/main.zip"
$expandedRoot = Join-Path $tempRoot "hhba-openclaw-starter-main"
$installRoot = [System.IO.Path]::GetFullPath($InstallDir)

if (-not $DeployLink -and ([string]::IsNullOrWhiteSpace($BaseUrl) -or [string]::IsNullOrWhiteSpace($ApiToken))) {
  throw "Usage: bootstrap.ps1 -DeployLink <HHBA_DEPLOY_LINK> OR -BaseUrl <HHBA_BASE_URL> -ApiToken <HHBA_API_TOKEN>"
}

Write-Host "正在下载 HHBA starter..."
Invoke-WebRequest -Uri $sourceUrl -OutFile $zipPath

Write-Host "正在解压..."
Expand-Archive -Path $zipPath -DestinationPath $tempRoot -Force

if (Test-Path $installRoot) {
  Remove-Item -Recurse -Force $installRoot
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $installRoot) | Out-Null
Move-Item -Path $expandedRoot -Destination $installRoot

$projectRoot = $installRoot
$setupArgs = @("run", "setup", "--")

if ($DeployLink) {
  $setupArgs += @("--deploy-link", $DeployLink)
} else {
  $setupArgs += @("--base-url", $BaseUrl, "--api-token", $ApiToken)
}

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
Write-Host "安装目录: $installRoot"
Write-Host "如果 OpenClaw 已经在本机，下一步直接重启 OpenClaw 即可。"
