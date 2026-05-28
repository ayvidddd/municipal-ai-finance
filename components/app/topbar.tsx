"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Moon, Search, Sun, Settings as SettingsIcon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { NotificationBell } from "./notifications";
import { CommandPalette } from "./command-palette";

const LABEL_MAP: Record<string, string> = {
  "": "Dashboard",
  solutions: "Solutions",
  "financial-forecasting": "Financial Forecasting",
  "dc-cil": "DC/CIL Management",
  reconciliation: "Trade Reconciliation",
  tools: "Tools",
  chat: "MuniBot Chat",
  "email-triage": "Email Triage",
  audit: "Audit Log",
  settings: "Settings",
};

function crumbs(pathname: string): { label: string; href: string }[] {
  if (pathname === "/") return [{ label: "Dashboard", href: "/" }];
  const parts = pathname.split("/").filter(Boolean);
  const out: { label: string; href: string }[] = [{ label: "Dashboard", href: "/" }];
  let acc = "";
  for (const p of parts) {
    acc += "/" + p;
    out.push({ label: LABEL_MAP[p] || p, href: acc });
  }
  return out;
}

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme, showLiveBadge } = useTheme();
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = crumbs(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="h-full px-6 flex items-center gap-4">
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            {items.map((c, i) => (
              <React.Fragment key={c.href}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-subtle shrink-0" />}
                <Link
                  href={c.href}
                  className={
                    i === items.length - 1
                      ? "font-medium text-foreground truncate"
                      : "text-muted-foreground hover:text-foreground transition-colors truncate"
                  }
                >
                  {c.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          <div className="flex-1 max-w-md mx-auto">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full h-8 flex items-center gap-2 px-3 rounded-md border border-border bg-surface text-sm text-muted-foreground hover:border-border-strong transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search or jump to...</span>
              <span className="kbd">⌘K</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {showLiveBadge && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium uppercase tracking-wider text-success bg-success/10">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Live Demo
              </span>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationBell icon={<Bell className="w-4 h-4" />} />
            <Link
              href="/settings"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
