// Lang sit la pou kliyan yo: Kreyòl (default) oswa Franse, ak bouton KR / FR la.
// Chak tèks ekri de fwa kote l parèt: t("Kreyòl", "Français"). Panneau admin lan rete an Kreyòl.
// Lè kliyan an chanje lang, paj la rechaje: tout tèks yo (menm banye yo) pran nouvo lang lan.
const KEY = "awens.lang";
let current = "kr";
try {
  if (typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "fr") current = "fr";
} catch {
  // navigatè a pa kenbe anyen: Kreyòl
}
if (typeof document !== "undefined") document.documentElement.lang = current === "fr" ? "fr" : "ht";

export const lang = () => current;
export const t = (kr, fr) => (current === "fr" ? fr : kr);

export function setLang(next) {
  if (next === current) return;
  try {
    localStorage.setItem(KEY, next === "fr" ? "fr" : "kr");
  } catch {
    return;
  }
  window.location.reload();
}
