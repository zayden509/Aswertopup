// Verifikasyon kòd tranzaksyon yon depo ak SMS NatCash/MonCash telefòn boutik la resevwa.
// Sèvè a (konfimasyon otomatik) ak Panneau admin lan sèvi ak menm règ yo.

// Yon SMS ki rive plis pase 24 è anvan (oswa apre) depo a se yon ansyen tranzaksyon: pa otomatik
export const SMS_MAX_AGE_MS = 24 * 3600 * 1000;

export const sameReference = (a, b) => String(a || "").toUpperCase().replace(/[^A-Z0-9]/g, "") === String(b || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const time = (value) => new Date(value || Date.now()).getTime();

export function smsTooOld(deposit, sms) {
  return Math.abs(time(deposit.created_at) - time(sms.received_at)) > SMS_MAX_AGE_MS;
}

// Yon lòt depo (nenpòt mòd peman) ki deja konfime ak menm kòd la
export function duplicateOf(deposit, deposits) {
  return (deposits || []).find((d) => d.id !== deposit.id && d.status === "completed" && sameReference(d.reference, deposit.reference)) || null;
}
