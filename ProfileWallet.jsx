import React, { useState } from "react";
import { Eye, EyeOff, RefreshCw, Send, Plus, Copy, ArrowDownLeft, ArrowUpRight, ShoppingBag, ReceiptText, ArrowRight } from "lucide-react";
import { Logo, copyText } from "./ui.jsx";
import { buildTransactions, useHiddenBalance, TxRow } from "./WalletPage.jsx";

// Inisyal non kliyan an pou avatar la (egzanp "Jean Baptiste" -> "JB")
export function initials(profile) {
  const source = (profile?.full_name || profile?.email || "?").trim();
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  return ((words[0]?.[0] || "?") + (words[1]?.[0] || "")).toUpperCase();
}

// Foto pwofil kliyan an, oswa inisyal li yo si l pa gen foto.
// `className` bay gwosè a (ak gwosè tèks inisyal yo).
export function UserAvatar({ profile, photo, className = "h-11 w-11 text-sm" }) {
  const src = photo ?? profile?.photo;
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" decoding="async" className={`${className} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`grid ${className} shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 font-extrabold text-white`}>
      {initials(profile)}
    </span>
  );
}

function Stat({ icon: Icon, tone, label, value, unit }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="block truncate text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
          {value}
          {unit && <span className="ml-1 text-xs font-semibold text-slate-400">{unit}</span>}
        </span>
      </span>
    </div>
  );
}

export default function ProfileWallet({ account, onDeposit, onTransfer, onOpenOrder, onSeeAll, onToast }) {
  const [hidden, toggleHidden] = useHiddenBalance();
  const [refreshing, setRefreshing] = useState(false);
  const profile = account.profile;
  if (!profile || !account.user) return null;

  const refresh = async () => {
    setRefreshing(true);
    await account.reload();
    setRefreshing(false);
    onToast("Solde a ajou.");
  };

  // Totals yo kalkile sou 100 dènye tranzaksyon yo (sa sit la chaje); "dépensé" a soti dirèk nan pwofil la
  const me = account.user.id;
  const received =
    account.deposits.filter((d) => d.status === "completed").reduce((sum, d) => sum + Number(d.amount), 0) +
    account.transfers.filter((t) => t.to_user === me).reduce((sum, t) => sum + Number(t.amount), 0);
  const sent = account.transfers.filter((t) => t.from_user === me).reduce((sum, t) => sum + Number(t.amount), 0);
  const rows = buildTransactions(account);
  const amount = (n) => (hidden ? "••••" : new Intl.NumberFormat("fr-FR").format(n));

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0b2547] to-sky-700 p-5 text-white shadow-xl shadow-sky-900/20">
        {/* Dekorasyon kat la: limyè ak logo an filigran */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
        <Logo className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 opacity-[.08]" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-sky-200/80">Solde disponible</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[40px] font-extrabold leading-none tabular-nums">{hidden ? "••••••" : new Intl.NumberFormat("fr-FR").format(Number(profile.balance))}</span>
              <span className="text-lg font-semibold text-sky-200">HTG</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={toggleHidden}
              aria-label={hidden ? "Montre solde a" : "Kache solde a"}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20"
            >
              {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={refresh}
              aria-label="Mete solde a ajou"
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => copyText(profile.wallet_code, onToast)}
          className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 ring-1 ring-white/10"
        >
          <span className="text-[10px] font-bold tracking-widest text-sky-200/80">AWENS-ID</span>
          <span className="font-mono text-sm font-bold tracking-[.2em]">{profile.wallet_code}</span>
          <Copy className="h-3.5 w-3.5 text-sky-200" />
        </button>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onTransfer}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 font-bold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 active:scale-[.98]"
          >
            <Send className="h-5 w-5" /> Transférer
          </button>
          <button
            type="button"
            onClick={onDeposit}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-slate-900 shadow-lg transition hover:bg-sky-50 active:scale-[.98]"
          >
            <Plus className="h-5 w-5" /> Déposer
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={ArrowDownLeft} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" label="Total reçu" value={amount(received)} unit="HTG" />
        <Stat icon={ArrowUpRight} tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" label="Total envoyé" value={amount(sent)} unit="HTG" />
        <Stat icon={ShoppingBag} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" label="Total dépensé" value={amount(Number(profile.total_spent))} unit="HTG" />
        <Stat icon={ReceiptText} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" label="Transactions" value={rows.length} />
      </div>

      <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dernières transactions</h2>
          <button type="button" onClick={onSeeAll} className="flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
            Voir tout <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            Pa gen tranzaksyon ankò. Peze <span className="font-semibold text-slate-700 dark:text-slate-200">Déposer</span> pou w ajoute kòb ak MonCash oswa NatCash.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {rows.slice(0, 4).map((r) => (
              <li key={r.key}><TxRow row={r} onOpenOrder={onOpenOrder} profile={profile} onToast={onToast} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
