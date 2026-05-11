"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { BenefitsList } from "@/components/BenefitsList";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SolutionCardProps {
  number: string;
  badge: string;
  title: string;
  description: string;
  benefits: string[];
  detailHref: string;
  demoHref: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
}

export function SolutionCard({
  number,
  badge,
  title,
  description,
  benefits,
  detailHref,
  demoHref,
  icon,
  defaultOpen = false,
}: SolutionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div className="flex items-start gap-5 p-6 sm:p-8">
          <div className="hidden sm:flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-navy text-gold">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gold-dark">
              <span className="font-mono">{number}</span>
              <span className="h-px w-6 bg-gold/50" />
              <span>{badge}</span>
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
              {title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm text-slate-warm sm:text-base leading-relaxed">
              {description}
            </p>
          </div>
          <div
            className={cn(
              "ml-auto flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border bg-background transition-transform",
              open && "rotate-180 bg-navy text-gold border-navy"
            )}
          >
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border"
          >
            <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-5">
              <div className="md:col-span-3">
                <div className="text-xs uppercase tracking-widest text-gold-dark">
                  Outcomes
                </div>
                <div className="mt-3">
                  <BenefitsList benefits={benefits} />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/40 p-5">
                  <div className="text-xs uppercase tracking-widest text-gold-dark">
                    Designed for
                  </div>
                  <div className="mt-2 font-display text-lg font-semibold text-navy">
                    Finance, Planning, and Treasury teams
                  </div>
                  <div className="mt-2 text-sm text-slate-warm leading-relaxed">
                    Built to slot into existing ERP, GIS, and permitting
                    systems without disrupting current workflows.
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={detailHref}
                    className={cn(buttonVariants({ variant: "default" }))}
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={demoHref}
                    className={cn(buttonVariants({ variant: "gold" }))}
                  >
                    Open live demo
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
