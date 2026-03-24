#!/usr/bin/env bash
set -euo pipefail

OWNER="${1:-}"
REPO="${2:-hhba-openclaw-starter}"
DESCRIPTION="${3:-Starter kit for connecting HHBA human execution tools into your own OpenClaw instance.}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI 尚未登录。先运行 gh auth login，再重新执行本脚本。"
  exit 1
fi

cd "$ROOT_DIR"

if [[ ! -d ".git" ]]; then
  git init -b main >/dev/null
fi

git add .

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git commit -m "Initial HHBA OpenClaw starter" >/dev/null
else
  if [[ -n "$(git status --porcelain)" ]]; then
    git commit -m "Update HHBA OpenClaw starter" >/dev/null
  fi
fi

FULL_NAME="$REPO"
if [[ -n "$OWNER" ]]; then
  FULL_NAME="$OWNER/$REPO"
fi

gh repo create "$FULL_NAME" --public --source . --remote origin --push --description "$DESCRIPTION" --homepage "https://yanm-jun.github.io/HHBA.com/"
gh repo edit "$FULL_NAME" --template --add-topic hhba --add-topic openclaw --add-topic ai-agents --add-topic human-execution

echo
echo "GitHub 仓库已创建并设为模板：https://github.com/$FULL_NAME"
