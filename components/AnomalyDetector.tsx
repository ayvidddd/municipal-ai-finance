"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { anomalies as initialAnomalies, type Anomaly } from "@/lib/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";

const severityConfig: Record<
  Anomaly["severity"],
  { label: string; variant: "destructive" | "warning" | "secondary"; icon: React.ReactNode }
> = {
  high: { label: "High", variant: "destructive", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  medium: { label: "Medium", variant: "warning", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  low: { label: "Low", variant: "secondary", icon: <Info className="h-3.5 w-3.5" /> },
};

const statusConfig: Record<Anomaly["status"], { label: string; tone: string }> = {
  open: { label: "Open", tone: "text-red-700 bg-red-50 border-red-100" },
  reviewing: { label: "Reviewing", tone: "text-amber-700 bg-amber-50 border-amber-100" },
  cleared: { label: "Cleared", tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
};

export function AnomalyDetector() {
  const [filter, setFilter] = useState<"all" | Anomaly["severity"]>("all");
  const [activeId, setActiveId] = useState<string | null>(initialAnomalies[0]?.id ?? null);
  const [items, setItems] = useState<Anomaly[]>(initialAnomalies);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((a) => a.severity === filter)),
    [filter, items]
  );

  const active = items.find((a) => a.id === activeId) ?? visible[0];

  const counts = useMemo(() => {
    return {
      all: items.length,
      high: items.filter((a) => a.severity === "high").length,
      medium: items.filter((a) => a.severity === "medium").length,
      low: items.filter((a) => a.severity === "low").length,
    };
  }, [items]);

  function setStatus(id: string, status: Anomaly["status"]) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Anomaly Detection</CardTitle>
            <CardDescription>
              Flagged transactions across departments, ranked by severity. Models review every posting nightly.
            </CardDescription>
          </div>
          <Badge variant="gold">{visible.length} flagged</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-slate-warm hover:border-navy hover:text-navy"
              }`}
            >
              {f === "all" ? "All" : f} {`(${counts[f]})`}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-2 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
            {visible.map((a) => {
              const cfg = severityConfig[a.severity];
              const isActive = active?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`group w-full text-left rounded-lg border px-4 py-3 transition-all ${
                    isActive
                      ? "border-navy bg-navy/5 shadow-sm"
                      : "border-border bg-card hover:border-navy/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={cfg.variant} className="gap-1">
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(a.date)}
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-sm text-navy">{a.vendor}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.department} <span aria-hidden>•</span> {a.category}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-navy">
                      {formatCurrency(a.amount)}
                    </span>
                    <span className="inline-flex items-center text-muted-foreground group-hover:text-navy">
                      View
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                No anomalies match this filter.
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-gold-dark">
                        Transaction {active.id}
                      </div>
                      <h4 className="mt-1 font-display text-xl font-semibold text-navy">
                        {active.vendor}
                      </h4>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {active.department} <span aria-hidden>•</span>{" "}
                        {active.category} <span aria-hidden>•</span>{" "}
                        {formatDate(active.date)}
                      </div>
                    </div>
                    <Badge variant={severityConfig[active.severity].variant}>
                      {severityConfig[active.severity].label} severity
                    </Badge>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <KeyValue label="Posted amount" value={formatCurrency(active.amount)} tone="navy" />
                    <KeyValue label="Expected" value={formatCurrency(active.expected)} />
                    <KeyValue
                      label="Delta"
                      value={`${
                        active.amount > active.expected ? "+" : ""
                      }${(((active.amount - active.expected) / active.expected) * 100).toFixed(0)}%`}
                      tone="warning"
                    />
                  </div>

                  <div className="mt-6 rounded-md border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      AI rationale
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {active.reason}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        statusConfig[active.status].tone
                      }`}
                    >
                      {statusConfig[active.status].label}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(active.id, "reviewing")}
                        disabled={active.status === "reviewing"}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-navy hover:border-navy disabled:opacity-50"
                      >
                        Mark reviewing
                      </button>
                      <button
                        onClick={() => setStatus(active.id, "cleared")}
                        disabled={active.status === "cleared"}
                        className="rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light disabled:opacity-50"
                      >
                        Clear flag
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeyValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "navy" | "warning";
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-lg font-semibold ${
          tone === "warning"
            ? "text-amber-700"
            : tone === "navy"
            ? "text-navy"
            : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
