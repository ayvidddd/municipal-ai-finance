"use client";
import * as React from "react";
import { toast } from "sonner";
import { Moon, RefreshCw, Sun, Trash2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/app/theme-provider";
import { useRouter } from "next/navigation";

export function SettingsClient() {
  const { theme, setTheme, density, setDensity, showLiveBadge, setShowLiveBadge } = useTheme();
  const [resetting, setResetting] = React.useState(false);
  const router = useRouter();

  async function reset() {
    if (!confirm("Reset all demo data? This will re-seed the database.")) return;
    setResetting(true);
    const r = await fetch("/api/reset", { method: "POST" });
    setResetting(false);
    if (r.ok) {
      toast.success("Demo data reset");
      router.refresh();
    } else {
      toast.error("Reset failed");
    }
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your experience.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Theme" description="Choose between light and dark mode.">
            <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-md">
              <button
                onClick={() => setTheme("light")}
                className={`h-7 px-3 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  theme === "light" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Sun className="w-3 h-3" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`h-7 px-3 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  theme === "dark" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Moon className="w-3 h-3" />
                Dark
              </button>
            </div>
          </Row>
          <Row label="Sidebar density" description="Compact reduces spacing in tables and lists.">
            <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-md">
              <button
                onClick={() => setDensity("compact")}
                className={`h-7 px-3 rounded text-xs font-medium transition-colors ${
                  density === "compact" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setDensity("comfortable")}
                className={`h-7 px-3 rounded text-xs font-medium transition-colors ${
                  density === "comfortable" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Comfortable
              </button>
            </div>
          </Row>
          <Row label="Live Demo badge" description="Show the green badge in the top bar.">
            <button
              onClick={() => setShowLiveBadge(!showLiveBadge)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showLiveBadge ? "bg-primary" : "bg-surface-2 border border-border"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  showLiveBadge ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label="Reset demo data"
            description="Wipes the SQLite database and re-seeds with fresh transactions, accounts, trades, and emails."
          >
            <Button variant="outline" size="sm" onClick={reset} disabled={resetting}>
              <RefreshCw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Resetting..." : "Reset"}
            </Button>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyboard shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <ShortcutRow keys={["⌘", "K"]} description="Open command palette" />
            <ShortcutRow keys={["Esc"]} description="Close any drawer or modal" />
            <ShortcutRow keys={["Enter"]} description="Send chat message" />
            <ShortcutRow keys={["Shift", "Enter"]} description="New line in chat input" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      {children}
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            <span className="kbd">{k}</span>
            {i < keys.length - 1 && <span className="text-xs text-subtle">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
