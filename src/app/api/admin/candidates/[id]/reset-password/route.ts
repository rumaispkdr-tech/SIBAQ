import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { updateCandidate, getCandidateById, createAuditLog } from "@/lib/db";

const ResetPasswordSchema = z.object({
  new_password: z.string().min(6).optional().default("Sibaq@Candidate2026!"),
  require_change: z.boolean().optional().default(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const candidateId = params.id;
    const existing = await getCandidateById(candidateId);
    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = ResetPasswordSchema.safeParse(body);
    const newPassword = parsed.success ? parsed.data.new_password : "Sibaq@Candidate2026!";
    const requireChange = parsed.success ? parsed.data.require_change : true;

    const newHash = await hashPassword(newPassword);
    await updateCandidate(candidateId, {
      password_hash: newHash,
      must_change_password: requireChange,
    });

    await createAuditLog({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: "PASSWORD_RESET_BY_ADMIN",
      target_type: "candidate",
      target_id: candidateId,
      details: `Reset password for ${existing.admission_no} (${existing.name})`,
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${existing.admission_no}. Temporary password: ${newPassword}`,
      temporaryPassword: newPassword,
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
