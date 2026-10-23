import React, { useState } from "react";
import { History, ShoppingCart, Clock, KeyRound, Search, Copy, Hash, CalendarDays, Banknote, User, StickyNote, Check } from "lucide-react";
import { PRODUCTS } from "./data.js";
import { Sheet, ProductArt, WhatsAppIcon, StatusChip, waLink, formatPrice, formatDate, formatDateTime, copyText, ORDER_STATUS } from "./ui.jsx";
import { orderMessage } from "./orders.js";
import { LoginPrompt } from "./WalletPage.jsx";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "pending", label: "En attente" },
  { id: "delivered", label: "Livré" },
  { id: "codes", label: "Codes" },
  { id: "refused", label: "Refusé" },
];

function productForPackage(packageId, catalog) {
  return catalog.find((p) => p.groups?.some((g) => g.items.some((i) => i.id === packageId)));
}

function EmptyState({ title, text, onShop }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">
        <History className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-1 max-w-xs text-slate-500 dark:text-slate-400">{text}</p>
      <button type="button" onClick={onShop} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 font-bold text-white hover:bg-sky-600">
        <ShoppingCart className="h-5 w-5" /> Achte kounye a
      </button>
    </div>
  );
}

// Detay yon kòmand, ak kòd PIN lan lè admin nan fin livre l
export function OrderSheet({ order, catalog = PRODUCTS, onClose, onToast }) {
  const product = productForPackage(order.package_id, catalog);
  const steps = order.status === "refused" ? ["pending", "refused"] : ["pending", "processing", "delivered"];
  const reached = steps.indexOf(order.status);
  const stepLabel = { pending: "Resevwa", processing: "An kou", delivered: "Livre", refused: "Refize" };

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Kòmand ${order.code}`}
      footer={
        <a
          href={waLink(`Bonjou Aswer Top Up, mwen bezwen èd ak kòmand ${order.code} (${order.product_name} · ${order.package_label}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> Bezwen èd ak kòmand sa a?
        </a>
      }
    >
      <div className="flex items-center gap-4">
        {product && <ProductArt product={product} className="relative h-16 w-16 shrink-0 rounded-2xl" />}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white">{order.product_name}</p>
          <p className="text-slate-500 dark:text-slate-400">{order.package_label}</p>
        </div>
        <StatusChip status={ORDER_STATUS[order.status]} />
      </div>

      <ol className="mt-5 flex items-center">
        {steps.map((s, i) => {
          const done = i <= reached;
          const bad = s === "refused";
          return (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <span className="flex flex-col items-center gap-1">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-white ${done ? (bad ? "bg-red-500" : "bg-emerald-500") : "bg-slate-200 dark:bg-slate-700"}`}>
                  {done ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-white/80" />}
                </span>
                <span className={`text-xs font-semibold ${done ? "text-slate-800 dark:text-slate-100" : "text-slate-400"}`}>{stepLabel[s]}</span>
              </span>
              {i < steps.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < reached ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />}
            </li>
          );
        })}
      </ol>

      {order.delivery_code && (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><KeyRound className="h-4 w-4" /> Kòd ou</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="min-w-0 select-all break-all font-mono text-base font-bold tracking-wide text-slate-900 dark:text-white">{order.delivery_code}</span>
            <button type="button" onClick={() => copyText(order.delivery_code, onToast)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-500/30">
              <Copy className="h-4 w-4" /> Kopye
            </button>
          </div>
        </div>
      )}

      <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {[
          [Hash, "Kòmand", order.code],
          [CalendarDays, "Dat", formatDateTime(order.created_at)],
          [Banknote, "Pri", formatPrice(Number(order.price))],
          order.player_id && [User, "Player ID", order.player_id],
          order.admin_note && [StickyNote, "Nòt", order.admin_note],
        ]
          .filter(Boolean)
          .map(([Icon, label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3">
              <dt className="flex items-center gap-3 text-slate-500 dark:text-slate-400"><Icon className="h-5 w-5" strokeWidth={1.75} /> {label}</dt>
              <dd className="min-w-0 text-right font-medium tabular-nums text-slate-900 dark:text-white">{value}</dd>
            </div>
          ))}
      </dl>
    </Sheet>
  );
}

function AccountHistory({ account, onShop, onOpenOrder }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const q = query.trim().toLowerCase();
  const codes = account.orders.filter((o) => o.delivery_code).length;

  const visible = account.orders.filter((o) => {
    if (q && !`${o.code} ${o.product_name} ${o.package_label}`.toLowerCase().includes(q)) return false;
    if (filter === "codes") return Boolean(o.delivery_code);
    if (filter === "pending") return o.status === "pending" || o.status === "processing";
    return filter === "all" || o.status === filter;
  });

  if (account.orders.length === 0) {
    return <EmptyState title="Ou poko gen kòmand" text="Lè w achte yon pwodwi, w ap swiv li isit la, epi w ap jwenn kòd PIN ou yo." onShop={onShop} />;
  }

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            id="orders-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full min-w-0 bg-transparent py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
        </label>
        <select
          id="orders-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtre"
          className="rounded-2xl border-2 border-slate-200 bg-white px-3 py-3 text-base font-medium text-slate-800 focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">Pa gen kòmand ki koresponn.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onOpenOrder(o)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-sky-200 dark:bg-slate-900 dark:ring-slate-800"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${o.delivery_code ? "bg-sky-50 text-sky-500 dark:bg-sky-500/10" : "bg-violet-50 text-violet-500 dark:bg-violet-500/10"}`}>
                  {o.delivery_code ? <KeyRound className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-slate-900 dark:text-white">{o.product_name}</span>
                  <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{o.package_label} · {formatDate(o.created_at)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">{formatPrice(Number(o.price))}</span>
                  {o.delivery_code ? (
                    <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold tracking-wider text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">PIN</span>
                  ) : (
                    <StatusChip status={ORDER_STATUS[o.status]} />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {codes > 0 && filter !== "codes" && (
        <button type="button" onClick={() => setFilter("codes")} className="w-full text-center text-sm font-semibold text-sky-600 dark:text-sky-400">
          {codes} kòd disponib: wè yo
        </button>
      )}
    </>
  );
}

// Mòd WhatsApp: kòmand yo sove sou telefòn nan sèlman
function LocalHistory({ orders, onShop }) {
  if (orders.length === 0) {
    return <EmptyState title="Ou poko gen kòmand" text="Lè w fin achte yon pwodwi, w ap jwenn li isit la ak nimewo kòmand lan." onShop={onShop} />;
  }
  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const product = PRODUCTS.find((p) => p.id === o.productId);
        return (
          <li key={o.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start gap-3">
              {product && <ProductArt product={product} className="relative h-14 w-14 shrink-0 rounded-xl" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold leading-tight text-slate-900 dark:text-white">{o.product}</p>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    <Clock className="h-3 w-3" /> An atant
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{o.package}</p>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p className="tabular-nums">{o.id} · {o.payment}</p>
                <p>{dateFormat.format(o.date)}</p>
              </div>
              <p className="text-lg font-extrabold tabular-nums text-sky-500">{o.priceText}</p>
            </div>
            <a
              href={waLink(orderMessage(o))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Voye kòmand lan ankò sou WhatsApp
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function HistoryPage({ account, localOrders, onShop, onLogin, onOpenOrder }) {
  const codes = account.orders.filter((o) => o.delivery_code).length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Historique</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {!account.enabled
            ? "Kòmand ou fè sou telefòn sa a."
            : codes > 0
              ? <span className="font-medium text-sky-600 dark:text-sky-400">{codes} kòd disponib</span>
              : "Kòmand ou yo ak kòd PIN ou resevwa yo."}
        </p>
      </div>
      {!account.enabled ? (
        <LocalHistory orders={localOrders} onShop={onShop} />
      ) : !account.user ? (
        <LoginPrompt title="Mes commandes" icon={History} text="Konekte pou w swiv kòmand ou yo epi jwenn kòd PIN ou resevwa yo." onLogin={onLogin} />
      ) : (
        <AccountHistory account={account} onShop={onShop} onOpenOrder={onOpenOrder} />
      )}
    </div>
  );
}
