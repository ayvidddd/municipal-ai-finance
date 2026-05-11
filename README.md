# Municipal AI Finance

Marketing and live demo site for two AI powered municipal finance solutions:

1. **AI Powered Financial Management and Budgeting** with forecasting, anomaly detection, and budget variance widgets.
2. **Customer Service and Financial Monitoring** for Development Charges (DC) and Cash in Lieu (CIL) parkland payments, with a live chatbot, collections dashboard, discrepancy flags, and email triage.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide icons, and the Anthropic SDK for the chatbot.

## Quick start

```bash
git clone <this-repo>
cd municipal-ai-finance
npm install

# Add your Anthropic API key to enable the live chatbot
cp .env.local .env.local.example   # optional: keep the template around
# Edit .env.local and replace the placeholder value
#   ANTHROPIC_API_KEY=sk-ant-...

npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Environment variables

| Name | Required | Description |
|------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for chatbot) | Anthropic key used by the `/api/chat` route. The rest of the site renders without it; only the chatbot tab will surface an error message. |
| `ANTHROPIC_MODEL`   | No | Override the default model. Defaults to `claude-sonnet-4-20250514`. |

Get an Anthropic key at https://console.anthropic.com/settings/keys.

## Pages and routes

| Path | Purpose |
|------|---------|
| `/` | Landing page with hero, expandable solution cards, and contact CTA. |
| `/solutions/financial-forecasting` | Solution 1 detail page. |
| `/solutions/customer-service` | Solution 2 detail page. |
| `/demo/forecasting-dashboard` | Working forecasting dashboard with mock municipal data. |
| `/demo/chatbot` | DC and CIL operations console: dashboard, discrepancies, email triage, and live chatbot. |
| `/api/chat` | POST endpoint that calls the Anthropic API. Body: `{ messages: [{ role, content }] }`. |

## Project structure

```
municipal-ai-finance/
  app/
    layout.tsx
    page.tsx
    globals.css
    solutions/
      financial-forecasting/page.tsx
      customer-service/page.tsx
    demo/
      forecasting-dashboard/page.tsx
      chatbot/page.tsx
    api/
      chat/route.ts
  components/
    Nav.tsx
    Footer.tsx
    Hero.tsx
    SolutionCard.tsx
    BenefitsList.tsx
    ForecastChart.tsx
    AnomalyDetector.tsx
    BudgetVariance.tsx
    DCDashboard.tsx
    DiscrepancyPanel.tsx
    EmailTriage.tsx
    ChatbotWidget.tsx
    ui/
      button.tsx
      card.tsx
      badge.tsx
      input.tsx
  lib/
    mockData.ts
    utils.ts
```

## Solution 1: Financial Forecasting demo

Path: `/demo/forecasting-dashboard`

Three working widgets:

- **Forecast chart** (Recharts ComposedChart). Twelve months of historical actuals plus six months of projected spend with a 90% confidence band, against approved budget. Switch between Parks, Roads, Public Safety, Admin, or all departments.
- **Anomaly detector**. Flagged transactions with severity badges, AI rationale, and status workflow (open, reviewing, cleared).
- **Budget variance** widget. Department level actual versus forecast with percent variance pills.

All data is mocked in `lib/mockData.ts` and is suitable for showing the experience without standing up an ERP integration.

## Solution 2: DC and CIL demo

Path: `/demo/chatbot`

- **DC dashboard**. KPI tiles for collected, outstanding, overdue, and collection rate; payment status donut; upcoming and overdue payments table.
- **Discrepancy panel**. Flagged issues such as superseded fee schedules and unit count mismatches.
- **Email triage**. Inbound developer and resident messages classified into urgent, normal, or low, with suggested action templates.
- **Chatbot widget**. Live Anthropic powered assistant trained as a municipal DC and CIL specialist. Suggested prompts include:
  - "When is my next DC payment due?"
  - "How is parkland CIL calculated?"
  - "What if I miss a payment?"
  - "How do by law updates affect my development?"

## Screenshots

Add screenshots to `docs/screenshots/` and reference them here. Placeholder slots:

- [ ] Landing page hero with expandable solution cards
- [ ] Forecasting dashboard, forecast chart and anomaly panel
- [ ] DC dashboard with KPI tiles and donut
- [ ] Chatbot live conversation

## Design system

- Color palette: deep navy (`#1a2942`), gold accent (`#c9a961`), warm slate, off white.
- Typography: Inter for body and UI; Playfair Display for display headings.
- Animations: subtle Framer Motion fade up on scroll, accordion expand on solution cards, chatbot bubble entrance.
- Mobile: responsive grid through to single column. Sticky nav with hamburger.
- Charts: Recharts with custom tooltips and a navy / gold palette consistent with the brand.

## Scripts

```bash
npm run dev      # Start the dev server on http://localhost:3000
npm run build    # Production build
npm run start    # Run the production build
npm run lint     # ESLint
```

## License

Confidential pitch material. Not for redistribution.
