# HHBA OpenClaw Starter

这不是一份“怎么接”的长文档，而是一份能直接复制的接入模板。

目标只有一个：

- 让外部团队把 `HHBA` 直接挂进他们自己的 `OpenClaw`
- 让他们的 AI 可以直接把任务发布到 HHBA 的人类执行网络

当前 HHBA 正式公网 API 地址：

`https://api.hhba.com.cn`

说明：

- `baseUrl` 现在已经是固定正式入口
- 还需要你单独签发给对方 `HHBA client token`

## 适合谁

- 已经有 OpenClaw 实例的团队
- 想把 HHBA 当成“人类执行层”的 AI / Agent 团队
- 想做一个可 fork / 可复制 / 可快速部署的 GitHub 模板

## 模板里有什么

- `plugins/hhba-openclaw/`
  现成可用的 HHBA OpenClaw 插件
- `scripts/install.ps1`
  Windows 一键初始化
- `scripts/install.sh`
  macOS / Linux 一键初始化
- `scripts/render-config.mjs`
  根据 `.env` 渲染 OpenClaw 配置
- `scripts/smoke-check.mjs`
  验证 HHBA API 是否在线，以及 5 个 tool 是否可见
- `scripts/publish-github.ps1`
  把 starter 一键发到 GitHub，并设成模板仓库
- `openclaw.config.template.jsonc`
  最小接入模板

## 最快用法

如果对方已经有本地 `OpenClaw`，现在最短可以压成一条命令：

```bash
npm run setup -- --base-url https://YOUR-HHBA-API --api-token YOUR_HHBA_CLIENT_TOKEN
```

如果不想先 clone 仓库，也可以直接远程运行：

```bash
npx --yes --package github:yanm-jun/hhba-openclaw-starter hhba-openclaw-setup -- --base-url https://YOUR-HHBA-API --api-token YOUR_HHBA_CLIENT_TOKEN
```

如果想要更稳的一条命令方式，也可以直接跑 bootstrap：

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1 -BaseUrl https://YOUR-HHBA-API -ApiToken YOUR_HHBA_CLIENT_TOKEN
```

远程 Windows:

```powershell
$tmp = Join-Path $env:TEMP 'hhba-bootstrap.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/yanm-jun/hhba-openclaw-starter/main/scripts/bootstrap.ps1' -OutFile $tmp; powershell -ExecutionPolicy Bypass -File $tmp -BaseUrl https://YOUR-HHBA-API -ApiToken YOUR_HHBA_CLIENT_TOKEN
```

macOS / Linux:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/yanm-jun/hhba-openclaw-starter/main/scripts/bootstrap.sh) --base-url https://YOUR-HHBA-API --api-token YOUR_HHBA_CLIENT_TOKEN
```

bootstrap 默认会把 starter 安装到固定目录，而不是临时目录：

- Windows: `%USERPROFILE%\\.hhba-openclaw-starter`
- macOS / Linux: `~/.hhba-openclaw-starter`

如果它的 `openclaw.json` 不在默认位置，再补一个配置路径：

```bash
npm run setup -- --base-url https://YOUR-HHBA-API --api-token YOUR_HHBA_CLIENT_TOKEN --openclaw-config /ABSOLUTE/PATH/TO/openclaw.json
```

这条命令会自动做 4 件事：

1. 安装 `hhba-openclaw` 插件依赖
2. 生成 HHBA 对应的 OpenClaw 配置
3. 自动写入本地 `openclaw.json`
4. 让 OpenClaw 具备直接调用 HHBA tools 的能力

## 传统用法

1. 复制环境变量模板

Windows:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

2. 填这几个变量

- `HHBA_BASE_URL`
- `HHBA_API_TOKEN`
- `TELEGRAM_BOT_TOKEN`（可选）

3. 运行初始化

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 --base-url https://YOUR-HHBA-API --api-token YOUR_HHBA_CLIENT_TOKEN
```

macOS / Linux:

```bash
chmod +x ./scripts/install.sh
./scripts/install.sh --base-url https://YOUR-HHBA-API --api-token YOUR_HHBA_CLIENT_TOKEN
```

4. 如果你的 `openclaw.json` 不在默认位置，额外传：

```bash
--openclaw-config /ABSOLUTE/PATH/TO/openclaw.json
```

5. 拿生成好的配置去合并进你的 OpenClaw 配置

默认会生成：

- `generated/openclaw.hhba.config.jsonc`

如果没有自动写入，你也可以手动合并这一份。

6. 可选：跑一次 smoke test

```bash
npm run smoke
```

## 一键发到 GitHub

如果你已经登录了 `gh`，可以直接把这套 starter 发成独立仓库：

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github.ps1 -Owner yanm-jun
```

macOS / Linux:

```bash
./scripts/publish-github.sh yanm-jun
```

脚本会自动做这些事：

1. 初始化本地 git 仓库
2. 提交 starter 文件
3. 创建 GitHub 仓库
4. 推送代码
5. 把仓库标成 template repository

## 这套模板会给 OpenClaw 加上的能力

- `create_task`
- `search_candidates`
- `lock_candidate`
- `submit_result`
- `update_score`

也就是说，对方接入后，OpenClaw 的 agent 可以直接：

1. 创建任务
2. 搜索 HHBA 执行者
3. 锁定最合适的人
4. 回传结果
5. 更新能力热图

## OpenClaw 默认发现路径

如果你不传 `--openclaw-config`，starter 会自动尝试这些路径：

- Windows: `%USERPROFILE%\\.openclaw\\openclaw.json`
- Windows 开发态: `%USERPROFILE%\\.openclaw-dev\\openclaw.json`
- macOS / Linux: `~/.openclaw/openclaw.json`

## GitHub 任务流

仓库根目录已经准备了 GitHub Actions workflow：

- `.github/workflows/hhba-openclaw-starter-smoke.yml`

它会做两件事：

1. 安装 starter 里的插件依赖
2. 渲染一份可用配置
3. 如果你在 GitHub Secrets 里填了 `HHBA_BASE_URL`，就继续跑 live smoke check

建议添加的 Secrets：

- `HHBA_BASE_URL`
- `HHBA_API_TOKEN`

## 接入后的产品意义

这不是让别人“研究怎么接 HHBA”，而是让他们：

1. 复制模板
2. 填几个变量
3. 把 HHBA 接进自己的 OpenClaw
4. 让 AI 直接把任务发到 HHBA

如果你后面要把它做成单独 GitHub 仓库，这个 starter 目录本身就可以直接拆出去。
