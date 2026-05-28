import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function openDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db: Database.Database = globalThis.__db ?? openDb();
if (process.env.NODE_ENV !== "production") globalThis.__db = db;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted',
  flagged INTEGER NOT NULL DEFAULT 0,
  anomaly_score REAL NOT NULL DEFAULT 0,
  anomaly_reasons TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department TEXT NOT NULL,
  month TEXT NOT NULL,
  actual REAL,
  forecast REAL NOT NULL,
  variance REAL
);
CREATE TABLE IF NOT EXISTS dc_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  developer TEXT NOT NULL,
  project_name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_owed REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL,
  by_law_version TEXT NOT NULL,
  units INTEGER NOT NULL,
  unit_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cil_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  parkland_sqm REAL NOT NULL,
  rate_per_sqm REAL NOT NULL,
  total_owed REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS trades_system_a (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id TEXT NOT NULL,
  date TEXT NOT NULL,
  instrument TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  total_value REAL NOT NULL,
  settlement_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS trades_system_b (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id TEXT NOT NULL,
  date TEXT NOT NULL,
  instrument TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  total_value REAL NOT NULL,
  settlement_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS breaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id TEXT NOT NULL,
  break_type TEXT NOT NULL,
  system_a_value TEXT,
  system_b_value TEXT,
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved INTEGER NOT NULL DEFAULT 0,
  sla_deadline TEXT NOT NULL,
  investigation_notes TEXT
);
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'general',
  suggested_action TEXT,
  draft_response TEXT,
  status TEXT NOT NULL DEFAULT 'unread'
);
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL DEFAULT 'New conversation',
  messages_json TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  link TEXT
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

db.exec(SCHEMA);

export function logAudit(
  actor: string,
  action: string,
  entity: string,
  entity_id: string | number | bigint | null = null,
  details: object | string | null = null
) {
  db.prepare(
    `INSERT INTO audit_log (actor, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)`
  ).run(
    actor,
    action,
    entity,
    entity_id != null ? String(entity_id) : null,
    details ? (typeof details === "string" ? details : JSON.stringify(details)) : null
  );
}

export function createNotification(
  type: string,
  title: string,
  message: string,
  link: string | null = null
) {
  db.prepare(
    `INSERT INTO notifications (type, title, message, link) VALUES (?, ?, ?, ?)`
  ).run(type, title, message, link);
}

function isSeeded(): boolean {
  const row = db.prepare(`SELECT value FROM meta WHERE key = 'seeded'`).get() as
    | { value: string }
    | undefined;
  return row?.value === "v1";
}

