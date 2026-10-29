import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/db";
import { getTodayDateString } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getTodayDateString();

  try {
    const stats = await getAdminStats(date);
    return NextResponse.json({ stats });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
