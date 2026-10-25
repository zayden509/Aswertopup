// Nimewo MonCash/NatCash kliyan yo voye kòb la. Valè pa defo yo nan data.js; pwopriyetè a
// chanje yo nan Panneau admin → Paramèt, epi tout paj yo wè nouvo nimewo a an dirèk.
// Yon nimewo ki vid nan Paramèt pa efase nimewo pa defo a.
import { useSyncExternalStore } from "react";
import { PAYMENT_METHODS } from "./data.js";

let methods = PAYMENT_METHODS;
const listeners = new Set();

export function setPaymentSettings(settings) {
  methods = PAYMENT_METHODS.map((m) => {
    const live = settings?.[m.id];
    return live?.number ? { ...m, number: live.number, holder: live.name || m.holder } : m;
  });
  listeners.forEach((notify) => notify());
}

const subscribe = (notify) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

export function usePaymentMethods() {
  return useSyncExternalStore(subscribe, () => methods);
}
