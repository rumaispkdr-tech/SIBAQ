/**
 * Asia/Kolkata Timezone utilities for Sibaq Daily Tasks
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getTodayDateString(timeZone = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if Intl fails
    const d = new Date();
    // Offset for UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(d.getTime() + istOffset);
    return istTime.toISOString().split("T")[0];
  }
}

/**
 * Format timestamp into readable Asia/Kolkata date and time
 */
export function formatKolkataDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: DEFAULT_TIMEZONE,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Format timestamp into short time (e.g. 02:45 PM)
 */
export function formatKolkataTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: DEFAULT_TIMEZONE,
      timeStyle: "short",
    }).format(d);
  } catch {
    return isoString;
  }
}
