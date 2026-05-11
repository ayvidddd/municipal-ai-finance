"use client";

import { AlertTriangle, FileSearch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { discrepancies } from "@/lib/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";

const sevVariant: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export function DiscrepancyPanel() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Discrepancy flags</CardTitle>
            <CardDescription>
              Issues identified across DC and CIL records, including by law alignment and unit count reconciliations.
            </CardDescription>
          </div>
          <Badge variant="gold" className="gap-1">
            <FileSearch className="h-3.5 w-3.5" />
            {discrepancies.length} open
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {discrepancies.map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-navy/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-navy">{d.developer}</span>
                      <Badge variant={sevVariant[d.severity]}>{d.severity}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-warm leading-relaxed">
                      {d.issue}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Amount affected
                  </div>
                  <div className="font-display text-base font-semibold text-navy">
                    {formatCurrency(d.amountAffected)}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {formatDate(d.detected)} <span aria-hidden>•</span> {d.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
