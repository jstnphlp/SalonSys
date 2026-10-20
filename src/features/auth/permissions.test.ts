import { describe, expect, it } from "vitest";

import { hasPermission, permissions } from "@/features/auth/permissions";

describe("role permissions", () => {
  it("allows administrators to perform every defined permission", () => {
    expect(
      Object.values(permissions).every((permission) =>
        hasPermission("admin", permission),
      ),
    ).toBe(true);
  });

  it("allows managers to maintain customers but not roles", () => {
    expect(hasPermission("manager", permissions.customersWrite)).toBe(true);
    expect(hasPermission("manager", permissions.customersDelete)).toBe(true);
    expect(hasPermission("manager", permissions.membersManage)).toBe(false);
  });

  it("keeps customer contacts and team pay private from staff", () => {
    expect(hasPermission("staff", permissions.customersRead)).toBe(false);
    expect(hasPermission("staff", permissions.payrollManage)).toBe(false);
    expect(hasPermission("manager", permissions.payrollManage)).toBe(false);
    expect(hasPermission("staff", permissions.payslipsRead)).toBe(true);
    expect(hasPermission("staff", permissions.customersWrite)).toBe(false);
    expect(hasPermission("staff", permissions.customersDelete)).toBe(false);
  });
});
