import { t } from "./i18n.js";

// Erè ki deja an kreyòl, pou kliyan an
export class UserError extends Error {}

// Mesaj erè Firebase yo an kreyòl
export function errorText(error) {
  if (error instanceof UserError) return error.message;
  const code = error?.code || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return t("Imèl oswa modpas la pa bon.", "E-mail ou mot de passe incorrect.");
  if (code.includes("email-already-in-use")) return t("Gen yon kont ak imèl sa a deja. Konekte pito.", "Un compte existe déjà avec cet e-mail. Connectez-vous plutôt.");
  if (code.includes("weak-password")) return t("Modpas la dwe gen omwen 6 karaktè.", "Le mot de passe doit contenir au moins 6 caractères.");
  if (code.includes("invalid-email")) return t("Imèl sa a pa bon.", "Cet e-mail n'est pas valide.");
  if (code.includes("too-many-requests")) return t("Ou eseye twòp fwa. Tann kèk minit epi eseye ankò.", "Trop de tentatives. Attendez quelques minutes et réessayez.");
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return t("Koneksyon Google la anile.", "Connexion Google annulée.");
  if (code.includes("popup-blocked")) return t("Navigatè a bloke fenèt Google la. Pèmèt popup yo, oswa konekte ak imèl.", "Le navigateur a bloqué la fenêtre Google. Autorisez les popups, ou connectez-vous par e-mail.");
  if (code.includes("operation-not-allowed")) return t("Koneksyon ak Google poko aktive. Konekte ak imèl pou kounye a.", "La connexion Google n'est pas encore activée. Connectez-vous par e-mail pour l'instant.");
  if (code.includes("internal-error") || code.includes("web-storage-unsupported")) return t("Koneksyon ak Google la pa mache sou navigatè sa a. Eseye ankò, oswa konekte ak imèl.", "La connexion Google ne fonctionne pas sur ce navigateur. Réessayez, ou connectez-vous par e-mail.");
  if (code.includes("unauthorized-domain")) return t("Google poko otorize sit sa a. Konekte ak imèl pou kounye a.", "Google n'a pas encore autorisé ce site. Connectez-vous par e-mail pour l'instant.");
  if (code.includes("account-exists-with-different-credential")) return t("Gen yon kont ak imèl sa a deja. Konekte ak imèl ou ak modpas ou.", "Un compte existe déjà avec cet e-mail. Connectez-vous avec votre e-mail et votre mot de passe.");
  if (code.includes("network-request-failed") || code === "unavailable") return t("Pa gen koneksyon entènèt. Eseye ankò.", "Pas de connexion Internet. Réessayez.");
  if (code === "permission-denied") return t("Operasyon an refize. Rechaje paj la epi eseye ankò.", "Opération refusée. Rechargez la page et réessayez.");
  return error?.message || t("Yon bagay pa mache. Eseye ankò.", "Une erreur est survenue. Réessayez.");
}
