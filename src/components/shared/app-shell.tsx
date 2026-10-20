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
  MoreHorizontal,
  Search,
  Bell,
  ArrowUpRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { signOutAction } from "@/features/auth/actions";
import { hasPermission, type Permission } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5"
      aria-label="SalonSys salon workspace"
    >
      <span className="grid size-9 place-items-center rounded-[12px] bg-primary text-primary-foreground">
        <Scissors className="size-5" strokeWidth={1.6} />
      </span>
      <span>
        <span className="block text-[16px] leading-none font-semibold tracking-[-0.035em] text-primary">
          SalonSys
        </span>
        <span className="mt-1 block text-[9px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Salon workspace
        </span>
      </span>
    </Link>
  );
}
export function AppShell({
  user,
  salon,
  demoControls,
  children,
}: {
  user: CurrentUser;
  salon: { id: string; name: string } | null;
  demoControls?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname(),
    [menuOpen, setMenuOpen] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const initials = user.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  const available = salon
    ? navigation.filter((n) => hasPermission(user.role, n.permission))
    : [];
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const nav = (
    <nav aria-label="Primary navigation" className="space-y-1">
      {available.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setMenuOpen(false)}
          aria-current={active(n.href) ? "page" : undefined}
          className={cn(
            "group flex min-h-9 w-full items-center gap-3 rounded-[11px] px-3 py-2 text-[13px] font-medium transition-all duration-200",
            active(n.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-primary/10"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
        >
          <n.icon
            className={cn(
              "size-[17px] shrink-0 transition-transform duration-200 group-hover:scale-105",
              active(n.href) ? "text-primary/75" : "text-muted-foreground",
            )}
          />
          <span>{n.label}</span>
          {active(n.href) && (
            <span className="ml-auto size-1.5 rounded-full bg-primary/65" />
          )}
        </Link>
      ))}
    </nav>
  );
  const account = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Open account menu for ${user.fullName}`}
            className="group flex w-full items-center gap-2 rounded-[13px] px-2 py-2 text-left transition-colors outline-none hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring/30 data-popup-open:bg-sidebar-accent"
          />
        }
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-primary text-[11px] font-semibold text-primary-foreground">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold">
            {user.fullName}
          </span>
          <span className="mt-0.5 block text-[9px] text-muted-foreground capitalize">
            {user.role === "admin" ? "Salon administrator" : user.role}
          </span>
        </span>
        <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[248px] rounded-[16px] bg-popover p-1.5 shadow-[0_18px_60px_rgba(15,23,42,0.16)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2.5">
            <span className="block text-xs font-semibold">{user.fullName}</span>
            <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<Link href="/settings/profile" />}
            className="rounded-[10px] px-2.5 py-2 text-xs"
          >
            <Contact />
            Profile settings
          </DropdownMenuItem>
          {hasPermission(user.role, "settings:manage") && (
            <DropdownMenuItem
              render={<Link href="/settings/salon" />}
              className="rounded-[10px] px-2.5 py-2 text-xs"
            >
              <Settings />
              Salon settings
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            render={<Link href="/select-salon" />}
            className="rounded-[10px] px-2.5 py-2 text-xs"
          >
            <ChevronDown />
            Change salon
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          variant="destructive"
          onClick={() =>
            start(async () => {
              await signOutAction();
            })
          }
          className="rounded-[10px] px-2.5 py-2 text-xs"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <div className="workspace-shell flex h-dvh min-h-0 w-full overflow-hidden bg-sidebar text-foreground">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-background p-3 focus:not-sr-only focus:fixed"
      >
        Skip to content
      </a>
      <aside className="hidden h-full w-[230px] shrink-0 flex-col overflow-hidden px-3.5 py-5 lg:flex">
        <div className="px-2.5">
          <Brand />
        </div>
        <div className="mt-9 min-h-0 flex-1 overflow-y-auto">
          <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Workspace
          </p>
          {nav}
        </div>
        <div className="space-y-2 pt-6">
          <Link
            href="/select-salon"
            className="flex items-center justify-between gap-2 px-2 text-[10px] text-muted-foreground"
          >
            <span className="truncate">{salon?.name ?? "Choose a salon"}</span>
            <ChevronDown className="size-3 shrink-0" />
          </Link>
          {account}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden p-3 lg:pl-0">
        <section className="workspace-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:rounded-[22px]">
          <header className="flex min-h-[60px] shrink-0 flex-wrap items-center gap-3 bg-background/90 px-4 py-2 backdrop-blur md:px-7 xl:px-9">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="order-3 w-full lg:order-none lg:w-auto">
              {demoControls}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-8 w-[220px] items-center gap-2 rounded-[10px] bg-muted/80 px-3 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent md:flex xl:w-[250px]"
              >
                <Search className="size-3.5" />
                <span>Search workspace...</span>
                <kbd className="ml-auto rounded-md bg-card px-1.5 py-0.5 text-[9px] shadow-sm">
                  Ctrl K
                </kbd>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Search workspace"
                onClick={() => setSearchOpen(true)}
              >
                <Search />
              </Button>
              <Link
                href="/dashboard#needs-attention"
                aria-label="View items needing attention"
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <Bell className="size-4" />
              </Link>
            </div>
          </header>
          <main
            id="main-content"
            className="min-h-0 min-w-0 flex-1 touch-pan-y [scrollbar-gutter:stable] overflow-x-hidden overflow-y-auto overscroll-y-contain"
          >
            {children}
          </main>
        </section>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-[18px] bg-card/95 p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.14)] backdrop-blur lg:hidden"
      >
        {available
          .filter(
            (n) =>
              !(
                hasPermission(user.role, "attendance:read") &&
                n.href === "/my-attendance"
              ) &&
              !(
                hasPermission(user.role, "payroll:manage") &&
                n.href === "/my-payslips"
              ),
          )
          .slice(0, 5)
          .map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[12px] px-1 py-2 text-[9px] font-medium",
                active(n.href)
                  ? "bg-accent text-primary"
                  : "text-muted-foreground",
              )}
            >
              <n.icon className="size-4" />
              <span className="truncate">{n.label}</span>
            </Link>
          ))}
      </nav>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="fixed inset-y-3 left-3 flex w-[280px] max-w-[calc(100vw-1.5rem)] flex-col rounded-[18px] bg-sidebar p-4">
          <DialogHeader>
            <DialogTitle className="sr-only">Navigation</DialogTitle>
            <DialogDescription className="sr-only">
              Salon workspace pages and account settings
            </DialogDescription>
            <Brand />
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
          {account}
        </DialogContent>
      </Dialog>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="rounded-[18px]">
          <DialogHeader>
            <DialogTitle>Search workspace</DialogTitle>
            <DialogDescription>
              Find a page in your salon workspace.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            aria-label="Search workspace pages"
            placeholder="Search pages..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="mt-3 space-y-1">
            {available
              .filter((n) =>
                n.label.toLowerCase().includes(query.toLowerCase()),
              )
              .map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 rounded-[11px] px-3 py-3 text-sm hover:bg-muted"
                >
                  <n.icon className="size-4 text-muted-foreground" />
                  {n.label}
                  <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" />
                </Link>
              ))}
            {!available.some((n) =>
              n.label.toLowerCase().includes(query.toLowerCase()),
            ) && (
              <p className="p-4 text-sm text-muted-foreground">
                No matching pages.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
