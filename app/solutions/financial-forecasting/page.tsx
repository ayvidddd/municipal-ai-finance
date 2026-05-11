import Link from "next/link";
import { ArrowRight, LineChart, Sparkles, AlertTriangle, Workflow, ShieldCheck } from "lucide-react";
import { BenefitsList } from "@/components/BenefitsList";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ForecastingSolutionPage() {
  return (
    <>
      <section className="bg-navy-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-xs uppercase tracking-widest text-gold-light">
            Solution 01
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold text-balance sm:text-5xl">
            Enhance municipal financial management and support transparent budgeting.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-200 leading-relaxed sm:text-lg">
            Machine learning analyzes city financial records, identifies unusual
            spending patterns, and forecasts budget trends so that Council,
            staff, and the public have a clearer view of the road ahead.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo/forecasting-dashboard"
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
              Five outcomes Finance teams ask for.
            </h2>
            <p className="mt-4 text-sm text-slate-warm leading-relaxed">
              We focused this solution on the working day of a municipal Finance
              team: the budget cycle, mid year reviews, year end close, and the
              hundreds of judgment calls in between.
            </p>
            <div className="mt-8">
              <BenefitsList
                benefits={[
                  "Improve the accuracy of financial forecasts using historical and real time data",
                  "Support informed resource allocation and financial policy development",
                  "Automate routine data processing, freeing Finance teams for strategic work",
                  "Provide real time budget monitoring and forecasting for timely adjustments",
                  "Detect anomalies and unusual spending patterns early, reducing financial risk and waste",
                ]}
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Capability
              icon={<LineChart className="h-5 w-5" />}
              title="Forecast engine"
              body="Hybrid time series and gradient boosting models with seasonality, vendor patterns, and macro indicators."
            />
            <Capability
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Anomaly detection"
              body="Unsupervised pattern scoring on every posting, with human readable rationale and audit trail."
            />
            <Capability
              icon={<Workflow className="h-5 w-5" />}
              title="Automation"
              body="Routine reconciliation, exception routing, and report drafting handled in the background."
            />
            <Capability
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Public sector controls"
              body="Role based access, data residency, and full audit trail aligned with records management policy."
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
            From posting to insight in a single workflow.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <Step n="01" title="Ingest" body="Read postings from your ERP and operational systems via secure connectors. No data leaves your tenant." />
            <Step n="02" title="Score" body="Forecast every department and category, with confidence intervals and seasonal patterns." />
            <Step n="03" title="Surface" body="Anomalies, variances, and emerging risks routed to the right person, with rationale." />
            <Step n="04" title="Decide" body="Staff act with context. Council and the public see clearer, more transparent reporting." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Ready when you are
            </div>
            <CardTitle className="mt-2 text-2xl sm:text-3xl">
              Try the working forecast and anomaly demo.
            </CardTitle>
            <CardDescription>
              Interactive dashboard with realistic municipal mock data across Parks, Roads, Public Safety, and Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/demo/forecasting-dashboard"
              className={cn(buttonVariants({ variant: "gold" }))}
            >
              Open the dashboard
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
