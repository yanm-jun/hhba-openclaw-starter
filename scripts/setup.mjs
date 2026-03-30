import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HELP_TEXT = `
HHBA OpenClaw Setup

Usage:
  npm run setup -- --base-url <HHBA_BASE_URL> --api-token <HHBA_API_TOKEN>
  hhba-openclaw-setup --base-url <HHBA_BASE_URL> --api-token <HHBA_API_TOKEN>

Options:
  --base-url <url>           HHBA Task API base URL
  --api-token <token>        HHBA API bearer token
  --openclaw-config <path>   Absolute path to openclaw.json (overrides auto-discovery)
  --telegram-bot-token <v>   Optional Telegram bot token
  --skip-install             Skip npm install for the plugin folder
  --no-merge                 Only render config, do not write openclaw.json
  --help                     Show this help
`;

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const source = readFileSync(filePath, "utf8");
  const values = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function updateEnvFile(filePath, updates) {
  const existing = existsSync(filePath) ? readFileSync(filePath, "utf8").split(/\r?\n/) : [];
  const pending = new Map(
    Object.entries(updates)
      .filter(([, value]) => value != null && value !== "")
      .map(([key, value]) => [key, String(value)])
  );

  const nextLines = existing.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return line;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      return line;
    }

    const key = line.slice(0, separator).trim();
    if (!pending.has(key)) {
      return line;
    }

    const value = pending.get(key);
    pending.delete(key);
    return `${key}=${value}`;
  });

  for (const [key, value] of pending.entries()) {
    nextLines.push(`${key}=${value}`);
  }

  writeFileSync(filePath, `${nextLines.join("\n").replace(/\n+$/g, "")}\n`, "utf8");
}

function run(command, args, options = {}) {
  let resolvedCommand = command;
  let resolvedArgs = args;

  if (command === "npm" && process.env.npm_execpath) {
    resolvedCommand = process.execPath;
    resolvedArgs = [process.env.npm_execpath, ...args];
  } else if (process.platform === "win32" && command === "npm") {
    resolvedCommand = "npm.cmd";
  }

  const result = spawnSync(resolvedCommand, resolvedArgs, {
    stdio: "inherit",
    cwd: rootDir,
    shell: false,
    ...options
  });

  if (result.error) {
    throw new Error(`${resolvedCommand} ${resolvedArgs.join(" ")} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `${resolvedCommand} ${resolvedArgs.join(" ")} failed with code ${result.status ?? "unknown"}${result.signal ? ` (signal: ${result.signal})` : ""}`
    );
  }
}

function findOpenClawConfig() {
  const homeDir = process.env.USERPROFILE || process.env.HOME || "";
  const preferredProfiles = [
    ...(existsSync(homeDir)
      ? readdirSync(homeDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(".openclaw-"))
        .map((entry) => resolve(homeDir, entry.name, "openclaw.json"))
        .sort((left, right) => {
          const leftName = basename(dirname(left));
          const rightName = basename(dirname(right));
          const leftScore = leftName.includes("hhba") ? 0 : (leftName.includes("dev") ? 2 : 1);
          const rightScore = rightName.includes("hhba") ? 0 : (rightName.includes("dev") ? 2 : 1);
          return leftScore - rightScore || left.localeCompare(right);
        })
      : []),
    resolve(homeDir, ".openclaw", "openclaw.json"),
    resolve(homeDir, ".openclaw-dev", "openclaw.json")
  ];

  return preferredProfiles.find((candidate) => existsSync(candidate)) || "";
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(HELP_TEXT.trim());
  process.exit(0);
}

const envFile = resolve(rootDir, ".env");
const envExample = resolve(rootDir, ".env.example");

if (!existsSync(envFile)) {
  mkdirSync(dirname(envFile), { recursive: true });
  writeFileSync(envFile, readFileSync(envExample, "utf8"), "utf8");
  console.log("已创建 .env。");
}

const updates = {
  HHBA_BASE_URL: args["base-url"],
  HHBA_API_TOKEN: args["api-token"],
  TELEGRAM_BOT_TOKEN: args["telegram-bot-token"],
  OPENCLAW_CONFIG_PATH: args["openclaw-config"]
};

updateEnvFile(envFile, updates);

const env = {
  ...parseEnvFile(resolve(rootDir, ".env.example")),
  ...parseEnvFile(envFile),
  ...process.env
};

const explicitConfigPath = String(args["openclaw-config"] || "").trim();
const discoveredConfigPath = findOpenClawConfig();
const envConfigPath = String(env.OPENCLAW_CONFIG_PATH || "").trim();
const targetConfigPath = explicitConfigPath
  ? resolve(explicitConfigPath)
  : discoveredConfigPath
    ? resolve(discoveredConfigPath)
    : envConfigPath
      ? resolve(envConfigPath)
    : "";

if (!args["skip-install"]) {
  console.log("正在安装 HHBA OpenClaw 插件依赖...");
  run("npm", ["install", "--prefix", "./plugins/hhba-openclaw"]);
}

console.log("正在生成 OpenClaw 配置...");
run("node", ["./scripts/render-config.mjs"]);

let merged = false;
if (!args["no-merge"] && targetConfigPath) {
  console.log(`正在写入 OpenClaw 配置 -> ${targetConfigPath}`);
  run("node", ["./scripts/apply-openclaw-config.mjs", "--config", targetConfigPath]);
  merged = true;
}

console.log("");
console.log("HHBA starter 已就绪。");
console.log(`HHBA_BASE_URL: ${env.HHBA_BASE_URL || "未设置"}`);
console.log(`配置输出: ${resolve(rootDir, "./generated/openclaw.hhba.config.jsonc")}`);

if (merged) {
  console.log(`OpenClaw 配置已写入: ${targetConfigPath}`);
  console.log("下一步：重启 OpenClaw，然后让 agent 直接调用 HHBA tools。");
} else {
  console.log("下一步：");
  console.log("1. 在 .env 里填好 HHBA_BASE_URL 和 HHBA_API_TOKEN");
  console.log("2. 查看 generated/openclaw.hhba.config.jsonc");
  console.log("3. 手动合并进你的 OpenClaw 配置，或重新运行 setup 并传入 --openclaw-config");
}
