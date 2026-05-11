export type Department = "Parks" | "Roads" | "Public Safety" | "Admin";

export interface MonthlyDataPoint {
  month: string;
  actual?: number;
  forecast?: number;
  budget: number;
  lower?: number;
  upper?: number;
}

export interface DepartmentForecast {
  department: Department;
  annualBudget: number;
  ytdActual: number;
  ytdForecast: number;
  variance: number;
  variancePct: number;
  trend: "up" | "down" | "stable";
  monthly: MonthlyDataPoint[];
}

const months = [
  "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25",
  "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26",
  "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26", "Nov 26",
];

function buildSeries(
  baseline: number,
  seasonality: number[],
  noiseSeed: number
): MonthlyDataPoint[] {
  return months.map((month, i) => {
    const seasonal = seasonality[i % 12] ?? 1;
    const drift = 1 + i * 0.004;
    const noise = 1 + Math.sin(noiseSeed + i * 1.7) * 0.04;
    const isHistorical = i < 12;
    const value = Math.round(baseline * seasonal * drift * noise);
    const budget = Math.round(baseline * seasonal * drift);

    if (isHistorical) {
      return { month, actual: value, budget };
    }
    const forecast = value;
    const band = Math.round(value * 0.08);
    return {
      month,
      forecast,
      budget,
      lower: forecast - band,
      upper: forecast + band,
    };
  });
}

const parksSeason = [1.05, 1.18, 1.22, 1.12, 0.95, 0.85, 0.78, 0.74, 0.76, 0.88, 1.0, 1.08];
const roadsSeason = [0.92, 0.98, 1.05, 1.1, 1.15, 1.18, 1.22, 1.15, 1.05, 0.95, 0.88, 0.85];
const safetySeason = [1.0, 1.02, 1.05, 1.0, 0.98, 1.04, 1.08, 1.1, 1.04, 1.0, 0.98, 0.96];
const adminSeason = [0.95, 0.98, 1.0, 1.02, 1.05, 1.08, 1.12, 1.0, 0.98, 1.02, 1.0, 0.95];

export const forecasts: DepartmentForecast[] = [
  {
    department: "Parks",
    annualBudget: 4_200_000,
    ytdActual: 2_186_000,
    ytdForecast: 2_310_000,
    variance: -124_000,
    variancePct: -5.4,
    trend: "down",
    monthly: buildSeries(350_000, parksSeason, 0.7),
  },
  {
    department: "Roads",
    annualBudget: 9_600_000,
    ytdActual: 5_412_000,
    ytdForecast: 5_180_000,
    variance: 232_000,
    variancePct: 4.5,
    trend: "up",
    monthly: buildSeries(800_000, roadsSeason, 1.4),
  },
  {
    department: "Public Safety",
    annualBudget: 14_800_000,
    ytdActual: 8_640_000,
    ytdForecast: 8_580_000,
    variance: 60_000,
    variancePct: 0.7,
    trend: "stable",
    monthly: buildSeries(1_230_000, safetySeason, 2.1),
  },
  {
    department: "Admin",
    annualBudget: 3_100_000,
    ytdActual: 1_805_000,
    ytdForecast: 1_820_000,
    variance: -15_000,
    variancePct: -0.8,
    trend: "stable",
    monthly: buildSeries(258_000, adminSeason, 3.3),
  },
];

export type AnomalySeverity = "high" | "medium" | "low";

export interface Anomaly {
  id: string;
  date: string;
  department: Department;
  vendor: string;
  amount: number;
  expected: number;
  severity: AnomalySeverity;
  category: string;
  reason: string;
  status: "open" | "reviewing" | "cleared";
}

