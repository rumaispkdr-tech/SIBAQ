import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateDailyTask, getRecitationEvents } from "@/lib/db";
import { getTodayDateString } from "@/lib/timezone";
import { calculateRecitationStats } from "@/lib/recitation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getTodayDateString();
    const task = await getOrCreateDailyTask(user.id, today);
    const events = await getRecitationEvents(task.id);
    const stats = calculateRecitationStats(events, task.completed_count, task.target_count);

    return NextResponse.json({
      task,
      events,
      stats,
    });
  } catch (err: any) {
    console.error("Error fetching today task:", err);
    return NextResponse.json({ error: "Failed to retrieve today's task" }, { status: 500 });
  }
}
