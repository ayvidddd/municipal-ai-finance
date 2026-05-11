import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SolutionCard } from "@/components/SolutionCard";
import { LineChart, Banknote, Building, Shield, GitBranch, MessagesSquare, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <Hero />

      <section id="solutions" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-gold-dark">
            Two integrated solutions
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold text-navy sm:text-4xl">
            A focused AI portfolio for municipal finance.
          </h2>
          <p className="mt-4 text-base text-slate-warm leading-relaxed">
            Each solution operates independently, yet they share the same data
            backbone. Adopt one or both, on a timeline that respects your
            existing budget cycle and procurement process.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-6">
          <SolutionCard
            number="01"
            badge="Forecasting and oversight"
            title="AI Powered Financial Management and Budgeting"
            description="Machine learning analyzes city financial records, identifies unusual spending patterns, and forecasts budget trends so that Council, staff, and the public have a clearer view of the road ahead."
            benefits={[
              "Improve the accuracy of financial forecasts using historical and real time data",
              "Support informed resource allocation and financial policy development",
              "Automate routine data processing, freeing Finance teams for strategic work",
              "Provide real time budget monitoring and forecasting for timely adjustments",
              "Detect anomalies and unusual spending patterns early, reducing financial risk and waste",
            ]}
            detailHref="/solutions/financial-forecasting"
            demoHref="/demo/forecasting-dashboard"
            icon={<LineChart className="h-7 w-7" />}
            defaultOpen
          />

          <SolutionCard
            number="02"
            badge="Customer service and collections"
            title="Customer Service and Financial Monitoring"
            description="Manage Development Charges and Cash in Lieu parkland payments with AI that monitors payment schedules, flags discrepancies, and integrates data across permitting, GIS, and finance for a single source of truth."
            benefits={[
              "Real time dashboards and analytics of financial data across DC and CIL collections",
              "Automate email triage by prioritizing urgent queries and streamlining web based intake",
              "Adapt to municipal by law updates or fee changes to ensure payments stay current",
              "Offer chatbot support, consistent answers, and proactive reminders to reduce missed payments",
            ]}
            detailHref="/solutions/customer-service"
            demoHref="/demo/chatbot"
            icon={<Banknote className="h-7 w-7" />}
          />
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 md:grid-cols-3">
            <Feature
              icon={<Shield className="h-6 w-6" />}
              title="Public sector grade controls"
              body="Role based access, full audit trails, and data residency options that align with municipal records management policies."
            />
            <Feature
              icon={<GitBranch className="h-6 w-6" />}
              title="Integrates with what you have"
              body="Connectors for major municipal ERP, permitting, GIS, and email platforms. No rip and replace."
            />
            <Feature
              icon={<Building className="h-6 w-6" />}
              title="Tuned for municipal data"
              body="Models trained on the structure of municipal budgets, by laws, and capital plans, not generic enterprise finance."
            />
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="overflow-hidden rounded-2xl bg-navy-gradient text-white shadow-lg">
          <div className="grid gap-10 p-10 md:grid-cols-2 lg:p-14">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold-light">
                Request a briefing
              </div>
              <h3 className="mt-3 font-display text-3xl font-semibold sm:text-4xl text-balance">
                Bring this to your Finance or CAO team.
              </h3>
              <p className="mt-4 max-w-xl text-slate-200 leading-relaxed">
                A 45 minute briefing covers the architecture, integration plan,
                pilot scope, and procurement pathways relevant to your
                municipality. We come prepared with examples from comparable
                jurisdictions.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/demo/forecasting-dashboard"
                  className={cn(buttonVariants({ variant: "gold", size: "lg" }))}
                >
                  Explore Forecasting Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/demo/chatbot"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/30 text-white hover:bg-white hover:text-navy"
                  )}
                >
                  <MessagesSquare className="h-4 w-4" />
                  Talk to the DC Assistant
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/5 p-6 backdrop-blur">
              <div className="text-xs uppercase tracking-widest text-gold-light">
                What you will get
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <BriefingPoint label="Pilot scope tailored to your departments" />
                <BriefingPoint label="Data assessment and integration plan" />
                <BriefingPoint label="Sample anomaly and DC analytics with your data" />
                <BriefingPoint label="Procurement options and pricing transparency" />
                <BriefingPoint label="Change management and training outline" />
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold-dark">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-navy">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-warm leading-relaxed">{body}</p>
    </div>
  );
}

function BriefingPoint({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-gold" />
      <span>{label}</span>
    </li>
  );
}
