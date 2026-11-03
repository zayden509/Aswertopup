// Imèl kòmand yo (Gmail). Kliyan an resevwa yon imèl lè l pase yon kòmand, lè kòmand lan
// livre, ak lè l refize. Tout admin sou sit la resevwa yon imèl pou chak nouvo kòmand.
// Vercel → Settings → Environment Variables:
//   SMTP_USER   adrès Gmail ki voye imèl yo (egz: awenstopup@gmail.com)
//   SMTP_PASS   "Mot de passe d'application" Gmail la (16 lèt), PA modpas nòmal la
//   ADMIN_EMAIL (opsyonèl) lòt adrès ki dwe resevwa kòmand yo tou. Plizyè: separe ak vigil.
// Si SMTP_USER/SMTP_PASS vid, pa gen imèl ki pati e kòmand yo mache nòmal.
import nodemailer from "nodemailer";
import { SITE_URL } from "../../config.js";

const cleanEnv = (value) => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
const user = () => cleanEnv(process.env.SMTP_USER);
const pass = () => cleanEnv(process.env.SMTP_PASS).replace(/\s+/g, ""); // Google montre l ak espas
const extraAdmins = () => cleanEnv(process.env.ADMIN_EMAIL).split(/[,;\s]+/).filter(Boolean);
const SITE = SITE_URL.replace(/\/+$/, "");

export const mailReady = () => Boolean(user() && pass());

