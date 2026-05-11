import Link from "next/link";
import { ArrowRight, Banknote, MessagesSquare, Mail, RefreshCw, Database } from "lucide-react";
import { BenefitsList } from "@/components/BenefitsList";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CustomerServiceSolutionPage() {
  return (
    <>
      <section className="bg-navy-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-xs uppercase tracking-widest text-gold-light">
            Solution 02
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold text-balance sm:text-5xl">
            Manage Development Charges and Cash in Lieu parkland payments with one intelligent system.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-200 leading-relaxed sm:text-lg">
            AI analyzes financial records, monitors payment schedules, flags
            discrepancies, and integrates data across permitting, GIS, and
            finance to give your team a single source of truth for DC and CIL
            collections.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo/chatbot"
              className={cn(buttonVariants({ variant: "gold", size: "lg" }))}
            >
              Open the live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 text-white hover:bg-white hover:text-navy"
              )}
            >
              Request a briefing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="text-xs uppercase tracking-widest text-gold-dark">
              What it does
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-navy">
              Four outcomes for collections, oversight, and service.
            </h2>
            <p className="mt-4 text-sm text-slate-warm leading-relaxed">
              Built for the realities of municipal collections: by laws that
              change, developers who need quick answers, and finance teams that
              need confidence the numbers reconcile.
            </p>
            <div className="mt-8">
              <BenefitsList
                benefits={[
                  "Real time dashboards and analytics of financial data across DC and CIL collections",
                  "Automate email triage by prioritizing urgent queries and streamlining web based intake",
                  "Adapt to municipal by law updates or fee changes to ensure payments stay current",
                  "Offer chatbot support, consistent answers, and proactive reminders to reduce missed payments",
                ]}
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Capability
              icon={<Banknote className="h-5 w-5" />}
              title="Collections command center"
              body="Unified view of DC and CIL receivables across permits, projects, and wards."
            />
            <Capability
              icon={<MessagesSquare className="h-5 w-5" />}
              title="Resident and developer chatbot"
              body="Always available answers grounded in your by laws and account records, with safe escalation to staff."
            />
            <Capability
              icon={<Mail className="h-5 w-5" />}
              title="Email and form triage"
              body="Incoming questions prioritized, classified, and drafted, so staff focus on judgment calls."
            />
            <Capability
              icon={<RefreshCw className="h-5 w-5" />}
              title="By law aware"
              body="Fee schedules and effective dates are versioned. The system applies the right rate to every project."
            />
            <Capability
              icon={<Database className="h-5 w-5" />}
              title="Connected data"
              body="Permitting, GIS, and finance kept in sync through standard municipal connectors."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-widest text-gold-dark">
            How it works
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold text-navy">
            From permit to paid, with fewer cracks to fall through.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <Step n="01" title="Connect" body="Sync permitting, GIS, finance, and email into a unified collections record." />
            <Step n="02" title="Monitor" body="Track payments, deadlines, and by law alignment across every active project." />
            <Step n="03" title="Engage" body="Chatbot, email triage, and proactive reminders carry the day to day load." />
            <Step n="04" title="Resolve" body="Discrepancies surface with rationale, and staff act on prioritized queues." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">
              Talk to the live DC assistant.
            </CardTitle>
            <CardDescription>
              Working chatbot powered by Claude, plus a collections dashboard, discrepancy flags, and email triage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/demo/chatbot"
              className={cn(buttonVariants({ variant: "gold" }))}
            >
              Open the demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Capability({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-gold-dark">{icon}<span className="text-xs uppercase tracking-widest">Capability</span></div>
      <div className="mt-2 font-display text-lg font-semibold text-navy">{title}</div>
      <div className="mt-1 text-sm text-slate-warm leading-relaxed">{body}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="font-mono text-xs text-gold-dark">{n}</div>
      <div className="mt-2 font-display text-lg font-semibold text-navy">{title}</div>
      <div className="mt-2 text-sm text-slate-warm leading-relaxed">{body}</div>
    </div>
  );
}
