import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { undoRecitation, getRecitationEvents } from "@/lib/db";
import { getTodayDateString } from "@/lib/timezone";
import { calculateRecitationStats } from "@/lib/recitation";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getTodayDateString();
    const task = await undoRecitation(user.id, today);
    const events = await getRecitationEvents(task.id);
    const stats = calculateRecitationStats(events, task.completed_count, task.target_count);

    return NextResponse.json({
      success: true,
      task,
      stats,
    });
  } catch (err: any) {
    console.error("Undo recitation error:", err);
    return NextResponse.json(
      { error: "Failed to undo recitation" },
      { status: 500 }
    );
  }
}
