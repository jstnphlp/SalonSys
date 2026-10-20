import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deflateRawSync } from "node:zlib";
import { cookies } from "next/headers";
import { readFile, writeFile } from "node:fs/promises";
import { createDemoSeed } from "./seed";
import { encodeDemoCookies, decodeDemoCookies } from "./cookie-store";
import { withDemoState } from "./store";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
  readFile: vi.fn(() => {
    throw new Error("Read-only deployment filesystem");
  }),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
}));

function cookieJar(entries: { name: string; value: string }[] = []) {
  const values = new Map(entries.map((entry) => [entry.name, entry.value]));
  return {
    getAll: () => [...values].map(([name, value]) => ({ name, value })),
    set: vi.fn((name: string, value: string) => values.set(name, value)),
    delete: vi.fn((name: string) => values.delete(name)),
  };
}
function useJar(jar: ReturnType<typeof cookieJar>) {
  vi.mocked(cookies).mockResolvedValue(
    jar as unknown as Awaited<ReturnType<typeof cookies>>,
  );
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("hosted demo cookie snapshots", () => {
  it("round-trips both salons and their calculation sources", () => {
    const state = createDemoSeed();
    expect(decodeDemoCookies(encodeDemoCookies(state))).toEqual(state);
    expect(
      encodeDemoCookies(state).every((cookie) => cookie.value.length <= 3000),
    ).toBe(true);
  });

  it("rejects corrupted, truncated or incomplete snapshots", () => {
    const encoded = encodeDemoCookies(createDemoSeed());
    expect(decodeDemoCookies(encoded.slice(0, 1))).toBeNull();
    expect(
      decodeDemoCookies([{ name: "salonsys-state-v1", value: "999" }]),
    ).toBeNull();
    expect(
      decodeDemoCookies([
        ...encoded.slice(0, 1),
        { name: "salonsys-state-v1.0", value: "not-valid-data" },
      ]),
    ).toBeNull();
    expect(
      decodeDemoCookies(encodeDemoCookies({ version: 1, tables: {} })),
    ).toBeNull();
  });

  it("limits both cookie headers and decompression size", () => {
    const state = createDemoSeed();
    state.tables.profiles[0].notes = Array.from({ length: 2000 }, () =>
      crypto.randomUUID(),
    ).join("");
    expect(() => encodeDemoCookies(state)).toThrow(
      "The demo is full. Use Reset demo to continue.",
    );
    const bomb = deflateRawSync("x".repeat(600_000)).toString("base64url");
    expect(
      decodeDemoCookies([
        { name: "salonsys-state-v1", value: "1" },
        { name: "salonsys-state-v1.0", value: bomb },
      ]),
    ).toBeNull();
  });
});

describe("serverless demo persistence without Supabase or writable disk", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SALONSYS_DEMO_MODE", undefined);
  });

  it("preserves writes across fresh request contexts and isolates browsers", async () => {
    const first = cookieJar();
    useJar(first);
    await withDemoState((state) => {
      state.tables.profiles[0].full_name = "Hosted demo owner";
    }, true);
    const nextRequest = cookieJar(first.getAll());
    useJar(nextRequest);
    expect(
      await withDemoState((state) => state.tables.profiles[0].full_name),
    ).toBe("Hosted demo owner");
    useJar(cookieJar());
    expect(
      await withDemoState((state) => state.tables.profiles[0].full_name),
    ).toBe("Alex Rivera");
    expect(readFile).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("does not change cookies if a transaction fails", async () => {
    const jar = cookieJar(encodeDemoCookies(createDemoSeed()));
    const previous = jar.getAll();
    useJar(jar);
    await expect(
      withDemoState((state) => {
        state.tables.profiles[0].full_name = "Must not persist";
        throw new Error("Booking conflict");
      }, true),
    ).rejects.toThrow("Booking conflict");
    expect(jar.getAll()).toEqual(previous);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("removes stale chunks when Reset demo reduces the snapshot", async () => {
    const state = createDemoSeed();
    state.tables.profiles[0].notes = Array.from({ length: 180 }, () =>
      crypto.randomUUID(),
    ).join("");
    const encoded = encodeDemoCookies(state);
    expect(encoded.length).toBeGreaterThan(2);
    const jar = cookieJar(encoded);
    useJar(jar);
    await withDemoState((current) => {
      current.tables = createDemoSeed().tables;
    }, true);
    expect(
      decodeDemoCookies(jar.getAll())?.tables.profiles[0].notes,
    ).toBeUndefined();
    expect(
      jar
        .getAll()
        .filter((entry) => entry.name.startsWith("salonsys-state-v1.")),
    ).toHaveLength(1);
  });
});