export const anomalies: Anomaly[] = [
  {
    id: "TX-48291",
    date: "2026-05-04",
    department: "Roads",
    vendor: "Northbound Asphalt Co.",
    amount: 412_500,
    expected: 145_000,
    severity: "high",
    category: "Capital works",
    reason: "Single invoice 184% above rolling 6 month vendor average. No matching purchase order found in approved capital plan.",
    status: "open",
  },
  {
    id: "TX-48207",
    date: "2026-05-02",
    department: "Parks",
    vendor: "Greenline Landscaping Ltd.",
    amount: 38_200,
    expected: 12_500,
    severity: "high",
    category: "Operating",
    reason: "Duplicate vendor charge: invoice number 22481 already posted on 2026-04-21 for the same amount.",
    status: "reviewing",
  },
  {
    id: "TX-48174",
    date: "2026-04-29",
    department: "Public Safety",
    vendor: "Atlas Fleet Services",
    amount: 22_100,
    expected: 14_800,
    severity: "medium",
    category: "Vehicle maintenance",
    reason: "Spend in this category has trended 32% above forecast for three consecutive periods.",
    status: "open",
  },
  {
    id: "TX-48150",
    date: "2026-04-27",
    department: "Admin",
    vendor: "Civic Office Supply",
    amount: 6_240,
    expected: 2_800,
    severity: "medium",
    category: "Procurement",
    reason: "Order placed outside standing offer agreement; pricing exceeds catalogued rate by 23%.",
    status: "open",
  },
  {
    id: "TX-48088",
    date: "2026-04-24",
    department: "Parks",
    vendor: "Lakeview Irrigation",
    amount: 9_850,
    expected: 8_400,
    severity: "low",
    category: "Operating",
    reason: "Minor variance against historical seasonal pattern. Within tolerance band but flagged for review.",
    status: "open",
  },
  {
    id: "TX-48041",
    date: "2026-04-21",
    department: "Roads",
    vendor: "Salt & Sand Depot",
    amount: 17_400,
    expected: 18_200,
    severity: "low",
    category: "Operating",
    reason: "Late season procurement timing differs from prior years. Verifying inventory carryover.",
    status: "cleared",
  },
];

export type PaymentStatus = "paid" | "due" | "overdue" | "scheduled";

export interface DCPayment {
  id: string;
  developer: string;
  project: string;
  type: "Development Charges" | "Cash in Lieu Parkland";
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  permitNumber: string;
  ward: string;
}

export const dcPayments: DCPayment[] = [
  {
    id: "DC-2026-0042",
    developer: "Cornerstone Developments",
    project: "Riverside Heights Phase 3",
    type: "Development Charges",
    amount: 2_840_000,
    dueDate: "2026-06-15",
    status: "due",
    permitNumber: "BP-2025-11288",
    ward: "Ward 4",
  },
  {
    id: "CIL-2026-0019",
    developer: "Maple Ridge Holdings",
    project: "Birch Lane Townhomes",
    type: "Cash in Lieu Parkland",
    amount: 412_500,
    dueDate: "2026-05-30",
    status: "due",
    permitNumber: "BP-2026-00214",
    ward: "Ward 2",
  },
  {
    id: "DC-2026-0038",
    developer: "Harbour West Properties",
    project: "Quayside Mixed Use",
    type: "Development Charges",
    amount: 1_650_000,
    dueDate: "2026-04-20",
    status: "overdue",
    permitNumber: "BP-2025-10044",
    ward: "Ward 1",
  },
  {
    id: "DC-2026-0044",
    developer: "Ironwood Build Corp.",
    project: "Forest Crest Subdivision",
    type: "Development Charges",
    amount: 985_000,
    dueDate: "2026-07-12",
    status: "scheduled",
    permitNumber: "BP-2026-00482",
    ward: "Ward 6",
  },
  {
    id: "CIL-2026-0024",
    developer: "Summit Residential",
    project: "Hilltop Estates Block B",
    type: "Cash in Lieu Parkland",
    amount: 218_000,
    dueDate: "2026-07-30",
    status: "scheduled",
    permitNumber: "BP-2026-00501",
    ward: "Ward 5",
  },
  {
    id: "DC-2026-0030",
    developer: "Cornerstone Developments",
    project: "Riverside Heights Phase 2",
    type: "Development Charges",
    amount: 2_410_000,
    dueDate: "2026-02-15",
    status: "paid",
    paidDate: "2026-02-14",
    permitNumber: "BP-2024-09877",
    ward: "Ward 4",
  },
  {
    id: "CIL-2026-0012",
    developer: "Lakeside Builders",
    project: "Bayfield Court Condos",
    type: "Cash in Lieu Parkland",
    amount: 178_000,
    dueDate: "2026-03-08",
    status: "paid",
    paidDate: "2026-03-05",
    permitNumber: "BP-2025-10122",
    ward: "Ward 3",
  },
  {
    id: "DC-2026-0028",
    developer: "Trillium Land Group",
    project: "Meadowbrook Phase 1",
    type: "Development Charges",
    amount: 1_320_000,
    dueDate: "2026-01-20",
    status: "paid",
    paidDate: "2026-01-19",
    permitNumber: "BP-2024-09702",
    ward: "Ward 7",
  },
];

export interface Discrepancy {
  id: string;
  developer: string;
  issue: string;
  severity: AnomalySeverity;
  amountAffected: number;
  detected: string;
}

