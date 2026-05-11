"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#solutions", label: "Solutions" },
  { href: "/solutions/financial-forecasting", label: "Forecasting" },
  { href: "/solutions/customer-service", label: "DC and CIL" },
  { href: "/demo/forecasting-dashboard", label: "Forecasting Demo" },
  { href: "/demo/chatbot", label: "Chatbot Demo" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-gold transition-transform group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold text-navy">
              Municipal AI Finance
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Public Sector Intelligence
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-warm hover:text-navy transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/#contact"
            className={cn(buttonVariants({ variant: "gold", size: "sm" }))}
          >
            Request a briefing
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-navy hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-warm hover:bg-muted hover:text-navy"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "gold", size: "sm" }), "mt-2")}
            >
              Request a briefing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
