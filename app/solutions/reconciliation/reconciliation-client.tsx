"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type Trade = {
  id: number;
  trade_id: string;
  date: string;
  instrument: string;
  counterparty: string;
  quantity: number;
  price: number;
  total_value: number;
  settlement_date: string;
  status: string;
};

type Break = {
  id: number;
  trade_id: string;
  break_type: string;
  system_a_value: string | null;
  system_b_value: string | null;
  detected_at: string;
  resolved: number;
  sla_deadline: string;
  investigation_notes: string | null;
};

type Data = {
  a: Trade[];
  b: Trade[];
  breaks: Break[];
  kpis: { totalTrades: number; matched: number; breaks: number; slaAtRisk: number };
};

type InvestStream = {
  text: string;
  toolUses: Array<{ name: string; input: Record<string, unknown> }>;
  toolResults: Array<{ name: string; result: unknown }>;
  done: boolean;
};

export function ReconciliationClient() {
  const [data, setData] = React.useState<Data | null>(null);
  const [running, setRunning] = React.useState(false);
  const [matchedIds, setMatchedIds] = React.useState<Set<string>>(new Set());
  const [counters, setCounters] = React.useState({ matched: 0, breaks: 0 });
  const [selectedBreak, setSelectedBreak] = React.useState<Break | null>(null);
  const [invest, setInvest] = React.useState<InvestStream | null>(null);
  const [investRunning, setInvestRunning] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/reconciliation", { cache: "no-store" });
    const json = await r.json();
    setData(json);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function runRecon() {
    if (!data) return;
    setRunning(true);
    setMatchedIds(new Set());
    setCounters({ matched: 0, breaks: 0 });
    const breakSet = new Set(data.breaks.map((b) => b.trade_id));
    const matched = data.a.filter((t) => !breakSet.has(t.trade_id));
    const total = matched.length;
    const step = Math.max(1, Math.floor(total / 60));

    for (let i = 0; i < total; i += step) {
      await new Promise((res) => setTimeout(res, 25));
      setMatchedIds((prev) => {
        const next = new Set(prev);
        for (let j = i; j < Math.min(i + step, total); j++) {
          next.add(matched[j].trade_id);
        }
        return next;
      });
      setCounters({ matched: Math.min(i + step, total), breaks: data.kpis.breaks });
    }
    setRunning(false);
    toast.success(`Reconciliation complete. ${total} matched, ${data.kpis.breaks} breaks.`);
  }

  async function investigate(br: Break) {
    setInvest({ text: "", toolUses: [], toolResults: [], done: false });
    setInvestRunning(true);
    const r = await fetch("/api/reconciliation/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ break_id: br.id }),
    });
    if (!r.ok || !r.body) {
      toast.error("Investigation failed");
      setInvestRunning(false);
      return;
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let textAcc = "";
    const tools: InvestStream["toolUses"] = [];
    const results: InvestStream["toolResults"] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const ev = JSON.parse(line) as { type: string; [k: string]: unknown };
          if (ev.type === "text") {
            textAcc += ev.text as string;
            setInvest({ text: textAcc, toolUses: tools, toolResults: results, done: false });
          } else if (ev.type === "tool_use") {
            tools.push({ name: ev.name as string, input: ev.input as Record<string, unknown> });
            setInvest({ text: textAcc, toolUses: [...tools], toolResults: [...results], done: false });
          } else if (ev.type === "tool_result") {
            results.push({ name: ev.name as string, result: ev.result });
            setInvest({ text: textAcc, toolUses: [...tools], toolResults: [...results], done: false });
          } else if (ev.type === "done") {
            setInvest({ text: textAcc, toolUses: [...tools], toolResults: [...results], done: true });
          }
        } catch {}
      }
    }
    setInvestRunning(false);
  }

  async function resolveBreak(br: Break) {
    const r = await fetch("/api/reconciliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_break", id: br.id, notes: invest?.text.slice(0, 500) }),
    });
    if (r.ok) {
      toast.success("Break resolved");
      setSelectedBreak(null);
      setInvest(null);
      load();
    }
  }

  async function genReport() {
    setReportOpen(true);
    setReportLoading(true);
    const r = await fetch("/api/reconciliation/report", { method: "POST" });
    const json = await r.json();
    setReport(json.report);
    setReportLoading(false);
  }

  const breakIds = React.useMemo(() => new Set(data?.breaks.map((b) => b.trade_id) || []), [data?.breaks]);

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade Reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Match trades across systems, investigate breaks, hit SLA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={genReport}>
            <FileText className="w-3.5 h-3.5" />
            Month-end report
          </Button>
          <Button size="sm" onClick={runRecon} disabled={running}>
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Running..." : "Run reconciliation"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Trades" value={data ? data.kpis.totalTrades : ""} loading={!data} index={0} />
        <KpiCard
          label="Matched"
          value={running ? counters.matched.toLocaleString() : data ? data.kpis.matched.toLocaleString() : ""}
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          loading={!data}
          index={1}
        />
        <KpiCard
          label="Breaks"
          value={data ? data.kpis.breaks : ""}
          trend="down"
          icon={<AlertTriangle className="w-4 h-4 text-danger" />}
          loading={!data}
          index={2}
        />
        <KpiCard
          label="SLA at Risk"
          value={data ? data.kpis.slaAtRisk : ""}
          trend="down"
          icon={<RefreshCw className="w-4 h-4" />}
          loading={!data}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SystemPane title="System A" subtitle="Front office" tone="left" rows={data?.a || []} breakIds={breakIds} matchedIds={matchedIds} loading={!data} />
        <SystemPane title="System B" subtitle="Middle office" tone="right" rows={data?.b || []} breakIds={breakIds} matchedIds={matchedIds} loading={!data} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open breaks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!data && [0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
          {data?.breaks.filter((b) => !b.resolved).map((br) => (
            <BreakCard key={br.id} br={br} onInvestigate={() => { setSelectedBreak(br); investigate(br); }} />
          ))}
        </CardContent>
      </Card>

      <Drawer
        open={!!selectedBreak}
        onOpenChange={(v) => {
          if (!v) {
            setSelectedBreak(null);
            setInvest(null);
          }
        }}
        title={selectedBreak ? `Break · ${selectedBreak.trade_id}` : ""}
        description={selectedBreak ? `${selectedBreak.break_type} break` : ""}
        width="w-[600px]"
      >
        {selectedBreak && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-[10px] uppercase tracking-wider text-subtle mb-1">System A</div>
                <div className="text-sm font-mono">{selectedBreak.system_a_value || "—"}</div>
              </div>
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-subtle mb-1">System B</div>
                <div className="text-sm font-mono">{selectedBreak.system_b_value || "—"}</div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  AI Investigation
                </h3>
                {investRunning && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Thinking...
                  </span>
                )}
              </div>
              {invest && invest.toolUses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {invest.toolUses.map((t, i) => (
                    <Badge key={i} variant="primary" className="font-mono">
                      <Sparkles className="w-2.5 h-2.5" />
                      {t.name}
                    </Badge>
                  ))}
                </div>
              )}
              {invest?.text && (
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{invest.text}</pre>
              )}
              {!invest && (
                <p className="text-sm text-muted-foreground">Investigation will start automatically.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" onClick={() => investigate(selectedBreak)} disabled={investRunning}>
                <RefreshCw className="w-3 h-3" />
                Re-investigate
              </Button>
              <Button variant="success" size="sm" onClick={() => resolveBreak(selectedBreak)}>
                Mark resolved
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={reportOpen} onOpenChange={setReportOpen} title="Month-end reconciliation report" size="lg">
        {reportLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{report}</pre>
        )}
      </Modal>
    </div>
  );
}

