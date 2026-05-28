import { NextResponse } from "next/server";
import { resetDb, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  resetDb();
  logAudit("user", "reset_demo_data", "database");
  return NextResponse.json({ ok: true });
}
