import React from "react";
import { Copy, Loader2 } from "lucide-react";
import { copyText } from "./ui.jsx";
import { UserAvatar } from "./Avatar.jsx";

// Ti moso ki sèvi nan tout onglet Panneau admin lan

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-900 transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-400/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950";

export const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
export const number = new Intl.NumberFormat("fr-FR");

// Fon kat Panneau admin lan (menm stil toupatou)
export const panel = "rounded-3xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800";

export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`${panel} p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Tit chak seksyon Panneau admin lan
export function SectionHead({ title, sub, children }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-stretch gap-3">
        <span className="w-1.5 shrink-0 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Yon valè ou ka kopye (kòd kòmand, Player ID, tranzaksyon…)
export function CopyText({ value, onToast, className = "" }) {
  return (
    <button type="button" onClick={() => copyText(value, onToast)} className={`inline-flex max-w-full items-center gap-1.5 font-mono text-sm font-medium tabular-nums text-slate-800 hover:text-sky-600 dark:text-slate-100 dark:hover:text-sky-300 ${className}`}>
      <span className="truncate">{value}</span> <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    </button>
  );
}

// Bouton Panneau admin lan: `tone` = primary | success | danger | ghost
const BUTTON_TONES = {
  primary: "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm shadow-sky-500/25 hover:brightness-110",
  success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/25 hover:brightness-110",
  danger: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50 dark:bg-transparent dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-red-500/10",
  ghost: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800",
};
export function AdminButton({ tone = "ghost", icon: Icon, busy, children, className = "", ...props }) {
  return (
    <button type="button" className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition active:scale-[.97] disabled:opacity-60 ${BUTTON_TONES[tone]} ${className}`} {...props}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-inner" : "bg-slate-300 dark:bg-slate-700"}`}>
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
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
            o.id === value ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/25" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
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
    <button type="button" onClick={() => copyText(value, onToast)} className="inline-flex max-w-full items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700 active:scale-95 dark:bg-slate-800 dark:text-slate-200">
      {label} <span className="truncate font-mono tabular-nums">{value}</span> <Copy className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

export function Empty({ children }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800" aria-hidden="true">📭</span>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{children}</p>
    </div>
  );
}

// Rechèch san aksan ak san majiskil
export function normalize(text) {
  return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