function SystemPane({
  title,
  subtitle,
  tone,
  rows,
  breakIds,
  matchedIds,
  loading,
}: {
  title: string;
  subtitle: string;
  tone: "left" | "right";
  rows: Trade[];
  breakIds: Set<string>;
  matchedIds: Set<string>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline gap-2">
          <CardTitle>{title}</CardTitle>
          <span className="text-xs text-subtle">{subtitle}</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        )}
        {!loading && (
          <div className="max-h-[440px] overflow-y-auto -mx-3">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider">Trade</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider">Inst</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider">Px</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map((t) => {
                  const isBreak = breakIds.has(t.trade_id);
                  const isMatched = matchedIds.has(t.trade_id);
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "border-b border-border last:border-b-0 transition-colors",
                        isBreak && "bg-danger/5",
                        isMatched && "bg-success/5"
                      )}
                    >
                      <td className="px-3 py-1.5 font-mono">
                        <span className="inline-flex items-center gap-1.5">
                          {isMatched && <CheckCircle2 className="w-3 h-3 text-success" />}
                          {isBreak && <AlertTriangle className="w-3 h-3 text-danger" />}
                          {t.trade_id}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 truncate max-w-[120px]">{t.instrument}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{t.quantity.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{t.price.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakCard({ br, onInvestigate }: { br: Break; onInvestigate: () => void }) {
  const [open, setOpen] = React.useState(false);
  const slaTime = new Date(br.sla_deadline).getTime();
  const now = Date.now();
  const overdue = slaTime < now;
  const hoursLeft = Math.round((slaTime - now) / 3600000);
  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 hover:bg-surface-2 transition-colors">
        {open ? <ChevronDown className="w-3.5 h-3.5 text-subtle" /> : <ChevronRight className="w-3.5 h-3.5 text-subtle" />}
        <span className="font-mono text-sm font-medium">{br.trade_id}</span>
        <Badge variant={br.break_type === "missing" ? "danger" : "warning"}>{br.break_type}</Badge>
        <span className="flex-1" />
        <span className={cn("text-xs", overdue ? "text-danger font-medium" : "text-muted-foreground")}>
          {overdue ? `SLA breached ${Math.abs(hoursLeft)}h ago` : `${hoursLeft}h to SLA`}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-surface-2 p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-subtle">System A</div>
                  <div className="text-sm font-mono">{br.system_a_value || "—"}</div>
                </div>
                <div className="rounded-md bg-warning/5 border border-warning/30 p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-subtle">System B</div>
                  <div className="text-sm font-mono">{br.system_b_value || "—"}</div>
                </div>
              </div>
              <Button size="sm" onClick={onInvestigate}>
                <Sparkles className="w-3 h-3" />
                Investigate with AI
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
