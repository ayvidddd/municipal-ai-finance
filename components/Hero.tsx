"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, LineChart, BadgeCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-gradient text-white">
      <CitySkyline />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-gold-light backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            Built for municipal governments
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
            Intelligent financial management for the public sector.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-200 sm:text-lg leading-relaxed">
            Two purpose built AI solutions that help finance teams forecast with
            confidence, surface anomalies early, and bring Development Charges
            and parkland Cash in Lieu collections into one transparent view.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="#solutions"
              className={cn(buttonVariants({ variant: "gold", size: "lg" }))}
            >
              Explore the solutions
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo/forecasting-dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 text-white hover:bg-white hover:text-navy"
              )}
            >
              See a live demo
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <Stat icon={<LineChart className="h-4 w-4" />} value="98%" label="Forecast accuracy across pilots" />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} value="$3.4M" label="Anomalous spend flagged annually" />
            <Stat icon={<BadgeCheck className="h-4 w-4" />} value="11 days" label="Average reduction in DC review time" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-gold-light">
        {icon}
        <span className="text-xs uppercase tracking-widest">Outcome</span>
      </div>
      <div className="mt-1 font-display text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-300 leading-snug">{label}</div>
    </div>
  );
}

function CitySkyline() {
  return (
    <svg
      viewBox="0 0 1440 360"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 w-full h-[60%] opacity-30"
    >
      <defs>
        <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1a2e" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f1a2e" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a961" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c9a961" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="1100" cy="80" r="60" fill="url(#goldGlow)" />
      <circle cx="1100" cy="80" r="22" fill="#c9a961" opacity="0.5" />

      <g fill="#2d4063" opacity="0.95">
        <rect x="20" y="220" width="60" height="140" />
        <rect x="90" y="180" width="70" height="180" />
        <rect x="170" y="210" width="50" height="150" />
        <polygon points="220,210 250,170 280,210 280,360 220,360" />
        <rect x="290" y="160" width="90" height="200" />
        <rect x="390" y="200" width="50" height="160" />
        <rect x="450" y="140" width="80" height="220" />
        <polygon points="530,140 565,100 600,140 600,360 530,360" />
        <rect x="610" y="180" width="70" height="180" />
        <rect x="690" y="120" width="60" height="240" />
        <rect x="760" y="160" width="100" height="200" />
        <rect x="870" y="200" width="50" height="160" />
        <rect x="930" y="140" width="80" height="220" />
        <polygon points="1010,140 1050,90 1090,140 1090,360 1010,360" />
        <rect x="1100" y="170" width="60" height="190" />
        <rect x="1170" y="200" width="80" height="160" />
        <rect x="1260" y="160" width="60" height="200" />
        <rect x="1330" y="190" width="90" height="170" />
      </g>

      <g fill="#c9a961" opacity="0.7">
        <rect x="35" y="240" width="6" height="8" />
        <rect x="50" y="260" width="6" height="8" />
        <rect x="105" y="200" width="6" height="8" />
        <rect x="125" y="220" width="6" height="8" />
        <rect x="180" y="230" width="6" height="8" />
        <rect x="310" y="180" width="6" height="8" />
        <rect x="335" y="200" width="6" height="8" />
        <rect x="470" y="160" width="6" height="8" />
        <rect x="495" y="180" width="6" height="8" />
        <rect x="630" y="200" width="6" height="8" />
        <rect x="710" y="140" width="6" height="8" />
        <rect x="780" y="180" width="6" height="8" />
        <rect x="810" y="200" width="6" height="8" />
        <rect x="950" y="160" width="6" height="8" />
        <rect x="975" y="200" width="6" height="8" />
        <rect x="1120" y="190" width="6" height="8" />
        <rect x="1280" y="180" width="6" height="8" />
        <rect x="1350" y="210" width="6" height="8" />
      </g>

      <rect x="0" y="0" width="1440" height="360" fill="url(#skylineFade)" />
    </svg>
  );
}
