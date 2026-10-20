import "server-only";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { cookies } from "next/headers";
import { z } from "zod";
import { createDemoSeed, type DemoState } from "./seed";

const cookieName = "salonsys-state-v1";
const chunkLength = 3000;
const maxChunks = 3;
const requiredTables = Object.keys(createDemoSeed().tables);
const stateSchema = z
  .object({
    version: z.literal(1),
    tables: z.record(z.string(), z.array(z.record(z.string(), z.json()))),
  })
  .refine((state) =>
    requiredTables.every((table) => Array.isArray(state.tables[table])),
  );

// These are synthetic, browser-owned demo records, not authentication/session
// credentials. No shared server memory, database or writable application disk.
export function encodeDemoCookies(state: DemoState) {
  const json = JSON.stringify(state);
  if (Buffer.byteLength(json, "utf8") > 512_000) {
    throw new Error("The demo is full. Use Reset demo to continue.");
  }
  const encoded = deflateRawSync(json).toString("base64url");
  if (encoded.length > chunkLength * maxChunks) {
    throw new Error("The demo is full. Use Reset demo to continue.");
  }
  const chunks = Array.from(
    { length: Math.ceil(encoded.length / chunkLength) },
    (_, i) => encoded.slice(i * chunkLength, (i + 1) * chunkLength),
  );
  return [
    { name: cookieName, value: String(chunks.length) },
    ...chunks.map((value, i) => ({ name: `${cookieName}.${i}`, value })),
  ];
}

export function decodeDemoCookies(
  entries: { name: string; value: string }[],
): DemoState | null {
  const values = new Map(entries.map((entry) => [entry.name, entry.value]));
  const count = values.get(cookieName);
  if (!count || !/^[1-3]$/.test(count)) return null;
  const chunks = Array.from({ length: Number(count) }, (_, i) =>
    values.get(`${cookieName}.${i}`),
  );
  if (
    chunks.some(
      (chunk) =>
        !chunk || chunk.length > chunkLength || !/^[A-Za-z0-9_-]+$/.test(chunk),
    )
  )
    return null;
  try {
    const json = inflateRawSync(Buffer.from(chunks.join(""), "base64url"), {
      maxOutputLength: 512_000,
    }).toString("utf8");
    return stateSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

export async function withCookieDemoState<T>(
  operation: (state: DemoState) => T | Promise<T>,
  write: boolean,
): Promise<T> {
  const jar = await cookies();
  const state = decodeDemoCookies(jar.getAll()) ?? createDemoSeed();
  const result = await operation(state);
  if (write) {
    // Encode and check the complete transaction before changing any cookies.
    const encoded = encodeDemoCookies(state);
    for (const entry of encoded) {
      jar.set(entry.name, entry.value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    for (let i = encoded.length - 1; i < maxChunks; i++)
      jar.delete(`${cookieName}.${i}`);
  }
  return result;
}
