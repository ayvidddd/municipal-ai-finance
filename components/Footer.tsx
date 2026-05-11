import Link from "next/link";
import { Building2, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy text-slate-200 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold text-navy">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-base font-semibold text-white">
                  Municipal AI Finance
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  Public Sector Intelligence
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-slate-300 leading-relaxed">
              Purpose built artificial intelligence for municipal finance teams.
              Forecast budgets with confidence, surface anomalies before they
              become losses, and bring Development Charges and parkland CIL
              collections into a single source of truth.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-gold-light">
              Solutions
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/solutions/financial-forecasting" className="hover:text-gold">
                  Financial Forecasting
                </Link>
              </li>
              <li>
                <Link href="/solutions/customer-service" className="hover:text-gold">
                  DC and CIL Management
                </Link>
              </li>
              <li>
                <Link href="/demo/forecasting-dashboard" className="hover:text-gold">
                  Forecasting Demo
                </Link>
              </li>
              <li>
                <Link href="/demo/chatbot" className="hover:text-gold">
                  Chatbot Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-gold-light">
              Contact
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-gold" />
                hello@municipal-ai-finance.example
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-gold" />
                1 800 555 0144
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-gold" />
                Public Sector AI Studio
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Municipal AI Finance. Built for public sector clients.
          </div>
          <div>Confidential pitch material. Not for redistribution.</div>
        </div>
      </div>
    </footer>
  );
}
