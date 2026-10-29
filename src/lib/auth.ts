import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CandidateSafe, UserRole } from "./types";
import { getCandidateById } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "sibaq_emerald_serenity_secret_fallback_key_2026";
export const SESSION_COOKIE_NAME = "sibaq_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
  id: string;
  admission_no: string;
  name: string;
  role: UserRole;
  must_change_password: boolean;
  iat?: number;
  exp?: number;
}

// In-memory rate limiter for failed login attempts
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}
const loginRateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_FAILED_ATTEMPTS = 6;

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimitMap.get(identifier);

  if (!entry) return { allowed: true };

  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimitMap.delete(identifier);
    return { allowed: true };
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt);
    return { allowed: false, waitSeconds: Math.ceil(remainingMs / 1000) };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const entry = loginRateLimitMap.get(identifier);

  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimitMap.set(identifier, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
  }
}

export function clearLoginRateLimit(identifier: string): void {
  loginRateLimitMap.delete(identifier);
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get current session user from incoming cookie in Next.js Server Components / Route Handlers
 */
export async function getSessionUser(): Promise<CandidateSafe | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const candidate = await getCandidateById(decoded.id);
    if (!candidate || !candidate.is_active) return null;

    return {
      id: candidate.id,
      admission_no: candidate.admission_no,
      name: candidate.name,
      role: candidate.role,
      must_change_password: candidate.must_change_password,
      is_active: candidate.is_active,
      phone: candidate.phone,
      email: candidate.email,
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Attach secure session cookie to a NextResponse
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clear session cookie from a NextResponse
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
