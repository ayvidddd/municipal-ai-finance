"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function BenefitsList({ benefits }: { benefits: string[] }) {
  return (
    <ul className="space-y-3">
      {benefits.map((b, i) => (
        <motion.li
          key={b}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="flex items-start gap-3 rounded-md border border-border bg-card p-4"
        >
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold/15 text-gold-dark">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <span className="text-sm text-foreground leading-relaxed">{b}</span>
        </motion.li>
      ))}
    </ul>
  );
}
