"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarClock, AlertOctagon, CheckCircle2, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collectionsSummary, dcPayments, type DCPayment, type PaymentStatus } from "@/lib/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: "#15803d",
  due: "#c9a961",
  overdue: "#b91c1c",
  scheduled: "#2d4063",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
  scheduled: "Scheduled",
};

const STATUS_BADGE: Record<
  PaymentStatus,
  { variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  paid: { variant: "success" },
  due: { variant: "warning" },
  overdue: { variant: "destructive" },
  scheduled: { variant: "secondary" },
};

export function DCDashboard() {
  const [typeFilter, setTypeFilter] = useState<"all" | DCPayment["type"]>("all");

  const filtered = useMemo(
    () =>
      typeFilter === "all"
        ? dcPayments
        : dcPayments.filter((p) => p.type === typeFilter),
    [typeFilter]
  );

  const upcoming = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "due" || p.status === "scheduled" || p.status === "overdue")
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
        .slice(0, 6),
    [filtered]
  );

  const pieData = useMemo(() => {
    const grouped: Record<PaymentStatus, number> = { paid: 0, due: 0, overdue: 0, scheduled: 0 };
    for (const p of filtered) grouped[p.status] += p.amount;
    return (Object.keys(grouped) as PaymentStatus[]).map((s) => ({
      name: STATUS_LABELS[s],
      value: grouped[s],
      key: s,
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Collected YTD"
          value={formatCurrency(collectionsSummary.collectedYtd)}
          tone="success"
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(collectionsSummary.outstanding)}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <KpiCard
          label="Overdue"
          value={formatCurrency(collectionsSummary.overdue)}
          tone="destructive"
          icon={<AlertOctagon className="h-4 w-4" />}
        />
        <KpiCard
          label="Collection rate"
          value={`${Math.round(collectionsSummary.collectionRate * 100)}%`}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Collections by status</CardTitle>
                <CardDescription>Filter by payment type to focus the breakdown.</CardDescription>
              </div>
              <Badge variant="gold">Live</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "Development Charges", "Cash in Lieu Parkland"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? "border-navy bg-navy text-white"
                      : "border-border bg-card text-slate-warm hover:border-navy hover:text-navy"
                  }`}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => {
                      const n = typeof v === "number" ? v : Number(v ?? 0);
                      return [formatCurrency(n), name as string];
                    }}
                    contentStyle={{
                      borderRadius: 6,
                      border: "1px solid #e4e4e7",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {pieData.map((d) => (
                <div key={d.key} className="flex items-center justify-between rounded border border-border bg-muted/30 px-2 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.key] }} />
                    {d.name}
                  </span>
                  <span className="font-medium">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming and overdue payments</CardTitle>
            <CardDescription>
              Ranked by due date. Click a row in production to open the developer account.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Due</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-navy">{p.project}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.developer} <span aria-hidden>•</span> {p.ward}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-warm">
                      {p.type === "Development Charges" ? "DC" : "CIL"}
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-warm">{formatDate(p.dueDate)}</td>
                    <td className="py-3 pr-3 text-right font-medium text-navy">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant={STATUS_BADGE[p.status].variant}>
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className="text-gold-dark">{icon}</span>
      </div>
      <div
        className={`mt-2 font-display text-2xl font-semibold ${
          tone === "success"
            ? "text-emerald-700"
            : tone === "destructive"
            ? "text-red-700"
            : "text-navy"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
