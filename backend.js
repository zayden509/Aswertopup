// Pòt antre baz done a. Firebase (gwo fichye) chaje sèlman si config.js gen kle yo,
// pou paj akèy la louvri vit; aksyon yo tann li fin chaje.
import { FIREBASE_CONFIG } from "./config.js";

export { errorText } from "./errors.js";

const enabled = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
let ready = null; // backend lan lè l fin chaje
let resolveLoaded;
const loading = enabled ? new Promise((resolve) => { resolveLoaded = resolve; }) : null;
let started = false;

// Firebase (≈190 KB) chaje APRE paj la fin parèt, pou premye afichaj la (tèks, foto, pri ki
// nan memwa telefòn nan) pa tann li. Si kliyan an fè yon aksyon anvan (konekte, achte…),
// li kòmanse chaje touswit.
function start() {
  if (started || !enabled) return;
  started = true;
  import("./firebase.js").then((m) => {
    ready = m.createBackend(FIREBASE_CONFIG);
    resolveLoaded(ready);
  });
}
if (enabled && typeof window !== "undefined") {
  const later = () => (window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 200));
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
  // Premye fwa kliyan an touche ekran an: Firebase ap pare lè l peze yon bouton (ex. Google)
  window.addEventListener("pointerdown", start, { once: true, passive: true });
  setTimeout(start, 4000); // filè sekirite
} else if (enabled) {
  start();
}

// Fonksyon ki retounen yon "stop" touswit, menm si Firebase poko fin chaje
const SUBSCRIPTIONS = [
  "onAuth", "subscribePrices", "subscribeCatalog", "subscribeAnnouncements", "subscribeAccount", "subscribeAdmin",
  "subscribeSupplierMap", "subscribeSms", "subscribeSmsFor", "subscribeSmsSeen", "subscribeHookStatus", "subscribeAlerts", "subscribeReviews", "subscribePublicStats", "adminSubscribeReviews", "adminSubscribePromos", "subscribeReferralSettings", "subscribeLoyalty", "subscribeFlash", "subscribeMyReferrals", "subscribeAutomation",
];

// null lè Firebase poko konfigire: sit la mache an mòd WhatsApp sèlman
export const backend = enabled
  ? new Proxy({}, {
      get(_, name) {
        if (SUBSCRIPTIONS.includes(name)) {
          return (...args) => {
            let stop = null;
            let cancelled = false;
            loading.then((b) => {
              if (!cancelled) stop = b[name](...args);
            });
            return () => {
              cancelled = true;
              stop?.();
            };
          };
        }
        // Lè Firebase fin chaje, nou rele fonksyon an touswit: Safari bloke fenèt Google la
        // si l pa louvri nan menm moman kliyan an peze bouton an
        return (...args) => {
          if (ready) return Promise.resolve(ready[name](...args));
          start();
          return loading.then((b) => b[name](...args));
        };
      },
    })
  : null;
