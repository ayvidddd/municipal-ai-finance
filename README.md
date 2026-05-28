# Municipal AI Finance

An interactive, end-to-end finance operations platform combining three production-feeling AI solutions for municipal and capital-markets finance teams:

1. **Financial Forecasting** — variance tracking, anomaly detection, 6-month cash flow projection
2. **DC/CIL Management** — Development Charges and Cash-in-Lieu accounts with AI-drafted reminders
3. **Trade Reconciliation** — match capital-markets trades across two systems, investigate breaks with AI tool-use

Plus three integrated AI tools:

- **MuniBot Chat** — streaming chat with live database access via 9 tools
- **Email Triage** — AI inbox with auto-classification and response drafting
- **Audit Log** — every action by humans or AI is logged and exportable

## Quick start

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database self-initializes and seeds on first request. No login, no password.

## Architecture

```
app/
  page.tsx                          Dashboard (KPIs, charts, anomalies, audit feed)
  solutions/
    financial-forecasting/          Cash flow, variance, anomaly drawer with Claude actions
    dc-cil/                         TanStack table, by-law simulator, AI reminders
    reconciliation/                 Two-pane diff, animated matching, AI investigation
  tools/
    chat/                           MuniBot streaming chat with tool use
    email-triage/                   Inbox + Claude triage
    audit/                          Filterable timeline, CSV export
  settings/                         Theme, density, reset demo data
  api/                              All Route Handlers (Next.js 16)
components/
  app/                              Sidebar, topbar, command palette, notifications
  ui/                               Button, Card, Modal, Drawer, KPI card, Skeleton
lib/
  db.ts                             SQLite schema, seed (300 tx, 30 DC, 20 CIL, 80 trades, 10 breaks, 20 emails)
  forecast.ts                       Linear regression + seasonal forecast, anomaly detector
  anthropic.ts                      Claude client + system rules
data/
  app.db                            SQLite database (auto-created)
```

## 10-minute demo script

1. **Dashboard (1 min)** — Open `/`. Note four KPIs, the actual+forecast area chart, the anomalies list, the recon donut, and the AI activity feed (it updates as you trigger actions in the rest of the demo).

2. **Financial Forecasting (2 min)** — `/solutions/financial-forecasting`.
   - Change the department filter — chart updates.
   - Click **Add transaction**, fill in a $50,000 entry, save. Forecast re-runs, audit log gains an entry.
   - Click **Run anomaly scan** for the count-up animation.
   - Click any anomaly card to open the side drawer. Click **Email** — Claude drafts a clarification email live.

3. **DC/CIL Management (2 min)** — `/solutions/dc-cil`.
   - Switch tabs (DC / CIL / Combined). Filter the table.
   - Click any DC row. In the drawer, click **Generate reminder** — Claude drafts a payment reminder using the row's specific developer, balance, and by-law version. Edit it inline.
   - Open the **By-law update simulator** in the header, set 5%, apply. All active accounts have their balances updated in the database.

4. **Trade Reconciliation (2 min)** — `/solutions/reconciliation`.
   - Click **Run reconciliation**. Trades stream in line-by-line, matched rows turn green, breaks stay red. KPI counters update live.
   - Expand a break and click **Investigate with AI**. Claude calls `get_trade_details`, `get_counterparty_info`, `get_historical_breaks`, then drafts a team message — all streamed back. Each tool call shows as a pill.
   - Hit **Mark resolved** — audit logged.
   - Header has a **Month-end report** button that streams a polished report.

5. **MuniBot Chat (1.5 min)** — `/tools/chat`. Try one of the suggested prompts ("List all overdue DC accounts"). Watch the tool-use pills appear above the streaming response. Start a new conversation — it persists to SQLite.

6. **Email Triage (1 min)** — `/tools/email-triage`. Click any unread email, see its AI-detected priority and category, scan the suggested action and draft response. Click **Simulate new email** to inject a new one — it's auto-triaged. Or **Reclassify all** to run Claude over every email.

7. **Audit Log (30 sec)** — `/tools/audit`. Every action you took in the previous steps is here. Filter by entity, search, export CSV.

8. **Command palette** — `⌘K` jumps anywhere and runs actions like "Run Reconciliation" or "Switch to Light Mode".

## What's real vs synthetic

| Element                          | Reality                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| Database                         | Real SQLite (`data/app.db`)                                  |
| Forecasting math                 | Real linear regression + seasonal adjustment                 |
| Anomaly detection                | Real z-score, duplicate, and round-number heuristics         |
| Reconciliation matching          | Real cross-system diff with break detection                  |
| Claude API calls                 | Real, using your `ANTHROPIC_API_KEY` and `claude-sonnet-4-5` |
| Tool use                         | Real Anthropic tool-use loop, server-executed against SQLite |
| Audit log                        | Real, every mutation logged automatically                    |
| Email sending                    | Simulated (status changes to 'sent' in DB)                   |
| Payment processing               | Simulated                                                    |
| Seed data                        | Synthetic but realistic                                      |

## Tech stack

- **Next.js 16** (App Router, Route Handlers, Turbopack)
- **React 19**
- **TypeScript** strict mode
- **Tailwind CSS v4** with custom design tokens, dark mode default
- **better-sqlite3** for the database
- **@anthropic-ai/sdk** with `claude-sonnet-4-5`, streaming, and tool use
- **Recharts** for charts
- **@tanstack/react-table** for sortable filterable tables
- **Framer Motion** for micro-interactions
- **cmdk** for the ⌘K command palette
- **sonner** for toasts
- **react-markdown** for chat rendering
- **lucide-react** for icons
- **date-fns** for relative time

## Environment

```bash
ANTHROPIC_API_KEY=sk-ant-...           # Required
ANTHROPIC_MODEL=claude-sonnet-4-5      # Optional override
```

## Keyboard

| Shortcut          | Action                       |
| ----------------- | ---------------------------- |
| ⌘K / Ctrl+K       | Open command palette         |
| Esc               | Close any drawer or modal    |
| Enter             | Send chat message            |
| Shift+Enter       | New line in chat input       |

## Reset

`Settings → Reset demo data` wipes the SQLite DB and re-seeds.
