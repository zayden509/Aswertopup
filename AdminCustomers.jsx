import React, { useState } from "react";
import { Search, Send, Loader2, ShieldCheck, Wallet, ShoppingBag, ArrowDownLeft, CalendarDays } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { Sheet, StatusChip, ErrorNote, formatPrice, formatDate, formatDateTime, ORDER_STATUS, DEPOSIT_STATUS } from "./ui.jsx";
import { rankInfo } from "./SettingsPage.jsx";
import { Avatar, Chips, CopyChip, Empty, Field, inputClass, normalize, number } from "./adminUi.jsx";

const SORTS = [
  { id: "new", label: "Nouvo yo", by: (a, b) => String(b.created_at).localeCompare(String(a.created_at)) },
  { id: "spent", label: "Plis depanse", by: (a, b) => b.total_spent - a.total_spent },
  { id: "balance", label: "Plis kòb", by: (a, b) => b.balance - a.balance },
  { id: "admins", label: "Admin yo", by: (a, b) => String(a.email).localeCompare(String(b.email)), filter: (p) => p.is_admin },
];
const PAGE = 50;

// Fòm pou ekri yon kliyan: mesaj la parèt nan notifikasyon li, an dirèk si l sou sit la
export function MessageForm({ profile, onSent, onToast }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await backend.adminSendMessage(profile.id, title, body);
      setTitle("");
      setBody("");
      onToast(`Mesaj voye bay ${profile.full_name || profile.email}.`);
      onSent?.();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-3">
      <Field label="Tit">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Egzanp: Kòmand ou a" className={inputClass} />
      </Field>
      <Field label="Mesaj">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} placeholder="Ekri mesaj la isit la…" className={`${inputClass} resize-none`} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={busy || !title.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white disabled:opacity-50">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Voye mesaj la
      </button>
    </form>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <p className="mt-1 truncate font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function CustomerSheet({ profile, orders, deposits, onClose, onToast }) {
  const mine = orders.filter((o) => o.user_id === profile.id);
  const myDeposits = deposits.filter((d) => d.user_id === profile.id);
  const rank = rankInfo(Number(profile.total_spent)).current;

  return (
    <Sheet open onClose={onClose} title="Kliyan">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar profile={profile} size="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{profile.full_name || "San non"}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {profile.is_admin && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"><ShieldCheck className="h-3 w-3" /> Admin</span>}
              {rank && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{rank.emoji} {rank.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyChip label="ID" value={profile.wallet_code} onToast={onToast} />
          <CopyChip label="@" value={profile.email} onToast={onToast} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={Wallet} label="Solde" value={formatPrice(Number(profile.balance))} />
          <MiniStat icon={ShoppingBag} label="Total depanse" value={formatPrice(Number(profile.total_spent))} />
          <MiniStat icon={ArrowDownLeft} label="Depo konfime" value={formatPrice(myDeposits.filter((d) => d.status === "completed").reduce((s, d) => s + d.amount, 0))} />
          <MiniStat icon={CalendarDays} label="Manm depi" value={profile.created_at ? formatDate(profile.created_at) : "—"} />
        </div>

        <section>
          <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Dènye kòmand ({mine.length})</h3>
          {mine.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Pa gen kòmand nan 31 dènye jou yo.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {mine.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{o.product_name} · {o.package_label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{o.code} · {formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatPrice(o.price)}</p>
                    <StatusChip status={ORDER_STATUS[o.status]} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {myDeposits.length > 0 && (
          <section>
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Dènye depo</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {myDeposits.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{d.method === "moncash" ? "MonCash" : "NatCash"} · {formatDateTime(d.created_at)}</p>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatPrice(d.amount)}</p>
                    <StatusChip status={DEPOSIT_STATUS[d.status]} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl bg-sky-50/70 p-4 ring-1 ring-sky-100 dark:bg-sky-500/5 dark:ring-sky-500/20">
          <h3 className="mb-3 font-bold text-slate-900 dark:text-white">Ekri kliyan sa a</h3>
          <MessageForm profile={profile} onToast={onToast} />
        </section>
      </div>
    </Sheet>
  );
}

export default function AdminCustomers({ profiles, orders, deposits, onToast }) {
  const [search, setSearch] = useState("");
  const [sortId, setSortId] = useState("new");
  const [openId, setOpenId] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const sort = SORTS.find((s) => s.id === sortId);
  const q = normalize(search.trim());

  const list = Object.values(profiles)
    .filter((p) => !sort.filter || sort.filter(p))
    .filter((p) => !q || normalize(`${p.full_name} ${p.email} ${p.wallet_code}`).includes(q))
    .sort(sort.by);
  const open = openId ? profiles[openId] : null;

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Non, imèl oswa AWENS-ID" className="w-full bg-transparent focus:outline-none" />
      </label>
      <Chips options={SORTS} value={sortId} onChange={(id) => { setSortId(id); setShown(PAGE); }} label="Lòd" />
      <p className="px-1 text-sm text-slate-500 dark:text-slate-400">{number.format(list.length)} kliyan</p>

      {list.length === 0 ? (
        <Empty>Pa gen kliyan ki koresponn.</Empty>
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {list.slice(0, shown).map((p) => (
            <li key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <button type="button" onClick={() => setOpenId(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <Avatar profile={p} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-slate-900 dark:text-white">{p.full_name || p.email}</span>
                    {p.is_admin && <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Admin" />}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.full_name ? `${p.email} · ` : ""}<span className="font-mono">{p.wallet_code}</span></span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold tabular-nums text-slate-900 dark:text-white">{formatPrice(Number(p.balance))}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{formatPrice(Number(p.total_spent))} depanse</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {list.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="w-full rounded-2xl bg-white py-3 font-semibold text-sky-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-sky-400 dark:ring-slate-800">
          Wè plis ({number.format(list.length - shown)})
        </button>
      )}

      {open && <CustomerSheet profile={open} orders={orders} deposits={deposits} onClose={() => setOpenId(null)} onToast={onToast} />}
    </div>
  );
}
