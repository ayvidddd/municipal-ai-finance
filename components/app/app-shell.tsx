"use client";
import * as React from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ThemeProvider, useTheme } from "./theme-provider";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 fade-in">{children}</main>
      </div>
      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          className: "!bg-surface !border-border !text-foreground",
        }}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