let transport = null;
function mailer() {
  const port = Number(process.env.SMTP_PORT) || 465;
  transport ??= nodemailer.createTransport({
    host: cleanEnv(process.env.SMTP_HOST) || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: user(), pass: pass() },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transport;
}

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const htg = (n) => `${Number(n || 0).toLocaleString("fr-FR").replace(/ /g, " ")} HTG`;

// Koulè chak kalite imèl
const THEMES = {
  placed: { color: "#0ea5e9", soft: "#e0f2fe", badge: "Kòmand resevwa", icon: "🛒" },
  delivered: { color: "#10b981", soft: "#d1fae5", badge: "Livre", icon: "✅" },
  refused: { color: "#ef4444", soft: "#fee2e2", badge: "Refize", icon: "↩️" },
  admin: { color: "#6366f1", soft: "#e0e7ff", badge: "Nouvo kòmand", icon: "🔔" },
};

function detailRows(order, extra = []) {
  return [
    ["Kòmand", order.code],
    ["Pwodwi", order.product_name],
    ["Pake", order.package_label],
    order.player_id ? ["Player ID", order.player_id] : null,
    order.promo ? ["Kòd pwomo", order.promo] : null,
    ...extra,
    ["Total", htg(order.price)],
  ].filter(Boolean);
}

// Yon imèl HTML ki mache nan Gmail, Outlook ak Apple Mail (tablo + style inline)
function render({ theme, preheader, title, greeting, lines, rows, highlight, button, footnote }) {
  const t = THEMES[theme];
  const rowsHtml = rows.map(([k, v], i) => {
    const last = i === rows.length - 1;
    return `<tr>
<td style="padding:12px 0;border-top:1px solid #eef2f7;color:#64748b;font-size:14px">${esc(k)}</td>
<td align="right" style="padding:12px 0;border-top:1px solid #eef2f7;color:#0f172a;font-size:${last ? 18 : 14}px;font-weight:${last ? 800 : 600}">${esc(v)}</td>
</tr>`;
  }).join("");
  const highlightHtml = highlight ? `<tr><td style="padding:0 32px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.soft};border-radius:14px">
<tr><td style="padding:16px 18px">
<div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${t.color};font-weight:700">${esc(highlight.label)}</div>
<div style="margin-top:6px;font-size:${highlight.mono ? 18 : 15}px;line-height:1.5;color:#0f172a;font-weight:${highlight.mono ? 800 : 500};${highlight.mono ? "font-family:'Courier New',monospace;word-break:break-all;" : ""}">${esc(highlight.value)}</div>
</td></tr></table></td></tr>` : "";
  const buttonHtml = button ? `<tr><td align="center" style="padding:16px 32px 8px">
<a href="${esc(button.url)}" style="display:inline-block;background:${t.color};color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:999px">${esc(button.label)}</a>
</td></tr>` : "";

  const html = `<!doctype html><html lang="ht"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)">
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,${t.color} 100%);background-color:#0f172a;padding:28px 32px 26px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td><img src="${SITE}/icon-192.png" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border-radius:10px;border:0">
<span style="display:inline-block;vertical-align:middle;margin-left:10px;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.3px">Awens <span style="color:#7dd3fc">Topup</span></span></td>
<td align="right"><span style="display:inline-block;background:rgba(255,255,255,.16);color:#ffffff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px">${t.icon} ${esc(t.badge)}</span></td>
</tr></table>
<div style="margin-top:22px;color:#ffffff;font-size:24px;line-height:1.3;font-weight:800">${esc(title)}</div>
</td></tr>
<tr><td style="padding:26px 32px 6px;color:#334155;font-size:15px;line-height:1.6">
${greeting ? `<p style="margin:0 0 10px;font-weight:700;color:#0f172a">${esc(greeting)}</p>` : ""}
${lines.map((l) => `<p style="margin:0 0 8px">${esc(l)}</p>`).join("")}
</td></tr>
${highlightHtml}
<tr><td style="padding:8px 32px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table></td></tr>
${buttonHtml}
<tr><td style="padding:18px 32px 28px;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center">
${footnote ? `${esc(footnote)}<br>` : ""}Awens Topup · Top-up jwèt ak kat kado an Ayiti<br>
<a href="${SITE}" style="color:#0ea5e9;text-decoration:none">${esc(SITE.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [title, "", greeting, ...lines, "", highlight ? `${highlight.label}: ${highlight.value}` : null,
    ...rows.map(([k, v]) => `${k}: ${v}`), "", button ? `${button.label}: ${button.url}` : null, "", "Awens Topup · " + SITE]
    .filter((l) => l !== null && l !== undefined).join("\n");
  return { html, text };
}

async function send(messages) {
  const from = `"Awens Topup" <${user()}>`;
  const results = await Promise.allSettled(messages.map((m) => mailer().sendMail({ from, ...m })));
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("mail", r.reason));
  return { sent: results.filter((r) => r.status === "fulfilled").length };
}

const hello = (customer) => (customer?.full_name ? `Bonjou ${customer.full_name.split(" ")[0]} 👋` : "Bonjou 👋");

// Nouvo kòmand: imèl pou kliyan an + imèl pou chak admin (adminEmails) ak ADMIN_EMAIL
export async function sendOrderEmails(order, customer, adminEmails = []) {
  if (!mailReady()) return { sent: 0, skipped: "setup" };
  const messages = [];

  if (customer?.email) {
    messages.push({
      to: customer.email,
      subject: `🛒 Kòmand ${order.code} resevwa · Awens Topup`,
      ...render({
        theme: "placed",
        preheader: `${order.product_name} · ${order.package_label} — n ap trete l kounye a.`,
        title: "Mèsi pou kòmand ou!",
        greeting: hello(customer),
        lines: [
          "Nou resevwa kòmand ou a e n ap trete l kounye a. W ap resevwa yon lòt imèl lè l livre.",
          "Nous avons bien reçu votre commande. Vous recevrez un autre e-mail dès qu'elle sera livrée.",
        ],
        rows: detailRows(order),
        button: { label: "Swiv kòmand mwen", url: `${SITE}/?page=history` },
        footnote: "Yon kesyon? Reponn imèl sa a oswa ekri nou sou WhatsApp.",
      }),
    });
  }

  const admins = [...new Set([...adminEmails, ...extraAdmins()].map((e) => e.toLowerCase()))];
  if (admins.length) {
    messages.push({
      to: admins.join(", "),
      replyTo: customer?.email || undefined,
      subject: `🔔 Nouvo kòmand ${order.code} · ${order.product_name} ${order.package_label} · ${htg(order.price)}`,
      ...render({
        theme: "admin",
        preheader: `${customer?.full_name || customer?.email || "Yon kliyan"} achte ${order.product_name} ${order.package_label}.`,
        title: `Nouvo kòmand ${order.code}`,
        greeting: null,
        lines: [`Kliyan: ${customer?.full_name || "-"} · ${customer?.email || "san imèl"}`],
        rows: detailRows(order),
        button: { label: "Louvri Panneau admin", url: `${SITE}/?page=admin` },
        footnote: "Reponn imèl sa a pou w ekri kliyan an dirèkteman.",
      }),
    });
  }
  return send(messages);
}

// Kòmand lan livre oswa refize: imèl pou kliyan an
export async function sendStatusEmail(order, customer) {
  if (!mailReady() || !customer?.email) return { sent: 0, skipped: "setup" };
  if (order.status === "delivered") {
    const code = order.delivery_code;
    return send([{
      to: customer.email,
      subject: `✅ Kòmand ${order.code} livre · Awens Topup`,
      ...render({
        theme: "delivered",
        preheader: `${order.product_name} · ${order.package_label} livre!`,
        title: "Kòmand ou livre! 🎉",
        greeting: hello(customer),
        lines: code
          ? ["Kòmand ou a livre. Men kòd ou a anba a. Pa bay pèsonn li.", "Votre commande est livrée. Voici votre code ci-dessous."]
          : ["Kòmand ou a livre sou kont ou. Bon jwèt!", "Votre commande a été livrée sur votre compte. Bon jeu !"],
        highlight: code ? { label: "Kòd ou / Votre code", value: code, mono: true } : null,
        rows: detailRows(order),
        button: { label: "Achte ankò", url: SITE },
        footnote: "Mèsi paske w fè Awens Topup konfyans 💙",
      }),
    }]);
  }
  if (order.status === "refused") {
    const refunded = order.payment ? null : `${htg(order.price)} retounen nan Wallet ou.`;
    return send([{
      to: customer.email,
      subject: `↩️ Kòmand ${order.code} refize · Awens Topup`,
      ...render({
        theme: "refused",
        preheader: refunded || "Kòmand ou a pa t ka fèt.",
        title: "Kòmand ou a pa t ka fèt",
        greeting: hello(customer),
        lines: [
          `Nou regrèt, kòmand ${order.code} lan refize.${refunded ? ` ${refunded}` : ""}`,
          "Nous sommes désolés, votre commande a été refusée." + (refunded ? " Le montant a été remboursé dans votre Wallet." : ""),
        ],
        highlight: order.admin_note ? { label: "Rezon / Raison", value: order.admin_note } : null,
        rows: detailRows(order, refunded ? [["Ranbousman", "Wallet ✅"]] : []),
        button: { label: "Eseye ankò", url: SITE },
        footnote: "Yon kesyon? Reponn imèl sa a oswa ekri nou sou WhatsApp.",
      }),
    }]);
  }
  return { sent: 0 };
}

// Voye imèl estati a yon sèl fwa (backend = bot admin). Pa janm voye erè.
export async function notifyStatus(backend, orderId) {
  try {
    if (!mailReady()) return;
    const order = await backend.adminGetOrder(orderId);
    if (!order || !["delivered", "refused"].includes(order.status) || order.kind === "exchange") return;
    if (!(await backend.adminClaimOrderEmail(`${order.id}_${order.status}`))) return;
    const customer = await backend.adminGetUser(order.user_id);
    await sendStatusEmail(order, customer);
  } catch (error) {
    console.error("status email", error);
  }
}
