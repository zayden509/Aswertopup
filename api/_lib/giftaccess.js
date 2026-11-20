// Gift Access (portal.gift-access.com): founisè kòd PIN / kat kado (PIN Free Fire…).
// Menm fason ak plugin WooCommerce ofisyèl yo a (giftacces-for-woo v1.3.18):
//   - chak demann siyen: X-API-KEY, X-API-TIMESTAMP, X-API-SIGNATURE =
//     HMAC-SHA256(timestamp + METHOD + chemen konplè (/api/v1/...) + kò JSON, sekrè API a) an hex
//   - POST /orders { product_id, quantity, reference, fields, amount?, variation_ref? } + Idempotency-Key
//   - GET /orders/{id} → estati + delivery.items[] (pin_code, code, pin…)
//   - GET /wallet/balance, GET /ping
//   - webhook: header x-giftacces-signature = HMAC-SHA256(kò a, sekrè webhook la), event "order.updated"
// Vercel → Environment Variables: GIFTACCESS_API_KEY, GIFTACCESS_API_SECRET, GIFTACCESS_WEBHOOK_SECRET
// (opsyonèl: GIFTACCESS_BASE_URL, GIFTACCESS_EMAIL pou imèl livrezon an bò kote Gift Access).
import crypto from "node:crypto";

const cleanEnv = (value) => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
const baseUrl = () => (cleanEnv(process.env.GIFTACCESS_BASE_URL) || "https://portal.gift-access.com/api/v1").replace(/\/+$/, "");
const apiKey = () => cleanEnv(process.env.GIFTACCESS_API_KEY);
const apiSecret = () => cleanEnv(process.env.GIFTACCESS_API_SECRET);

export const PROVIDER = "giftaccess";
export const giftReady = () => Boolean(apiKey() && apiSecret());

export class GiftAccessError extends Error {
  constructor(message, status = 0, body = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Siyati a: timestamp + METHOD + chemen konplè a (ak /api/v1) + kò JSON la egzakteman jan l voye a
export function signature(secret, method, url, body, timestamp) {
  const path = new URL(url).pathname.replace(/\/+/g, "/");
  return crypto.createHmac("sha256", secret).update(`${timestamp}${method.toUpperCase()}${path}${body}`).digest("hex");
}

function errorMessage(data, fallback) {
  if (data?.error?.message) return String(data.error.message);
  if (data?.message) return String(data.message);
  if (typeof data?.error === "string") return data.error;
  return fallback;
}

export async function giftRequest(method, endpoint, payload = null, headers = {}) {
  if (!giftReady()) throw new GiftAccessError("GIFTACCESS_API_KEY ak GIFTACCESS_API_SECRET poko mete nan Vercel.");
  const url = `${baseUrl()}/${String(endpoint).replace(/^\/+/, "")}`;
  const body = payload ? JSON.stringify(payload) : "";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey(),
      "X-API-TIMESTAMP": timestamp,
      "X-API-SIGNATURE": signature(apiSecret(), method, url, body, timestamp),
      ...headers,
    },
    body: body || undefined,
    signal: AbortSignal.timeout(20000),
  });
  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }
  if (!res.ok || data?.success === false) throw new GiftAccessError(errorMessage(data, `Gift Access HTTP ${res.status}`), res.status, data);
  return data;
}

// Repons yo ka gen kòmand lan nan "order", "data.order" oswa "data"
export function orderPayload(result) {
  if (result?.order && typeof result.order === "object") return result.order;
  if (result?.data?.order && typeof result.data.order === "object") return result.data.order;
  if (result?.data && typeof result.data === "object") return result.data;
  return result || {};
}

const pick = (obj, keys) => {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  return null;
};

export const giftOrderId = (order) => String(pick(order, ["order_id", "order_number", "id", "requestId", "order_reference", "reference"]) ?? "");
const DONE = ["completed", "complete", "delivered", "livree", "livrée", "success"];
const FAILED = ["failed", "failure", "cancelled", "canceled", "refunded", "refund", "rejected", "error", "expired"];

// Estati Gift Access → estati nou: "completed" | "failed" | "processing"
export function giftStatus(order) {
  const s = String(pick(order, ["status", "state"]) ?? "").toLowerCase().trim();
  if (DONE.includes(s)) return "completed";
  if (FAILED.includes(s)) return "failed";
  return "processing";
}

// Kòd yo (PIN, kat kado, kont) jan plugin ofisyèl la li yo
export function giftCards(order) {
  const items = order?.delivery?.items || order?.delivery_items || order?.cards || [];
  const cards = [];
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || typeof item !== "object") continue;
    const type = String(pick(item, ["type", "delivery_type"]) ?? "").toLowerCase();
    let code = "";
    let pin = "";
    if (type === "email_pass") {
      code = String(pick(item, ["login_email", "email", "username"]) ?? "");
      pin = String(pick(item, ["login_password", "password", "pin"]) ?? "");
    } else if (type === "pin") {
      code = String(pick(item, ["pin_code", "pin", "code"]) ?? "");
    } else {
      code = String(pick(item, ["code", "card_code", "voucher_code", "serial_number"]) ?? "");
      pin = String(pick(item, ["pin", "pin_code", "password"]) ?? "");
    }
    if (code || pin) cards.push({ code, pin });
  }
  return cards;
}

// Tèks kòd la pou kliyan an (Istorik, imèl): "CODE" oswa "CODE · PIN 1234", plizyè separe ak " | "
export const cardsText = (cards) => cards.map((c) => (c.code && c.pin ? `${c.code} · PIN ${c.pin}` : c.code || c.pin)).join(" | ").slice(0, 200);

export const giftBalance = () => giftRequest("GET", "/wallet/balance");
export const giftPing = () => giftRequest("GET", "/ping");
export async function giftGetOrder(id) {
  return orderPayload(await giftRequest("GET", `/orders/${encodeURIComponent(id)}`));
}

// Pase yon kòmand. Menm Idempotency-Key pou menm kòmand: Gift Access pa janm fè l de fwa.
export async function giftCreateOrder(order, map) {
  const email = cleanEnv(process.env.GIFTACCESS_EMAIL) || cleanEnv(process.env.SMTP_USER) || undefined;
  const payload = {
    product_id: String(map.product_id),
    quantity: 1,
    reference: `awens-${order.id}`,
    fields: {
      recipient_name: "Awens Topup",
      ...(email && { recipient_email: email }),
      awens_order: order.code,
      ...(order.player_id && { player_id: order.player_id }),
    },
    ...(Number(map.amount) > 0 && { amount: Number(map.amount) }),
    ...(map.variation_ref && map.variation_ref !== map.product_id && { variation_ref: String(map.variation_ref) }),
  };
  return orderPayload(await giftRequest("POST", "/orders", payload, { "Idempotency-Key": `awens-${order.id}` }));
}

// Webhook Gift Access: x-giftacces-signature = HMAC-SHA256(kò a, sekrè webhook la) an hex
export function verifyGiftWebhook(raw, sig) {
  const secret = cleanEnv(process.env.GIFTACCESS_WEBHOOK_SECRET);
  if (!secret || !sig || !raw) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(raw).digest("hex"));
  const given = Buffer.from(String(sig).trim());
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
