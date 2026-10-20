import { describe, expect, it } from "vitest";

import {
  customerFormSchema,
  customerListQuerySchema,
} from "@/features/customers/schemas";

describe("customer validation", () => {
  it("normalizes Philippine mobile numbers and requires a salon", () => {
    const input = {
      name: "Demo",
      email: "",
      phone: "0917 000 0001",
      status: "active",
      notes: "",
      organizationId: "10000000-0000-4000-8000-000000000001",
    };
    expect(customerFormSchema.parse(input).phone).toBe("+639170000001");
    expect(
      customerFormSchema.safeParse({ ...input, organizationId: "" }).success,
    ).toBe(false);
  });
  it("accepts and normalizes a valid customer form", () => {
    expect(
      customerFormSchema.parse({
        name: "  Northstar Supplies  ",
        email: "orders@northstar.example",
        phone: "  +1 555 0100  ",
        status: "active",
        notes: "  Priority account  ",
        organizationId: "10000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      name: "Northstar Supplies",
      email: "orders@northstar.example",
      phone: "+1 555 0100",
      status: "active",
      notes: "Priority account",
      organizationId: "10000000-0000-4000-8000-000000000001",
    });
  });

  it("rejects invalid contact data", () => {
    expect(
      customerFormSchema.safeParse({
        name: "",
        email: "not-an-email",
        phone: "",
        status: "unknown",
        notes: "",
        organizationId: "",
      }).success,
    ).toBe(false);
  });
});

describe("customer list query", () => {
  it("coerces supported URL values", () => {
    expect(
      customerListQuerySchema.parse({
        page: "2",
        pageSize: "20",
        search: "  north  ",
        status: "active",
        sort: "name",
        direction: "asc",
      }),
    ).toEqual({
      page: 2,
      pageSize: 20,
      search: "north",
      status: "active",
      sort: "name",
      direction: "asc",
    });
  });

  it("falls back safely for unsupported URL values", () => {
    expect(
      customerListQuerySchema.parse({
        page: "-1",
        pageSize: "999",
        sort: "sql",
      }),
    ).toMatchObject({ page: 1, pageSize: 10, sort: "created_at" });
  });
});
