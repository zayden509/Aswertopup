// Yon paj ki rete louvri lontan (ex. Panneau admin lan sou telefòn) kenbe ansyen vèsyon sit la.
// Nou gade si Vercel pibliye yon lòt vèsyon (lòt fichye /assets/index-….js) pou n mande rechaje.
const currentScript = () => document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute("src") || null;

export async function newVersionAvailable() {
  const mine = currentScript();
  if (!mine) return false; // mòd devlopman
  try {
    const html = await (await fetch("/", { cache: "no-store" })).text();
    const live = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
    return Boolean(live && live !== mine);
  } catch {
    return false;
  }
}