function markSeeded() {
  db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', 'v1')`).run();
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function seed() {
  const DEPARTMENTS = [
    "Public Works",
    "Parks & Recreation",
    "Fire Services",
    "Library Services",
    "Transit",
    "Planning & Development",
  ];
  const CATEGORIES = [
    "Salaries",
    "Equipment",
    "Maintenance",
    "Consulting",
    "Supplies",
    "Utilities",
    "Software",
    "Vehicles",
  ];
  const VENDORS = [
    "Acme Industrial",
    "BlueRidge Consulting",
    "Cedar Supply Co",
    "Delta Logistics",
    "Evergreen IT",
    "Fairway Mechanical",
    "Granite Materials",
    "Horizon Energy",
    "Ironclad Security",
    "Juniper Software",
    "Keystone Vehicles",
    "Lakeside Office",
  ];

  const insertTx = db.prepare(
    `INSERT INTO transactions (date, department, category, vendor, amount, status, flagged, anomaly_score, anomaly_reasons) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const now = new Date();
  const txs: number[] = [];
  for (let i = 0; i < 285; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - randInt(0, 540));
    const dept = rand(DEPARTMENTS);
    const cat = rand(CATEGORIES);
    const vendor = rand(VENDORS);
    const base = cat === "Salaries" ? randInt(15000, 95000) : randInt(500, 25000);
    const amount = Math.round(base * (0.9 + Math.random() * 0.2) * 100) / 100;
    const r = insertTx.run(
      fmtDate(d),
      dept,
      cat,
      vendor,
      amount,
      "posted",
      0,
      0,
      null
    );
    txs.push(Number(r.lastInsertRowid));
  }

  const anomalyKinds = [
    { reasons: ["Duplicate invoice within 48h", "Same vendor and amount"], multiplier: 1 },
    { reasons: ["Amount 8x category average", "Outlier vs 18m history"], multiplier: 9 },
    { reasons: ["Round-number invoice", "Unusual vendor for department"], multiplier: 1.5 },
    { reasons: ["After-hours posting", "Approver self-approved"], multiplier: 1 },
    { reasons: ["Vendor not on approved list"], multiplier: 1 },
    { reasons: ["Split transaction below threshold"], multiplier: 0.5 },
  ];

  for (let i = 0; i < 15; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - randInt(0, 60));
    const dept = rand(DEPARTMENTS);
    const cat = rand(CATEGORIES);
    const vendor = rand(VENDORS);
    const kind = rand(anomalyKinds);
    const baseAmt = randInt(5000, 30000) * kind.multiplier;
    const amount = Math.round(baseAmt * 100) / 100;
    insertTx.run(
      fmtDate(d),
      dept,
      cat,
      vendor,
      amount,
      "posted",
      1,
      0.6 + Math.random() * 0.4,
      JSON.stringify(kind.reasons)
    );
  }

  const insertDc = db.prepare(
    `INSERT INTO dc_accounts (developer, project_name, address, total_owed, paid, balance, due_date, status, by_law_version, units, unit_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const developers = [
    "Northwind Homes",
    "Cedar Hills Developments",
    "Riverside Builders",
    "Skyline Construction",
    "Heritage Properties",
    "Maple Grove Group",
    "Pioneer Land Co",
    "Summit Realty",
    "Trillium Communities",
    "Westbrook Inc",
  ];
  const unitTypes = ["Single Family", "Townhouse", "Mid-Rise", "High-Rise", "Mixed Use"];
  const bylaws = ["2022-15", "2023-08", "2024-02"];
  const statuses = ["current", "current", "current", "overdue", "disputed", "paid"];

  for (let i = 0; i < 30; i++) {
    const dev = rand(developers);
    const project = `${rand(["Aspen", "Birch", "Crescent", "Dover", "Elgin", "Forest", "Glen", "Heritage"])} ${rand(["Place", "Heights", "Commons", "Village", "Park", "Crossing"])} Phase ${randInt(1, 4)}`;
    const units = randInt(8, 240);
    const utype = rand(unitTypes);
    const rate = utype === "Single Family" ? 38500 : utype === "Townhouse" ? 28900 : 22100;
    const totalOwed = Math.round(units * rate);
    const status = rand(statuses);
    let paid = 0;
    if (status === "paid") paid = totalOwed;
    else if (status === "current") paid = Math.round(totalOwed * (Math.random() * 0.6));
    else if (status === "overdue") paid = Math.round(totalOwed * (Math.random() * 0.4));
    const balance = totalOwed - paid;
    const due = new Date(now);
    due.setDate(due.getDate() + (status === "overdue" ? -randInt(5, 90) : randInt(10, 180)));
    insertDc.run(
      dev,
      project,
      `${randInt(100, 9999)} ${rand(["King", "Queen", "Bridge", "Main", "Wellington", "Front"])} St`,
      totalOwed,
      paid,
      balance,
      fmtDate(due),
      status,
      rand(bylaws),
      units,
      utype
    );
  }

  const insertCil = db.prepare(
    `INSERT INTO cil_accounts (project_name, parkland_sqm, rate_per_sqm, total_owed, paid, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < 20; i++) {
    const project = `${rand(["Riverwalk", "Oakdale", "Pinecrest", "Lakefront", "Crestwood"])} Development ${randInt(1, 9)}`;
    const sqm = randInt(800, 12000);
    const rate = randInt(220, 480);
    const totalOwed = sqm * rate;
    const status = rand(["current", "current", "overdue", "paid"]);
    const paid = status === "paid" ? totalOwed : status === "current" ? Math.round(totalOwed * Math.random() * 0.5) : 0;
    const balance = totalOwed - paid;
    insertCil.run(project, sqm, rate, totalOwed, paid, balance, status);
  }

  const insertA = db.prepare(
    `INSERT INTO trades_system_a (trade_id, date, instrument, counterparty, quantity, price, total_value, settlement_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertB = db.prepare(
    `INSERT INTO trades_system_b (trade_id, date, instrument, counterparty, quantity, price, total_value, settlement_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const instruments = [
    "ON 4.25 06/15/2028",
    "CA 3.75 12/01/2030",
    "ONHydro 4.10 03/15/2032",
    "Toronto Muni 3.50 09/01/2029",
    "Hamilton 4.00 06/01/2031",
    "Ottawa GreenBond 3.25 01/15/2034",
    "PEEL 4.50 11/01/2027",
    "YORK 3.90 08/15/2030",
  ];
  const counterparties = [
    "RBC Capital Markets",
    "TD Securities",
    "Scotia Capital",
    "BMO Nesbitt Burns",
    "CIBC World Markets",
    "National Bank Financial",
    "Desjardins Securities",
    "Laurentian Bank Securities",
  ];

  const trades: Array<{ tid: string; row: (string | number)[] }> = [];
  for (let i = 0; i < 80; i++) {
    const tid = `TRD-${String(100000 + i).padStart(6, "0")}`;
    const d = new Date(now);
    d.setDate(d.getDate() - randInt(0, 14));
    const settle = new Date(d);
    settle.setDate(settle.getDate() + randInt(1, 5));
    const instrument = rand(instruments);
    const counterparty = rand(counterparties);
    const quantity = randInt(100, 5000) * 1000;
    const price = Math.round((95 + Math.random() * 10) * 1000) / 1000;
    const totalValue = Math.round(quantity * price) / 100;
    trades.push({
      tid,
      row: [tid, fmtDate(d), instrument, counterparty, quantity, price, totalValue, fmtDate(settle), "pending"],
    });
  }

  const breakIndices = new Set<number>();
  while (breakIndices.size < 10) breakIndices.add(randInt(0, 79));
  const breakKinds = ["quantity", "price", "settlement_date", "counterparty", "missing"];

  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    insertA.run(...(t.row as [string, string, string, string, number, number, number, string, string]));
    if (breakIndices.has(i)) {
      const kind = rand(breakKinds);
      if (kind === "missing") continue;
      const mutated = [...t.row];
      if (kind === "quantity") mutated[4] = (mutated[4] as number) + randInt(-50000, 50000);
      if (kind === "price") mutated[5] = Math.round(((mutated[5] as number) + (Math.random() * 0.5 - 0.25)) * 1000) / 1000;
      if (kind === "settlement_date") {
        const ns = new Date(mutated[7] as string);
        ns.setDate(ns.getDate() + randInt(1, 3));
        mutated[7] = fmtDate(ns);
      }
      if (kind === "counterparty") {
        let nc = rand(counterparties);
        while (nc === mutated[3]) nc = rand(counterparties);
        mutated[3] = nc;
      }
      mutated[6] = Math.round((mutated[4] as number) * (mutated[5] as number)) / 100;
      insertB.run(...(mutated as [string, string, string, string, number, number, number, string, string]));
    } else {
      insertB.run(...(t.row as [string, string, string, string, number, number, number, string, string]));
    }
  }

  const insertBreak = db.prepare(
    `INSERT INTO breaks (trade_id, break_type, system_a_value, system_b_value, sla_deadline) VALUES (?, ?, ?, ?, ?)`
  );
  const allA = db.prepare(`SELECT trade_id, instrument, counterparty, quantity, price, total_value, settlement_date FROM trades_system_a`).all() as Array<{ trade_id: string; instrument: string; counterparty: string; quantity: number; price: number; total_value: number; settlement_date: string }>;
  const mapB = new Map<string, { instrument: string; counterparty: string; quantity: number; price: number; total_value: number; settlement_date: string }>();
  const allB = db.prepare(`SELECT trade_id, instrument, counterparty, quantity, price, total_value, settlement_date FROM trades_system_b`).all() as Array<{ trade_id: string; instrument: string; counterparty: string; quantity: number; price: number; total_value: number; settlement_date: string }>;
  for (const b of allB) mapB.set(b.trade_id, b);

  for (const a of allA) {
    const b = mapB.get(a.trade_id);
    const sla = new Date(now);
    sla.setHours(sla.getHours() + randInt(-12, 48));
    if (!b) {
      insertBreak.run(a.trade_id, "missing", JSON.stringify(a), null, sla.toISOString());
      continue;
    }
    if (a.quantity !== b.quantity)
      insertBreak.run(a.trade_id, "quantity", String(a.quantity), String(b.quantity), sla.toISOString());
    else if (a.price !== b.price)
      insertBreak.run(a.trade_id, "price", String(a.price), String(b.price), sla.toISOString());
    else if (a.settlement_date !== b.settlement_date)
      insertBreak.run(a.trade_id, "settlement_date", a.settlement_date, b.settlement_date, sla.toISOString());
    else if (a.counterparty !== b.counterparty)
      insertBreak.run(a.trade_id, "counterparty", a.counterparty, b.counterparty, sla.toISOString());
  }

  const insertEmail = db.prepare(
    `INSERT INTO emails (sender, subject, body, priority, category, suggested_action, draft_response, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const emails = [
    {
      sender: "marcus.lee@northwindhomes.ca",
      subject: "DC payment query for Aspen Place Phase 2",
      body: "Hi team, can you confirm the outstanding DC balance on Aspen Place Phase 2? We received a notice last week but the figure looks different from our records. Looking to settle this week.",
      priority: "high",
      category: "dc_inquiry",
    },
    {
      sender: "jennifer.tam@cedarhills.ca",
      subject: "By-law 2024-02 clarification",
      body: "Following the rate update, are units already permitted under 2023-08 grandfathered? Three of our active applications were filed in March.",
      priority: "medium",
      category: "policy",
    },
    {
      sender: "ops@rbccm.com",
      subject: "Trade TRD-100037 settlement query",
      body: "Settlement date appears to differ between our system and yours by 2 business days. Please confirm the correct value date.",
      priority: "urgent",
      category: "reconciliation",
    },
    {
      sender: "council.member@city.gov",
      subject: "Q3 cash flow report",
      body: "Can I get a summary of cash flow variance vs forecast by department before Thursday's session?",
      priority: "high",
      category: "reporting",
    },
    {
      sender: "residents@example.com",
      subject: "Park maintenance complaint",
      body: "The playground equipment at Riverside Park needs attention.",
      priority: "low",
      category: "general",
    },
    {
      sender: "finance@scotiacapital.com",
      subject: "Counterparty mismatch TRD-100052",
      body: "Our books show TD Securities as counterparty. Please verify.",
      priority: "urgent",
      category: "reconciliation",
    },
    {
      sender: "ap@evergreenit.com",
      subject: "Duplicate payment refund",
      body: "We received two payments of $4,800 for invoice INV-22841. Should we refund one?",
      priority: "high",
      category: "ap",
    },
    {
      sender: "permits@riverside.dev",
      subject: "CIL deferral request",
      body: "We would like to discuss deferring the CIL on Riverwalk Development 4 due to a construction delay.",
      priority: "medium",
      category: "cil_inquiry",
    },
    {
      sender: "treasurer@city.gov",
      subject: "Reconciliation breaks aging",
      body: "Several reconciliation breaks are over 24h. What is the escalation plan?",
      priority: "urgent",
      category: "reconciliation",
    },
    {
      sender: "auditor@external.ca",
      subject: "Year-end audit request",
      body: "Can you forward the latest anomaly flags report and resolution status?",
      priority: "medium",
      category: "audit",
    },
    {
      sender: "vendor@cedarsupply.com",
      subject: "Invoice past due 60+ days",
      body: "Invoice CS-99812 for $14,200 remains unpaid. Please advise.",
      priority: "high",
      category: "ap",
    },
    {
      sender: "legal@city.gov",
      subject: "Disputed DC account follow-up",
      body: "Has there been progress on the Granite Crossing Phase 1 dispute? Outside counsel is asking.",
      priority: "high",
      category: "dc_inquiry",
    },
    {
      sender: "ops@bmonesbittburns.ca",
      subject: "Trade volume reconciliation",
      body: "Quarterly volume totals differ by 0.4%. Working with your team on root cause.",
      priority: "medium",
      category: "reconciliation",
    },
    {
      sender: "planning@city.gov",
      subject: "New development applications",
      body: "Six new mid-rise applications expected next quarter. DC revenue forecast impact?",
      priority: "medium",
      category: "reporting",
    },
    {
      sender: "fire.chief@city.gov",
      subject: "Equipment budget overrun",
      body: "Our equipment line is tracking 12% over forecast. Need a review meeting.",
      priority: "high",
      category: "budget",
    },
    {
      sender: "library.director@city.gov",
      subject: "Software renewal approval",
      body: "ILS renewal due in 14 days. Cost is $42,500. Confirming budget availability.",
      priority: "medium",
      category: "budget",
    },
    {
      sender: "parks@city.gov",
      subject: "Capital project status",
      body: "Riverside Park phase 2 is 8 weeks ahead of schedule. Cash flow impact this quarter.",
      priority: "low",
      category: "reporting",
    },
    {
      sender: "transit@city.gov",
      subject: "Fuel surcharge increase",
      body: "Provider increased rates 6%. Need budget adjustment recommendation.",
      priority: "medium",
      category: "budget",
    },
    {
      sender: "developer@summitrealty.ca",
      subject: "Payment plan proposal",
      body: "Requesting 6-month payment plan for the outstanding DC balance on Heritage Heights.",
      priority: "high",
      category: "dc_inquiry",
    },
    {
      sender: "ops@cibcwm.com",
      subject: "Quantity break TRD-100061",
      body: "Looks like a fat-finger on lot size. Confirming the correct amount.",
      priority: "urgent",
      category: "reconciliation",
    },
  ];
  for (const e of emails) {
    insertEmail.run(e.sender, e.subject, e.body, e.priority, e.category, null, null, "unread");
  }

  const insertNotif = db.prepare(
    `INSERT INTO notifications (type, title, message, link) VALUES (?, ?, ?, ?)`
  );
  insertNotif.run("anomaly", "15 new anomalies flagged", "Pattern scan completed across 300 transactions.", "/solutions/financial-forecasting");
  insertNotif.run("sla", "3 breaks exceeded 24h SLA", "Escalation required on TRD-100012, TRD-100037, TRD-100061.", "/solutions/reconciliation");
  insertNotif.run("overdue", "8 DC accounts overdue", "Combined outstanding balance: $4.2M.", "/solutions/dc-cil");
  insertNotif.run("triage", "5 urgent emails triaged", "AI suggested actions for review.", "/tools/email-triage");
  insertNotif.run("system", "Demo data initialized", "Welcome to Municipal AI Finance.", "/");

  logAudit("system", "seed", "database", null, { tables: 11 });
}

if (!isSeeded()) {
  const txn = db.transaction(() => {
    seed();
    markSeeded();
  });
  txn();
}

export function resetDb() {
  const tables = [
    "transactions",
    "forecasts",
    "dc_accounts",
    "cil_accounts",
    "trades_system_a",
    "trades_system_b",
    "breaks",
    "emails",
    "chat_sessions",
    "audit_log",
    "notifications",
  ];
  const txn = db.transaction(() => {
    for (const t of tables) db.exec(`DELETE FROM ${t};`);
    db.prepare(`DELETE FROM meta WHERE key = 'seeded'`).run();
    seed();
    markSeeded();
  });
  txn();
}
