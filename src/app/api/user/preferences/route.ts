import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getUserPreferences, updateUserPreferences } from "@/lib/db";

const PreferencesSchema = z.object({
  theme: z.enum(["peaceful-garden", "morning-mist", "soft-sky", "warm-evening", "minimal-ivory"]).optional(),
  text_size: z.enum(["standard", "large", "extra-large"]).optional(),
  animation_mode: z.enum(["full", "reduced", "off"]).optional(),
  fireworks_enabled: z.boolean().optional(),
  ambient_motion: z.boolean().optional(),
  sound_enabled: z.boolean().optional(),
  eye_rest_enabled: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getUserPreferences(user.id);
  return NextResponse.json({ preferences: prefs });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preferences data" }, { status: 400 });
    }

    const updated = await updateUserPreferences(user.id, parsed.data);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
