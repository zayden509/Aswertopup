// Jou yo kalkile ak lè Ayiti, pou estatistik yo ak kontè vizitè yo tonbe sou menm jou a
const HAITI = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Port-au-Prince", year: "numeric", month: "2-digit", day: "2-digit" });

// "2026-10-23"
export function dayKey(date) {
  return HAITI.format(new Date(date));
}

// N dènye jou yo, pi ansyen an anvan, jodi a an dènye
export function lastDays(n, now = Date.now()) {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10));
}
