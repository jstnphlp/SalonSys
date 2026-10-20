export const permissions = {
  dashboardView: "dashboard:view",
  customersRead: "customers:read",
  customersWrite: "customers:write",
  customersDelete: "customers:delete",
  filesRead: "files:read",
  filesWrite: "files:write",
  filesDelete: "files:delete",
  auditRead: "audit:read",
  membersManage: "members:manage",
  settingsManage: "settings:manage",
  servicesRead: "services:read",
  servicesManage: "services:manage",
  staffRead: "staff:read",
  staffManage: "staff:manage",
  appointmentsRead: "appointments:read",
  appointmentsManage: "appointments:manage",
  attendanceRead: "attendance:read",
  attendanceManage: "attendance:manage",
  attendanceClock: "attendance:clock",
  payrollManage: "payroll:manage",
  payslipsRead: "payslips:read",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];
export type AppRole = "admin" | "manager" | "staff";

const rolePermissions: Record<AppRole, ReadonlySet<Permission> | "all"> = {
  admin: "all",
  manager: new Set([
    permissions.dashboardView,
    permissions.customersRead,
    permissions.customersWrite,
    permissions.customersDelete,
    permissions.filesRead,
    permissions.filesWrite,
    permissions.filesDelete,
    permissions.auditRead,
    permissions.servicesRead,
    permissions.staffRead,
    permissions.appointmentsRead,
    permissions.appointmentsManage,
    permissions.attendanceRead,
    permissions.attendanceManage,
    permissions.attendanceClock,
    permissions.payslipsRead,
  ]),
  staff: new Set([
    permissions.dashboardView,
    permissions.servicesRead,
    permissions.appointmentsRead,
    permissions.attendanceClock,
    permissions.payslipsRead,
    permissions.filesRead,
    permissions.filesWrite,
    permissions.filesDelete,
  ]),
};

export function hasPermission(role: AppRole, permission: Permission) {
  const allowed = rolePermissions[role];
  return allowed === "all" || allowed.has(permission);
}
