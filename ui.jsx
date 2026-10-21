import React, { useEffect } from "react";
import { X } from "lucide-react";
import { WHATSAPP_NUMBER } from "./data.js";

/* ============ UTIL ============ */
export function waLink(text) {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const priceFormat = new Intl.NumberFormat("fr-FR");
export function formatPrice(n) {
  return `${priceFormat.format(n)} HTG`;
}

// Pi ba pri pwodwi a, pou "Dès …" sou kat yo (pri baz done a si li la)
export function minPrice(product, live = {}) {
  const prices = (product.groups || [])
    .flatMap((g) => g.items)
    .filter((i) => live[i.id]?.available ?? true)
    .map((i) => live[i.id]?.price ?? i.price);
  return prices.length ? Math.min(...prices) : null;
}

// Non pake a jan li parèt nan kòmand lan (egzanp "100 + BONUS 10")
export function packageName(item) {
  return item.bonus ? `${item.label} + BONUS ${item.bonus}` : item.label;
}

/* ============ IKÒN ============ */
export function Logo({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="aswer-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M18 8h28l14 16-28 34L4 24z" fill="url(#aswer-gem)" />
      <path d="M4 24h56M18 8l14 50M46 8 32 58M18 8l-4 16M46 8l4 16" stroke="#fff" strokeOpacity=".55" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

// Dyaman ak koulè, pou kat pake yo
export function GemIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M18 10h28l12 14-26 30L6 24z" fill="#38bdf8" />
      <path d="M6 24h52L32 54z" fill="#0ea5e9" />
      <path d="M18 10l6 14h16l6-14z" fill="#7dd3fc" />
      <path d="M24 24l8 30 8-30z" fill="#38bdf8" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.04.72C5.79.72.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.08 11.34-11.33 0-3.03-1.18-5.87-3.32-8.01" />
    </svg>
  );
}

/* ============ KOMPOZAN ============ */
export function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative grid h-11 w-11 place-items-center rounded-full text-slate-600 transition hover:bg-slate-200/70 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, title, icon, footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 !mt-0 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">{icon}</span>}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            type="button"
            aria-label="Fèmen"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 ${footer ? "pb-4" : "pb-8 sm:pb-5"}`}>{children}</div>
        {/* Footer la rete anba fenèt la menm lè lis la long */}
        {footer && <div className="border-t border-slate-100 px-5 pb-8 pt-3 dark:border-slate-800 sm:pb-5">{footer}</div>}
      </div>
    </div>
  );
}

// `className` dwe bay pozisyon an (relative oswa absolute) ak gwosè a
export function ProductArt({ product: p, className = "" }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      {p.image && p.bg ? (
        <div className="absolute inset-0" style={{ background: p.bg }}>
          <img src={p.image} alt="" loading="lazy" className="absolute inset-x-0 top-0 aspect-square w-full object-contain transition duration-300 group-hover:scale-105" />
        </div>
      ) : p.image ? (
        <img src={p.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.25),transparent_55%)]" />
          <p.Icon className="absolute left-1/2 top-[44%] h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow-lg transition duration-300 group-hover:scale-110" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product: p, prices, onOpen }) {
  const from = minPrice(p, prices);
  return (
    <button
      type="button"
      onClick={() => onOpen(p)}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-black/5 transition active:scale-[.98] dark:ring-white/10"
    >
      <ProductArt product={p} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
      {p.isNew && (
        <span className="absolute left-3 top-3 rounded-full bg-emerald-300 px-3 py-1 text-[11px] font-extrabold tracking-[.15em] text-emerald-950 shadow">
          NOUVEAU
        </span>
      )}
      <span className="absolute inset-x-3 bottom-3">
        <span className="block text-[15px] font-bold leading-tight text-white drop-shadow">{p.name}</span>
        {from != null && <span className="mt-0.5 block text-[13px] font-semibold text-sky-300">Dès {formatPrice(from)}</span>}
      </span>
    </button>
  );
}

// Kat ak tit nimewote pou etap paj acha a
export function StepCard({ step, title, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500 text-base font-bold text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ============ DAT AK ESTATI ============ */
const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function formatDate(value) {
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value) {
  return dateTimeFormat.format(new Date(value));
}

export function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Kounye a";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} è`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Ayè";
  if (days < 7) return `${days} jou`;
  return formatDate(value);
}

export const ORDER_STATUS = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  processing: { label: "En cours", className: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" },
  delivered: { label: "Livré", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  refused: { label: "Refusé · Remboursé", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
};

export const DEPOSIT_STATUS = {
  pending: { label: "En attente", className: ORDER_STATUS.pending.className },
  completed: { label: "Complété", className: ORDER_STATUS.delivered.className },
  refused: { label: "Refusé", className: ORDER_STATUS.refused.className },
};

export function StatusChip({ status }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span>;
}

// Kopye yon tèks; si navigatè a refize, nou mande kliyan an kopye l alamen
export function copyText(text, onToast) {
  const done = () => onToast?.("Kopye.");
  if (!navigator.clipboard) return onToast?.("Kenbe tèks la pou w kopye l.");
  navigator.clipboard.writeText(text).then(done, () => onToast?.("Kenbe tèks la pou w kopye l."));
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{children}</p>;
}
