import React, { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2, Share } from "lucide-react";
import { backend } from "./backend.js";
import { t } from "./i18n.js";

// Notifikasyon push sou telefòn nan: kliyan an limen yo yon fwa, epi li resevwa yon notifikasyon
// lè kòmand li livre, lè depo l konfime… menm lè sit la fèmen.
const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;

function keyBytes(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function usePush() {
  const [state, setState] = useState("checking"); // checking | unsupported | ios-install | off | on | denied
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported()) {
      setState(isIos() && !standalone() ? "ios-install" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    }).catch(() => setState("off"));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return false;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const res = await fetch("/api/push-key");
      const { publicKey } = await res.json();
      if (!publicKey) throw new Error("no key");
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      await backend.savePushSubscription(sub);
      setState("on");
      return true;
    } catch (error) {
      console.error("push", error);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await backend.removePushSubscription(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  return { state, busy, enable, disable };
}

// Kat pou limen notifikasyon yo (Profil, Notifikasyon)
export function PushCard({ onToast, compact = false }) {
  const push = usePush();
  if (["checking", "unsupported"].includes(push.state)) return null;
  if (compact && push.state === "on") return null;

  if (push.state === "ios-install") {
    return (
      <div className="flex gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20">
        <Share className="h-5 w-5 shrink-0" />
        <span>{t("Pou resevwa notifikasyon sou iPhone: nan Safari, peze bouton pataje a, epi « Sur l'écran d'accueil ». Louvri sit la depi ikòn nan.", "Pour recevoir les notifications sur iPhone : dans Safari, touchez le bouton de partage puis « Sur l'écran d'accueil ». Ouvrez ensuite le site depuis l'icône.")}</span>
      </div>
    );
  }

  const on = push.state === "on";
  const toggle = async () => {
    if (on) {
      await push.disable();
      onToast?.(t("Notifikasyon yo etenn sou telefòn sa a.", "Notifications désactivées sur ce téléphone."));
    } else if (await push.enable()) {
      onToast?.(t("Notifikasyon yo limen ✅", "Notifications activées ✅"));
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 p-4 ring-1 ring-sky-100 dark:from-sky-500/10 dark:to-indigo-500/10 dark:ring-sky-500/20">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm dark:bg-slate-900 dark:text-sky-400">
        {on ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900 dark:text-white">{t("Notifikasyon sou telefòn", "Notifications sur le téléphone")}</span>
        <span className="block text-xs text-slate-600 dark:text-slate-300">
          {push.state === "denied"
            ? t("Ou bloke yo: pèmèt yo nan paramèt navigatè a.", "Bloquées : autorisez-les dans les réglages du navigateur.")
            : t("Kòmand livre, depo konfime… menm lè sit la fèmen.", "Commande livrée, dépôt confirmé… même site fermé.")}
        </span>
      </span>
      {push.state !== "denied" && (
        <button
          type="button"
          onClick={toggle}
          disabled={push.busy}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-60 ${on ? "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700" : "bg-sky-500 text-white shadow-md shadow-sky-500/25"}`}
        >
          {push.busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {on ? t("Etenn", "Désactiver") : t("Limen", "Activer")}
        </button>
      )}
    </div>
  );
}
