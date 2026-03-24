#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"
PLUGIN_DIR="$ROOT_DIR/plugins/hhba-openclaw"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "已创建 .env，请先按需填写 HHBA_BASE_URL / HHBA_API_TOKEN。"
fi

echo "正在安装 HHBA OpenClaw 插件依赖..."
npm install --prefix "$PLUGIN_DIR"

echo "正在生成 OpenClaw 配置..."
node "$ROOT_DIR/scripts/render-config.mjs"

echo
echo "初始化完成。"
echo "下一步："
echo "1. 打开 starter/.env 填好 HHBA_BASE_URL 和 HHBA_API_TOKEN"
echo "2. 查看 generated/openclaw.hhba.config.jsonc"
echo "3. 把生成的配置合并进你自己的 OpenClaw 配置"
echo "4. 如需验活，运行 npm run smoke"
