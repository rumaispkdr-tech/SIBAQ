import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { incrementRecitation, getRecitationEvents, createAuditLog } from "@/lib/db";
import { getTodayDateString } from "@/lib/timezone";
import { calculateRecitationStats } from "@/lib/recitation";

const IncrementSchema = z.object({
  durationSeconds: z.number().nonnegative().optional().default(0),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = IncrementSchema.safeParse(body);
    const durationSeconds = parsed.success ? parsed.data.durationSeconds : 0;

    const today = getTodayDateString();
    const result = await incrementRecitation(user.id, today, durationSeconds);

    if (result.isNewCompletion) {
      await createAuditLog({
        actor_id: user.id,
        actor_name: user.name,
        actor_role: user.role,
        action: "TASK_COMPLETED",
        target_type: "daily_task",
        target_id: result.task.id,
        details: `Completed 33 recitations for date ${today}`,
      });
    }

    const events = await getRecitationEvents(result.task.id);
    const stats = calculateRecitationStats(events, result.task.completed_count, result.task.target_count);

    return NextResponse.json({
      success: true,
      task: result.task,
      isNewCompletion: result.isNewCompletion,
      stats,
    });
  } catch (err: any) {
    console.error("Increment recitation error:", err);
    return NextResponse.json(
      { error: "Failed to record recitation. Please try again." },
      { status: 500 }
    );
  }
}
