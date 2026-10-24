import React from "react";
import { Copy } from "lucide-react";
import { copyText } from "./ui.jsx";
import { UserAvatar } from "./ProfileWallet.jsx";

// Ti moso ki sèvi nan tout onglet Panneau admin lan

export const inputClass =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
export const number = new Intl.NumberFormat("fr-FR");

export function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
      {label}
    </button>
  );
}

// Bouton chip: chwazi yon filtè oswa yon peryòd
export function Chips({ options, value, onChange, label }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            o.id === value ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
          }`}
        >
          {o.label}
          {o.count > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[11px] leading-5 text-white">{o.count}</span>}
          {o.tally !== undefined && <span className="tabular-nums opacity-60">{o.tally}</span>}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ profile, size = "h-11 w-11 text-sm" }) {
  return <UserAvatar profile={profile} className={size} />;
}

export function CustomerLine({ profile }) {
  if (!profile) return null;
  return (
    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
      {profile.full_name ? `${profile.full_name} · ` : ""}{profile.email} · <span className="font-mono">{profile.wallet_code}</span>
    </p>
  );
}

export function CopyChip({ label, value, onToast }) {
  return (
    <button type="button" onClick={() => copyText(value, onToast)} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {label} <span className="truncate font-mono tabular-nums">{value}</span> <Copy className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

export function Empty({ children }) {
  return <p className="rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">{children}</p>;
}

// Rechèch san aksan ak san majiskil
export function normalize(text) {
  return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
