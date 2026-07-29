import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const envFiles = [".env", ".env.local", ".env.development.local"];

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const key = line.slice(0, line.indexOf("=")).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    process.env[key] = unquote(line.slice(line.indexOf("=") + 1));
  }
}

for (const file of envFiles) loadEnvFile(file);

const cliArgs = process.argv.slice(2);
const args = [
  "vercel",
  "dev",
  "--local-config",
  "vercel.dev.json",
  ...(cliArgs.length ? cliArgs : ["--listen", "8080"]),
];
const child = spawn("npx", args, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
