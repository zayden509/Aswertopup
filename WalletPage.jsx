import React, { useState } from "react";
import { Wallet, Eye, EyeOff, Copy, Plus, Send, ShoppingCart, ArrowDownLeft, ArrowUpRight, LogIn } from "lucide-react";
import { formatPrice, formatDate, copyText, ORDER_STATUS, DEPOSIT_STATUS } from "./ui.jsx";
import { MethodList } from "./WalletSheets.jsx";

const HIDE_KEY = "aswer-hide-balance";
const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "order", label: "Achats" },
  { id: "deposit", label: "Dépôts" },
  { id: "transfer", label: "Transferts" },
];
const DONE = { label: "Complété", className: DEPOSIT_STATUS.completed.className };

// Mete kòmand, depo ak transfè yo nan yon sèl lis, pi resan an anwo
function buildTransactions({ orders, deposits, transfers, user }) {
  const rows = [
    ...orders.map((o) => ({
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
    order: ["bg-violet-50 text-violet-500 dark:bg-violet-500/10", ShoppingCart],
    deposit: ["bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10", ArrowDownLeft],
    transfer: row.sent ? ["bg-sky-50 text-sky-500 dark:bg-sky-500/10", ArrowUpRight] : ["bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10", ArrowDownLeft],
  };
  const [cls, Icon] = styles[row.kind];
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" /></span>;
}

export function LoginPrompt({ title, text, onLogin, icon: Icon = Wallet }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-slate-500 dark:text-slate-400">{text}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onLogin("login")} className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 font-bold text-white hover:bg-sky-600">
          <LogIn className="h-5 w-5" /> Konekte
        </button>
        <button type="button" onClick={() => onLogin("signup")} className="rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          Kreye kont
        </button>
      </div>
    </div>
  );
}

export default function WalletPage({ account, onLogin, onDeposit, onTransfer, onOpenOrder, onToast }) {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; }
  });
  const [filter, setFilter] = useState("all");

  if (!account.user) {
    return (
      <div className="space-y-4">
        <LoginPrompt
          title="Mon portefeuille ASWER"
          text="Konekte pou w ajoute kòb ak MonCash oswa NatCash, wè solde ou epi achte an kèk segonn."
          onLogin={onLogin}
        />
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <MethodList onPick={() => onLogin("login")} onToast={onToast} />
        </section>
      </div>
    );
  }

  const profile = account.profile;
  const toggleHidden = () => {
    setHidden((h) => {
      try { localStorage.setItem(HIDE_KEY, h ? "0" : "1"); } catch {}
      return !h;
    });
  };

  const rows = buildTransactions(account);
  const visible = filter === "all" ? rows : rows.filter((r) => r.kind === filter);
  const stats = [
    { label: "Achats", value: account.orders.filter((o) => o.status !== "refused").length, cls: "text-sky-500" },
    { label: "Dépôts", value: account.deposits.filter((d) => d.status === "completed").length, cls: "text-emerald-500" },
    { label: "Transferts", value: account.transfers.length, cls: "text-violet-500" },
    {
      label: "En attente",
      value: account.orders.filter((o) => o.status === "pending" || o.status === "processing").length + account.deposits.filter((d) => d.status === "pending").length,
      cls: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 shadow-lg shadow-sky-500/10 ring-1 ring-sky-100 dark:from-sky-500/10 dark:via-slate-900 dark:to-violet-500/10 dark:ring-slate-800">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-sky-500">Mon portefeuille ASWER</h1>
          <button
            type="button"
            onClick={toggleHidden}
            aria-label={hidden ? "Montre solde a" : "Kache solde a"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/80 text-slate-700 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
          >
            {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {profile && (
          <button
            type="button"
            onClick={() => copyText(profile.wallet_code, onToast)}
            className="mt-3 inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <span className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">ASWER-ID</span>
            <span className="font-mono text-base font-bold tracking-wider text-slate-900 dark:text-white">{profile.wallet_code}</span>
            <Copy className="h-4 w-4 text-slate-500" />
          </button>
        )}
        <p className="mt-5 bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-4xl font-extrabold tabular-nums text-transparent">
          {profile ? (hidden ? "•••••• HTG" : formatPrice(Number(profile.balance))) : "…"}
        </p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Solde total</p>
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onDeposit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 py-3.5 text-lg font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-105"
          >
            <Plus className="h-5 w-5" /> Ajouter de l'argent
          </button>
          <button
            type="button"
            onClick={onTransfer}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/80 py-3.5 text-lg font-bold text-slate-800 ring-2 ring-sky-100 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
          >
            <Send className="h-5 w-5" /> Envoyer de l'argent
          </button>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white px-1 py-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <p className={`text-2xl font-extrabold tabular-nums ${s.cls}`}>{s.value}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">{s.label}</p>
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
                f.id === filter ? "bg-sky-500 text-white" : "bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            Pa gen tranzaksyon ankò. Kòmanse ak <button type="button" onClick={onDeposit} className="font-semibold text-sky-600 dark:text-sky-400">Ajouter de l'argent</button>.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {visible.map((r) => {
              const Row = r.kind === "order" ? "button" : "div";
              return (
                <li key={r.key}>
                  <Row
                    {...(r.kind === "order" && { type: "button", onClick: () => onOpenOrder(r.raw) })}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                  >
                    <TxIcon row={r} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900 dark:text-white">{r.title}</span>
                      <span className="block text-sm text-slate-500 dark:text-slate-400">{formatDate(r.date)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={`block font-bold tabular-nums ${r.amount < 0 ? "text-orange-500" : "text-emerald-500"}`}>
                        {r.amount < 0 ? "−" : "+"}{formatPrice(Math.abs(r.amount))}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{r.status.label}</span>
                    </span>
                  </Row>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
