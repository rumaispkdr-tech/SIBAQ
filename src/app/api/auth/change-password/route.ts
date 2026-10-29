import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getCandidateById, updateCandidate, createAuditLog } from "@/lib/db";

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { current_password, new_password } = parsed.data;
    const candidate = await getCandidateById(user.id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const matches = await verifyPassword(current_password, candidate.password_hash);
    if (!matches) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newHash = await hashPassword(new_password);
    await updateCandidate(user.id, {
      password_hash: newHash,
      must_change_password: false,
    });

    await createAuditLog({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: "PASSWORD_CHANGED",
      target_type: "candidate",
      target_id: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
