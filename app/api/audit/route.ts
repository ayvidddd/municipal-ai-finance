import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity = url.searchParams.get("entity") || "";
  const actor = url.searchParams.get("actor") || "";
  const action = url.searchParams.get("action") || "";
  const q = url.searchParams.get("q") || "";
  const exportCsv = url.searchParams.get("export") === "csv";

  const where: string[] = [];
  const params: string[] = [];
  if (entity) {
    where.push("entity = ?");
    params.push(entity);
  }
  if (actor) {
    where.push("actor = ?");
    params.push(actor);
  }
  if (action) {
    where.push("action = ?");
    params.push(action);
  }
  if (q) {
    where.push("(details LIKE ? OR entity LIKE ? OR action LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const rows = db
    .prepare(
      `SELECT * FROM audit_log ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY timestamp DESC LIMIT ${exportCsv ? 2000 : 200}`
    )
    .all(...params) as Array<{
    id: number;
    timestamp: string;
    actor: string;
    action: string;
    entity: string;
    entity_id: string | null;
    details: string | null;
  }>;

  if (exportCsv) {
    const header = "id,timestamp,actor,action,entity,entity_id,details\n";
    const csv =
      header +
      rows
        .map((r) =>
          [r.id, r.timestamp, r.actor, r.action, r.entity, r.entity_id || "", (r.details || "").replace(/"/g, '""')]
            .map((v) => `"${String(v).replace(/\n/g, " ")}"`)
            .join(",")
        )
        .join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=audit_log.csv",
      },
    });
  }

  const facets = {
    entities: db.prepare(`SELECT DISTINCT entity FROM audit_log ORDER BY entity`).all() as Array<{ entity: string }>,
    actors: db.prepare(`SELECT DISTINCT actor FROM audit_log ORDER BY actor`).all() as Array<{ actor: string }>,
    actions: db.prepare(`SELECT DISTINCT action FROM audit_log ORDER BY action`).all() as Array<{ action: string }>,
  };

  return NextResponse.json({ rows, facets });
}
