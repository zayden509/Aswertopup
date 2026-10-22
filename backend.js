// Pòt antre baz done a. Firebase (gwo fichye) chaje sèlman si config.js gen kle yo,
// pou paj akèy la louvri vit; aksyon yo tann li fin chaje.
import { FIREBASE_CONFIG } from "./config.js";

export { errorText } from "./errors.js";

const enabled = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
const loading = enabled ? import("./firebase.js").then((m) => m.createBackend(FIREBASE_CONFIG)) : null;

// Fonksyon ki retounen yon "stop" touswit, menm si Firebase poko fin chaje
const SUBSCRIPTIONS = ["onAuth", "subscribePrices", "subscribeAccount", "subscribeAdmin"];

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
        return async (...args) => (await loading)[name](...args);
      },
    })
  : null;
