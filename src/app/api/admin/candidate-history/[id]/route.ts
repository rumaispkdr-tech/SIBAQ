import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCandidateById, getCandidateTaskHistory } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const candidateId = params.id;
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const history = await getCandidateTaskHistory(candidateId, 30);
    return NextResponse.json({ candidate, history });
  } catch (err: any) {
    console.error("Candidate history error:", err);
    return NextResponse.json({ error: "Failed to load candidate history" }, { status: 500 });
  }
}
