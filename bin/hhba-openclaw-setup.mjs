#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const setupPath = resolve(rootDir, "scripts", "setup.mjs");

const result = spawnSync(process.execPath, [setupPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: process.cwd()
});

process.exit(result.status ?? 1);
