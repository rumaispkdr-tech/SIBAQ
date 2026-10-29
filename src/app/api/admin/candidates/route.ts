import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, hashPassword } from "@/lib/auth";
import {
  listCandidatesWithTasks,
  createCandidate,
  getCandidateByAdmission,
  createAuditLog,
} from "@/lib/db";
import { getTodayDateString } from "@/lib/timezone";

const CreateCandidateSchema = z.object({
  admission_no: z.string().min(2, "Admission number is required"),
  name: z.string().min(2, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().default("Sibaq@Candidate2026!"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: z.enum(["candidate", "admin"]).optional().default("candidate"),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getTodayDateString();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const sortBy = (searchParams.get("sortBy") as any) || "admission_no";
  const sortOrder = (searchParams.get("sortOrder") as any) || "asc";

  try {
    const data = await listCandidatesWithTasks({
      date,
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("List candidates error:", err);
    return NextResponse.json({ error: "Failed to list candidates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid candidate data" },
        { status: 400 }
      );
    }

    const { admission_no, name, password, phone, email, role } = parsed.data;

    const existing = await getCandidateByAdmission(admission_no);
    if (existing) {
      return NextResponse.json(
        { error: `Admission number ${admission_no} already exists.` },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);
    const candidate = await createCandidate({
      admission_no,
      name,
      password_hash,
      role,
      must_change_password: true,
      phone,
      email,
    });

    await createAuditLog({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: "CANDIDATE_CREATED",
      target_type: "candidate",
      target_id: candidate.id,
      details: `Created candidate ${candidate.admission_no} (${candidate.name})`,
    });

    return NextResponse.json({ success: true, candidate }, { status: 201 });
  } catch (err: any) {
    console.error("Create candidate error:", err);
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
