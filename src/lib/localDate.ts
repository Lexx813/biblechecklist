// "YYYY-MM-DD" in the user's local timezone. Reading days and streaks are
// keyed on the user's calendar day — `toISOString().slice(0, 10)` is the UTC
// day, which puts a US evening read on "tomorrow".
export function localDateStr(date: Date = new Date(), offsetDays = 0): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
