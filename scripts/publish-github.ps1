param(
  [string]$Owner = "",
  [string]$Repo = "hhba-openclaw-starter",
  [string]$Description = "Starter kit for connecting HHBA human execution tools into your own OpenClaw instance.",
  [switch]$Private
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$visibility = if ($Private) { "--private" } else { "--public" }

try {
  gh auth status | Out-Null
} catch {
  Write-Host "GitHub CLI 尚未登录。先运行 gh auth login，再重新执行本脚本。"
  exit 1
}

Push-Location $root
try {
  if (-not (Test-Path (Join-Path $root ".git"))) {
    git init -b main | Out-Null
  }

  git add .

  $hasCommit = $true
  try {
    git rev-parse --verify HEAD | Out-Null
  } catch {
    $hasCommit = $false
  }

  if (-not $hasCommit) {
    git commit -m "Initial HHBA OpenClaw starter" | Out-Null
  } else {
    $dirty = git status --porcelain
    if ($dirty) {
      git commit -m "Update HHBA OpenClaw starter" | Out-Null
    }
  }

  $fullName = if ($Owner) { "$Owner/$Repo" } else { $Repo }

  gh repo create $fullName $visibility --source . --remote origin --push --description $Description --homepage "https://yanm-jun.github.io/HHBA.com/"
  gh repo edit $fullName --template --add-topic hhba --add-topic openclaw --add-topic ai-agents --add-topic human-execution

  Write-Host ""
  Write-Host "GitHub 仓库已创建并设为模板：https://github.com/$fullName"
} finally {
  Pop-Location
}
