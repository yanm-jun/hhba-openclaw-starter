$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"
$pluginDir = Join-Path $root "plugins\hhba-openclaw"

if (-not (Test-Path $envFile)) {
  Copy-Item $envExample $envFile
  Write-Host "已创建 .env，请先按需填写 HHBA_BASE_URL / HHBA_API_TOKEN。"
}

Write-Host "正在安装 HHBA OpenClaw 插件依赖..."
npm install --prefix $pluginDir

Write-Host "正在生成 OpenClaw 配置..."
node (Join-Path $root "scripts\render-config.mjs")

Write-Host ""
Write-Host "初始化完成。"
Write-Host "下一步："
Write-Host "1. 打开 starter\.env 填好 HHBA_BASE_URL 和 HHBA_API_TOKEN"
Write-Host "2. 查看 generated\openclaw.hhba.config.jsonc"
Write-Host "3. 把生成的配置合并进你自己的 OpenClaw 配置"
Write-Host "4. 如需验活，运行 npm run smoke"
