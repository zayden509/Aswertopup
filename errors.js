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
  if (code.includes("popup-blocked")) return "Navigatè a bloke fenèt Google la. Pèmèt popup yo, oswa konekte ak imèl.";
  if (code.includes("operation-not-allowed")) return "Koneksyon ak Google poko aktive. Konekte ak imèl pou kounye a.";
  if (code.includes("internal-error") || code.includes("web-storage-unsupported")) return "Koneksyon ak Google la pa mache sou navigatè sa a. Eseye ankò, oswa konekte ak imèl.";
  if (code.includes("unauthorized-domain")) return "Google poko otorize sit sa a. Konekte ak imèl pou kounye a.";
  if (code.includes("account-exists-with-different-credential")) return "Gen yon kont ak imèl sa a deja. Konekte ak imèl ou ak modpas ou.";
  if (code.includes("network-request-failed") || code === "unavailable") return "Pa gen koneksyon entènèt. Eseye ankò.";
  if (code === "permission-denied") return "Operasyon an refize. Rechaje paj la epi eseye ankò.";
  return error?.message || "Yon bagay pa mache. Eseye ankò.";
}
