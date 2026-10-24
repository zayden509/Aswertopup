import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ShieldCheck, Crown, Check, X, Loader2, RefreshCw, PackageCheck, Clock, Search,
  LayoutDashboard, ShoppingBag, ArrowDownLeft, Users, Package, MessageSquareText, Zap, Settings,
} from "lucide-react";
import { PAYMENT_METHODS } from "./data.js";
import { backend, errorText } from "./backend.js";
import { StatusChip, ErrorNote, ProductArt, formatPrice, formatDateTime, orderStatus, ORDER_STATUS, DEPOSIT_STATUS } from "./ui.jsx";
import { Chips, CopyText, Empty, AdminButton, SectionHead, panel, inputClass, normalize } from "./adminUi.jsx";
import { productForPackage, packageNameFixes } from "./catalog.js";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminCustomers from "./AdminCustomers.jsx";
import AdminCatalog from "./AdminCatalog.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminTeam, { isOwner } from "./AdminTeam.jsx";
import AdminAuto from "./AdminAuto.jsx";
import AdminSettings from "./AdminSettings.jsx";

const TABS = [
  { id: "dashboard", label: "Tablo", Icon: LayoutDashboard, title: "Tablo" },
  { id: "orders", label: "Kòmand", Icon: ShoppingBag, title: "Kòmand" },
  { id: "deposits", label: "Depo", Icon: ArrowDownLeft, title: "Depo" },
  { id: "customers", label: "Kliyan", Icon: Users, title: "Kliyan" },
  { id: "catalog", label: "Pwodwi", Icon: Package, title: "Pwodwi ak pri" },
  { id: "messages", label: "Mesaj", Icon: MessageSquareText, title: "Mesaj" },
  { id: "team", label: "Ekip", Icon: ShieldCheck, title: "Ekip admin" },
  { id: "auto", label: "Otomatik", Icon: Zap, title: "Livrezon otomatik" },
  { id: "settings", label: "Paramèt", Icon: Settings, title: "Paramèt" },
];

// "Tout" an premye: yon kòmand rete nan lis la menm apre l livre (oswa livre otomatikman)
const ORDER_FILTERS = [
  { id: "all", label: "Tout", test: () => true },
  { id: "open", label: "Pou trete", test: (o) => o.status === "unpaid" || o.status === "pending" || o.status === "processing" },
  { id: "delivered", label: "Livré", test: (o) => o.status === "delivered" },
  { id: "refused", label: "Refusé", test: (o) => o.status === "refused" },
];
const isOpen = ORDER_FILTERS[1].test;
const OLDER_PAGE = 100;

const SUPPLIER_STATUS = {
  sending: ["Ap voye bay FazerCards…", "text-violet-600 dark:text-violet-300"],
  created: ["FazerCards resevwa l", "text-violet-600 dark:text-violet-300"],
  processing: ["An kou kote FazerCards", "text-violet-600 dark:text-violet-300"],
  completed: ["FazerCards livre l ✅", "text-emerald-600 dark:text-emerald-400"],
  failed: ["FazerCards echwe: kliyan an ranbouse", "text-red-600 dark:text-red-400"],
  refund: ["FazerCards ranbouse: kliyan an ranbouse", "text-red-600 dark:text-red-400"],
  error: ["Pa t ka voye l bay FazerCards", "text-red-600 dark:text-red-400"],
};

// Detay yon kat (Kliyan, Kòmand, Player ID…): etikèt agoch, valè adwat
function Detail({ label, children }) {
  return (
    <>
      <dt className="pt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm text-slate-800 dark:text-slate-100">{children}</dd>
    </>
  );
}

