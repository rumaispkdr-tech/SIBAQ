import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRecitationStats,
  formatDuration,
} from "../src/lib/recitation";
import { getTodayDateString } from "../src/lib/timezone";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "../src/lib/auth";
import {
  ensureDbInitialized,
  getOrCreateDailyTask,
  incrementRecitation,
  undoRecitation,
} from "../src/lib/db";

test("Sibaq Recitation Pace & Time Estimations", async (t) => {
  await t.test("formats durations properly", () => {
    assert.equal(formatDuration(0), "0s");
    assert.equal(formatDuration(45), "45s");
    assert.equal(formatDuration(60), "1m");
    assert.equal(formatDuration(125), "2m 5s");
  });

  await t.test("indicates calculating state when fewer than 2 valid events exist", () => {
    const stats = calculateRecitationStats([], 0, 33);
    assert.equal(stats.hasEnoughData, false);
    assert.equal(stats.averageDurationSeconds, 0);
  });

  await t.test("computes average of valid durations and excludes pauses > 300s", () => {
    const mockEvents = [
      { id: "1", daily_task_id: "t", candidate_id: "c", count_after: 1, duration_seconds: 20, timestamp: "t1" },
      { id: "2", daily_task_id: "t", candidate_id: "c", count_after: 2, duration_seconds: 22, timestamp: "t2" },
      { id: "3", daily_task_id: "t", candidate_id: "c", count_after: 3, duration_seconds: 24, timestamp: "t3" },
      { id: "4", daily_task_id: "t", candidate_id: "c", count_after: 4, duration_seconds: 600, timestamp: "t4" }, // pause ignored!
      { id: "5", daily_task_id: "t", candidate_id: "c", count_after: 5, duration_seconds: 18, timestamp: "t5" },
    ];

    const stats = calculateRecitationStats(mockEvents, 5, 33);
    assert.equal(stats.hasEnoughData, true);
    // Average of 20, 22, 24, 18 = 84 / 4 = 21 seconds
    assert.equal(stats.averageDurationSeconds, 21);
    // Remaining count = 33 - 5 = 28 * 21 = 588s = ~9m 48s
    assert.equal(stats.estimatedRemainingSeconds, 28 * 21);
  });
});

test("Timezone and Asia/Kolkata Schedule Boundary", () => {
  const today = getTodayDateString();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/, "Today date must be YYYY-MM-DD");
});

test("Authentication and Cryptographic Security", async (t) => {
  await t.test("secure password hashing and verification", async () => {
    const pass = "TestPass@123";
    const hash = await hashPassword(pass);
    assert.notEqual(pass, hash);
    const valid = await verifyPassword(pass, hash);
    assert.equal(valid, true);
    const invalid = await verifyPassword("WrongPass", hash);
    assert.equal(invalid, false);
  });

  await t.test("JWT token signing and role extraction", () => {
    const payload = {
      id: "candidate-123",
      admission_no: "SBQ-9999",
      name: "Zaid Ahmad",
      role: "candidate" as const,
      must_change_password: false,
    };
    const token = signToken(payload);
    assert.ok(typeof token === "string" && token.length > 20);

    const verified = verifyToken(token);
    assert.ok(verified);
    assert.equal(verified?.admission_no, "SBQ-9999");
    assert.equal(verified?.role, "candidate");
  });

  await t.test("rate limiter blocks after threshold", () => {
    const testId = "test_rate_user";
    clearLoginRateLimit(testId);

    for (let i = 0; i < 5; i++) {
      recordFailedLogin(testId);
    }
    assert.equal(checkLoginRateLimit(testId).allowed, true);

    recordFailedLogin(testId); // 6th attempt
    assert.equal(checkLoginRateLimit(testId).allowed, false);

    clearLoginRateLimit(testId);
    assert.equal(checkLoginRateLimit(testId).allowed, true);
  });
});

test("Persistent Daily Task & Counting Logic (0 to 33 bounds)", async (t) => {
  const db = await ensureDbInitialized();
  const testCandidateId = `cand-test-${Date.now()}`;
  const testDate = "2026-12-31";

  // Create temporary test candidate
  await db.execute({
    sql: `
      INSERT INTO candidates (id, admission_no, name, password_hash, role, must_change_password, is_active, created_at, updated_at)
      VALUES (?, ?, 'Test Candidate', 'hash', 'candidate', 0, 1, '2026-10-28', '2026-10-28')
    `,
    args: [testCandidateId, `TEST-${Date.now().toString().slice(-6)}`],
  });

  await t.test("initial task creation starts at 0/33", async () => {
    const task = await getOrCreateDailyTask(testCandidateId, testDate);
    assert.equal(task.target_count, 33);
    assert.equal(task.completed_count, 0);
    assert.equal(task.status, "not_started");
  });

  await t.test("increments count by exactly 1 and records duration", async () => {
    const res = await incrementRecitation(testCandidateId, testDate, 20);
    assert.equal(res.task.completed_count, 1);
    assert.equal(res.task.status, "in_progress");
    assert.equal(res.isNewCompletion, false);
    assert.equal(res.event.duration_seconds, 20);
  });

  await t.test("undo decrements count by 1", async () => {
    const task = await undoRecitation(testCandidateId, testDate);
    assert.equal(task.completed_count, 0);
    assert.equal(task.status, "not_started");
  });

  await t.test("undo never drops below 0", async () => {
    const task = await undoRecitation(testCandidateId, testDate);
    assert.equal(task.completed_count, 0);
  });

  await t.test("caps count at 33 and flags new completion once", async () => {
    // Fast-forward to 32
    for (let i = 1; i <= 32; i++) {
      await incrementRecitation(testCandidateId, testDate, 15);
    }

    // 33rd recitation
    const finalRec = await incrementRecitation(testCandidateId, testDate, 15);
    assert.equal(finalRec.task.completed_count, 33);
    assert.equal(finalRec.task.status, "completed");
    assert.equal(finalRec.isNewCompletion, true);
    assert.ok(finalRec.task.completed_at);

    // 34th attempt should NOT exceed 33 and NOT flag new completion
    const beyondRec = await incrementRecitation(testCandidateId, testDate, 15);
    assert.equal(beyondRec.task.completed_count, 33);
    assert.equal(beyondRec.isNewCompletion, false);

    // Clean up temporary test data
    await db.execute({
      sql: "DELETE FROM recitation_events WHERE candidate_id = ?",
      args: [testCandidateId],
    });
    await db.execute({
      sql: "DELETE FROM daily_tasks WHERE candidate_id = ?",
      args: [testCandidateId],
    });
    await db.execute({
      sql: "DELETE FROM candidates WHERE id = ?",
      args: [testCandidateId],
    });
  });
});
