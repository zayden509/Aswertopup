// Livrezon otomatik ak FazerCards (kòd sèvè, Vercel Functions).
//
// Sèvè a konekte nan Firebase ak yon kont "bot" ki admin sou sit la (BOT_EMAIL /
// BOT_PASSWORD), kidonk menm règ sekirite ak Panneau admin lan aplike: yon ranbousman
// pa ka depase pri kòmand lan. Kle FazerCards la (FAZER_API_KEY) rete sèlman sou sèvè a.
import { FazerCardsClient, FazerCardsAuthError, FazerCardsError, TERMINAL_ORDER_STATUSES } from "fazercards";
import { createBackend } from "../../firebase.js";
import { FIREBASE_CONFIG } from "../../config.js";

const env = process.env;
const firebaseConfig = env.TEST_FIREBASE_CONFIG ? JSON.parse(env.TEST_FIREBASE_CONFIG) : FIREBASE_CONFIG;
const PROVIDER = "fazercards";

export class SetupError extends Error {}

export const json = (body, status = 200) => Response.json(body, { status });
export const fail = (error, status = 400) => json({ ok: false, error }, status);

// Erè FazerCards yo an kreyòl pou Panneau admin lan
export function fazerError(error) {
  if (error instanceof SetupError) return error.message;
  if (error instanceof FazerCardsAuthError) return "Kle API FazerCards la pa bon (oswa abònman an fini).";
  if (error instanceof FazerCardsError) return `FazerCards: ${error.message}`;
  return "Pa ka kontakte FazerCards kounye a. Eseye ankò.";
}

// Valè yo kole nan Vercel ka gen espas oswa gimè anplis: nou retire yo
const cleanEnv = (value) => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();

let client = null;
export function fazer() {
  const apiKey = cleanEnv(env.FAZER_API_KEY);
  if (!apiKey) throw new SetupError("FAZER_API_KEY poko mete nan Vercel (Settings → Environment Variables).");
  client ??= new FazerCardsClient({
    apiKey,
    baseUrl: env.FAZER_BASE_URL || undefined,
    appName: "awens-topup",
    timeoutMs: 8000,
  });
  return client;
}

const WRONG_LOGIN = "BOT_EMAIL oswa BOT_PASSWORD nan Vercel pa menm ak kont bot la, oswa kont bot la poko kreye sou sit la.";
const BOT_ERRORS = {
  "auth/invalid-email": "BOT_EMAIL nan Vercel pa yon imèl ki bon. Mete imèl kont bot la egzakteman (egz: bot@awenstopup.com), san espas ni gimè.",
  "auth/invalid-credential": WRONG_LOGIN,
  "auth/wrong-password": WRONG_LOGIN,
  "auth/user-not-found": WRONG_LOGIN,
  "auth/user-disabled": "Kont bot la bloke nan Firebase (Authentication → Users).",
  "auth/too-many-requests": "Firebase bloke bot la pou kounye a apre twòp eseye. Tann kèk minit.",
};

let botBackend = null;
let botPromise = null;
export function bot() {
  const email = cleanEnv(env.BOT_EMAIL);
  const password = cleanEnv(env.BOT_PASSWORD);
  if (!email || !password) {
    return Promise.reject(new SetupError("BOT_EMAIL ak BOT_PASSWORD poko mete nan Vercel."));
  }
  botPromise ??= (async () => {
    // Yon sèl app Firebase "bot" pa sèvè; si koneksyon an echwe, nou eseye ankò ak menm app la
    botBackend ??= createBackend(firebaseConfig, { appName: "bot", emulatorHost: env.FIREBASE_EMULATOR_HOST });
    await botBackend.signIn(email, password);
    return botBackend;
  })().catch((error) => {
    botPromise = null;
    throw new SetupError(BOT_ERRORS[error.code] || `Bot la pa ka konekte nan Firebase (${error.code || error.message}).`);
  });
  return botPromise;
}

// Apre yon erè pèmisyon (pa egzanp kont bot la chanje), nou konekte ankò nan pwochen demann lan
export function resetBotOnDenied(error) {
  if (error?.code === "permission-denied" || error?.code === "unauthenticated") botPromise = null;
}

