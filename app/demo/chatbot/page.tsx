import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DCDashboard } from "@/components/DCDashboard";
import { DiscrepancyPanel } from "@/components/DiscrepancyPanel";
import { EmailTriage } from "@/components/EmailTriage";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { Badge } from "@/components/ui/badge";

export default function ChatbotDemoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/solutions/customer-service"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-warm hover:text-navy"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to solution overview
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
            DC and CIL Operations Demo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-warm leading-relaxed">
            A working operations console for Development Charges and Cash in
            Lieu parkland: collections dashboard, discrepancy flags, email
            triage, and a live AI assistant for developers and staff.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <Badge variant="gold">Live chatbot, mock collections data</Badge>
          <span>Powered by Claude</span>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        <DCDashboard />

        <div className="grid gap-8 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <DiscrepancyPanel />
          </div>
          <div className="xl:col-span-2">
            <ChatbotWidget />
          </div>
        </div>

        <EmailTriage />
      </div>
    </div>
  );
}
