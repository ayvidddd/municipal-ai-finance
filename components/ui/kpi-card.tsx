"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  trend,
  icon,
  href,
  loading,
  index = 0,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: React.ReactNode;
  href?: string;
  loading?: boolean;
  index?: number;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group rounded-lg border border-border bg-surface p-4 transition-all",
        href && "hover:border-border-strong hover:bg-surface-2 cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-subtle group-hover:text-primary transition-colors">{icon}</span>}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="skeleton h-7 w-24 rounded" />
        ) : (
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        )}
      </div>
      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {trend === "up" && <ArrowUp className="w-3 h-3 text-success" />}
          {trend === "down" && <ArrowDown className="w-3 h-3 text-danger" />}
          <span
            className={cn(
              "tabular-nums",
              trend === "up" && "text-success",
              trend === "down" && "text-danger",
              (!trend || trend === "flat") && "text-muted-foreground"
            )}
          >
            {delta}
          </span>
        </div>
      )}
    </motion.div>
  );
  if (href)
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  return content;
}
