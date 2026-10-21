import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Copy, Check, X, Loader2, RefreshCw, PackageCheck, Clock } from "lucide-react";
import { PAYMENT_METHODS } from "./data.js";
import { supabase, errorText } from "./supabase.js";
import { StatusChip, ErrorNote, formatPrice, formatDateTime, copyText, ORDER_STATUS, DEPOSIT_STATUS } from "./ui.jsx";

const TABS = [
  { id: "orders", label: "Kòmand" },
  { id: "deposits", label: "Depo" },
  { id: "prices", label: "Pri" },
];
const ORDER_FILTERS = [
  { id: "open", label: "Pou trete", test: (o) => o.status === "pending" || o.status === "processing" },
  { id: "delivered", label: "Livré", test: (o) => o.status === "delivered" },
  { id: "refused", label: "Refusé", test: (o) => o.status === "refused" },
  { id: "all", label: "Tout", test: () => true },
];

function Customer({ profile }) {
  if (!profile) return null;
  return (
    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
      {profile.full_name ? `${profile.full_name} · ` : ""}{profile.email} · <span className="font-mono">{profile.wallet_code}</span>
    </p>
  );
}

function CopyChip({ label, value, onToast }) {
  return (
    <button type="button" onClick={() => copyText(value, onToast)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {label} <span className="font-mono tabular-nums">{value}</span> <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function OrderCard({ order, profile, onToast, onChanged }) {
  const [mode, setMode] = useState(null); // "deliver" | "refuse"
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = async (status) => {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.rpc("admin_update_order", {
      p_order_id: order.id,
      p_status: status,
      p_delivery_code: code || null,
      p_note: note || null,
    });
    setBusy(false);
    if (err) return setError(errorText(err));
    setMode(null);
    onToast(status === "refused" ? `${order.code} refize, kliyan an ranbouse.` : `${order.code}: ${ORDER_STATUS[status].label}.`);
    onChanged();
  };

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-white">{order.product_name} · {order.package_label}</p>
          <Customer profile={profile} />
        </div>
        <StatusChip status={ORDER_STATUS[order.status]} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyChip label="#" value={order.code} onToast={onToast} />
        {order.player_id && <CopyChip label="ID" value={order.player_id} onToast={onToast} />}
        <span className="ml-auto text-lg font-extrabold tabular-nums text-sky-500">{formatPrice(Number(order.price))}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{formatDateTime(order.created_at)}</p>
      {order.delivery_code && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Kòd: <span className="font-mono font-semibold">{order.delivery_code}</span></p>}

      {order.status !== "refused" && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          {mode === null ? (
            <div className="flex flex-wrap gap-2">
              {order.status === "pending" && (
                <button type="button" disabled={busy} onClick={() => update("processing")} className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <Clock className="h-4 w-4" /> En cours
                </button>
              )}
              <button type="button" onClick={() => setMode("deliver")} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white">
                <PackageCheck className="h-4 w-4" /> {order.status === "delivered" ? "Chanje kòd la" : "Livrer"}
              </button>
              <button type="button" onClick={() => setMode("refuse")} className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <X className="h-4 w-4" /> Refuser
              </button>
            </div>
          ) : (
            <>
              {mode === "deliver" && (
                <input
                  id={`code-${order.id}`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Kòd PIN pou kliyan an (si gen youn)"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 font-mono focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                />
              )}
              <input
                id={`note-${order.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === "refuse" ? "Rezon an (kliyan an ap wè l)" : "Nòt pou kliyan an (si w vle)"}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              />
              <ErrorNote>{error}</ErrorNote>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode(null)} className="rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Anile</button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => update(mode === "deliver" ? "delivered" : "refused")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-white disabled:opacity-60 ${mode === "deliver" ? "bg-emerald-500" : "bg-red-500"}`}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "deliver" ? "Konfime livrezon" : "Refize + ranbouse"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function DepositCard({ deposit, profile, onToast, onChanged }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const method = PAYMENT_METHODS.find((m) => m.id === deposit.method);

  const review = async (approve) => {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.rpc("admin_review_deposit", { p_deposit_id: deposit.id, p_approve: approve, p_note: note || null });
    setBusy(false);
    if (err) return setError(errorText(err));
    onToast(approve ? `${formatPrice(Number(deposit.amount))} ajoute nan Wallet kliyan an.` : "Depo a refize.");
    onChanged();
  };

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start gap-3">
        {method && <img src={method.logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold tabular-nums text-emerald-500">+{formatPrice(Number(deposit.amount))}</p>
          <Customer profile={profile} />
        </div>
        <StatusChip status={DEPOSIT_STATUS[deposit.status]} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyChip label="Tranzaksyon" value={deposit.reference} onToast={onToast} />
        {deposit.sender_phone && <CopyChip label="Tel" value={deposit.sender_phone} onToast={onToast} />}
      </div>
      <p className="mt-1 text-xs text-slate-400">{formatDateTime(deposit.created_at)}</p>
      {deposit.admin_note && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Nòt: {deposit.admin_note}</p>}
      {deposit.status === "pending" && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Verifye nan {method?.name} ou ke tranzaksyon sa a rive anvan w konfime.</p>
          <input
            id={`dnote-${deposit.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nòt pou kliyan an si w refize"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
          />
          <ErrorNote>{error}</ErrorNote>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => review(false)} className="flex items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2.5 font-bold text-red-600 disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300">
              <X className="h-4 w-4" /> Refuser
            </button>
            <button type="button" disabled={busy} onClick={() => review(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 font-bold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Konfime
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function PriceRow({ pkg, onToast, onChanged }) {
  const [price, setPrice] = useState(String(Number(pkg.price)));
  const [available, setAvailable] = useState(pkg.available);
  const [busy, setBusy] = useState(false);
  const dirty = Number(price) !== Number(pkg.price) || available !== pkg.available;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_package", { p_id: pkg.id, p_price: Number(price), p_available: available });
    setBusy(false);
    if (error) return onToast(errorText(error));
    onToast(`${pkg.label}: ${formatPrice(Number(price))}${available ? "" : " (pa disponib)"}.`);
    onChanged();
  };

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="min-w-0 flex-1 basis-40">
        <p className="font-semibold text-slate-900 dark:text-white">{pkg.label}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{pkg.product_name}</p>
      </div>
      <label className="flex items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-2 focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
        <input
          id={`price-${pkg.id}`}
          type="number"
          inputMode="decimal"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label={`Pri ${pkg.label}`}
          className="w-20 bg-transparent py-2 text-right font-bold tabular-nums focus:outline-none"
        />
        <span className="text-xs font-semibold text-slate-400">HTG</span>
      </label>
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={available}
          onClick={() => setAvailable((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
        >
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${available ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${available ? "left-6" : "left-1"}`} />
          </span>
          {available ? "Disponib" : "Pa disponib"}
        </button>
        <button type="button" disabled={!dirty || busy} onClick={save} className="ml-auto rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sove"}
        </button>
      </div>
    </li>
  );
}

export default function AdminPage({ onBack, onToast }) {
  const [tab, setTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("open");
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [packages, setPackages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const recent = (q) => q.order("created_at", { ascending: false }).limit(200);
    const [o, d, p, u] = await Promise.all([
      recent(supabase.from("orders").select("*")),
      recent(supabase.from("deposits").select("*")),
      supabase.from("packages").select("*").order("sort"),
      supabase.from("profiles").select("id, email, full_name, wallet_code").limit(2000),
    ]);
    if (o.data) setOrders(o.data);
    if (d.data) setDeposits(d.data);
    if (p.data) setPackages(p.data);
    if (u.data) setProfiles(Object.fromEntries(u.data.map((x) => [x.id, x])));
    setLoading(false);
  }, []);

  // Nouvo kòmand ak depo parèt poukont yo
  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const openOrders = orders.filter(ORDER_FILTERS[0].test).length;
  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const filterTest = ORDER_FILTERS.find((f) => f.id === orderFilter).test;
  const sortedDeposits = [...deposits].sort((a, b) => (a.status === "pending") === (b.status === "pending") ? 0 : a.status === "pending" ? -1 : 1);
  const badges = { orders: openOrders, deposits: pendingDeposits };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-2 py-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Paramètres
      </button>
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><ShieldCheck className="h-7 w-7 text-emerald-500" /> Panneau admin</h1>
        <button type="button" onClick={load} aria-label="Rechaje" className="grid h-10 w-10 place-items-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${tab === t.id ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500"}`}
          >
            {t.label}
            {badges[t.id] > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[11px] leading-5 text-white">{badges[t.id]}</span>}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {ORDER_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOrderFilter(f.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${f.id === orderFilter ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {orders.filter(filterTest).map((o) => (
              <OrderCard key={`${o.id}-${o.status}-${o.updated_at}`} order={o} profile={profiles[o.user_id]} onToast={onToast} onChanged={load} />
            ))}
          </ul>
          {!loading && orders.filter(filterTest).length === 0 && <p className="py-8 text-center text-slate-500 dark:text-slate-400">Pa gen kòmand isit la.</p>}
        </>
      )}

      {tab === "deposits" && (
        <>
          <ul className="space-y-3">
            {sortedDeposits.map((d) => (
              <DepositCard key={`${d.id}-${d.status}`} deposit={d} profile={profiles[d.user_id]} onToast={onToast} onChanged={load} />
            ))}
          </ul>
          {!loading && deposits.length === 0 && <p className="py-8 text-center text-slate-500 dark:text-slate-400">Pa gen depo ankò.</p>}
        </>
      )}

      {tab === "prices" && (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">Chanje pri a oswa dezaktive yon pake, epi peze Sove. Sit la mete l ajou pou tout kliyan yo.</p>
          <ul className="space-y-2">
            {packages.map((p) => (
              <PriceRow key={`${p.id}-${p.price}-${p.available}`} pkg={p} onToast={onToast} onChanged={load} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
