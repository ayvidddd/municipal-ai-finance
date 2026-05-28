"use client";
import * as React from "react";

type Theme = "light" | "dark";
type Density = "compact" | "comfortable";

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  density: Density;
  setDensity: (d: Density) => void;
  showLiveBadge: boolean;
  setShowLiveBadge: (v: boolean) => void;
};

const ThemeCtx = React.createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [density, setDensityState] = React.useState<Density>("comfortable");
  const [showLiveBadge, setShowLiveBadgeState] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme) || "dark";
    const d = (localStorage.getItem("density") as Density) || "comfortable";
    const b = localStorage.getItem("showLiveBadge");
    setThemeState(t);
    setDensityState(d);
    setShowLiveBadgeState(b === null ? true : b === "true");
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.density = density;
    localStorage.setItem("density", density);
  }, [density, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("showLiveBadge", String(showLiveBadge));
  }, [showLiveBadge, mounted]);

  const value: Ctx = {
    theme,
    setTheme: setThemeState,
    density,
    setDensity: setDensityState,
    showLiveBadge,
    setShowLiveBadge: setShowLiveBadgeState,
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
