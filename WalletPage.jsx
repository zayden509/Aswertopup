import React, { useState } from "react";
import { Wallet, Eye, EyeOff, Copy, Plus, Send, ShoppingCart, ArrowDownLeft, ArrowUpRight, LogIn, Clock3, Sparkles } from "lucide-react";
import { Sheet, formatPrice, formatDate, formatDateTime, copyText, isPaidOrder, ORDER_STATUS, DEPOSIT_STATUS } from "./ui.jsx";
import { ReceiptButton } from "./Receipt.jsx";
import { MethodList } from "./WalletSheets.jsx";
import { t } from "./i18n.js";

const HIDE_KEY = "aswer-hide-balance";
const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "order", label: "Achats" },
  { id: "deposit", label: "Dépôts" },
  { id: "transfer", label: "Transferts" },
];
const DONE = { label: "Complété", className: DEPOSIT_STATUS.completed.className };

// Kache/montre solde a; chwa a pataje ant Wallet la ak Profil la
export function useHiddenBalance() {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; }
  });
  const toggle = () => {
    setHidden((h) => {
      try { localStorage.setItem(HIDE_KEY, h ? "0" : "1"); } catch {}
      return !h;
    });
  };
  return [hidden, toggle];
}

// Mete kòmand, depo ak transfè yo nan yon sèl lis, pi resan an anwo
export function buildTransactions({ orders, deposits, transfers, user }) {
  const rows = [
    // Kòmand peye dirèkteman (MonCash/NatCash) pa soti nan Wallet la
    ...orders.filter((o) => !o.payment).map((o) => ({
      kind: "order", key: `o-${o.id}`, date: o.created_at, raw: o,
      title: `${o.product_name} · ${o.package_label}`, amount: -Number(o.price), status: ORDER_STATUS[o.status],
    })),
    ...deposits.map((d) => ({
      kind: "deposit", key: `d-${d.id}`, date: d.created_at, raw: d,
      title: `Dépôt ${d.method === "moncash" ? "MonCash" : "NatCash"}`, amount: Number(d.amount), status: DEPOSIT_STATUS[d.status],
    })),
    ...transfers.map((t) => {
      const sent = t.from_user === user.id;
      return {
        kind: "transfer", key: `t-${t.id}`, date: t.created_at, raw: t, sent,
        title: sent ? "Transfert envoyé" : "Transfert reçu", amount: sent ? -Number(t.amount) : Number(t.amount), status: DONE,
      };
    }),
  ];
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function TxIcon({ row }) {
  const styles = {
    order: ["bg-violet-50 text-violet-700 dark:text-violet-400 dark:bg-violet-500/10", ShoppingCart],
    deposit: ["bg-emerald-50 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/10", ArrowDownLeft],
    transfer: row.sent ? ["bg-sky-50 text-sky-700 dark:text-sky-400 dark:bg-sky-500/10", ArrowUpRight] : ["bg-emerald-50 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/10", ArrowDownLeft],
  };
  const [cls, Icon] = styles[row.kind];
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" /></span>;
}

// Detay ak resi yon depo oswa yon transfè
function txReceipt(r, profile) {
  const d = r.raw;
  const rows = [[t("Dat", "Date"), formatDateTime(d.created_at)]];
  if (r.kind === "deposit") {
    rows.push([t("Mòd", "Mode"), d.method === "moncash" ? "MonCash" : "NatCash"], [t("Kòd tranzaksyon", "Code de transaction"), d.reference]);
    if (d.admin_note && d.status === "refused") rows.push([t("Nòt", "Note"), d.admin_note]);
  } else {
    rows.push(r.sent ? [t("Bay", "À"), d.to_code] : [t("Soti nan", "De"), d.from_code]);
  }
  return {
    title: r.title,
    amount: r.amount,
    status: r.status.label,
    rows,
    customer: profile ? `${profile.full_name || profile.email} · AWENS-ID ${profile.wallet_code}` : null,
  };
}

function TxSheet({ row, profile, onClose, onToast }) {
  const receipt = txReceipt(row, profile);
  return (
    <Sheet open onClose={onClose} title={row.title}>
      <p className={`text-3xl font-extrabold tabular-nums ${row.amount < 0 ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}`}>
        {row.amount < 0 ? "−" : "+"}{formatPrice(Math.abs(row.amount))}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{row.status.label}</p>
      <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {receipt.rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="min-w-0 break-all text-right font-medium tabular-nums text-slate-900 dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>
      {(row.kind === "transfer" || row.raw.status === "completed") && (
        <ReceiptButton className="mt-4" receipt={() => receipt} name={`resi-${row.kind === "deposit" ? "depo" : "transfe"}-${row.raw.id.slice(0, 8)}.png`} onToast={onToast} />
      )}
    </Sheet>
  );
}

// Yon liy tranzaksyon: yon acha louvri detay kòmand lan; yon depo oswa yon transfè louvri detay li ak resi a
export function TxRow({ row: r, onOpenOrder, profile, onToast }) {
  const [open, setOpen] = useState(false);
  return (
    <>
    <button
      type="button"
      onClick={() => (r.kind === "order" ? onOpenOrder(r.raw) : setOpen(true))}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <TxIcon row={r} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900 dark:text-white">{r.title}</span>
        <span className="block text-sm text-slate-500 dark:text-slate-400">{formatDate(r.date)}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block font-bold tabular-nums ${r.amount < 0 ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}`}>
          {r.amount < 0 ? "−" : "+"}{formatPrice(Math.abs(r.amount))}
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{r.status.label}</span>
      </span>
    </button>
    {open && <TxSheet row={r} profile={profile} onClose={() => setOpen(false)} onToast={onToast} />}
    </>
  );
}

export function LoginPrompt({ title, text, onLogin, icon: Icon = Wallet }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-700 dark:text-sky-400 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-slate-500 dark:text-slate-400">{text}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onLogin("login")} className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 font-bold text-neutral-950 hover:bg-sky-600">
          <LogIn className="h-5 w-5" /> {t("Konekte", "Connexion")}
        </button>
        <button type="button" onClick={() => onLogin("signup")} className="rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          {t("Kreye kont", "Créer un compte")}
        </button>
      </div>
    </div>
  );
}

export default function WalletPage({ account, onLogin, onDeposit, onTransfer, onOpenOrder, onToast }) {
  const [hidden, toggleHidden] = useHiddenBalance();
  const [filter, setFilter] = useState("all");

  if (!account.user) {
    return (
      <div className="space-y-4">
        <LoginPrompt
          title="Mon portefeuille AWENS"
          text={t("Konekte pou w ajoute kòb ak MonCash oswa NatCash, wè solde ou epi achte an kèk segonn.", "Connectez-vous pour ajouter de l'argent avec MonCash ou NatCash, voir votre solde et acheter en quelques secondes.")}
          onLogin={onLogin}
        />
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <MethodList onPick={() => onLogin("login")} onToast={onToast} />
        </section>
      </div>
    );
  }

  const profile = account.profile;

  const rows = buildTransactions(account);
  const visible = filter === "all" ? rows : rows.filter((r) => r.kind === filter);
  const stats = [
    { label: t("Acha", "Achats"), value: account.orders.filter(isPaidOrder).length, Icon: ShoppingCart, tone: "from-sky-400 to-indigo-500" },
    { label: t("Depo", "Dépôts"), value: account.deposits.filter((d) => d.status === "completed").length, Icon: ArrowDownLeft, tone: "from-emerald-400 to-teal-500" },
    { label: t("Transfè", "Transferts"), value: account.transfers.length, Icon: Send, tone: "from-violet-500 to-fuchsia-500" },
    {
      label: t("An atant", "En attente"),
      value: account.orders.filter((o) => o.status === "pending" || o.status === "processing").length + account.deposits.filter((d) => d.status === "pending").length,
      Icon: Clock3,
      tone: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Kat Wallet la: tankou yon kat bank "gaming" */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1c1606] p-5 text-white shadow-xl shadow-violet-900/30 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/40">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-violet-200/80">{t("Wallet mwen", "Mon portefeuille")}</p>
              <h1 className="text-lg font-black leading-tight">AWENS Wallet</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHidden}
            aria-label={hidden ? t("Montre solde a", "Afficher le solde") : t("Kache solde a", "Masquer le solde")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 transition hover:bg-white/15 active:scale-95"
          >
            {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <p className="relative mt-6 text-sm font-semibold text-slate-300">{t("Solde total", "Solde total")}</p>
        <p className="relative mt-0.5 text-[40px] font-black leading-none tracking-tight tabular-nums">
          {profile ? (hidden ? "•••••• HTG" : formatPrice(Number(profile.balance))) : "…"}
        </p>

        {profile && (
          <button
            type="button"
            onClick={() => copyText(profile.wallet_code, onToast)}
            className="relative mt-4 inline-flex items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-fuchsia-300" />
            <span className="text-[11px] font-extrabold tracking-[.16em] text-violet-200/80">AWENS-ID</span>
            <span className="font-mono text-base font-bold tracking-wider">{profile.wallet_code}</span>
            <Copy className="h-4 w-4 text-violet-200" />
          </button>
        )}

        <div className="relative mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onDeposit}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 py-3.5 font-extrabold shadow-lg shadow-fuchsia-500/35 transition hover:brightness-110 active:scale-[.98]"
          >
            <Plus className="h-5 w-5" /> {t("Ajoute kòb", "Ajouter")}
          </button>
          <button
            type="button"
            onClick={onTransfer}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 font-extrabold ring-1 ring-white/20 transition hover:bg-white/15 active:scale-[.98]"
          >
            <Send className="h-5 w-5" /> {t("Voye kòb", "Envoyer")}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center rounded-2xl bg-white px-1 py-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[.07] dark:to-white/[.02] dark:ring-white/10">
            <span className={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${s.tone} text-neutral-950 shadow-md`}>
              <s.Icon className="h-4 w-4" />
            </span>
            <p className="mt-1.5 text-xl font-black tabular-nums text-slate-900 dark:text-white">{s.value}</p>
            <p className="w-full truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-2xl font-extrabold tracking-tight">Transactions</h2>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                f.id === filter ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-neutral-950 shadow-md shadow-fuchsia-500/25" : "bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            {t("Pa gen tranzaksyon ankò. Kòmanse ak", "Aucune transaction pour l'instant. Commencez par")} <button type="button" onClick={onDeposit} className="font-semibold text-sky-700 dark:text-sky-400">Ajouter de l'argent</button>.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {visible.map((r) => (
              <li key={r.key}><TxRow row={r} onOpenOrder={onOpenOrder} profile={profile} onToast={onToast} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
