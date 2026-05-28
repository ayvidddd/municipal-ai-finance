"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  RefreshCw,
  MessageSquare,
  Mail,
  ScrollText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const SOLUTIONS: NavItem[] = [
  { href: "/solutions/financial-forecasting", label: "Financial Forecasting", icon: <TrendingUp className="w-4 h-4" /> },
  { href: "/solutions/dc-cil", label: "DC/CIL Management", icon: <Receipt className="w-4 h-4" /> },
  { href: "/solutions/reconciliation", label: "Trade Reconciliation", icon: <RefreshCw className="w-4 h-4" /> },
];

const TOOLS: NavItem[] = [
  { href: "/tools/chat", label: "MuniBot Chat", icon: <MessageSquare className="w-4 h-4" /> },
  { href: "/tools/email-triage", label: "Email Triage", icon: <Mail className="w-4 h-4" /> },
  { href: "/tools/audit", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const v = localStorage.getItem("sidebar-collapsed");
    if (v === "true") setCollapsed(true);
  }, []);

  React.useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r border-border bg-surface flex flex-col transition-[width] duration-200",
        collapsed ? "w-[60px]" : "w-[232px]"
      )}
    >
      <div className="flex items-center gap-2 h-14 px-4 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-info flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold tracking-tight text-sm truncate">Municipal AI</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        <NavItemLink
          href="/"
          label="Dashboard"
          icon={<LayoutDashboard className="w-4 h-4" />}
          collapsed={collapsed}
          active={pathname === "/"}
        />

        <NavGroup label="Solutions" collapsed={collapsed}>
          {SOLUTIONS.map((item) => (
            <NavItemLink
              key={item.href}
              {...item}
              collapsed={collapsed}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </NavGroup>

        <NavGroup label="Tools" collapsed={collapsed}>
          {TOOLS.map((item) => (
            <NavItemLink
              key={item.href}
              {...item}
              collapsed={collapsed}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </NavGroup>

        <NavGroup label="System" collapsed={collapsed}>
          <NavItemLink
            href="/settings"
            label="Settings"
            icon={<Settings className="w-4 h-4" />}
            collapsed={collapsed}
            active={pathname === "/settings"}
          />
        </NavGroup>
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-full flex items-center justify-center h-8 rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-subtle">
          {label}
        </div>
      )}
      {collapsed && <div className="mx-3 my-2 h-px bg-border" />}
      {children}
    </div>
  );
}

function NavItemLink({
  href,
  label,
  icon,
  collapsed,
  active,
}: NavItem & { collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2.5 h-8 rounded-md text-sm transition-colors px-2.5",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
