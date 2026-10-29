import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import {
  getCandidateByAdmission,
  createCandidate,
  createAuditLog,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const { csvData } = await req.json();
    if (!csvData || typeof csvData !== "string") {
      return NextResponse.json({ error: "CSV text data is required" }, { status: 400 });
    }

    const lines = csvData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must contain a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    const admIdx = headers.findIndex((h) => h.includes("admission") || h === "adm" || h === "id");
    const nameIdx = headers.findIndex((h) => h === "name" || h.includes("candidate"));
    const pwdIdx = headers.findIndex((h) => h.includes("password") || h === "pwd");
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile"));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h === "mail");

    if (admIdx === -1 || nameIdx === -1) {
      return NextResponse.json(
        {
          error:
            "CSV must include columns for 'admission_no' (or 'admission') and 'name'. Optional: 'password', 'phone', 'email'.",
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const defaultPassword = "Sibaq@Candidate2026!";
    const defaultHash = await hashPassword(defaultPassword);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV split handling quotes
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanVals = values.map((v) => v.trim().replace(/^"|"$/g, ""));

      const rawAdm = cleanVals[admIdx]?.trim();
      const rawName = cleanVals[nameIdx]?.trim();
      const rawPwd = pwdIdx !== -1 ? cleanVals[pwdIdx]?.trim() : "";
      const rawPhone = phoneIdx !== -1 ? cleanVals[phoneIdx]?.trim() : null;
      const rawEmail = emailIdx !== -1 ? cleanVals[emailIdx]?.trim() : null;

      if (!rawAdm || !rawName) {
        skipped++;
        errors.push(`Row ${i + 1}: Missing admission number or candidate name.`);
        continue;
      }

      const admissionNo = rawAdm.toUpperCase();
      const existing = await getCandidateByAdmission(admissionNo);
      if (existing) {
        skipped++;
        errors.push(`Row ${i + 1}: Admission number ${admissionNo} already exists.`);
        continue;
      }

      const passwordHash = rawPwd ? await hashPassword(rawPwd) : defaultHash;

      await createCandidate({
        admission_no: admissionNo,
        name: rawName,
        password_hash: passwordHash,
        role: "candidate",
        must_change_password: true,
        phone: rawPhone,
        email: rawEmail,
      });

      imported++;
    }

    await createAuditLog({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: "CSV_IMPORT",
      target_type: "candidates",
      target_id: "batch",
      details: `Imported ${imported} candidates, skipped ${skipped}.`,
    });

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 15), // top 15 errors
      totalRows: lines.length - 1,
    });
  } catch (err: any) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}
