import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const child = spawn(
  process.execPath,
  [
    nextCli,
    process.argv.includes("--production") ? "start" : "dev",
    ...process.argv.slice(2).filter((arg) => arg !== "--production"),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, SALONSYS_DEMO_MODE: "true" },
    windowsHide: true,
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
