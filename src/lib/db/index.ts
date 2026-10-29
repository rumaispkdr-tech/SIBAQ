import { createClient, Client } from "@libsql/client";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  Candidate,
  CandidateSafe,
  DailyTask,
  RecitationEvent,
  UserPreferences,
  AuditLog,
  AdminStats,
  CandidateWithTask,
} from "../types";
import { getTodayDateString } from "../timezone";

let dbInstance: Client | null = null;
let initialized = false;

function getDbClient(): Client {
  if (dbInstance) return dbInstance;

  // 1. If remote libSQL / Turso cloud database URL is configured
  const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (remoteUrl) {
    dbInstance = createClient({
      url: remoteUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return dbInstance;
  }

  // 2. Serverless environment handling (e.g., Vercel read-only filesystem)
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let dbPath: string;

  if (isServerless) {
    const tmpDataDir = "/tmp";
    const tmpDbPath = path.join(tmpDataDir, "sibaq.db");
    const bundledDbPath = path.join(process.cwd(), "data", "sibaq.db");

    // Copy bundled database to writable /tmp if not already present
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(bundledDbPath)) {
        try {
          fs.copyFileSync(bundledDbPath, tmpDbPath);
        } catch (e) {
          console.warn("Could not copy bundled db to /tmp:", e);
        }
      }
    }
    dbPath = tmpDbPath;
  } else {
    // Local development
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        console.warn("Could not create data dir:", e);
      }
    }
    dbPath = path.join(dataDir, "sibaq.db");
  }

  // Normalize Windows paths for libsql file: url
  const normalizedPath = dbPath.replace(/\\/g, "/");

  dbInstance = createClient({
    url: `file:${normalizedPath}`,
  });

  return dbInstance;
}

