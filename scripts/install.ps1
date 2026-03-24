$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"
$pluginDir = Join-Path $root "plugins\hhba-openclaw"

if (-not (Test-Path $envFile)) {
  Copy-Item $envExample $envFile
  Write-Host "已创建 .env，请先按需填写 HHBA_BASE_URL / HHBA_API_TOKEN。"
}

$setupScript = Join-Path $root "scripts\setup.mjs"
$forwardArgs = @()

foreach ($arg in $args) {
  $forwardArgs += $arg
}

node $setupScript @forwardArgs