// Ki kliyan k ap rele sèvè a: nou verifye kle koneksyon Firebase li a
export async function callerId(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const base = env.FIREBASE_AUTH_EMULATOR_HOST
    ? `http://${env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  const res = await fetch(`${base}/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.users?.[0]?.localId || null;
}

const isTerminal = (status) => TERMINAL_ORDER_STATUSES.includes(status);

// Mete estati kòmand FazerCards la sou kòmand nou an
export async function applyStatus(backend, order, fz) {
  const reason = fz.fail_reason || fz.failReason || null;
  const supplier = {
    provider: PROVIDER,
    order_id: String(fz.id),
    status: String(fz.status).slice(0, 20),
    offer_name: (fz.offer_name || fz.title || order.supplier?.offer_name || null)?.slice(0, 120) ?? null,
    error: reason ? String(reason).slice(0, 300) : null,
  };
  if (order.supplier?.order_id === supplier.order_id && order.supplier?.status === supplier.status) return;

  if (fz.status === "completed" && order.status !== "delivered" && order.status !== "refused") {
    const codes = [...(fz.cards || []), ...(fz.keys || [])].join(" | ").slice(0, 200);
    await backend.adminUpdateOrder(order, "delivered", codes, null, supplier);
  } else if ((fz.status === "failed" || fz.status === "refund") && order.status !== "delivered" && order.status !== "refused") {
    // FazerCards remèt nou kòb la: nou remèt kliyan an pa l tou
    const note = `Livrezon otomatik la pa mache${reason ? ` (${reason})` : ""}. Verifye Player ID ou epi eseye ankò.`;
    await backend.adminUpdateOrder(order, "refused", "", note.slice(0, 300), supplier);
  } else if (!isTerminal(fz.status) && order.status === "pending") {
    await backend.adminUpdateOrder(order, "processing", "", null, supplier);
  } else {
    await backend.adminSetSupplier(order.id, supplier);
  }
}

// Voye yon kòmand bay FazerCards si pake a otomatik, oswa mete estati l ajou si l deja ale
export async function fulfill(orderId) {
  const backend = await bot();
  const order = await backend.adminGetOrder(orderId);
  if (!order) return { ok: false, error: "Kòmand sa a pa egziste." };
  if (order.kind === "exchange") return { ok: true, auto: false };

  // Deja voye: nou mande FazerCards ki kote l ye
  if (order.supplier?.order_id) {
    if (isTerminal(order.supplier.status)) return { ok: true, status: order.supplier.status };
    const fz = await fazer().orders.get(order.supplier.order_id);
    await applyStatus(backend, order, fz);
    return { ok: true, status: fz.status };
  }
  if (order.status !== "pending") return { ok: true, auto: false };

  const map = await backend.adminGetSupplierMap(order.package_id);
  if (!map?.auto) return { ok: true, auto: false };

  const fields = {};
  if (map.field_key) {
    if (!order.player_id) {
      await backend.adminSetSupplier(order.id, { provider: PROVIDER, status: "error", error: "Kòmand lan pa gen Player ID.", offer_name: map.offer_name });
      return { ok: false, error: "Kòmand lan pa gen Player ID." };
    }
    fields[map.field_key] = order.player_id;
  }

  // Yon sèl demann voye kòmand lan, menm si kliyan an ak webhook la rive ansanm
  const claimed = await backend.adminClaimSupplier(order.id);
  if (!claimed) return { ok: true, status: "busy" };

  try {
    // Menm Idempotency-Key pou menm kòmand: FazerCards pa janm fè l de fwa
    const fz = await fazer().topups.order({
      categoryId: map.category_id,
      offerId: map.offer_id,
      fields,
      idempotencyKey: `awens-${order.id}`,
    });
    await applyStatus(backend, { ...claimed, supplier: { provider: PROVIDER, status: "sending" } }, { offer_name: map.offer_name, ...fz });
    return { ok: true, status: fz.status };
  } catch (error) {
    const message = fazerError(error);
    await backend.adminSetSupplier(order.id, { provider: PROVIDER, status: "error", error: message.slice(0, 300), offer_name: map.offer_name ?? null });
    return { ok: false, error: message };
  }
}

// Sekrè webhook la soti dirèkteman nan FazerCards (pa bezwen kopye l)
let secretCache = null;
export async function webhookSecret(refresh = false) {
  if (!secretCache || refresh) secretCache = (await fazer().webhooks.get())?.secret || null;
  return secretCache;
}
