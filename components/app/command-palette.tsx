"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  RefreshCw,
  MessageSquare,
  Mail,
  ScrollText,
  Settings,
  AlertTriangle,
  Sparkles,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "./theme-provider";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function go(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
      <div
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in"
      />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-surface shadow-2xl overflow-hidden fade-in">
        <Command className="w-full">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full h-12 px-4 bg-transparent text-sm outline-none border-b border-border placeholder:text-subtle"
            autoFocus
          />
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>

            <Command.Group heading="Navigate">
              <Item icon={<LayoutDashboard className="w-4 h-4" />} onSelect={() => go("/")}>
                Dashboard
              </Item>
              <Item icon={<TrendingUp className="w-4 h-4" />} onSelect={() => go("/solutions/financial-forecasting")}>
                Financial Forecasting
              </Item>
              <Item icon={<Receipt className="w-4 h-4" />} onSelect={() => go("/solutions/dc-cil")}>
                DC/CIL Management
              </Item>
              <Item icon={<RefreshCw className="w-4 h-4" />} onSelect={() => go("/solutions/reconciliation")}>
                Trade Reconciliation
              </Item>
              <Item icon={<MessageSquare className="w-4 h-4" />} onSelect={() => go("/tools/chat")}>
                Open MuniBot Chat
              </Item>
              <Item icon={<Mail className="w-4 h-4" />} onSelect={() => go("/tools/email-triage")}>
                Email Triage
              </Item>
              <Item icon={<ScrollText className="w-4 h-4" />} onSelect={() => go("/tools/audit")}>
                Audit Log
              </Item>
              <Item icon={<Settings className="w-4 h-4" />} onSelect={() => go("/settings")}>
                Settings
              </Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Item
                icon={<RefreshCw className="w-4 h-4" />}
                onSelect={() => go("/solutions/reconciliation?action=run")}
              >
                Run Reconciliation
              </Item>
              <Item
                icon={<AlertTriangle className="w-4 h-4" />}
                onSelect={() => go("/solutions/financial-forecasting?tab=anomalies")}
              >
                Show Flagged Transactions
              </Item>
              <Item
                icon={<Sparkles className="w-4 h-4" />}
                onSelect={() => go("/solutions/financial-forecasting?action=rerun")}
              >
                Re-run Forecast
              </Item>
              <Item icon={<Bell className="w-4 h-4" />} onSelect={() => go("/tools/audit")}>
                View Recent Activity
              </Item>
            </Command.Group>

            <Command.Group heading="Preferences">
              <Item
                icon={theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                onSelect={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  onOpenChange(false);
                }}
              >
                Switch to {theme === "dark" ? "Light" : "Dark"} Mode
              </Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({
  icon,
  children,
  onSelect,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-surface-2 aria-selected:text-foreground text-muted-foreground transition-colors"
    >
      <span className="text-subtle">{icon}</span>
      <span>{children}</span>
    </Command.Item>
  );
}
