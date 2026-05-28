export type MonthlyPoint = { month: string; actual: number | null; forecast: number | null };

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function aggregateMonthly(
  rows: Array<{ date: string; amount: number; department?: string }>,
  department?: string
): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    if (department && r.department && r.department !== department) continue;
    const k = r.date.slice(0, 7);
    out.set(k, (out.get(k) ?? 0) + r.amount);
  }
  return out;
}

function linregress(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const xs = ys.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

export function forecastSeries(actualsByMonth: Map<string, number>, horizon: number = 6): MonthlyPoint[] {
  const sorted = [...actualsByMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (sorted.length === 0) return [];
  const ys = sorted.map(([, v]) => v);
  const { slope, intercept } = linregress(ys);

  const seasonal: number[] = new Array(12).fill(0);
  const seasonalCounts: number[] = new Array(12).fill(0);
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  for (let i = 0; i < sorted.length; i++) {
    const m = parseInt(sorted[i][0].slice(5, 7), 10) - 1;
    seasonal[m] += sorted[i][1] - mean;
    seasonalCounts[m] += 1;
  }
  for (let i = 0; i < 12; i++) seasonal[i] = seasonalCounts[i] ? seasonal[i] / seasonalCounts[i] : 0;

  const points: MonthlyPoint[] = sorted.map(([month, v], idx) => ({
    month,
    actual: v,
    forecast: Math.round(intercept + slope * idx + seasonal[parseInt(month.slice(5, 7), 10) - 1]),
  }));

  const lastKey = sorted[sorted.length - 1][0];
  const [ly, lm] = lastKey.split("-").map((s) => parseInt(s, 10));
  for (let i = 1; i <= horizon; i++) {
    const d = new Date(ly, lm - 1 + i, 1);
    const k = monthKey(d);
    const idx = sorted.length - 1 + i;
    const m = d.getMonth();
    points.push({
      month: k,
      actual: null,
      forecast: Math.round(intercept + slope * idx + seasonal[m]),
    });
  }
  return points;
}

export type Anomaly = {
  id: number;
  date: string;
  department: string;
  category: string;
  vendor: string;
  amount: number;
  score: number;
  reasons: string[];
};

export function detectAnomalies(
  rows: Array<{
    id: number;
    date: string;
    department: string;
    category: string;
    vendor: string;
    amount: number;
  }>
): Anomaly[] {
  const byCat = new Map<string, number[]>();
  for (const r of rows) {
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category)!.push(r.amount);
  }
  const stats = new Map<string, { mean: number; std: number }>();
  for (const [k, arr] of byCat) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    stats.set(k, { mean, std: Math.sqrt(variance) });
  }

  const seen = new Map<string, { id: number; date: string }>();
  const out: Anomaly[] = [];
  for (const r of rows) {
    const reasons: string[] = [];
    const s = stats.get(r.category);
    if (s && s.std > 0) {
      const z = Math.abs((r.amount - s.mean) / s.std);
      if (z > 2.5) reasons.push(`Amount ${z.toFixed(1)}σ above category mean`);
    }
    if (r.amount > 0 && r.amount % 1000 === 0 && r.amount >= 5000) reasons.push("Round-number invoice");
    const key = `${r.vendor}|${Math.round(r.amount)}`;
    const prior = seen.get(key);
    if (prior) {
      const dDays = Math.abs((new Date(r.date).getTime() - new Date(prior.date).getTime()) / 86400000);
      if (dDays <= 3) reasons.push(`Possible duplicate of #${prior.id}`);
    } else seen.set(key, { id: r.id, date: r.date });

    if (reasons.length > 0) {
      const score = Math.min(1, 0.4 + reasons.length * 0.2);
      out.push({
        id: r.id,
        date: r.date,
        department: r.department,
        category: r.category,
        vendor: r.vendor,
        amount: r.amount,
        score,
        reasons,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}
