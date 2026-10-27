// Verifikasyon kòd tranzaksyon yon depo ak SMS NatCash/MonCash telefòn boutik la resevwa.
// Sèvè a (konfimasyon otomatik) ak Panneau admin lan sèvi ak menm règ yo.

// Yon SMS ki rive plis pase 24 è anvan (oswa apre) depo a se yon ansyen tranzaksyon: pa otomatik
export const SMS_MAX_AGE_MS = 24 * 3600 * 1000;

// Kòd tranzaksyon an san espas, tirè ni pwen, an majiskil: "2607-2853 633942" = "26072853633942".
// Zewo ki devan yon kòd ki gen chif sèlman pa konte: MonCash "003577973060" = "3577973060".
export function normalizeReference(reference) {
  const ref = String(reference || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^\d+$/.test(ref) ? ref.replace(/^0+(?=\d)/, "") : ref;
}
export const sameReference = (a, b) => normalizeReference(a) === normalizeReference(b);

// Yon nimewo telefòn ayisyen (50934431664 oswa 34431664) se pa yon ID tranzaksyon
export const isPhoneNumber = (reference) => /^(?:509)?[2-5]\d{7}$/.test(normalizeReference(reference));

// Yon mòd peman verifye otomatikman sèlman si sit la resevwa yon SMS li nan 7 dènye jou yo, sa
// vle di SIM li a konekte nan httpSMS. Sinon depo yo ale kote admin nan (kliyan an pa janm bloke).
export const SMS_SEEN_MS = 7 * 86400000;
export const smsConnected = (lastAt) => Boolean(lastAt) && Date.now() - new Date(lastAt).getTime() < SMS_SEEN_MS;

// Montan SMS la an goud antye (1 500.50 → 1500): se sa ki antre nan Wallet la
export const smsAmount = (sms) => Math.floor(Number(sms.amount) || 0);

const time = (value) => new Date(value || Date.now()).getTime();

export function smsTooOld(deposit, sms) {
  return Math.abs(time(deposit.created_at) - time(sms.received_at)) > SMS_MAX_AGE_MS;
}

// Yon lòt depo (nenpòt mòd peman) ki deja konfime ak menm kòd la
export function duplicateOf(deposit, deposits) {
  return (deposits || []).find((d) => d.id !== deposit.id && d.status === "completed" && sameReference(d.reference, deposit.reference)) || null;
}
