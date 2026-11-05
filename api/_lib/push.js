// Notifikasyon push (sou telefòn kliyan an, menm lè sit la fèmen), ak Web Push standa a.
// Kle VAPID yo: sèvè a kreye yo premye fwa epi l kenbe yo nan private/push (admin yo sèlman ka li l),
// konsa pa gen anyen pou mete nan Vercel. Yon notifikasyon pa janm bloke sa sèvè a t ap fè a.
import webpush from "web-push";
import { SITE_URL } from "../../config.js";

let keys = null;
export async function pushKeys(backend) {
  if (keys) return keys;
  let saved = await backend.adminGetPushKeys();
  if (!saved?.publicKey || !saved?.privateKey) {
    saved = webpush.generateVAPIDKeys();
    await backend.adminSetPushKeys({ publicKey: saved.publicKey, privateKey: saved.privateKey, created_at: new Date() });
  }
  keys = { publicKey: saved.publicKey, privateKey: saved.privateKey };
  return keys;
}

// Voye yon notifikasyon bay tout aparèy yon kliyan. Aparèy ki pa abòne ankò yo retire.
export async function pushTo(backend, uid, { title, body, url = "/", tag }) {
  try {
    const subs = await backend.adminGetPushSubs(uid);
    if (!subs.length) return 0;
    const { publicKey, privateKey } = await pushKeys(backend);
    const payload = JSON.stringify({ title, body, url, tag });
    const options = { vapidDetails: { subject: SITE_URL, publicKey, privateKey }, TTL: 24 * 3600, timeout: 6000 };
    const results = await Promise.allSettled(subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, options)));
    const dead = subs.filter((_, i) => results[i].status === "rejected" && [404, 410].includes(results[i].reason?.statusCode));
    if (dead.length) await backend.adminSetPushSubs(uid, subs.filter((s) => !dead.includes(s)));
    results.filter((r) => r.status === "rejected" && ![404, 410].includes(r.reason?.statusCode)).forEach((r) => console.error("push", r.reason?.statusCode, r.reason?.body || r.reason?.message));
    return results.filter((r) => r.status === "fulfilled").length;
  } catch (error) {
    console.error("push", error);
    return 0;
  }
}

const htg = (n) => `${new Intl.NumberFormat("fr-FR").format(Number(n) || 0).replace(/ /g, " ")} HTG`;

// Notifikasyon pou chak chanjman kòmand oswa depo (an franse, lang prensipal sit la)
export function orderPush(order) {
  const what = `${order.product_name} · ${order.package_label}`;
  if (order.status === "delivered") return { title: `✅ Commande ${order.code} livrée`, body: order.delivery_code ? `${what}. Votre code est dans l'historique.` : `${what} est sur votre compte. Bon jeu !`, url: "/?page=history", tag: order.code };
  if (order.status === "refused") return { title: `↩️ Commande ${order.code} refusée`, body: order.payment ? what : `${htg(order.price)} remboursés dans votre Wallet.`, url: "/?page=history", tag: order.code };
  return null;
}

export function depositPush(deposit) {
  if (deposit.status === "completed") return { title: `💰 Dépôt de ${htg(deposit.amount)} confirmé`, body: "Le montant est dans votre Wallet. Vous pouvez acheter maintenant.", url: "/?page=wallet", tag: `dep_${deposit.id}` };
  if (deposit.status === "refused") return { title: `Dépôt de ${htg(deposit.amount)} refusé`, body: deposit.admin_note || "Écrivez-nous sur WhatsApp si vous avez une question.", url: "/?page=wallet", tag: `dep_${deposit.id}` };
  return null;
}
