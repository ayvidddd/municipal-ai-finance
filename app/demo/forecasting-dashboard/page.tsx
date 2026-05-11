import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForecastChart } from "@/components/ForecastChart";
import { AnomalyDetector } from "@/components/AnomalyDetector";
import { BudgetVariance } from "@/components/BudgetVariance";
import { Badge } from "@/components/ui/badge";

export default function ForecastingDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/solutions/financial-forecasting"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-warm hover:text-navy"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to solution overview
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
            Financial Forecasting Demo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-warm leading-relaxed">
            Live data sandbox. Switch departments, drill into flagged
            transactions, and review variance against AI generated forecasts.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <Badge variant="gold">Mock municipal data</Badge>
          <span>Refreshed nightly</span>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        <ForecastChart />
        <div className="grid gap-8 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <AnomalyDetector />
          </div>
          <div className="xl:col-span-2">
            <BudgetVariance />
          </div>
        </div>
      </div>
    </div>
  );
}
