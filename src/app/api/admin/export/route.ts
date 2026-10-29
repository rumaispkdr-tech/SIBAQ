import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listCandidatesWithTasks, createAuditLog } from "@/lib/db";
import { getTodayDateString } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getTodayDateString();
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";

  try {
    const data = await listCandidatesWithTasks({
      date,
      status,
      search,
      page: 1,
      limit: 1000,
    });

    // Generate CSV content
    const header = [
      "Admission No",
      "Chest No",
      "Candidate Name",
      "Class",
      "Date",
      "Completed Count",
      "Target Count",
      "Status",
      "Completion Time",
      "Last Activity",
      "Phone",
      "Email",
    ];

    const rows = data.candidates.map((c) => [
      `"${c.admission_no}"`,
      `"${c.chest_no || ""}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.class_name || ""}"`,
      `"${c.task_date}"`,
      c.today_count,
      c.target_count,
      `"${c.status}"`,
      `"${c.completed_at || ""}"`,
      `"${c.last_activity || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
    ]);

    const csvString = [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    await createAuditLog({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: "EXPORT_CSV",
      target_type: "daily_tasks",
      target_id: date,
      details: `Exported ${data.candidates.length} records for date ${date}`,
    });

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sibaq-swalath-report-${date}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Export CSV error:", err);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}
