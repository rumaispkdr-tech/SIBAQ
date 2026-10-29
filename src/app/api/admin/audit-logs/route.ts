import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAuditLogs } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const logs = await getAuditLogs(100);
    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Audit logs error:", err);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }
}
