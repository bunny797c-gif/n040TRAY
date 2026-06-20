const TZ = "Asia/Kolkata";

export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function istDayOfWeek(date: Date = new Date()): number {
  return new Date(date.toLocaleString("en-US", { timeZone: TZ })).getDay();
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nextSundayIST(from: Date = new Date()): string {
  const ymd = from.toLocaleDateString("en-CA", { timeZone: TZ });
  const d = new Date(ymd + "T00:00:00Z");
  const days = (7 - d.getUTCDay()) % 7 || 7;
  return addDays(ymd, days);
}

export function isLockWindow(): boolean {
  const day = istDayOfWeek();
  return day === 0 || day === 6; // Sat or Sun
}

export function formatDate(ymd: string): string {
  const d = new Date(ymd + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateShort(ymd: string): string {
  const d = new Date(ymd + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
