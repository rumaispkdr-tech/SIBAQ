import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPreferences } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const preferences = await getUserPreferences(user.id);

  return NextResponse.json({
    user,
    preferences,
  });
}
