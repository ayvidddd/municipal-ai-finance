"use client";
import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Receipt,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatCurrency } from "@/lib/utils";
import type { MonthlyPoint } from "@/lib/forecast";

type DashboardData = {
  kpis: { variancePct: number; outstanding: number; openBreaks: number; aiActionsToday: number };
  series: MonthlyPoint[];
  anomalies: Array<{ id: number; date: string; vendor: string; amount: number; reasons: string[] }>;
  reconciliation: { matched: number; breaks: number; total: number };
  audit: Array<{ id: number; timestamp: string; actor: string; action: string; entity: string; details: string | null }>;
};

export function DashboardClient() {
  const [data, setData] = React.useState<DashboardData | null>(null);

  React.useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered finance operations across forecasting, collections, and capital markets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Budget Variance"
          value={data ? `${data.kpis.variancePct > 0 ? "+" : ""}${data.kpis.variancePct}%` : ""}
          delta="vs forecast"
          trend={data && data.kpis.variancePct < 0 ? "down" : "up"}
          icon={<TrendingUp className="w-4 h-4" />}
          href="/solutions/financial-forecasting"
          loading={!data}
          index={0}
        />
        <KpiCard
          label="DC/CIL Outstanding"
          value={data ? formatCurrency(data.kpis.outstanding) : ""}
          delta="across all developers"
          icon={<Receipt className="w-4 h-4" />}
          href="/solutions/dc-cil"
          loading={!data}
          index={1}
        />
        <KpiCard
          label="Open Recon Breaks"
          value={data ? String(data.kpis.openBreaks) : ""}
          delta={data ? `${data.reconciliation.matched.toLocaleString()} matched` : ""}
          trend={data && data.kpis.openBreaks > 5 ? "down" : "flat"}
          icon={<RefreshCw className="w-4 h-4" />}
          href="/solutions/reconciliation"
          loading={!data}
          index={2}
        />
        <KpiCard
          label="AI Actions Today"
          value={data ? String(data.kpis.aiActionsToday) : ""}
          delta="across all agents"
          icon={<Sparkles className="w-4 h-4" />}
          href="/tools/audit"
          loading={!data}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Cash flow</CardTitle>
              <p className="text-xs text-subtle mt-0.5">Actuals plus 6-month forecast</p>
            </div>
            <Link
              href="/solutions/financial-forecasting"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-[280px]" />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series}>
                    <defs>
                      <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="forecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--subtle)"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--subtle)"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${formatCompact(Number(v))}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v) => formatCurrency(Number(v))}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#actual)"
                      name="Actual"
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="url(#forecast)"
                      name="Forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent anomalies</CardTitle>
            <Link
              href="/solutions/financial-forecasting"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data && [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}
            {data && data.anomalies.length === 0 && (
              <EmptyState
                icon={<AlertTriangle className="w-4 h-4" />}
                title="No anomalies detected"
                description="Your books look healthy."
              />
            )}
            {data?.anomalies.map((a) => (
              <Link
                key={a.id}
                href={`/solutions/financial-forecasting?anomaly=${a.id}`}
                className="flex items-start gap-3 p-2.5 rounded-md border border-border hover:bg-surface-2 transition-colors"
              >
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-warning/10 text-warning">
                  <AlertTriangle className="w-3 h-3" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.vendor}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.reasons[0]}</p>
                </div>
                <span className="text-sm tabular-nums">{formatCurrency(a.amount)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation status</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-[200px]" />
            ) : (
              <div className="h-[200px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Matched", value: data.reconciliation.matched, color: "#10B981" },
                        { name: "Breaks", value: data.reconciliation.breaks, color: "#EF4444" },
                      ]}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-semibold tabular-nums">
                    {data.reconciliation.matched.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">matched</span>
                </div>
              </div>
            )}
            {data && (
              <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Matched</span>
                  <span className="font-medium">{data.reconciliation.matched}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  <span className="text-muted-foreground">Breaks</span>
                  <span className="font-medium">{data.reconciliation.breaks}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>AI activity feed</CardTitle>
            <Link href="/tools/audit" className="text-xs text-primary hover:underline">
              Full audit log
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {!data && [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9" />)}
            {data?.audit.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 transition-colors"
              >
                <Badge variant={a.actor === "system" ? "default" : "primary"}>{a.actor}</Badge>
                <span className="text-sm flex-1 min-w-0 truncate">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-muted-foreground"> on {a.entity}</span>
                </span>
                <span className="text-xs text-subtle shrink-0 tabular-nums">
                  {formatDistanceToNow(new Date(a.timestamp.replace(" ", "T") + "Z"), { addSuffix: true })}
                </span>
              </div>
            ))}
            {data?.audit.length === 0 && (
              <EmptyState
                icon={<Sparkles className="w-4 h-4" />}
                title="No activity yet"
                description="Trigger an action in a solution to see it logged here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
