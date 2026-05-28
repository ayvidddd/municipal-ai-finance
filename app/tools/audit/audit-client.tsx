"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, ChevronRight, Download, Search, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type Row = {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
};

export function AuditClient() {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [facets, setFacets] = React.useState<{ entities: { entity: string }[]; actors: { actor: string }[]; actions: { action: string }[] }>({ entities: [], actors: [], actions: [] });
  const [q, setQ] = React.useState("");
  const [entity, setEntity] = React.useState("");
  const [actor, setActor] = React.useState("");
  const [action, setAction] = React.useState("");
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  const load = React.useCallback(async () => {
    const url = new URL("/api/audit", window.location.origin);
    if (q) url.searchParams.set("q", q);
    if (entity) url.searchParams.set("entity", entity);
    if (actor) url.searchParams.set("actor", actor);
    if (action) url.searchParams.set("action", action);
    const r = await fetch(url.toString(), { cache: "no-store" });
    const j = await r.json();
    setRows(j.rows);
    setFacets(j.facets);
  }, [q, entity, actor, action]);

  React.useEffect(() => {
    const t = setTimeout(load, 100);
    return () => clearTimeout(t);
  }, [load]);

  function exportCsv() {
    const url = new URL("/api/audit", window.location.origin);
    url.searchParams.set("export", "csv");
    if (q) url.searchParams.set("q", q);
    if (entity) url.searchParams.set("entity", entity);
    if (actor) url.searchParams.set("actor", actor);
    if (action) url.searchParams.set("action", action);
    window.location.href = url.toString();
  }

  function toggle(id: number) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every action, AI or human, logged automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />
              <Input
                placeholder="Search actions, entities, details..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8"
              />
            </div>
            <select value={entity} onChange={(e) => setEntity(e.target.value)} className="h-9 px-2 rounded-md border border-border bg-input text-sm">
              <option value="">All entities</option>
              {facets.entities.map((f) => (
                <option key={f.entity} value={f.entity}>
                  {f.entity}
                </option>
              ))}
            </select>
            <select value={actor} onChange={(e) => setActor(e.target.value)} className="h-9 px-2 rounded-md border border-border bg-input text-sm">
              <option value="">All actors</option>
              {facets.actors.map((f) => (
                <option key={f.actor} value={f.actor}>
                  {f.actor}
                </option>
              ))}
            </select>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="h-9 px-2 rounded-md border border-border bg-input text-sm">
              <option value="">All actions</option>
              {facets.actions.map((f) => (
                <option key={f.action} value={f.action}>
                  {f.action}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {rows === null && [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}
            {rows && rows.length === 0 && (
              <EmptyState icon={<ScrollText className="w-4 h-4" />} title="No entries" description="Adjust your filters." />
            )}
            {rows?.map((r) => {
              const ts = new Date(r.timestamp.replace(" ", "T") + "Z");
              const isOpen = expanded.has(r.id);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-md border border-border bg-surface overflow-hidden"
                >
                  <button onClick={() => toggle(r.id)} className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-2 transition-colors text-left">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-subtle" /> : <ChevronRight className="w-3.5 h-3.5 text-subtle" />}
                    <Badge variant={r.actor === "ai" ? "primary" : r.actor === "system" ? "info" : "default"}>{r.actor}</Badge>
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                      {r.action}
                      <span className="text-muted-foreground font-normal"> on </span>
                      {r.entity}
                      {r.entity_id && <span className="text-subtle"> #{r.entity_id}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                      {format(ts, "MMM d, HH:mm")}
                    </span>
                    <span className="text-xs text-subtle tabular-nums">
                      {formatDistanceToNow(ts, { addSuffix: true })}
                    </span>
                  </button>
                  {isOpen && r.details && (
                    <div className="border-t border-border p-3 bg-surface-2">
                      <pre className="text-xs font-mono whitespace-pre-wrap">{r.details}</pre>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
