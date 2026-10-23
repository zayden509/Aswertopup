import React, { useEffect, useState } from "react";
import { Bell, ShoppingCart, ArrowDownLeft, Send, X, LogIn, MessageSquareText, Megaphone } from "lucide-react";
import { NOTIFICATIONS } from "./data.js";
import { Sheet, timeAgo } from "./ui.jsx";

const KINDS = {
  order: [ShoppingCart, "bg-violet-50 text-violet-500 dark:bg-violet-500/10"],
  deposit: [ArrowDownLeft, "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10"],
  transfer: [Send, "bg-sky-50 text-sky-500 dark:bg-sky-500/10"],
  info: [Bell, "bg-sky-50 text-sky-500 dark:bg-sky-500/10"],
  message: [MessageSquareText, "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10"],
  announcement: [Megaphone, "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"],
};

function NotificationRow({ n, fresh, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`flex w-full gap-3 rounded-2xl p-3 text-left transition ${fresh ? "bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20" : "bg-slate-50 dark:bg-slate-800/60"}`}
    >
      <KindIcon kind={n.kind} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
          <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.created_at)}</span>
        </span>
        {n.kind === "announcement" && <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Aswer Top Up</span>}
        {n.body && <span className="mt-0.5 block whitespace-pre-line text-sm text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">{n.body}</span>}
      </span>
      {fresh && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" aria-label="Nouvo" />}
    </button>
  );
}

function KindIcon({ kind, size = "h-11 w-11" }) {
  const [Icon, cls] = KINDS[kind] || KINDS.info;
  return <span className={`grid ${size} shrink-0 place-items-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" /></span>;
}

export function NotificationsSheet({ account, onClose, onLogin, onOpen }) {
  // Sonje kiyès ki te nouvo lè fenèt la louvri, menm apre nou make yo li
  const [fresh] = useState(() => new Set(account.notifications.filter((n) => !n.read_at).map((n) => n.id)));

  // Make yo li yon sèl fwa, lè fenèt la louvri
  useEffect(() => {
    if (account.enabled) account.markRead();
  }, []);

  return (
    <Sheet open onClose={onClose} title="Notifications" icon={<Bell className="h-6 w-6" />}>
      {account.enabled && !account.user && (
        <div className="mb-4 rounded-2xl bg-sky-50 p-4 dark:bg-sky-500/10">
          <p className="text-sm text-sky-900 dark:text-sky-100">Konekte pou w resevwa notifikasyon sou kòmand ou yo, depo ou yo ak kòd PIN ou yo.</p>
          <button type="button" onClick={() => onLogin("login")} className="mt-3 flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white">
            <LogIn className="h-4 w-4" /> Konekte
          </button>
        </div>
      )}
      {account.enabled ? (
        account.notifications.length === 0 ? (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">Pa gen notifikasyon pou kounye a.</p>
        ) : (
          <ul className="space-y-2">
            {account.notifications.map((n) => (
              <li key={n.id}><NotificationRow n={n} fresh={fresh.has(n.id)} onOpen={onOpen} /></li>
            ))}
          </ul>
        )
      ) : (
        <ul className="space-y-2">
          {NOTIFICATIONS.map((n, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">{n.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">{n.time}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// Mesaj ki "monte" anlè ekran an lè yon notifikasyon rive an dirèk
export function LiveToast({ notification, onOpen, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [notification, onClose]);

  return (
    <div className="fixed inset-x-3 z-[70] mx-auto max-w-md animate-slide-down" style={{ top: "calc(env(safe-area-inset-top) + 10px)" }} role="status">
      <div className="flex items-start gap-3 rounded-3xl bg-white/95 p-3 pr-2 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/95 dark:ring-slate-700">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <KindIcon kind={notification.kind} />
          <span className="min-w-0 flex-1 pt-0.5">
            <span className="block font-bold text-slate-900 dark:text-white">{notification.title}</span>
            {notification.body && <span className="mt-0.5 line-clamp-2 block text-sm text-slate-500 dark:text-slate-400">{notification.body}</span>}
          </span>
        </button>
        <button type="button" onClick={onClose} aria-label="Fèmen" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
