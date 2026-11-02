// Imèl kòmand yo: lè yon kliyan pase yon kòmand, li resevwa yon imèl e admin nan resevwa youn tou.
// Imèl yo pati nan yon kont Gmail (Vercel → Settings → Environment Variables):
//   SMTP_USER   adrès Gmail ki voye imèl yo (egz: awenstopup@gmail.com)
//   SMTP_PASS   "Mot de passe d'application" Gmail la (16 lèt), PA modpas nòmal la
//   ADMIN_EMAIL adrès ki resevwa imèl kòmand yo (si l vid: SMTP_USER). Plizyè: separe ak vigil.
// Si SMTP_USER/SMTP_PASS vid, pa gen imèl ki pati e kòmand yo mache nòmal.
import nodemailer from "nodemailer";
import { SITE_URL } from "../../config.js";

const cleanEnv = (value) => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
const user = () => cleanEnv(process.env.SMTP_USER);
const pass = () => cleanEnv(process.env.SMTP_PASS).replace(/\s+/g, ""); // Google montre l ak espas
const adminEmails = () => (cleanEnv(process.env.ADMIN_EMAIL) || user()).split(/[,;\s]+/).filter(Boolean);

export const mailReady = () => Boolean(user() && pass());

let transport = null;
function mailer() {
  transport ??= nodemailer.createTransport({
    host: cleanEnv(process.env.SMTP_HOST) || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: user(), pass: pass() },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transport;
}

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const htg = (n) => `${Number(n || 0).toLocaleString("fr-FR")} HTG`;

function rows(order) {
  const list = [
    ["Kòmand / Commande", order.code],
    ["Pwodwi / Produit", `${order.product_name} · ${order.package_label}`],
    order.player_id ? ["Player ID", order.player_id] : null,
    ["Pri / Prix", htg(order.price)],
    order.promo ? ["Kòd pwomo", order.promo] : null,
  ].filter(Boolean);
  return {
    html: list.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#64748b">${esc(k)}</td><td style="padding:6px 0;font-weight:600;color:#0f172a">${esc(v)}</td></tr>`).join(""),
    text: list.map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}

function page(title, intro, order, footer) {
  const r = rows(order);
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
<h2 style="margin:0 0 8px;color:#0284c7">Awens Topup</h2>
<h3 style="margin:0 0 12px">${esc(title)}</h3>
<p style="margin:0 0 16px;line-height:1.5">${intro.map(esc).join("<br>")}</p>
<table style="border-collapse:collapse;font-size:15px">${r.html}</table>
<p style="margin:20px 0 0;line-height:1.5;color:#475569">${footer.map(esc).join("<br>")}</p>
</div>`;
  const text = `Awens Topup\n${title}\n\n${intro.join("\n")}\n\n${r.text}\n\n${footer.join("\n")}`;
  return { html, text };
}

// Voye imèl kliyan an ak imèl admin nan. Pa janm voye erè: yon imèl ki pa pati pa kraze kòmand lan.
export async function sendOrderEmails(order, customer) {
  if (!mailReady()) return { sent: 0, skipped: "setup" };
  const from = `"Awens Topup" <${user()}>`;
  const site = SITE_URL.replace(/\/+$/, "");
  const jobs = [];

  if (customer?.email) {
    const name = customer.full_name ? ` ${customer.full_name}` : "";
    const body = page(
      `Kòmand ${order.code} resevwa ✅`,
      [`Bonjou${name}, mèsi pou kòmand ou!`, "Merci pour votre commande ! Nous la traitons maintenant."],
      order,
      ["Swiv kòmand ou nan Istorik / Suivez votre commande dans l'Historique :", `${site}`],
    );
    jobs.push(mailer().sendMail({ from, to: customer.email, subject: `Kòmand ${order.code} resevwa · Awens Topup`, ...body }));
  }

  const admins = adminEmails();
  if (admins.length) {
    const body = page(
      `Nouvo kòmand ${order.code} 🛒`,
      [`Kliyan: ${customer?.full_name || "-"} (${customer?.email || "san imèl"})`],
      order,
      ["Trete l nan Panneau admin lan:", `${site}`],
    );
    jobs.push(mailer().sendMail({
      from, to: admins, subject: `🛒 Nouvo kòmand ${order.code} · ${order.product_name} ${order.package_label}`,
      replyTo: customer?.email || undefined, ...body,
    }));
  }

  const results = await Promise.allSettled(jobs);
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("mail", r.reason));
  return { sent: results.filter((r) => r.status === "fulfilled").length };
}
