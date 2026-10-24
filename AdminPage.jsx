import React, { useEffect, useState } from "react";
import {
  ArrowLeft, ShieldCheck, Crown, Check, X, Loader2, RefreshCw, PackageCheck, Clock, Search,
  LayoutDashboard, ShoppingBag, ArrowDownLeft, Users, Package, MessageSquareText, Zap,
} from "lucide-react";
import { PAYMENT_METHODS } from "./data.js";
import { backend, errorText } from "./backend.js";
import { StatusChip, ErrorNote, formatPrice, formatDateTime, ORDER_STATUS, DEPOSIT_STATUS } from "./ui.jsx";
import { Chips, CopyChip, CustomerLine, Empty, normalize } from "./adminUi.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminCustomers from "./AdminCustomers.jsx";
import AdminCatalog from "./AdminCatalog.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminTeam, { isOwner } from "./AdminTeam.jsx";
import AdminAuto from "./AdminAuto.jsx";

const TABS = [
  { id: "dashboard", label: "Tablo", Icon: LayoutDashboard },
  { id: "orders", label: "Kòmand", Icon: ShoppingBag },
  { id: "deposits", label: "Depo", Icon: ArrowDownLeft },
  { id: "customers", label: "Kliyan", Icon: Users },
  { id: "catalog", label: "Pwodwi", Icon: Package },
  { id: "messages", label: "Mesaj", Icon: MessageSquareText },
  { id: "team", label: "Ekip", Icon: ShieldCheck },
  { id: "auto", label: "Otomatik", Icon: Zap },
];

const ORDER_FILTERS = [
  { id: "open", label: "Pou trete", test: (o) => o.status === "pending" || o.status === "processing" },
  { id: "delivered", label: "Livré", test: (o) => o.status === "delivered" },
  { id: "refused", label: "Refusé", test: (o) => o.status === "refused" },
  { id: "all", label: "Tout", test: () => true },
];

const SUPPLIER_STATUS = {
  sending: ["Ap voye bay FazerCards…", "text-violet-600 dark:text-violet-300"],
  created: ["FazerCards resevwa l", "text-violet-600 dark:text-violet-300"],
  processing: ["An kou kote FazerCards", "text-violet-600 dark:text-violet-300"],
  completed: ["FazerCards livre l ✅", "text-emerald-600 dark:text-emerald-400"],
  failed: ["FazerCards echwe: kliyan an ranbouse", "text-red-600 dark:text-red-400"],
  refund: ["FazerCards ranbouse: kliyan an ranbouse", "text-red-600 dark:text-red-400"],
  error: ["Pa t ka voye l bay FazerCards", "text-red-600 dark:text-red-400"],
};