export async function ensureDbInitialized(): Promise<Client> {
  const db = getDbClient();
  if (initialized) return db;

  // Initialize tables
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      admission_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'candidate',
      must_change_password INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      phone TEXT,
      email TEXT,
      chest_no TEXT,
      class_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      task_date TEXT NOT NULL,
      target_count INTEGER NOT NULL DEFAULT 33,
      completed_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'not_started',
      completed_at TEXT,
      last_recitation_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(candidate_id, task_date),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recitation_events (
      id TEXT PRIMARY KEY,
      daily_task_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      count_after INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (daily_task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      candidate_id TEXT PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'peaceful-garden',
      text_size TEXT NOT NULL DEFAULT 'large',
      animation_mode TEXT NOT NULL DEFAULT 'full',
      fireworks_enabled INTEGER NOT NULL DEFAULT 1,
      ambient_motion INTEGER NOT NULL DEFAULT 1,
      sound_enabled INTEGER NOT NULL DEFAULT 0,
      eye_rest_enabled INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_name TEXT,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_admission ON candidates(admission_no);
    CREATE INDEX IF NOT EXISTS idx_daily_tasks_lookup ON daily_tasks(candidate_id, task_date);
    CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);
    CREATE INDEX IF NOT EXISTS idx_recitations_task ON recitation_events(daily_task_id);
    CREATE INDEX IF NOT EXISTS idx_recitations_candidate ON recitation_events(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);

  // Ensure columns chest_no and class_name exist in candidates table
  try {
    await db.execute("ALTER TABLE candidates ADD COLUMN chest_no TEXT");
  } catch {}
  try {
    await db.execute("ALTER TABLE candidates ADD COLUMN class_name TEXT");
  } catch {}

  initialized = true;
  return db;
}

// Helper to sanitize candidate object for frontend consumption
export function toSafeCandidate(c: any): CandidateSafe {
  return {
    id: String(c.id),
    admission_no: String(c.admission_no),
    name: String(c.name),
    role: c.role as any,
    must_change_password: Boolean(c.must_change_password),
    is_active: Boolean(c.is_active),
    phone: c.phone ? String(c.phone) : null,
    email: c.email ? String(c.email) : null,
    chest_no: c.chest_no ? String(c.chest_no) : null,
    class_name: c.class_name ? String(c.class_name) : null,
    created_at: String(c.created_at),
    updated_at: String(c.updated_at),
  };
}

export async function getCandidateByAdmission(
  admission_no: string
): Promise<Candidate | null> {
  const db = await ensureDbInitialized();
  const trimmed = admission_no.trim();
  // Support matching admission_no OR if '111'/'admin' check admin role
  const res = await db.execute({
    sql: `SELECT * FROM candidates 
          WHERE LOWER(admission_no) = LOWER(?) 
             OR (LOWER(?) IN ('111', 'admin') AND role = 'admin') 
          LIMIT 1`,
    args: [trimmed, trimmed],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    admission_no: String(row.admission_no),
    name: String(row.name),
    password_hash: String(row.password_hash),
    role: row.role as any,
    must_change_password: Boolean(row.must_change_password),
    is_active: Boolean(row.is_active),
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    chest_no: row.chest_no ? String(row.chest_no) : null,
    class_name: row.class_name ? String(row.class_name) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: "SELECT * FROM candidates WHERE id = ? LIMIT 1",
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    admission_no: String(row.admission_no),
    name: String(row.name),
    password_hash: String(row.password_hash),
    role: row.role as any,
    must_change_password: Boolean(row.must_change_password),
    is_active: Boolean(row.is_active),
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    chest_no: row.chest_no ? String(row.chest_no) : null,
    class_name: row.class_name ? String(row.class_name) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createCandidate(data: {
  admission_no: string;
  name: string;
  password_hash: string;
  role?: "candidate" | "admin";
  must_change_password?: boolean;
  phone?: string | null;
  email?: string | null;
}): Promise<CandidateSafe> {
  const db = await ensureDbInitialized();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const role = data.role || "candidate";
  const mustChange = data.must_change_password ? 1 : 0;

  await db.execute({
    sql: `
      INSERT INTO candidates (id, admission_no, name, password_hash, role, must_change_password, is_active, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `,
    args: [
      id,
      data.admission_no.trim().toUpperCase(),
      data.name.trim(),
      data.password_hash,
      role,
      mustChange,
      data.phone || null,
      data.email || null,
      now,
      now,
    ],
  });

  // Create default preferences
  await db.execute({
    sql: `
      INSERT OR IGNORE INTO user_preferences (candidate_id, theme, text_size, animation_mode, fireworks_enabled, ambient_motion, sound_enabled, eye_rest_enabled)
      VALUES (?, 'peaceful-garden', 'large', 'full', 1, 1, 0, 1)
    `,
    args: [id],
  });

  return {
    id,
    admission_no: data.admission_no.trim().toUpperCase(),
    name: data.name.trim(),
    role,
    must_change_password: Boolean(mustChange),
    is_active: true,
    phone: data.phone || null,
    email: data.email || null,
    created_at: now,
    updated_at: now,
  };
}

export async function updateCandidate(
  id: string,
  data: {
    name?: string;
    is_active?: boolean;
    password_hash?: string;
    must_change_password?: boolean;
    phone?: string | null;
    email?: string | null;
  }
): Promise<void> {
  const db = await ensureDbInitialized();
  const now = new Date().toISOString();
  const sets: string[] = ["updated_at = ?"];
  const args: any[] = [now];

  if (data.name !== undefined) {
    sets.push("name = ?");
    args.push(data.name.trim());
  }
  if (data.is_active !== undefined) {
    sets.push("is_active = ?");
    args.push(data.is_active ? 1 : 0);
  }
  if (data.password_hash !== undefined) {
    sets.push("password_hash = ?");
    args.push(data.password_hash);
  }
  if (data.must_change_password !== undefined) {
    sets.push("must_change_password = ?");
    args.push(data.must_change_password ? 1 : 0);
  }
  if (data.phone !== undefined) {
    sets.push("phone = ?");
    args.push(data.phone);
  }
  if (data.email !== undefined) {
    sets.push("email = ?");
    args.push(data.email);
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE candidates SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function getOrCreateDailyTask(
  candidate_id: string,
  task_date = getTodayDateString()
): Promise<DailyTask> {
  const db = await ensureDbInitialized();
  const now = new Date().toISOString();

  // Try to find existing task
  const existing = await db.execute({
    sql: "SELECT * FROM daily_tasks WHERE candidate_id = ? AND task_date = ? LIMIT 1",
    args: [candidate_id, task_date],
  });

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    return {
      id: String(row.id),
      candidate_id: String(row.candidate_id),
      task_date: String(row.task_date),
      target_count: Number(row.target_count),
      completed_count: Number(row.completed_count),
      status: row.status as any,
      completed_at: row.completed_at ? String(row.completed_at) : null,
      last_recitation_at: row.last_recitation_at ? String(row.last_recitation_at) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  // Insert fresh 0/33 daily task
  const newId = crypto.randomUUID();
  try {
    await db.execute({
      sql: `
        INSERT INTO daily_tasks (id, candidate_id, task_date, target_count, completed_count, status, created_at, updated_at)
        VALUES (?, ?, ?, 33, 0, 'not_started', ?, ?)
      `,
      args: [newId, candidate_id, task_date, now, now],
    });

    return {
      id: newId,
      candidate_id,
      task_date,
      target_count: 33,
      completed_count: 0,
      status: "not_started",
      completed_at: null,
      last_recitation_at: null,
      created_at: now,
      updated_at: now,
    };
  } catch {
    // If concurrent insert occurred, return the one created
    const retry = await db.execute({
      sql: "SELECT * FROM daily_tasks WHERE candidate_id = ? AND task_date = ? LIMIT 1",
      args: [candidate_id, task_date],
    });
    const row = retry.rows[0];
    return {
      id: String(row.id),
      candidate_id: String(row.candidate_id),
      task_date: String(row.task_date),
      target_count: Number(row.target_count),
      completed_count: Number(row.completed_count),
      status: row.status as any,
      completed_at: row.completed_at ? String(row.completed_at) : null,
      last_recitation_at: row.last_recitation_at ? String(row.last_recitation_at) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}

/**
 * Increment recitation count by exactly +1 (Never exceeds 33)
 */
export async function incrementRecitation(
  candidate_id: string,
  task_date = getTodayDateString(),
  durationSeconds = 0
): Promise<{ task: DailyTask; isNewCompletion: boolean; event: RecitationEvent }> {
  const db = await ensureDbInitialized();
  const task = await getOrCreateDailyTask(candidate_id, task_date);

  if (task.completed_count >= 33) {
    // Already maxed out at 33
    const latestEventRes = await db.execute({
      sql: "SELECT * FROM recitation_events WHERE daily_task_id = ? ORDER BY timestamp DESC LIMIT 1",
      args: [task.id],
    });
    const latestEvent = latestEventRes.rows[0];
    return {
      task,
      isNewCompletion: false,
      event: {
        id: latestEvent ? String(latestEvent.id) : "",
        daily_task_id: task.id,
        candidate_id,
        count_after: task.completed_count,
        duration_seconds: latestEvent ? Number(latestEvent.duration_seconds) : 0,
        timestamp: latestEvent ? String(latestEvent.timestamp) : task.updated_at,
      },
    };
  }

  const newCount = task.completed_count + 1;
  const isNewCompletion = newCount === 33 && task.status !== "completed";
  const newStatus = newCount === 33 ? "completed" : "in_progress";
  const now = new Date().toISOString();
  const completedAt = isNewCompletion ? now : task.completed_at;

  const eventId = crypto.randomUUID();

  // Atomically update task and insert recitation event
  await db.executeMultiple(`
    UPDATE daily_tasks
    SET completed_count = ${newCount},
        status = '${newStatus}',
        last_recitation_at = '${now}',
        completed_at = ${completedAt ? `'${completedAt}'` : "NULL"},
        updated_at = '${now}'
    WHERE id = '${task.id}';

    INSERT INTO recitation_events (id, daily_task_id, candidate_id, count_after, duration_seconds, timestamp)
    VALUES ('${eventId}', '${task.id}', '${candidate_id}', ${newCount}, ${Math.max(0, Math.round(durationSeconds))}, '${now}');
  `);

  const updatedTask: DailyTask = {
    ...task,
    completed_count: newCount,
    status: newStatus as any,
    last_recitation_at: now,
    completed_at: completedAt,
    updated_at: now,
  };

  const event: RecitationEvent = {
    id: eventId,
    daily_task_id: task.id,
    candidate_id,
    count_after: newCount,
    duration_seconds: Math.max(0, Math.round(durationSeconds)),
    timestamp: now,
  };

  return { task: updatedTask, isNewCompletion, event };
}

/**
 * Undo recitation count by -1 (Never drops below 0)
 */
export async function undoRecitation(
  candidate_id: string,
  task_date = getTodayDateString()
): Promise<DailyTask> {
  const db = await ensureDbInitialized();
  const task = await getOrCreateDailyTask(candidate_id, task_date);

  if (task.completed_count <= 0) {
    return task;
  }

  const newCount = task.completed_count - 1;
  const newStatus = newCount === 0 ? "not_started" : "in_progress";
  const now = new Date().toISOString();

  // Find and remove the latest recitation event
  await db.executeMultiple(`
    DELETE FROM recitation_events
    WHERE id IN (
      SELECT id FROM recitation_events
      WHERE daily_task_id = '${task.id}'
      ORDER BY timestamp DESC
      LIMIT 1
    );

    UPDATE daily_tasks
    SET completed_count = ${newCount},
        status = '${newStatus}',
        completed_at = NULL,
        updated_at = '${now}'
    WHERE id = '${task.id}';
  `);

  return {
    ...task,
    completed_count: newCount,
    status: newStatus as any,
    completed_at: null,
    updated_at: now,
  };
}

export async function getRecitationEvents(
  daily_task_id: string
): Promise<RecitationEvent[]> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: "SELECT * FROM recitation_events WHERE daily_task_id = ? ORDER BY timestamp ASC",
    args: [daily_task_id],
  });

  return res.rows.map((r) => ({
    id: String(r.id),
    daily_task_id: String(r.daily_task_id),
    candidate_id: String(r.candidate_id),
    count_after: Number(r.count_after),
    duration_seconds: Number(r.duration_seconds),
    timestamp: String(r.timestamp),
  }));
}

export async function getUserPreferences(
  candidate_id: string
): Promise<UserPreferences> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: "SELECT * FROM user_preferences WHERE candidate_id = ? LIMIT 1",
    args: [candidate_id],
  });

  if (res.rows.length === 0) {
    return {
      candidate_id,
      theme: "peaceful-garden",
      text_size: "large",
      animation_mode: "full",
      fireworks_enabled: true,
      ambient_motion: true,
      sound_enabled: false,
      eye_rest_enabled: true,
    };
  }

  const r = res.rows[0];
  return {
    candidate_id: String(r.candidate_id),
    theme: r.theme as any,
    text_size: r.text_size as any,
    animation_mode: r.animation_mode as any,
    fireworks_enabled: Boolean(r.fireworks_enabled),
    ambient_motion: Boolean(r.ambient_motion),
    sound_enabled: Boolean(r.sound_enabled),
    eye_rest_enabled: Boolean(r.eye_rest_enabled),
  };
}

export async function updateUserPreferences(
  candidate_id: string,
  prefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  const db = await ensureDbInitialized();
  const current = await getUserPreferences(candidate_id);
  const updated: UserPreferences = { ...current, ...prefs };

  await db.execute({
    sql: `
      INSERT INTO user_preferences (candidate_id, theme, text_size, animation_mode, fireworks_enabled, ambient_motion, sound_enabled, eye_rest_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(candidate_id) DO UPDATE SET
        theme = excluded.theme,
        text_size = excluded.text_size,
        animation_mode = excluded.animation_mode,
        fireworks_enabled = excluded.fireworks_enabled,
        ambient_motion = excluded.ambient_motion,
        sound_enabled = excluded.sound_enabled,
        eye_rest_enabled = excluded.eye_rest_enabled
    `,
    args: [
      candidate_id,
      updated.theme,
      updated.text_size,
      updated.animation_mode,
      updated.fireworks_enabled ? 1 : 0,
      updated.ambient_motion ? 1 : 0,
      updated.sound_enabled ? 1 : 0,
      updated.eye_rest_enabled ? 1 : 0,
    ],
  });

  return updated;
}

export async function getAdminStats(
  date = getTodayDateString()
): Promise<AdminStats> {
  const db = await ensureDbInitialized();

  // Get total registered candidates (excluding pure admin accounts)
  const totalRes = await db.execute({
    sql: "SELECT COUNT(*) as count FROM candidates WHERE role = 'candidate' AND is_active = 1",
  });
  const totalCandidates = Number(totalRes.rows[0]?.count || 0);

  // Get task status breakdown for the given date
  const tasksRes = await db.execute({
    sql: `
      SELECT dt.status, COUNT(*) as count
      FROM daily_tasks dt
      JOIN candidates c ON c.id = dt.candidate_id
      WHERE dt.task_date = ? AND c.role = 'candidate' AND c.is_active = 1
      GROUP BY dt.status
    `,
    args: [date],
  });

  let completedToday = 0;
  let inProgressToday = 0;
  let notStartedRecorded = 0;

  for (const row of tasksRes.rows) {
    const status = String(row.status);
    const count = Number(row.count);
    if (status === "completed") completedToday = count;
    else if (status === "in_progress") inProgressToday = count;
    else if (status === "not_started") notStartedRecorded = count;
  }

  // Any candidate without a task record for today is effectively 'not started'
  const recordedCount = completedToday + inProgressToday + notStartedRecorded;
  const notStartedToday = notStartedRecorded + Math.max(0, totalCandidates - recordedCount);
  const incompleteToday = inProgressToday + notStartedToday;

  const completionPercentage =
    totalCandidates > 0
      ? Math.round((completedToday / totalCandidates) * 100 * 10) / 10
      : 0;

  return {
    totalCandidates,
    completedToday,
    inProgressToday,
    notStartedToday,
    incompleteToday,
    completionPercentage,
    date,
  };
}


export async function listCandidatesWithTasks(options: {
  date?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: "admission_no" | "name" | "today_count" | "status";
  sortOrder?: "asc" | "desc";
}): Promise<{ candidates: CandidateWithTask[]; total: number; page: number; limit: number }> {
  const db = await ensureDbInitialized();
  const date = options.date || getTodayDateString();
  const search = options.search?.trim().toLowerCase() || "";
  const statusFilter = options.status || "all";
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(200, options.limit || 50));
  const offset = (page - 1) * limit;

  let whereClauses: string[] = ["c.role = 'candidate'"];
  let args: any[] = [date];

  if (search) {
    whereClauses.push("(LOWER(c.admission_no) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(COALESCE(c.chest_no, '')) LIKE ? OR LOWER(COALESCE(c.class_name, '')) LIKE ?)");
    args.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (statusFilter === "completed") {
    whereClauses.push("dt.status = 'completed'");
  } else if (statusFilter === "in_progress") {
    whereClauses.push("dt.status = 'in_progress'");
  } else if (statusFilter === "not_started") {
    whereClauses.push("(dt.status = 'not_started' OR dt.status IS NULL)");
  } else if (statusFilter === "incomplete") {
    whereClauses.push("(dt.status != 'completed' OR dt.status IS NULL)");
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  // Count total matching
  const countSql = `
    SELECT COUNT(*) as total
    FROM candidates c
    LEFT JOIN daily_tasks dt ON dt.candidate_id = c.id AND dt.task_date = ?
    ${whereSql}
  `;

  const countRes = await db.execute({ sql: countSql, args });
  const total = Number(countRes.rows[0]?.total || 0);

  // Sorting
  const sortBy = options.sortBy || "admission_no";
  const sortOrder = options.sortOrder === "desc" ? "DESC" : "ASC";
  let orderColumn = "c.admission_no";
  if (sortBy === "name") orderColumn = "c.name";
  if (sortBy === "today_count") orderColumn = "COALESCE(dt.completed_count, 0)";
  if (sortBy === "status") orderColumn = "COALESCE(dt.status, 'not_started')";

  const querySql = `
    SELECT 
      c.id,
      c.admission_no,
      c.name,
      c.role,
      c.is_active,
      c.phone,
      c.email,
      c.chest_no,
      c.class_name,
      COALESCE(dt.task_date, ?) as task_date,
      COALESCE(dt.completed_count, 0) as today_count,
      COALESCE(dt.target_count, 33) as target_count,
      COALESCE(dt.status, 'not_started') as status,
      dt.last_recitation_at as last_activity,
      dt.completed_at
    FROM candidates c
    LEFT JOIN daily_tasks dt ON dt.candidate_id = c.id AND dt.task_date = ?
    ${whereSql}
    ORDER BY ${orderColumn} ${sortOrder}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const queryArgs = [date, date, ...args.slice(1)];
  const res = await db.execute({ sql: querySql, args: queryArgs });

  const candidates: CandidateWithTask[] = res.rows.map((r) => ({
    id: String(r.id),
    admission_no: String(r.admission_no),
    name: String(r.name),
    role: String(r.role),
    is_active: Boolean(r.is_active),
    phone: r.phone ? String(r.phone) : null,
    email: r.email ? String(r.email) : null,
    chest_no: r.chest_no ? String(r.chest_no) : null,
    class_name: r.class_name ? String(r.class_name) : null,
    task_date: String(r.task_date),
    today_count: Number(r.today_count),
    target_count: Number(r.target_count),
    status: String(r.status),
    last_activity: r.last_activity ? String(r.last_activity) : null,
    completed_at: r.completed_at ? String(r.completed_at) : null,
  }));

  return { candidates, total, page, limit };
}

export async function getCandidateTaskHistory(
  candidate_id: string,
  limit = 30
): Promise<DailyTask[]> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: "SELECT * FROM daily_tasks WHERE candidate_id = ? ORDER BY task_date DESC LIMIT ?",
    args: [candidate_id, limit],
  });

  return res.rows.map((r) => ({
    id: String(r.id),
    candidate_id: String(r.candidate_id),
    task_date: String(r.task_date),
    target_count: Number(r.target_count),
    completed_count: Number(r.completed_count),
    status: r.status as any,
    completed_at: r.completed_at ? String(r.completed_at) : null,
    last_recitation_at: r.last_recitation_at ? String(r.last_recitation_at) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));
}

export async function createAuditLog(data: {
  actor_id: string;
  actor_name?: string;
  actor_role: "candidate" | "admin";
  action: string;
  target_type: string;
  target_id: string;
  details?: string | null;
  ip_address?: string | null;
}): Promise<void> {
  const db = await ensureDbInitialized();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      data.actor_id,
      data.actor_name || null,
      data.actor_role,
      data.action,
      data.target_type,
      data.target_id,
      data.details || null,
      data.ip_address || null,
      now,
    ],
  });
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });

  return res.rows.map((r) => ({
    id: String(r.id),
    actor_id: String(r.actor_id),
    actor_name: r.actor_name ? String(r.actor_name) : undefined,
    actor_role: r.actor_role as any,
    action: String(r.action),
    target_type: String(r.target_type),
    target_id: String(r.target_id),
    details: r.details ? String(r.details) : null,
    ip_address: r.ip_address ? String(r.ip_address) : null,
    created_at: String(r.created_at),
  }));
}

export async function getSiteSetting(key: string): Promise<string | null> {
  const db = await ensureDbInitialized();
  const res = await db.execute({
    sql: "SELECT value FROM site_settings WHERE key = ? LIMIT 1",
    args: [key],
  });
  if (res.rows.length === 0) return null;
  return String(res.rows[0].value);
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  const db = await ensureDbInitialized();
  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    args: [key, value, now],
  });
}
