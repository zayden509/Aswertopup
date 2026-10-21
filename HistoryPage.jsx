import React from "react";
import { History, ShoppingCart, Clock } from "lucide-react";
import { PRODUCTS } from "./data.js";
import { ProductArt, WhatsAppIcon, waLink } from "./ui.jsx";
import { orderMessage } from "./orders.js";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function HistoryPage({ orders, onShop }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Historique</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Kòmand ou fè sou telefòn sa a.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">
            <History className="h-8 w-8" strokeWidth={1.5} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Ou poko gen kòmand</h2>
          <p className="mx-auto mt-1 max-w-xs text-slate-500 dark:text-slate-400">Lè w fin achte yon pwodwi, w ap jwenn li isit la ak nimewo kòmand lan.</p>
          <button type="button" onClick={onShop} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 font-bold text-white hover:bg-sky-600">
            <ShoppingCart className="h-5 w-5" /> Achte kounye a
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
