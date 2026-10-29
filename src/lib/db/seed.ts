import bcrypt from "bcryptjs";
import { ensureDbInitialized, getCandidateByAdmission } from "./index";
import { REAL_SIBAQ_STUDENTS } from "../data/students";

export async function seedDatabase(cleanExistingDemo = false) {
  console.log("🌿 Initializing database schema...");
  const db = await ensureDbInitialized();

  if (cleanExistingDemo) {
    console.log("🧹 Purging all existing demo candidates and tasks...");
    await db.execute("DELETE FROM recitation_events");
    await db.execute("DELETE FROM daily_tasks");
    await db.execute("DELETE FROM user_preferences");
    await db.execute("DELETE FROM candidates");
  }

  const now = new Date().toISOString();

  // 1. Seed Administrator (Admission No: 111, Password: 111 three times = 111111111)
  console.log("👑 Setting up Administrator account (Admission: 111)...");
  const adminPasswordHash = await bcrypt.hash("111111111", 10);
  const adminId = "admin-sibaq-111";

  const adminExists = await getCandidateByAdmission("111");
  if (!adminExists) {
    await db.execute({
      sql: `
        INSERT INTO candidates (
          id, admission_no, name, password_hash, role, must_change_password,
          is_active, phone, email, chest_no, class_name, created_at, updated_at
        )
        VALUES (?, '111', 'Usthad Ahmad (Sibaq Convenor)', ?, 'admin', 0, 1, '+91 98460 12345', 'admin@sibaq.edu', 'ADMIN-01', 'HQ', ?, ?)
      `,
      args: [adminId, adminPasswordHash, now, now],
    });
    console.log("✅ Admin account ready: Admission No: 111 | Password: 111 three times (111111111)");
  } else {
    // Ensure password hash is updated to 111111111
    await db.execute({
      sql: "UPDATE candidates SET admission_no = '111', password_hash = ?, updated_at = ? WHERE role = 'admin'",
      args: [adminPasswordHash, now],
    });
    console.log("✅ Admin account updated: Admission No: 111 | Password: 111 three times (111111111)");
  }

  // 2. Seed 153 Real Candidates from the Excel Data
  console.log(`🌱 Initializing ${REAL_SIBAQ_STUDENTS.length} Real Sibaq Candidates (Clean 0/33)...`);
  let candidatesAdded = 0;

  for (const student of REAL_SIBAQ_STUDENTS) {
    const admissionNo = student.admissionNo.trim();
    // Candidate password is their admission number 3 times (e.g. 1070 -> 107010701070)
    const plainPassword = `${admissionNo}${admissionNo}${admissionNo}`;
    const passwordHash = await bcrypt.hash(plainPassword, 8);
    const candidateId = `cand-${admissionNo}`;

    const exists = await getCandidateByAdmission(admissionNo);
    if (!exists) {
      await db.execute({
        sql: `
          INSERT INTO candidates (
            id, admission_no, name, password_hash, role, must_change_password,
            is_active, phone, email, chest_no, class_name, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, 'candidate', 0, 1, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          candidateId,
          admissionNo,
          student.name,
          passwordHash,
          `+91 98470 ${admissionNo}`,
          `student_${admissionNo}@sibaq.edu`,
          student.chestNo,
          student.className,
          now,
          now,
        ],
      });

      // Insert default preferences
      await db.execute({
        sql: `
          INSERT OR IGNORE INTO user_preferences (candidate_id, theme, text_size, animation_mode, fireworks_enabled, ambient_motion, sound_enabled, eye_rest_enabled)
          VALUES (?, 'peaceful-garden', 'large', 'full', 1, 1, 0, 1)
        `,
        args: [candidateId],
      });

      candidatesAdded++;
    } else {
      // Update candidate details and password hash to 3x admission number
      await db.execute({
        sql: `
          UPDATE candidates SET 
            name = ?, 
            password_hash = ?, 
            chest_no = ?, 
            class_name = ?, 
            updated_at = ? 
          WHERE admission_no = ?
        `,
        args: [student.name, passwordHash, student.chestNo, student.className, now, admissionNo],
      });
      candidatesAdded++;
    }
  }

  console.log(`✨ Real candidate setup complete! ${candidatesAdded} real student accounts configured.`);
  console.log(`🔒 ALL 153 CANDIDATES START FRESH AT 0/33 — EACH HAS THEIR OWN ADMISSION NO AND PASSWORD.`);
}

// Allow direct CLI execution
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  const shouldClean = process.argv.includes("--clean") || true;
  seedDatabase(shouldClean)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed error:", err);
      process.exit(1);
    });
}
