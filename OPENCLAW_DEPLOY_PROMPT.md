# 给 OpenClaw 的部署提示词

把下面这段直接发给 `OpenClaw`，只需要替换里面的 `YOUR_HHBA_API`、`YOUR_HHBA_CLIENT_TOKEN` 和仓库链接即可。

## 最短版本

```text
请部署这个 GitHub 工作流：https://github.com/yanm-jun/hhba-openclaw-starter

目标：
1. 把这个 starter 安装到当前机器
2. 用 HHBA API 接入 OpenClaw
3. 自动写入本机的 openclaw.json
4. 完成后告诉我生成的配置位置，以及是否需要重启 OpenClaw

参数：
- HHBA_BASE_URL=https://YOUR_HHBA_API
- HHBA_API_TOKEN=YOUR_HHBA_CLIENT_TOKEN

如果当前机器是 Windows，请优先执行：
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1 -BaseUrl https://YOUR_HHBA_API -ApiToken YOUR_HHBA_CLIENT_TOKEN

如果当前机器是 macOS / Linux，请优先执行：
bash <(curl -fsSL https://raw.githubusercontent.com/yanm-jun/hhba-openclaw-starter/main/scripts/bootstrap.sh) --base-url https://YOUR_HHBA_API --api-token YOUR_HHBA_CLIENT_TOKEN

如果本机的 openclaw.json 不在默认位置，请继续帮我定位，并在 setup 时补上 --openclaw-config。
部署完后，再帮我跑一次 smoke check。
```

## 一句话版本

```text
请按这个仓库的 README 帮我部署并启用 HHBA 工作流：https://github.com/yanm-jun/hhba-openclaw-starter ，参数是 HHBA_BASE_URL=https://YOUR_HHBA_API 和 HHBA_API_TOKEN=YOUR_HHBA_CLIENT_TOKEN。
```

## 部署完成后应该看到的结果

- starter 被安装到本机固定目录
- `plugins/hhba-openclaw` 依赖已安装
- `generated/openclaw.hhba.config.jsonc` 已生成
- 本机 `openclaw.json` 已自动合并 HHBA 配置
- OpenClaw 可以直接调用这 5 个 tools：
  - `create_task`
  - `search_candidates`
  - `lock_candidate`
  - `submit_result`
  - `update_score`

## 对外发 GitHub 链接时建议一起发的说明

```text
这是 HHBA 的 OpenClaw starter。直接把仓库链接发给 OpenClaw，让它按 README 和 OPENCLAW_DEPLOY_PROMPT.md 部署即可。
```
