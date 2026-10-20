"use client";
import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Wallet,
  Users,
  Scissors,
  Contact,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/features/auth/actions";
import { hasPermission, type Permission } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/queries";
import { cn } from "@/lib/utils";
const navigation: {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
}[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
    permission: "appointments:read",
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: Clock3,
    permission: "attendance:read",
  },
  {
    label: "My attendance",
    href: "/my-attendance",
    icon: Clock3,
    permission: "attendance:clock",
  },
  {
    label: "Payroll",
    href: "/payroll",
    icon: Wallet,
    permission: "payroll:manage",
  },
  {
    label: "My payslips",
    href: "/my-payslips",
    icon: Wallet,
    permission: "payslips:read",
  },
  { label: "Staff", href: "/staff", icon: Users, permission: "staff:read" },
  {
    label: "Services",
    href: "/services",
    icon: Scissors,
    permission: "services:read",
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Contact,
    permission: "customers:read",
  },
  {
    label: "Settings",
    href: "/settings/salon",
    icon: Settings,
    permission: "settings:manage",
  },
];
export function AppShell({
  user,
  salon,
  children,
}: {
  user: CurrentUser;
  salon: { id: string; name: string } | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const nav = (
    <nav aria-label="Primary navigation" className="space-y-1">
      {salon &&
        navigation
          .filter((n) => hasPermission(user.role, n.permission))
          .map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={(event) =>
                event.currentTarget.closest("details")?.removeAttribute("open")
              }
              aria-current={
                pathname === n.href || pathname.startsWith(n.href + "/")
                  ? "page"
                  : undefined
              }
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-foreground",
                (pathname === n.href || pathname.startsWith(n.href + "/")) &&
                  "bg-sidebar-accent font-semibold text-primary",
              )}
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </Link>
          ))}
    </nav>
  );
  const brand = (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        s
      </span>
      salonsys
      <span className="size-1.5 rounded-full bg-primary" />
    </Link>
  );
  const workspace = (
    <Link
      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm"
      href="/select-salon"
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Workspace
        </span>
        <span className="block truncate font-medium">
          {salon?.name ?? "Choose a salon"}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
  const account = (
    <div className="space-y-3 border-t pt-4">
      <Link
        href="/settings/profile"
        className="flex items-center gap-3 text-sm"
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
          {user.fullName.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{user.fullName}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {user.role === "admin" ? "Salon owner" : user.role}
          </span>
        </span>
        <ArrowUpRight className="size-4" />
      </Link>
      <form action={signOutAction}>
        <button className="flex items-center gap-2 text-xs text-muted-foreground">
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </form>
    </div>
  );
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        className="sr-only z-50 bg-card p-3 focus:not-sr-only focus:fixed"
        href="#main-content"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-svh flex-col gap-7 border-r bg-sidebar p-5 lg:flex">
        <div className="py-2">{brand}</div>
        {workspace}
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
        {account}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-5 backdrop-blur-sm sm:px-8">
          <div className="lg:hidden">{brand}</div>
          <p className="hidden truncate text-sm font-medium lg:block">
            {salon?.name ?? "Your salon workspace"}
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {new Intl.DateTimeFormat("en-PH", {
              timeZone: "Asia/Manila",
              weekday: "long",
              month: "short",
              day: "numeric",
            }).format(new Date())}{" "}
            · Manila
          </p>
          <details className="relative lg:hidden">
            <summary className="grid size-10 list-none place-items-center rounded-lg border">
              <span className="sr-only">Open navigation</span>
              <Menu className="size-5" />
            </summary>
            <div className="absolute top-12 right-0 max-h-[80svh] w-72 space-y-4 overflow-y-auto rounded-xl border bg-card p-4 shadow-lg">
              {workspace}
              {nav}
              {account}
            </div>
          </details>
        </header>
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
