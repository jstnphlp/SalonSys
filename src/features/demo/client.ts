import "server-only";
import { cookies } from "next/headers";
import { usesHostedDemoStorage } from "@/config/demo";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database.generated";
import { customerFormSchema } from "@/features/customers/schemas";
import { hasPermission } from "@/features/auth/permissions";
import { profileSchema } from "@/features/auth/schemas";
import {
  auditDemo,
  demoRole,
  DemoError,
  executeDemoRpc,
  value,
  visibleDemoRows,
} from "./engine";
import { demoId, type DemoRow, type DemoState } from "./seed";
import { withDemoState } from "./store";

type Result = {
  data: unknown;
  error: { message: string; code: string } | null;
  count?: number | null;
};
function failure(error: unknown): Result {
  return {
    data: null,
    error: {
      message:
        error instanceof Error ? error.message : "Demo operation failed.",
      code: error instanceof DemoError ? error.code : "P0001",
    },
  };
}
class DemoQuery implements PromiseLike<Result> {
  private filters: ((row: DemoRow) => boolean)[] = [];
  private projection = "*";
  private operation = "select";
  private payload: DemoRow = {};
  private start = 0;
  private end = Infinity;
  private sort?: { field: string; ascending: boolean };
  private head = false;
  constructor(
    private table: string,
    private user: string | null,
  ) {}
  select(fields = "*", options?: { head?: boolean }) {
    this.projection = fields;
    this.head = !!options?.head;
    return this;
  }
  eq(field: string, input: unknown) {
    this.filters.push((row) => row[field] === input);
    return this;
  }
  is(field: string, input: unknown) {
    return this.eq(field, input);
  }
  in(field: string, inputs: unknown[]) {
    this.filters.push((row) => inputs.includes(row[field]));
    return this;
  }
  ilike(field: string, pattern: string) {
    const needle = pattern.replace(/^%|%$/g, "").toLowerCase();
    this.filters.push((row) =>
      value(row, field).toLowerCase().includes(needle),
    );
    return this;
  }
  order(field: string, options?: { ascending?: boolean }) {
    this.sort = { field, ascending: options?.ascending !== false };
    return this;
  }
  range(start: number, end: number) {
    this.start = start;
    this.end = end + 1;
    return this;
  }
  limit(count: number) {
    this.end = count;
    return this;
  }
  insert(row: DemoRow) {
    this.operation = "insert";
    this.payload = row;
    return this;
  }
  update(row: DemoRow) {
    this.operation = "update";
    this.payload = row;
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  private mutate(state: DemoState, matches: DemoRow[]): DemoRow[] {
    if (this.table === "profiles" && this.operation === "update") {
      const name = profileSchema.parse({ fullName: this.payload.full_name });
      const row = state.tables.profiles.find(
        (p) => p.id === this.user && matches.some((m) => m.id === p.id),
      );
      if (!row) throw new DemoError("Permission denied", "42501");
      row.full_name = name.fullName;
      return [row];
    }
    if (this.table !== "customers")
      throw new DemoError(
        "This direct write is unavailable in demo mode.",
        "42501",
      );
    const rows = this.operation === "insert" ? [this.payload] : matches;
    const now = new Date().toISOString();
    return rows.map((row) => {
      const org = value(row, "organization_id"),
        role = demoRole(state, this.user, org);
      if (
        !role ||
        !hasPermission(
          role,
          this.operation === "delete" ? "customers:delete" : "customers:write",
        )
      )
        throw new DemoError("Permission denied", "42501");
      const old = this.operation === "insert" ? null : structuredClone(row);
      if (this.operation === "delete") {
        if (state.tables.appointments.some((a) => a.customer_id === row.id))
          throw new DemoError(
            "Customer has appointment history. Mark them inactive instead.",
            "23503",
          );
        state.tables.customers = state.tables.customers.filter(
          (c) => c.id !== row.id,
        );
        auditDemo(state, this.user, org, "customers", row, old, "delete");
        return row;
      }
      const input = { ...row, ...this.payload };
      const parsed = customerFormSchema.parse({
        name: input.name,
        email: input.email ?? "",
        phone: input.phone ?? "",
        notes: input.notes ?? "",
        status: input.status,
        organizationId: org,
      });
      const result = {
        ...(old ?? {}),
        id: row.id ?? crypto.randomUUID(),
        organization_id: org,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
        status: parsed.status,
        created_by: old?.created_by ?? this.user,
        updated_by: this.user,
        created_at: old?.created_at ?? now,
        updated_at: now,
      };
      if (old) Object.assign(row, result);
      else state.tables.customers.push(result);
      auditDemo(state, this.user, org, "customers", result, old);
      return result;
    });
  }
  private async execute(single = false): Promise<Result> {
    try {
      return await withDemoState((state) => {
        const draft = structuredClone(state);
        let rows = visibleDemoRows(draft, this.user, this.table).filter((row) =>
          this.filters.every((filter) => filter(row)),
        );
        if (this.operation !== "select") {
          rows = this.mutate(draft, rows);
          state.tables = draft.tables;
        }
        const count = rows.length;
        if (this.sort) {
          const { field, ascending } = this.sort;
          rows.sort(
            (a, b) =>
              value(a, field).localeCompare(value(b, field), undefined, {
                numeric: true,
              }) * (ascending ? 1 : -1),
          );
        }
        rows = rows
          .slice(this.start, this.end)
          .map((row) =>
            this.projection === "*"
              ? structuredClone(row)
              : Object.fromEntries(
                  this.projection
                    .split(",")
                    .map((key) => [key.trim(), row[key.trim()] ?? null]),
                ),
          );
        return {
          data: this.head ? null : single ? (rows[0] ?? null) : rows,
          error: null,
          count,
        };
      }, this.operation !== "select");
    } catch (error) {
      return failure(error);
    }
  }
  maybeSingle() {
    return this.execute(true);
  }
  single() {
    return this.execute(true);
  }
  then<T = Result, E = never>(
    fulfilled?: ((value: Result) => T | PromiseLike<T>) | null,
    rejected?: ((reason: unknown) => E | PromiseLike<E>) | null,
  ): PromiseLike<T | E> {
    return this.execute().then(fulfilled, rejected);
  }
}
export async function createDemoClient(): Promise<SupabaseClient<Database>> {
  const jar = await cookies(),
    selected = jar.get("demo-user-id")?.value;
  const user =
    selected === "signed-out"
      ? null
      : z
          .uuid()
          .catch(demoId(0, 1))
          .parse(selected ?? demoId(0, 1));
  const setIdentity = (id: string) =>
    jar.set("demo-user-id", id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  const client = {
    from: (table: string) => new DemoQuery(table, user),
    rpc: async (name: string, args: DemoRow = {}): Promise<Result> => {
      try {
        const data = await withDemoState(
          (state) => executeDemoRpc(state, user, name, args),
          !["salon_read", "salon_members"].includes(name) &&
            // A Server Component cannot set response cookies. Page-view audit
            // records are ephemeral in the hosted demo; business writes remain
            // audited in the browser's persisted demo snapshot.
            !(usesHostedDemoStorage() && name === "log_payslip_access"),
        );
        return { data, error: null };
      } catch (error) {
        return failure(error);
      }
    },
    auth: {
      getClaims: async () => ({
        data: {
          claims: user
            ? {
                sub: user,
                email: await withDemoState(
                  (state) =>
                    state.tables.profiles.find((p) => p.id === user)?.email ??
                    "",
                ),
              }
            : {},
        },
        error: null,
      }),
      signInWithPassword: async (input: {
        email: string;
        password: string;
      }) => {
        const account = await withDemoState((state) =>
          state.tables.profiles.find(
            (p) =>
              value(p, "email").toLowerCase() === input.email.toLowerCase(),
          ),
        );
        if (!account || input.password !== "Starter123!")
          return {
            error: {
              message: "Use a sample demo account with password Starter123!",
            },
          };
        setIdentity(value(account, "id"));
        jar.delete("salon-id");
        return { error: null };
      },
      signOut: async () => {
        setIdentity("signed-out");
        jar.delete("salon-id");
        return { error: null };
      },
      updateUser: async () => ({
        error: {
          code: "demo",
          message: "Passwords are not changed in demo mode.",
        },
      }),
    },
  };
  // Adapter boundary: only the query/RPC surface used by this app is implemented.
  // No Supabase client, authentication request, SQL engine or database is created.
  return client as unknown as SupabaseClient<Database>;
}
