import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { updateCandidate, getCandidateById, createAuditLog } from "@/lib/db";

const UpdateCandidateSchema = z.object({
  name: z.string().min(2).optional(),
  is_active: z.boolean().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export async function PUT(
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

    const body = await req.json();
    const parsed = UpdateCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    await updateCandidate(candidateId, parsed.data);

    await createAuditLog({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: "CANDIDATE_UPDATED",
      target_type: "candidate",
      target_id: candidateId,
      details: JSON.stringify(parsed.data),
    });

    return NextResponse.json({ success: true, message: "Candidate updated" });
  } catch (err: any) {
    console.error("Update candidate error:", err);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}
