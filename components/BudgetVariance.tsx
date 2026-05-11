"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { budgetVariance } from "@/lib/mockData";
import { formatCompact, formatCurrency } from "@/lib/utils";

export function BudgetVariance() {
  const data = budgetVariance.map((b) => ({
    department: b.department,
    Actual: b.actual,
    Forecast: b.forecast,
    variance: b.variance,
    variancePct: b.variancePct,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Budget Variance, year to date</CardTitle>
            <CardDescription>
              Actual posted spend against AI generated forecast for each department.
            </CardDescription>
          </div>
          <Badge variant="gold">Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="department" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => formatCompact(v as number)}
                width={56}
              />
              <Tooltip content={<VarianceTooltip />} />
              <Bar dataKey="Actual" radius={[4, 4, 0, 0]} barSize={26}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.variance >= 0 ? "#c9a961" : "#1a2942"} />
                ))}
              </Bar>
              <Bar dataKey="Forecast" radius={[4, 4, 0, 0]} barSize={26} fill="#cbd5e1">
                <LabelList
                  dataKey="variancePct"
                  position="top"
                  formatter={(v) => {
                    const n = typeof v === "number" ? v : Number(v ?? 0);
                    return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
                  }}
                  className="fill-slate-warm"
                  style={{ fontSize: 11, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {data.map((d) => (
            <div
              key={d.department}
              className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3"
            >
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {d.department}
                </div>
                <div className="mt-0.5 text-sm text-slate-warm">
                  Actual {formatCurrency(d.Actual)}
                </div>
              </div>
              <VarianceTag pct={d.variancePct} amount={d.variance} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VarianceTag({ pct, amount }: { pct: number; amount: number }) {
  const isOver = amount > 0;
  const isNeutral = Math.abs(pct) < 1;
  const Icon = isNeutral ? Minus : isOver ? ArrowUpRight : ArrowDownRight;
  const tone = isNeutral
    ? "text-slate-warm bg-slate-100"
    : isOver
    ? "text-amber-800 bg-amber-100"
    : "text-emerald-800 bg-emerald-100";
  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </div>
  );
}

function VarianceTooltip({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const items = payload as Array<{ name: string; value: number; color: string }>;
  return (
    <div className="rounded-md border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="text-xs font-semibold text-navy">{label}</div>
      <div className="mt-1 space-y-0.5 text-xs">
        {items.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
