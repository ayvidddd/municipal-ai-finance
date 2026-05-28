"use client";
import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpDown,
  Calculator,
  Calendar,
  CheckCircle2,
  Receipt,
  Search,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

type DcAccount = {
  id: number;
  developer: string;
  project_name: string;
  address: string;
  total_owed: number;
  paid: number;
  balance: number;
  due_date: string;
  status: string;
  by_law_version: string;
  units: number;
  unit_type: string;
};

type CilAccount = {
  id: number;
  project_name: string;
  parkland_sqm: number;
  rate_per_sqm: number;
  total_owed: number;
  paid: number;
  balance: number;
  status: string;
};

type Data = {
  dc: DcAccount[];
  cil: CilAccount[];
  kpis: { totalOutstanding: number; overdue: number; collectedMtd: number; disputed: number };
};

const TABS = ["DC Accounts", "CIL Accounts", "Combined"] as const;

function statusVariant(status: string) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "current":
      return "primary" as const;
    case "overdue":
      return "danger" as const;
    case "disputed":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export function DcCilClient() {
  const [data, setData] = React.useState<Data | null>(null);
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("DC Accounts");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<
    | { type: "dc"; row: DcAccount }
    | { type: "cil"; row: CilAccount }
    | null
  >(null);
  const [bylawOpen, setBylawOpen] = React.useState(false);
  const [bylawPct, setBylawPct] = React.useState("5");
  const [reminderDraft, setReminderDraft] = React.useState<string | null>(null);
  const [reminderLoading, setReminderLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/dc-cil", { cache: "no-store" });
    const json = await r.json();
    setData(json);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function markPaid(id: number, type: "dc" | "cil") {
    const r = await fetch("/api/dc-cil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_paid", id, type }),
    });
    if (r.ok) {
      toast.success("Marked as paid");
      setSelected(null);
      load();
    }
  }

  async function genReminder(id: number, type: "dc" | "cil") {
    setReminderLoading(true);
    const r = await fetch("/api/dc-cil/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type }),
    });
    const json = await r.json();
    setReminderLoading(false);
    setReminderDraft(json.draft);
    toast.success("Reminder drafted by Claude");
  }

  async function applyBylaw() {
    const r = await fetch("/api/dc-cil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bylaw_update", pct: Number(bylawPct) }),
    });
    const json = await r.json();
    if (r.ok) {
      toast.success(`Applied. ${json.affected} accounts updated.`);
      setBylawOpen(false);
      load();
    }
  }

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DC/CIL Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Development Charges and Cash-in-Lieu of Parkland accounts, all in one place.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setBylawOpen(true)}>
          <Calculator className="w-3.5 h-3.5" />
          By-law update simulator
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Outstanding"
          value={data ? formatCurrency(data.kpis.totalOutstanding) : ""}
          icon={<Receipt className="w-4 h-4" />}
          loading={!data}
          index={0}
        />
        <KpiCard
          label="Overdue"
          value={data ? formatCurrency(data.kpis.overdue) : ""}
          trend="down"
          icon={<AlertTriangle className="w-4 h-4" />}
          loading={!data}
          index={1}
        />
        <KpiCard
          label="Collected MTD"
          value={data ? formatCurrency(data.kpis.collectedMtd) : ""}
          trend="up"
          icon={<CheckCircle2 className="w-4 h-4" />}
          loading={!data}
          index={2}
        />
        <KpiCard
          label="Disputed"
          value={data ? formatCurrency(data.kpis.disputed) : ""}
          icon={<TrendingDown className="w-4 h-4" />}
          loading={!data}
          index={3}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-md">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 h-7 rounded text-xs font-medium transition-colors ${
                    tab === t
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />
              <Input
                placeholder="Search developer, project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!data && <Skeleton className="h-[300px]" />}
          {data && tab === "DC Accounts" && (
            <DcTable
              rows={data.dc}
              search={search}
              onRow={(row) => setSelected({ type: "dc", row })}
            />
          )}
          {data && tab === "CIL Accounts" && (
            <CilTable
              rows={data.cil}
              search={search}
              onRow={(row) => setSelected({ type: "cil", row })}
            />
          )}
          {data && tab === "Combined" && (
            <div className="space-y-4">
              <DcTable rows={data.dc.slice(0, 10)} search={search} onRow={(row) => setSelected({ type: "dc", row })} compact />
              <CilTable rows={data.cil.slice(0, 10)} search={search} onRow={(row) => setSelected({ type: "cil", row })} compact />
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) {
            setSelected(null);
            setReminderDraft(null);
          }
        }}
        title={selected?.type === "dc" ? "DC Account" : "CIL Account"}
        description={selected?.row.project_name}
        width="w-[540px]"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {selected.type === "dc" && (
                <>
                  <Field label="Developer" value={selected.row.developer} />
                  <Field label="By-law" value={selected.row.by_law_version} />
                  <Field label="Units" value={`${selected.row.units} ${selected.row.unit_type}`} />
                  <Field label="Address" value={selected.row.address} />
                  <Field label="Due" value={formatDate(selected.row.due_date)} />
                </>
              )}
              {selected.type === "cil" && (
                <>
                  <Field label="Parkland" value={`${selected.row.parkland_sqm.toLocaleString()} sqm`} />
                  <Field label="Rate" value={`$${selected.row.rate_per_sqm}/sqm`} />
                </>
              )}
              <Field label="Total Owed" value={formatCurrency(selected.row.total_owed)} />
              <Field label="Paid" value={formatCurrency(selected.row.paid)} />
              <Field label="Balance" value={formatCurrency(selected.row.balance)} />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-subtle">Status</div>
                <Badge variant={statusVariant(selected.row.status)} className="mt-1">
                  {selected.row.status}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Payment timeline
              </h3>
              <div className="space-y-2">
                <TimelineRow date="Issued" amount={selected.row.total_owed} status="info" />
                {selected.row.paid > 0 && (
                  <TimelineRow date="Last payment" amount={selected.row.paid} status="success" />
                )}
                {selected.row.balance > 0 && (
                  <TimelineRow date="Outstanding" amount={selected.row.balance} status="warning" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => genReminder(selected.row.id, selected.type)}
                disabled={reminderLoading}
              >
                <Sparkles className="w-3 h-3" />
                {reminderLoading ? "Drafting..." : "Generate reminder"}
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => markPaid(selected.row.id, selected.type)}
                disabled={selected.row.balance === 0}
              >
                Mark as paid
              </Button>
            </div>

            {reminderDraft && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-border bg-surface-2 p-4"
              >
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Draft reminder
                </h3>
                <textarea
                  className="w-full h-48 bg-transparent text-sm font-sans leading-relaxed resize-y outline-none"
                  value={reminderDraft}
                  onChange={(e) => setReminderDraft(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(reminderDraft);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success("Reminder dispatched (simulated)");
                      setReminderDraft(null);
                    }}
                  >
                    Send (simulated)
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={bylawOpen} onOpenChange={setBylawOpen} title="By-law update simulator" description="Bump active DC rates by a percentage." size="md">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Rate increase (%)</span>
            <Input
              type="number"
              step="0.5"
              value={bylawPct}
              onChange={(e) => setBylawPct(e.target.value)}
            />
          </label>
          {data && (
            <div className="rounded-md border border-border bg-surface-2 p-3 text-sm">
              <p className="text-muted-foreground">
                Will update <span className="font-medium text-foreground">{data.dc.filter((r) => r.status !== "paid").length}</span> active accounts.
              </p>
              <p className="text-muted-foreground mt-1">
                Estimated new total outstanding:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatCurrency(
                    data.dc.filter((r) => r.status !== "paid").reduce((s, r) => s + r.balance * (1 + Number(bylawPct) / 100), 0)
                  )}
                </span>
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBylawOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyBylaw}>Apply</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-subtle">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

function TimelineRow({ date, amount, status }: { date: string; amount: number; status: "info" | "success" | "warning" }) {
  const colors = {
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
  };
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2 w-2 rounded-full ${colors[status]}`} />
      <div className="flex-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{date}</span>
        <span className="font-medium tabular-nums">{formatCurrency(amount)}</span>
      </div>
    </div>
  );
}

function DcTable({ rows, search, onRow, compact }: { rows: DcAccount[]; search: string; onRow: (r: DcAccount) => void; compact?: boolean }) {
  const filtered = React.useMemo(
    () =>
      rows.filter(
        (r) =>
          !search ||
          r.developer.toLowerCase().includes(search.toLowerCase()) ||
          r.project_name.toLowerCase().includes(search.toLowerCase()) ||
          r.address.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<DcAccount>[] = [
    { accessorKey: "developer", header: "Developer", cell: (i) => <span className="font-medium">{i.getValue<string>()}</span> },
    { accessorKey: "project_name", header: "Project" },
    { accessorKey: "units", header: "Units", cell: (i) => <span className="tabular-nums">{i.getValue<number>()}</span> },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: (i) => <span className="tabular-nums font-medium">{formatCurrency(i.getValue<number>())}</span>,
    },
    {
      accessorKey: "due_date",
      header: "Due",
      cell: (i) => <span className="tabular-nums text-muted-foreground">{formatDate(i.getValue<string>())}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (i) => <Badge variant={statusVariant(i.getValue<string>())}>{i.getValue<string>()}</Badge>,
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  return (
    <div className="overflow-x-auto">
      {compact && <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Development Charges</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {table.getHeaderGroups()[0].headers.map((h) => (
              <th key={h.id} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={h.column.getToggleSortingHandler()}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRow(r.original)}
              className="border-b border-border hover:bg-surface-2 cursor-pointer transition-colors"
            >
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-3 py-2.5">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-sm text-muted-foreground">
                No accounts match
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CilTable({ rows, search, onRow, compact }: { rows: CilAccount[]; search: string; onRow: (r: CilAccount) => void; compact?: boolean }) {
  const filtered = React.useMemo(
    () => rows.filter((r) => !search || r.project_name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  return (
    <div className="overflow-x-auto">
      {compact && <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cash-in-Lieu of Parkland</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Parkland</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rate</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRow(r)}
              className="border-b border-border hover:bg-surface-2 cursor-pointer transition-colors"
            >
              <td className="px-3 py-2.5 font-medium">{r.project_name}</td>
              <td className="px-3 py-2.5 tabular-nums">{r.parkland_sqm.toLocaleString()} sqm</td>
              <td className="px-3 py-2.5 tabular-nums">${r.rate_per_sqm}/sqm</td>
              <td className="px-3 py-2.5 tabular-nums font-medium">{formatCurrency(r.balance)}</td>
              <td className="px-3 py-2.5">
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                No accounts match
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
