import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

function stripJsonComments(source) {
  return source
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function readJsonc(filePath) {
  const source = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(stripJsonComments(source));
}

function uniqueArray(values) {
  return [...new Set(values.filter(Boolean))];
}

function mergeObjects(base, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return incoming;
  }

  const next = { ...(base || {}) };

  for (const [key, value] of Object.entries(incoming)) {
    const current = next[key];

    if (Array.isArray(value)) {
      next[key] = uniqueArray([...(Array.isArray(current) ? current : []), ...value]);
      continue;
    }

    if (value && typeof value === "object") {
      next[key] = mergeObjects(current, value);
      continue;
    }

    next[key] = value;
  }

  return next;
}

const args = parseArgs(process.argv.slice(2));
const generatedPath = resolve(
  rootDir,
  String(args.generated || "./generated/openclaw.hhba.config.jsonc")
);
const targetPath = args.config ? resolve(String(args.config)) : "";

if (!targetPath) {
  throw new Error("Missing --config <path>. Point it at the target openclaw.json file.");
}

if (!existsSync(generatedPath)) {
  throw new Error(`Generated config not found: ${generatedPath}`);
}

let targetConfig = {};
if (existsSync(targetPath)) {
  targetConfig = readJsonc(targetPath);
}

const generatedConfig = readJsonc(generatedPath);
const mergedConfig = mergeObjects(targetConfig, generatedConfig);

mergedConfig.plugins = mergedConfig.plugins || {};
mergedConfig.plugins.allow = uniqueArray([
  ...(Array.isArray(mergedConfig.plugins.allow) ? mergedConfig.plugins.allow : []),
  "hhba-openclaw"
]);

mergedConfig.tools = mergedConfig.tools || {};
mergedConfig.tools.allow = uniqueArray([
  ...(Array.isArray(mergedConfig.tools.allow) ? mergedConfig.tools.allow : []),
  "hhba-openclaw"
]);

mkdirSync(dirname(targetPath), { recursive: true });

if (existsSync(targetPath)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  copyFileSync(targetPath, `${targetPath}.bak.${stamp}`);
}

writeFileSync(targetPath, `${JSON.stringify(mergedConfig, null, 2)}\n`, "utf8");

console.log(`Applied HHBA config -> ${targetPath}`);
console.log("Backups: openclaw.json.bak.<timestamp> (if the target file already existed)");