// Estati livrezon otomatik la, ak bouton pou verifye oswa eseye ankò
function SupplierLine({ order, auto, onToast }) {
  const [busy, setBusy] = useState(null);
  const s = order.supplier;
  if (!s && !(auto && order.status === "pending")) return null;
  const run = async (action) => {
    setBusy(action);
    try {
      const res = await backend.adminFazer(action, { orderId: order.id });
      onToast(res.status ? `FazerCards: ${SUPPLIER_STATUS[res.status]?.[0] || res.status}` : "Pa gen anyen pou voye.");
    } catch (err) {
      onToast(errorText(err));
    } finally {
      setBusy(null);
    }
  };
  const [label, tone] = s ? SUPPLIER_STATUS[s.status] || [s.status, "text-slate-600"] : ["Otomatik, poko voye", "text-amber-600 dark:text-amber-400"];
  const canRetry = !s || s.status === "error" || (s.status === "sending" && !s.order_id);
  const canSync = s?.order_id && !["completed", "failed", "refund"].includes(s.status);
  return (
    <div className="mt-2 rounded-xl bg-violet-50/70 px-3 py-2 ring-1 ring-violet-100 dark:bg-violet-500/5 dark:ring-violet-500/20">
      <p className={`flex items-center gap-1.5 text-sm font-semibold ${tone}`}><Zap className="h-4 w-4 shrink-0" /> {label}</p>
      {(s?.offer_name || s?.order_id) && <p className="text-xs text-slate-500 dark:text-slate-400">{[s.offer_name, s.order_id].filter(Boolean).join(" · ")}</p>}
      {s?.error && <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{s.error}</p>}
      {(canRetry || canSync) && (
        <div className="mt-2 flex gap-2">
          {canSync && (
            <button type="button" disabled={Boolean(busy)} onClick={() => run("sync")} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200 disabled:opacity-60 dark:bg-slate-900 dark:text-violet-300 dark:ring-violet-500/30">
              {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Verifye
            </button>
          )}
          {canRetry && (
            <button type="button" disabled={Boolean(busy)} onClick={() => run("retry")} className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
              {busy === "retry" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} {s ? "Eseye ankò" : "Voye kounye a"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, profile, auto, onToast }) {
  const [mode, setMode] = useState(null); // "deliver" | "refuse"
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = async (status) => {
    setBusy(true);
    setError("");
    try {
      await backend.adminUpdateOrder(order, status, code, note);
      setMode(null);
      onToast(status === "refused" ? `${order.code} refize, kliyan an ranbouse.` : `${order.code}: ${ORDER_STATUS[status].label}.`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-white">{order.product_name} · {order.package_label}</p>
          <CustomerLine profile={profile} />
        </div>
        <StatusChip status={ORDER_STATUS[order.status]} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyChip label="#" value={order.code} onToast={onToast} />
        {order.player_id && <CopyChip label="ID" value={order.player_id} onToast={onToast} />}
        {order.recipient && <CopyChip label="Kont" value={order.recipient.account} onToast={onToast} />}
        <span className="ml-auto text-lg font-extrabold tabular-nums text-sky-500">{formatPrice(Number(order.price))}</span>
      </div>
      {order.kind === "exchange" && (
        <p className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
          Voye <b>{order.amount} {order.currency}</b> bay <b>{order.recipient.name}</b> · frè {order.fee} {order.currency} · to {order.rate} HTG
        </p>
      )}
      <SupplierLine order={order} auto={auto} onToast={onToast} />
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

function DepositCard({ deposit, profile, onToast }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const method = PAYMENT_METHODS.find((m) => m.id === deposit.method);

  const review = async (approve) => {
    setBusy(true);
    setError("");
    try {
      await backend.adminReviewDeposit(deposit, approve, note);
      onToast(approve ? `${formatPrice(Number(deposit.amount))} ajoute nan Wallet kliyan an.` : "Depo a refize.");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start gap-3">
        {method && <img src={method.logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold tabular-nums text-emerald-500">+{formatPrice(Number(deposit.amount))}</p>
          <CustomerLine profile={profile} />
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

function OrdersTab({ orders, profiles, supplierMap, loading, onToast }) {
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const q = normalize(search.trim());
  const test = ORDER_FILTERS.find((f) => f.id === filter).test;
  const list = orders.filter(test).filter((o) => {
    if (!q) return true;
    const p = profiles[o.user_id];
    return normalize(`${o.code} ${o.player_id} ${o.product_name} ${o.package_label} ${p?.email} ${p?.full_name} ${p?.wallet_code}`).includes(q);
  });
  const options = ORDER_FILTERS.map((f) => ({ ...f, count: f.id === "open" ? orders.filter(f.test).length : 0 }));

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kòd, Player ID, imèl…" className="w-full bg-transparent focus:outline-none" />
      </label>
      <Chips options={options} value={filter} onChange={setFilter} label="Filtè" />
      <ul className="space-y-3">
        {list.map((o) => (
          <OrderCard key={`${o.id}-${o.status}-${o.updated_at}`} order={o} profile={profiles[o.user_id]} auto={Boolean(supplierMap[o.package_id]?.auto)} onToast={onToast} />
        ))}
      </ul>
      {!loading && list.length === 0 && <Empty>Pa gen kòmand isit la.</Empty>}
      {filter !== "open" && <p className="px-1 text-xs text-slate-400">Lis la montre kòmand 31 dènye jou yo.</p>}
    </div>
  );
}

export default function AdminPage({ account, onBack, onToast }) {
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [visits, setVisits] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [supplierMap, setSupplierMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [epoch, setEpoch] = useState(0); // bouton 🔄: rekòmanse koute done yo

  // Tout done yo an dirèk: nouvo kòmand ak depo parèt poukont yo
  useEffect(() => {
    setLoading(true);
    return backend.subscribeAdmin({
      onOrders: (list) => {
        setOrders(list);
        setLoading(false);
      },
      onDeposits: setDeposits,
      onProfiles: setProfiles,
      onVisits: setVisits,
      onAnnouncements: setAnnouncements,
    });
  }, [epoch]);

  // Ki pake ki otomatik (FazerCards)
  useEffect(() => backend.subscribeSupplierMap(setSupplierMap), [epoch]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const me = account.profile;
  const owner = isOwner(me);
  const badges = {
    orders: orders.filter(ORDER_FILTERS[0].test).length,
    deposits: deposits.filter((d) => d.status === "pending").length,
  };
  const sortedDeposits = [...deposits].sort((a, b) => (a.status === "pending") === (b.status === "pending") ? 0 : a.status === "pending" ? -1 : 1);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-2 py-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Paramètres
      </button>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">Panneau admin</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            {owner ? <Crown className="h-4 w-4 text-amber-500" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
            {owner ? "Pwopriyetè" : "Admin"} · {me.full_name || me.email}
          </p>
        </div>
        <button type="button" onClick={() => setEpoch((e) => e + 1)} aria-label="Rechaje" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <nav className="grid grid-cols-4 gap-2" aria-label="Seksyon admin">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-xs font-bold transition ${
                active ? "bg-sky-500 text-white shadow-md shadow-sky-500/25" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
              }`}
            >
              <t.Icon className="h-5 w-5" />
              {t.label}
              {badges[t.id] > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-red-500 px-1 text-center text-[11px] leading-5 text-white ring-2 ring-slate-100 dark:ring-slate-950">{badges[t.id]}</span>
              )}
            </button>
          );
        })}
      </nav>

      {tab === "dashboard" && <AdminDashboard orders={orders} deposits={deposits} profiles={profiles} visits={visits} onGo={setTab} />}
      {tab === "orders" && <OrdersTab orders={orders} profiles={profiles} supplierMap={supplierMap} loading={loading} onToast={onToast} />}
      {tab === "deposits" && (
        <>
          <ul className="space-y-3">
            {sortedDeposits.map((d) => (
              <DepositCard key={`${d.id}-${d.status}`} deposit={d} profile={profiles[d.user_id]} onToast={onToast} />
            ))}
          </ul>
          {!loading && deposits.length === 0 && <Empty>Pa gen depo ankò.</Empty>}
        </>
      )}
      {tab === "customers" && <AdminCustomers profiles={profiles} orders={orders} deposits={deposits} onToast={onToast} />}
      {tab === "catalog" && <AdminCatalog account={account} onToast={onToast} />}
      {tab === "messages" && <AdminMessages profiles={profiles} announcements={announcements} onToast={onToast} />}
      {tab === "team" && <AdminTeam me={me} profiles={profiles} onToast={onToast} />}
      {tab === "auto" && <AdminAuto account={account} supplierMap={supplierMap} onToast={onToast} />}
    </div>
  );
}
