import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function cleanSecret(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.includes("REPLACE_WITH")) {
    return "";
  }

  return raw;
}

const env = {
  ...parseEnvFile(resolve(rootDir, ".env.example")),
  ...parseEnvFile(resolve(rootDir, ".env")),
  ...process.env
};

const baseUrl = normalizeBaseUrl(env.HHBA_BASE_URL);
const apiToken = cleanSecret(env.HHBA_API_TOKEN);
const enableCreateTaskSmoke = ["1", "true", "yes", "on"].includes(
  String(env.HHBA_ENABLE_CREATE_TASK_SMOKE || "").trim().toLowerCase()
);

if (!baseUrl || baseUrl.includes("REPLACE_WITH")) {
  throw new Error("Set HHBA_BASE_URL to a real HHBA API address before running npm run smoke.");
}

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
  };
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: buildHeaders(),
    ...init
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok || body.ok === false) {
    throw new Error(body.error || `Request failed: ${response.status} ${path}`);
  }

  return body;
}

const requiredTools = [
  "create_task",
  "search_candidates",
  "lock_candidate",
  "submit_result",
  "update_score"
];

const health = await request("/api/health");
const toolsResponse = await request("/api/openclaw/tools");
const toolNames = Array.isArray(toolsResponse.tools) ? toolsResponse.tools.map((tool) => tool.name) : [];

for (const toolName of requiredTools) {
  if (!toolNames.includes(toolName)) {
    throw new Error(`Missing HHBA tool: ${toolName}`);
  }
}

console.log(`HHBA health OK on port ${health.port}`);
console.log(`HHBA tools OK: ${toolNames.join(", ")}`);

if (enableCreateTaskSmoke) {
  const createTaskResponse = await request("/api/tasks/create", {
    method: "POST",
    body: JSON.stringify({
      source: "starter-smoke",
      sourceTaskId: "starter-smoke-001",
      title: "Starter smoke test task",
      objective: "Verify HHBA starter can create a task and return candidates.",
      budgetPerDay: 1200,
      expectedDays: 2,
      priority: "normal",
      acceptanceCriteria: ["Smoke test only"],
      maxCandidates: 3
    })
  });

  console.log(`Task create OK: ${createTaskResponse.task?.taskId || "task-created"}`);
  console.log(`Matches returned: ${createTaskResponse.matches?.length || 0}`);
}
