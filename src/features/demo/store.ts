import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { isDemoMode, usesHostedDemoStorage } from "@/config/demo";
import { createDemoSeed, type DemoState } from "./seed";
import { withCookieDemoState } from "./cookie-store";

const stateSchema = z.object({
  version: z.literal(1),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.json()))),
});
const runtime = globalThis as typeof globalThis & {
  salonDemoQueue?: Promise<unknown>;
};
export function demoStorePath() {
  return join(process.cwd(), ".salonsys-demo", "data.json");
}
export async function withDemoState<T>(
  operation: (state: DemoState) => T | Promise<T>,
  write = false,
): Promise<T> {
  if (!isDemoMode()) throw new Error("Demo mode is disabled.");
  if (usesHostedDemoStorage()) return withCookieDemoState(operation, write);
  const run = (runtime.salonDemoQueue ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      let state: DemoState;
      try {
        state = stateSchema.parse(
          JSON.parse(await readFile(demoStorePath(), "utf8")),
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        state = createDemoSeed();
        write = true;
      }
      const result = await operation(state);
      if (write) {
        await mkdir(join(process.cwd(), ".salonsys-demo"), { recursive: true });
        const temporary = `${demoStorePath()}.${crypto.randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(state), "utf8");
        await rename(temporary, demoStorePath());
      }
      return result;
    });
  runtime.salonDemoQueue = run;
  return run;
}