export const discrepancies: Discrepancy[] = [
  {
    id: "DSC-1041",
    developer: "Harbour West Properties",
    issue: "By law 2026-04 fee schedule update not applied. DC amount calculated against superseded rate.",
    severity: "high",
    amountAffected: 142_500,
    detected: "2026-05-08",
  },
  {
    id: "DSC-1039",
    developer: "Ironwood Build Corp.",
    issue: "Unit count from site plan amendment not reflected in DC calculation worksheet.",
    severity: "high",
    amountAffected: 96_400,
    detected: "2026-05-06",
  },
  {
    id: "DSC-1035",
    developer: "Maple Ridge Holdings",
    issue: "Parkland dedication area in plan of subdivision does not match CIL calculation input.",
    severity: "medium",
    amountAffected: 38_200,
    detected: "2026-05-02",
  },
  {
    id: "DSC-1029",
    developer: "Summit Residential",
    issue: "Permit fee waiver applied without matching council resolution reference.",
    severity: "medium",
    amountAffected: 14_800,
    detected: "2026-04-28",
  },
];

export type EmailPriority = "urgent" | "normal" | "low";

export interface TriagedEmail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  priority: EmailPriority;
  category: string;
  receivedAt: string;
  suggestedAction: string;
}

export const triagedEmails: TriagedEmail[] = [
  {
    id: "EML-7820",
    from: "j.morrison@harbourwest.dev",
    subject: "Urgent: DC payment overdue notice received",
    preview: "We received an overdue notice for permit BP-2025-10044. Can you confirm the outstanding amount and any interest accrued before...",
    priority: "urgent",
    category: "Overdue payment",
    receivedAt: "12 min ago",
    suggestedAction: "Route to Collections lead. Auto draft acknowledgment with current balance and accrued interest.",
  },
  {
    id: "EML-7819",
    from: "legal@cornerstonedev.ca",
    subject: "By law 2026-04 fee impact on Riverside Phase 3",
    preview: "Following the May 1 by law update, please advise whether the revised DC rates apply to our Phase 3 development given that...",
    priority: "urgent",
    category: "By law inquiry",
    receivedAt: "38 min ago",
    suggestedAction: "Escalate to Finance and Planning. Reference effective date provisions in by law 2026-04 section 7.",
  },
  {
    id: "EML-7818",
    from: "permits@maplerigde.com",
    subject: "Parkland CIL calculation question",
    preview: "Could you walk us through how the CIL amount of $412,500 was derived for the Birch Lane Townhomes project? We want to confirm...",
    priority: "normal",
    category: "Calculation question",
    receivedAt: "1 hr ago",
    suggestedAction: "Reply with calculation breakdown using template DC-CALC-02. Attach by law 2024-18 schedule B.",
  },
  {
    id: "EML-7817",
    from: "a.singh@ironwoodbuild.com",
    subject: "Payment schedule for Forest Crest",
    preview: "Hello, we are reviewing our project cash flow and wanted to confirm the DC payment schedule for the Forest Crest Subdivision...",
    priority: "normal",
    category: "Schedule inquiry",
    receivedAt: "2 hr ago",
    suggestedAction: "Reply with payment schedule from agreement DC-2026-0044. Suggested template: DC-SCHED-01.",
  },
  {
    id: "EML-7816",
    from: "info@summitresidential.com",
    subject: "Thank you for the reminder",
    preview: "Thanks for the heads up on our upcoming CIL payment. We have the funds scheduled and will remit ahead of the deadline...",
    priority: "low",
    category: "Acknowledgment",
    receivedAt: "3 hr ago",
    suggestedAction: "No action required. Log for audit trail.",
  },
  {
    id: "EML-7815",
    from: "newsletter@homebuilders.ca",
    subject: "Industry update: Q2 housing starts",
    preview: "Read the latest report on Q2 housing starts and how municipal fee changes are shaping the development pipeline...",
    priority: "low",
    category: "Newsletter",
    receivedAt: "5 hr ago",
    suggestedAction: "Archive. Optional: forward to Planning research bulletin.",
  },
];

export interface BudgetVarianceItem {
  department: Department;
  actual: number;
  forecast: number;
  variance: number;
  variancePct: number;
}

export const budgetVariance: BudgetVarianceItem[] = forecasts.map((f) => ({
  department: f.department,
  actual: f.ytdActual,
  forecast: f.ytdForecast,
  variance: f.variance,
  variancePct: f.variancePct,
}));

export const collectionsSummary = {
  collectedYtd: 6_870_000,
  outstanding: 4_902_500,
  overdue: 1_650_000,
  upcoming30Days: 3_252_500,
  collectionRate: 0.94,
};
