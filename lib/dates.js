// All business dates (deliveries, lock windows) are IST — Asia/Kolkata.
// Never use Date.toISOString() for calendar dates: it converts to UTC and
// shifts the day (e.g. Sunday 00:00 IST → Saturday in UTC).

const TZ = 'Asia/Kolkata';

// Today's date in IST as 'YYYY-MM-DD'
export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

// Day of week in IST: 0=Sunday … 6=Saturday
export function istDayOfWeek(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: TZ })).getDay();
}

// Add n days to a 'YYYY-MM-DD' string (pure date arithmetic, no TZ involved)
export function addDays(ymd, n) {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Next upcoming Sunday (IST) as 'YYYY-MM-DD'. If today is Sunday, returns
// the Sunday a week from now.
export function nextSundayIST(from = new Date()) {
  const ymd = from.toLocaleDateString('en-CA', { timeZone: TZ });
  const d = new Date(ymd + 'T00:00:00Z');
  const days = (7 - d.getUTCDay()) % 7 || 7;
  return addDays(ymd, days);
}
