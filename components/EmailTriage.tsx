"use client";

import { useMemo, useState } from "react";
import { Mail, Flame, Clock, Inbox, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { triagedEmails, type EmailPriority } from "@/lib/mockData";

const priorityConfig: Record<
  EmailPriority,
  { label: string; variant: "destructive" | "secondary" | "warning" | "success"; icon: React.ReactNode; color: string }
> = {
  urgent: { label: "Urgent", variant: "destructive", icon: <Flame className="h-3.5 w-3.5" />, color: "border-red-200 bg-red-50" },
  normal: { label: "Normal", variant: "warning", icon: <Clock className="h-3.5 w-3.5" />, color: "border-amber-200 bg-amber-50" },
  low: { label: "Low", variant: "secondary", icon: <Inbox className="h-3.5 w-3.5" />, color: "border-slate-200 bg-slate-50" },
};

export function EmailTriage() {
  const [filter, setFilter] = useState<"all" | EmailPriority>("all");
  const [activeId, setActiveId] = useState<string>(triagedEmails[0]?.id ?? "");

  const visible = useMemo(
    () => (filter === "all" ? triagedEmails : triagedEmails.filter((e) => e.priority === filter)),
    [filter]
  );

  const active = triagedEmails.find((e) => e.id === activeId) ?? visible[0];

  const counts = useMemo(() => {
    return {
      all: triagedEmails.length,
      urgent: triagedEmails.filter((e) => e.priority === "urgent").length,
      normal: triagedEmails.filter((e) => e.priority === "normal").length,
      low: triagedEmails.filter((e) => e.priority === "low").length,
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Email triage</CardTitle>
            <CardDescription>
              Incoming developer and resident messages, sorted and routed by AI.
            </CardDescription>
          </div>
          <Badge variant="gold" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI sorted
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "urgent", "normal", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-slate-warm hover:border-navy hover:text-navy"
              }`}
            >
              {f === "all" ? "All" : f} ({counts[f]})
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-2 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
            {visible.map((e) => {
              const cfg = priorityConfig[e.priority];
              const isActive = active?.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setActiveId(e.id)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                    isActive ? "border-navy bg-navy/5 shadow-sm" : `${cfg.color} hover:border-navy/40`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={cfg.variant} className="gap-1 capitalize">
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{e.receivedAt}</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-navy line-clamp-1">{e.subject}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{e.from}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-warm line-clamp-2">{e.preview}</div>
                </button>
              );
            })}
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
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-widest text-gold-dark">
                        {active.category}
                      </div>
                      <h4 className="mt-1 font-display text-xl font-semibold text-navy">
                        {active.subject}
                      </h4>
                      <div className="mt-1 text-xs text-muted-foreground">
                        From {active.from} <span aria-hidden>•</span> {active.receivedAt}
                      </div>
                    </div>
                    <Badge variant={priorityConfig[active.priority].variant} className="capitalize">
                      {priorityConfig[active.priority].label}
                    </Badge>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-foreground">{active.preview}</p>

                  <div className="mt-6 rounded-md border border-gold/40 bg-gold/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark">
                      <Sparkles className="h-3.5 w-3.5" />
                      Suggested action
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {active.suggestedAction}
                    </p>
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
