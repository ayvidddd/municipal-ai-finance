"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { forecasts, type Department, type MonthlyDataPoint } from "@/lib/mockData";
import { formatCompact, formatCurrency } from "@/lib/utils";

type Mode = "all" | Department;

export function ForecastChart() {
  const [mode, setMode] = useState<Mode>("Roads");

  const dataset = useMemo(() => {
    const target =
      mode === "all"
        ? aggregate(forecasts.flatMap((f) => f.monthly))
        : forecasts.find((f) => f.department === mode)!.monthly;
    return target.map((d) => ({
      month: d.month,
      Actual: d.actual,
      Forecast: d.forecast,
      Budget: d.budget,
      lower: d.lower,
      upper: d.upper,
      band:
        d.lower !== undefined && d.upper !== undefined
          ? [d.lower, d.upper]
          : undefined,
    }));
  }, [mode]);

  const splitIndex = dataset.findIndex((d) => d.Forecast !== undefined);
  const splitMonth =
    splitIndex > 0 ? dataset[splitIndex - 1]?.month : undefined;

  const summary = useMemo(() => {
    if (mode === "all") {
      const total = forecasts.reduce((acc, f) => acc + f.annualBudget, 0);
      const ytd = forecasts.reduce((acc, f) => acc + f.ytdActual, 0);
      const variance = forecasts.reduce((acc, f) => acc + f.variance, 0);
      return {
        annualBudget: total,
        ytdActual: ytd,
        variance,
        variancePct: (variance / ytd) * 100,
      };
    }
    const d = forecasts.find((f) => f.department === mode)!;
    return {
      annualBudget: d.annualBudget,
      ytdActual: d.ytdActual,
      variance: d.variance,
      variancePct: d.variancePct,
    };
  }, [mode]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>12 Month Spend Forecast</CardTitle>
          <CardDescription>
            Historical actuals, projected spend with 90% confidence band, and approved budget envelope.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <DeptButton active={mode === "all"} onClick={() => setMode("all")}>
            All departments
          </DeptButton>
          {forecasts.map((f) => (
            <DeptButton
              key={f.department}
              active={mode === f.department}
              onClick={() => setMode(f.department)}
            >
              {f.department}
            </DeptButton>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <SummaryStat label="Annual budget" value={formatCurrency(summary.annualBudget)} />
          <SummaryStat label="YTD actual" value={formatCurrency(summary.ytdActual)} />
          <SummaryStat
            label="YTD variance"
            value={formatCurrency(summary.variance, { signDisplay: "always" })}
            tone={summary.variance >= 0 ? "warning" : "success"}
          />
          <SummaryStat
            label="Variance %"
            value={`${summary.variancePct >= 0 ? "+" : ""}${summary.variancePct.toFixed(1)}%`}
            tone={summary.variance >= 0 ? "warning" : "success"}
          />
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a961" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#c9a961" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => formatCompact(v as number)}
                width={64}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#c9a961", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                wrapperStyle={{ fontSize: 12, color: "#475569" }}
              />
              {splitMonth && (
                <ReferenceLine
                  x={splitMonth}
                  stroke="#1a2942"
                  strokeDasharray="4 4"
                  label={{
                    value: "Forecast →",
                    position: "insideTopRight",
                    fill: "#1a2942",
                    fontSize: 11,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="band"
                stroke="none"
                fill="url(#bandFill)"
                isAnimationActive
                name="Confidence band"
              />
              <Line
                type="monotone"
                dataKey="Budget"
                stroke="#64748b"
                strokeDasharray="5 5"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="#1a2942"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#1a2942" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Forecast"
                stroke="#c9a961"
                strokeWidth={2.5}
                strokeDasharray="3 3"
                dot={{ r: 2.5, fill: "#c9a961" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="gold">AI generated</Badge>
          Forecast updated nightly using 36 months of historical posting data, vendor patterns, and macro indicators.
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-xl font-semibold ${
          tone === "success"
            ? "text-emerald-700"
            : tone === "warning"
            ? "text-amber-700"
            : "text-navy"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DeptButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-navy bg-navy text-white"
          : "border-border bg-card text-slate-warm hover:border-navy hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const items = payload as Array<{ name: string; value: number; color: string; dataKey: string }>;
  const filtered = items.filter((p) => p.dataKey !== "band" && p.value !== undefined);
  return (
    <div className="rounded-md border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="text-xs font-semibold text-navy">{label}</div>
      <div className="mt-1 space-y-0.5 text-xs">
        {filtered.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">
              {formatCurrency(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function aggregate(rows: MonthlyDataPoint[]): MonthlyDataPoint[] {
  const map = new Map<string, MonthlyDataPoint>();
  for (const row of rows) {
    const existing = map.get(row.month);
    if (!existing) {
      map.set(row.month, { ...row });
      continue;
    }
    existing.budget += row.budget;
    if (row.actual !== undefined) {
      existing.actual = (existing.actual ?? 0) + row.actual;
    }
    if (row.forecast !== undefined) {
      existing.forecast = (existing.forecast ?? 0) + row.forecast;
    }
    if (row.lower !== undefined) {
      existing.lower = (existing.lower ?? 0) + row.lower;
    }
    if (row.upper !== undefined) {
      existing.upper = (existing.upper ?? 0) + row.upper;
    }
  }
  return Array.from(map.values());
}
