// Erè ki deja an kreyòl, pou kliyan an
export class UserError extends Error {}

// Mesaj erè Firebase yo an kreyòl
export function errorText(error) {
  if (error instanceof UserError) return error.message;
  const code = error?.code || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return "Imèl oswa modpas la pa bon.";
  if (code.includes("email-already-in-use")) return "Gen yon kont ak imèl sa a deja. Konekte pito.";
  if (code.includes("weak-password")) return "Modpas la dwe gen omwen 6 karaktè.";
  if (code.includes("invalid-email")) return "Imèl sa a pa bon.";
  if (code.includes("too-many-requests")) return "Ou eseye twòp fwa. Tann kèk minit epi eseye ankò.";
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return "Koneksyon Google la anile.";
  if (code.includes("network-request-failed") || code === "unavailable") return "Pa gen koneksyon entènèt. Eseye ankò.";
  if (code === "permission-denied") return "Operasyon an refize. Rechaje paj la epi eseye ankò.";
  return error?.message || "Yon bagay pa mache. Eseye ankò.";
}
