#!/usr/bin/env bash
set -euo pipefail

BASE_URL=""
API_TOKEN=""
OPENCLAW_CONFIG=""
TELEGRAM_BOT_TOKEN=""
INSTALL_DIR="${HOME}/.hhba-openclaw-starter"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    --api-token)
      API_TOKEN="${2:-}"
      shift 2
      ;;
    --openclaw-config)
      OPENCLAW_CONFIG="${2:-}"
      shift 2
      ;;
    --telegram-bot-token)
      TELEGRAM_BOT_TOKEN="${2:-}"
      shift 2
      ;;
    --install-dir)
      INSTALL_DIR="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$BASE_URL" || -z "$API_TOKEN" ]]; then
  echo "Usage: bootstrap.sh --base-url <HHBA_BASE_URL> --api-token <HHBA_API_TOKEN> [--openclaw-config <path>]" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d%H%M%S)"
TEMP_ROOT="${TMPDIR:-/tmp}/hhba-openclaw-starter-${STAMP}"
ZIP_PATH="${TMPDIR:-/tmp}/hhba-openclaw-starter-${STAMP}.zip"
SOURCE_URL="https://github.com/yanm-jun/hhba-openclaw-starter/archive/refs/heads/main.zip"

echo "正在下载 HHBA starter..."
curl -fsSL "$SOURCE_URL" -o "$ZIP_PATH"

echo "正在解压..."
mkdir -p "$TEMP_ROOT"
unzip -q "$ZIP_PATH" -d "$TEMP_ROOT"

rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$TEMP_ROOT/hhba-openclaw-starter-main" "$INSTALL_DIR"

PROJECT_ROOT="$INSTALL_DIR"
cd "$PROJECT_ROOT"

ARGS=(
  run setup -- --base-url "$BASE_URL" --api-token "$API_TOKEN"
)

if [[ -n "$OPENCLAW_CONFIG" ]]; then
  ARGS+=(--openclaw-config "$OPENCLAW_CONFIG")
fi

if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
  ARGS+=(--telegram-bot-token "$TELEGRAM_BOT_TOKEN")
fi

echo "正在执行 HHBA 接入..."
npm "${ARGS[@]}"

echo
echo "完成。"
echo "安装目录: $INSTALL_DIR"
echo "如果 OpenClaw 已经在本机，下一步直接重启 OpenClaw 即可。"