function Customer({ profile }) {
  if (!profile) return <span className="text-slate-400">—</span>;
  return (
    <span className="block truncate">
      <span className="font-medium">{profile.full_name || profile.email}</span>
      {profile.full_name && <span className="text-slate-500 dark:text-slate-400"> · {profile.email}</span>}
    </span>
  );
}

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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-violet-50/70 px-3 py-2.5 ring-1 ring-violet-100 dark:bg-violet-500/5 dark:ring-violet-500/20">
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1.5 text-sm font-semibold ${tone}`}><Zap className="h-4 w-4 shrink-0" /> {label}</p>
        {(s?.offer_name || s?.order_id) && <p className="text-xs text-slate-500 dark:text-slate-400">{[s.offer_name, s.order_id].filter(Boolean).join(" · ")}</p>}
        {s?.error && <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{s.error}</p>}
      </div>
      {canSync && (
        <AdminButton icon={RefreshCw} busy={busy === "sync"} disabled={Boolean(busy)} onClick={() => run("sync")} className="h-8 text-xs">Verifye</AdminButton>
      )}
      {canRetry && (
        <AdminButton tone="primary" icon={Zap} busy={busy === "retry"} disabled={Boolean(busy)} onClick={() => run("retry")} className="h-8 bg-violet-600 text-xs hover:bg-violet-700 dark:bg-violet-500">
          {s ? "Eseye ankò" : "Voye kounye a"}
        </AdminButton>
      )}
    </div>
  );
}

function OrderCard({ order, profile, product, auto, onLink, onToast }) {
  const [mode, setMode] = useState(null); // "deliver" | "refuse"
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const unpaid = order.status === "unpaid";
  const method = order.payment && PAYMENT_METHODS.find((m) => m.id === order.payment.method);
  // Yon top-up jwèt (gen Player ID) ki p ap ka ale kote FazerCards poukont li
  const needsLink = !auto && !order.supplier && order.kind !== "exchange" && Boolean(order.player_id) && ["unpaid", "pending"].includes(order.status);

  const update = async (status) => {
    setBusy(true);
    setError("");
    try {
      await backend.adminUpdateOrder(order, status, code, note);
      setMode(null);
      onToast(status === "refused" ? `${order.code} refize${unpaid ? "" : ", kliyan an ranbouse"}.` : `${order.code}: ${ORDER_STATUS[status].label}.`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  // Admin nan resevwa kòb MonCash/NatCash la: kòmand lan ale kote FazerCards si pake a otomatik
  const confirmPayment = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminConfirmPayment(order);
      if (auto) backend.requestAutoDelivery(order.id);
      onToast(auto ? `${order.code}: peman konfime, FazerCards ap livre l.` : `${order.code}: peman konfime. Livre l kounye a.`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`${panel} overflow-hidden`}>
      <div className="flex gap-3 p-4 pb-3">
        {product ? (
          <ProductArt product={product} className="relative h-11 w-11 shrink-0 rounded-xl" />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><ShoppingBag className="h-5 w-5" /></span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate font-semibold text-slate-900 dark:text-white">{order.product_name}</p>
            <StatusChip status={orderStatus(order)} />
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-sm text-slate-500 dark:text-slate-400">{order.package_label}</p>
            <p className="shrink-0 font-bold tabular-nums text-slate-900 dark:text-white">{formatPrice(Number(order.price))}</p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 px-4 pb-3">
        <Detail label="Kliyan"><Customer profile={profile} /></Detail>
        <Detail label="Kòmand"><CopyText value={order.code} onToast={onToast} /></Detail>
        {order.player_id && <Detail label="Player ID"><CopyText value={order.player_id} onToast={onToast} /></Detail>}
        {order.recipient && <Detail label="Kont"><CopyText value={order.recipient.account} onToast={onToast} /></Detail>}
        {order.delivery_code && <Detail label="Kòd"><CopyText value={order.delivery_code} onToast={onToast} /></Detail>}
        <Detail label="Dat"><span className="text-slate-500 dark:text-slate-400">{formatDateTime(order.created_at)}</span></Detail>
      </dl>

      {(order.kind === "exchange" || order.payment || order.supplier || auto || needsLink) && (
        <div className="space-y-2 px-4 pb-3">
          {order.kind === "exchange" && (
            <p className="rounded-xl bg-sky-50 px-3 py-2.5 text-sm text-sky-900 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20">
              Voye <b>{order.amount} {order.currency}</b> bay <b>{order.recipient.name}</b> · frè {order.fee} {order.currency} · to {order.rate} HTG
            </p>
          )}
          {order.payment && (
            <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ${unpaid ? "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30" : "bg-slate-50 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700"}`}>
              {method && <img src={method.logo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${unpaid ? "text-amber-900 dark:text-amber-200" : "text-slate-700 dark:text-slate-200"}`}>
                  {unpaid ? `Tcheke si w resevwa ${formatPrice(Number(order.price))} sou ${method?.name || order.payment.method}` : `Peye ak ${method?.name || order.payment.method}`}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">Tranzaksyon <CopyText value={order.payment.reference} onToast={onToast} className="text-xs" /></span>
                  {order.payment.sender_phone && <span className="inline-flex items-center gap-1">Tel <CopyText value={order.payment.sender_phone} onToast={onToast} className="text-xs" /></span>}
                </p>
              </div>
            </div>
          )}
          <SupplierLine order={order} auto={auto} onToast={onToast} />
          {needsLink && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
              <Zap className="h-4 w-4 shrink-0 text-slate-400" />
              <p className="min-w-0 flex-1 text-sm text-slate-600 dark:text-slate-300">Pake sa a poko konekte ak FazerCards: li p ap livre poukont li.</p>
              <AdminButton onClick={onLink} className="h-8 shrink-0 text-xs">Konekte l</AdminButton>
            </div>
          )}
        </div>
      )}
      {order.admin_note && <p className="px-4 pb-3 text-sm text-slate-500 dark:text-slate-400">Nòt: {order.admin_note}</p>}

      {order.status !== "refused" && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
          <ErrorNote>{error}</ErrorNote>
          {mode === null && unpaid ? (
            <div className="flex flex-wrap justify-end gap-2">
              <AdminButton tone="danger" icon={X} onClick={() => setMode("refuse")}>Refuser</AdminButton>
              <AdminButton tone="success" icon={Check} busy={busy} disabled={busy} onClick={confirmPayment}>Mwen resevwa peman an</AdminButton>
            </div>
          ) : mode === null ? (
            <div className="flex flex-wrap justify-end gap-2">
              <AdminButton tone="danger" icon={X} onClick={() => setMode("refuse")}>Refuser</AdminButton>
              {order.status === "pending" && (
                <AdminButton icon={Clock} disabled={busy} onClick={() => update("processing")}>En cours</AdminButton>
              )}
              {/* Yon pake FazerCards ki deja livre pa gen kòd pou chanje */}
              {!(auto && order.status === "delivered") && (
                <AdminButton tone="success" icon={PackageCheck} onClick={() => setMode("deliver")}>
                  {order.status === "delivered" ? "Chanje kòd la" : "Livrer"}
                </AdminButton>
              )}
            </div>
          ) : (
            <>
              {/* Pake FazerCards yo pa bezwen kòd: dyaman yo rive sou kont jwè a */}
              {mode === "deliver" && !auto && (
                <input
                  id={`code-${order.id}`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Kòd PIN pou kliyan an (si gen youn)"
                  className={`${inputClass} font-mono`}
                />
              )}
              <input
                id={`note-${order.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === "refuse" ? "Rezon an (kliyan an ap wè l)" : "Nòt pou kliyan an (si w vle)"}
                className={inputClass}
              />
              <div className="flex justify-end gap-2">
                <AdminButton onClick={() => setMode(null)}>Anile</AdminButton>
                <AdminButton
                  tone={mode === "deliver" ? "success" : "danger"}
                  busy={busy}
                  disabled={busy}
                  onClick={() => update(mode === "deliver" ? "delivered" : "refused")}
                  className={mode === "refuse" ? "bg-red-600 text-white ring-0 hover:bg-red-700 dark:bg-red-500 dark:text-white" : ""}
                >
                  {mode === "deliver" ? "Konfime livrezon" : unpaid ? "Refize (peman pa rive)" : "Refize + ranbouse"}
                </AdminButton>
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
    <li className={`${panel} overflow-hidden`}>
      <div className="flex gap-3 p-4 pb-3">
        {method && <img src={method.logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900 dark:text-white">Depo {method?.name}</p>
            <StatusChip status={DEPOSIT_STATUS[deposit.status]} />
          </div>
          <p className="mt-0.5 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{formatPrice(Number(deposit.amount))}</p>
        </div>
      </div>
      <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 px-4 pb-3">
        <Detail label="Kliyan"><Customer profile={profile} /></Detail>
        <Detail label="Tranzaksyon"><CopyText value={deposit.reference} onToast={onToast} /></Detail>
        {deposit.sender_phone && <Detail label="Tel"><CopyText value={deposit.sender_phone} onToast={onToast} /></Detail>}
        <Detail label="Dat"><span className="text-slate-500 dark:text-slate-400">{formatDateTime(deposit.created_at)}</span></Detail>
        {deposit.admin_note && <Detail label="Nòt">{deposit.admin_note}</Detail>}
      </dl>
      {deposit.status === "pending" && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
          <p className="text-sm text-slate-500 dark:text-slate-400">Verifye nan {method?.name} ou ke tranzaksyon sa a rive anvan w konfime.</p>
          <input
            id={`dnote-${deposit.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nòt pou kliyan an si w refize"
            className={inputClass}
          />
          <ErrorNote>{error}</ErrorNote>
          <div className="flex justify-end gap-2">
            <AdminButton tone="danger" icon={X} disabled={busy} onClick={() => review(false)}>Refuser</AdminButton>
            <AdminButton tone="success" icon={Check} busy={busy} disabled={busy} onClick={() => review(true)}>Konfime</AdminButton>
          </div>
        </div>
      )}
    </li>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="flex h-11 items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-sky-500/40 dark:bg-slate-900 dark:ring-slate-800">
      <Search className="h-[18px] w-[18px] shrink-0 text-slate-400" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[15px] focus:outline-none" />
    </label>
  );
}

function OrdersTab({ orders, older, onLoadOlder, filter, onFilter, profiles, catalog, supplierMap, loading, onLink, onToast }) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = normalize(search.trim());
  const test = ORDER_FILTERS.find((f) => f.id === filter).test;
  const list = orders.filter(test).filter((o) => {
    if (!q) return true;
    const p = profiles[o.user_id];
    return normalize(`${o.code} ${o.player_id} ${o.product_name} ${o.package_label} ${o.payment?.reference} ${p?.email} ${p?.full_name} ${p?.wallet_code}`).includes(q);
  });
  const options = ORDER_FILTERS.map((f) => {
    const n = orders.filter(f.test).length;
    return f.id === "open" ? { ...f, count: n } : { ...f, tally: n };
  });

  const loadOlder = async () => {
    setBusy(true);
    setError("");
    try {
      await onLoadOlder();
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <SearchBox value={search} onChange={setSearch} placeholder="Kòd, Player ID, tranzaksyon, imèl…" />
      <Chips options={options} value={filter} onChange={onFilter} label="Filtè" />
      <ul className="space-y-3">
        {list.map((o) => (
          <OrderCard
            key={`${o.id}-${o.status}-${o.updated_at}`}
            order={o}
            profile={profiles[o.user_id]}
            product={productForPackage(o.package_id, catalog)}
            auto={Boolean(supplierMap[o.package_id]?.auto)}
            onLink={onLink}
            onToast={onToast}
          />
        ))}
      </ul>
      {!loading && list.length === 0 && <Empty>Pa gen kòmand isit la.</Empty>}
      {!loading && filter !== "open" && (
        older.done ? (
          <p className="px-1 text-center text-xs text-slate-400">Se tout kòmand yo sa: {orders.length}.</p>
        ) : (
          <>
            <ErrorNote>{error}</ErrorNote>
            <AdminButton icon={Clock} busy={busy} disabled={busy} onClick={loadOlder} className="h-11 w-full">
              Wè kòmand ki pi ansyen yo
            </AdminButton>
          </>
        )
      )}
    </div>
  );
}

export default function AdminPage({ account, catalog = [], onBack, onToast }) {
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [visits, setVisits] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [supplierMap, setSupplierMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [epoch, setEpoch] = useState(0); // bouton 🔄: rekòmanse koute done yo
  const [orderFilter, setOrderFilter] = useState("all");
  // Kòmand ki pi ansyen pase 31 jou yo, chaje sou demann (yo pa an dirèk)
  const [older, setOlder] = useState({ list: [], done: false });
  const [historyFrom, setHistoryFrom] = useState(null);

  // Tout done yo an dirèk: nouvo kòmand ak depo parèt poukont yo
  useEffect(() => {
    setLoading(true);
    setOlder({ list: [], done: false });
    return backend.subscribeAdmin({
      onOrders: (list, from) => {
        setOrders(list);
        setHistoryFrom(from);
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

  // Lè non yon pwodwi chanje sou sit la, pake li yo nan baz done a swiv li (kòmand ki deja fèt yo pa chanje)
  const nameFixes = useMemo(() => packageNameFixes(account.prices, account.catalog.products), [account.prices, account.catalog.products]);
  useEffect(() => {
    if (nameFixes.length) backend.adminRenamePackages(nameFixes).catch((error) => console.error("rename packages", error));
  }, [nameFixes]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  // Kòmand an dirèk yo genyen sou ansyen yo si se menm kòmand lan
  const allOrders = useMemo(() => {
    if (!older.list.length) return orders;
    const live = new Set(orders.map((o) => o.id));
    return [...orders, ...older.list.filter((o) => !live.has(o.id))];
  }, [orders, older.list]);

  const loadOlder = async () => {
    const before = older.list.at(-1)?.created_at ?? historyFrom;
    const page = await backend.adminOlderOrders(before, OLDER_PAGE);
    setOlder((prev) => ({ list: [...prev.list, ...page], done: page.length < OLDER_PAGE }));
  };

  const go = (target, filter) => {
    if (filter) setOrderFilter(filter);
    setTab(target);
  };

  const me = account.profile;
  const owner = isOwner(me);
  const openCount = orders.filter(isOpen).length;
  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const badges = { orders: openCount, deposits: pendingDeposits };
  const sortedDeposits = [...deposits].sort((a, b) => (a.status === "pending") === (b.status === "pending") ? 0 : a.status === "pending" ? -1 : 1);
  const current = TABS.find((t) => t.id === tab);
  const subtitles = {
    dashboard: "Lavant, vizitè ak sa ki pou trete",
    orders: `${allOrders.length} kòmand · ${openCount} pou trete`,
    deposits: pendingDeposits ? `${pendingDeposits} depo pou verifye` : "Tout depo yo trete",
    customers: `${Object.keys(profiles).length} kont`,
    catalog: "Pri, pake, foto ak pwodwi ki parèt sou sit la",
    messages: "Ekri kliyan yo nan notifikasyon sit la",
    team: "Moun ki gen aksè nan Panneau admin lan",
    auto: "FazerCards livre dyaman yo poukont li",
    settings: "Nimewo kliyan yo voye kòb la",
  };

  return (
    <div className="-mx-4 -mt-2">
      {/* Ba anlè a rete vizib: retounen, tit, wòl ou, rechaje, ak tout seksyon yo */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-100/[.97] dark:border-slate-800 dark:bg-slate-950/[.97]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-2 pt-3">
          <button type="button" onClick={onBack} aria-label="Retounen nan Paramètres" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-sky-600 dark:text-sky-400">Awens Topup</p>
            <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">Panneau admin</h1>
          </div>
          <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold min-[380px]:inline-flex ${owner ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
            {owner ? <Crown className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {owner ? "Pwopriyetè" : "Admin"}
          </span>
          <button type="button" onClick={() => setEpoch((e) => e + 1)} aria-label="Rechaje" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
            <RefreshCw className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <nav aria-label="Seksyon admin" className="no-scrollbar mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2.5">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                <t.Icon className="h-4 w-4" />
                {t.label}
                {badges[t.id] > 0 && (
                  <span className="min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white">{badges[t.id]}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-5">
        <SectionHead title={current.title} sub={subtitles[tab]} />

        {tab === "dashboard" && <AdminDashboard orders={orders} deposits={deposits} profiles={profiles} visits={visits} onGo={go} />}
        {tab === "orders" && (
          <OrdersTab
            orders={allOrders} older={older} onLoadOlder={loadOlder} filter={orderFilter} onFilter={setOrderFilter}
            profiles={profiles} catalog={catalog} supplierMap={supplierMap} loading={loading} onLink={() => setTab("auto")} onToast={onToast}
          />
        )}
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
        {tab === "customers" && <AdminCustomers profiles={profiles} orders={allOrders} deposits={deposits} onToast={onToast} />}
        {tab === "catalog" && <AdminCatalog account={account} onToast={onToast} />}
        {tab === "messages" && <AdminMessages profiles={profiles} announcements={announcements} onToast={onToast} />}
        {tab === "team" && <AdminTeam me={me} profiles={profiles} onToast={onToast} />}
        {tab === "auto" && <AdminAuto account={account} supplierMap={supplierMap} onToast={onToast} />}
        {tab === "settings" && <AdminSettings account={account} owner={owner} onToast={onToast} />}
      </div>
    </div>
  );
}
