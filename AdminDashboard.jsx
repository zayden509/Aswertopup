import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, ShoppingBag, Users, UserPlus, ArrowDownLeft, ReceiptText, Percent, Wallet, Clock, ChevronRight, Table2 } from "lucide-react";
import { dayKey, lastDays } from "./days.js";
import { formatPrice } from "./ui.jsx";
import { Card, Chips, compact, number } from "./adminUi.jsx";

const PERIODS = [
  { id: "today", label: "Jodi a", days: 1, previous: "ayè" },
  { id: "7d", label: "7 jou", days: 7, previous: "7 jou anvan yo" },
  { id: "30d", label: "30 jou", days: 30 },
];

const HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Port-au-Prince", hour: "2-digit", hourCycle: "h23" });
const WEEKDAY = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const FULL_DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const asDate = (key) => new Date(`${key}T12:00:00Z`);

const sold = (o) => o.status !== "refused";
const sum = (list, pick) => list.reduce((total, x) => total + Number(pick(x) || 0), 0);

// Yon chif won pou tèt grafik la (0 / mwatye / tèt)
function niceMax(max) {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 4, 6, 8, 10].find((s) => s * magnitude >= max);
  return step * magnitude;
}

// Grafik an kolòn: yon sèl seri, ak ti bil ki montre valè a lè w peze yon kolòn
function ColumnChart({ data, format, labelEvery, label }) {
  const [active, setActive] = useState(null);
  const max = Math.max(0, ...data.map((d) => d.value));
  const top = niceMax(max);
  const peak = max > 0 ? data.findIndex((d) => d.value === max) : -1;
  const shown = active ?? null;
  const tipLeft = shown == null ? 0 : Math.min(85, Math.max(15, ((shown + 0.5) / data.length) * 100));

  return (
    <figure aria-label={label}>
      <div className="relative ml-9 mt-5 h-44">
        {/* Liy fon yo: 0, mwatye, tèt */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-slate-100 dark:border-slate-800" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -left-9 -translate-y-1/2 text-[11px] tabular-nums text-slate-400">{compact.format(top * f)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d, i) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${d.full}: ${format(d.value)}`}
              className="relative flex h-full min-w-0 flex-1 items-end justify-center focus:outline-none"
            >
              <span
                className={`block w-full max-w-[24px] rounded-t-[4px] bg-sky-600 transition-opacity dark:bg-sky-400 ${shown != null && shown !== i ? "opacity-40" : ""}`}
                style={{ height: `${(d.value / top) * 100}%` }}
              />
              {i === peak && shown == null && (
                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-slate-600 dark:text-slate-300" style={{ bottom: `calc(${(d.value / top) * 100}% + 4px)` }}>
                  {compact.format(d.value)}
                </span>
              )}
            </button>
          ))}
        </div>
        {shown != null && (
          <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-white shadow-lg dark:bg-white dark:text-slate-900" style={{ left: `${tipLeft}%` }}>
            <span className="block text-sm font-bold">{format(data[shown].value)}</span>
            <span className="block text-xs opacity-70">{data[shown].full}</span>
          </div>
        )}
      </div>
      <div className="ml-9 mt-1.5 flex gap-[2px]">
        {data.map((d, i) => (
          <span key={d.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[11px] text-slate-400">
            {i % labelEvery === 0 || i === data.length - 1 ? d.short : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

function Delta({ now, before, previous }) {
  if (!previous) return null;
  if (before === 0) {
    return now > 0 ? <p className="mt-1 text-sm font-medium text-emerald-200">Nouvo konpare ak {previous}</p> : null;
  }
  const change = Math.round(((now - before) / before) * 100);
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${up ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/25 text-red-100"}`}>
        <Icon className="h-4 w-4" /> {up ? "+" : ""}{change}%
      </span>
      <span className="text-sky-100/80">konpare ak {previous}</span>
    </p>
  );
}

function Stat({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-2 truncate text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

function Alert({ count, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-amber-50 p-3 text-left ring-1 ring-amber-200 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/30">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white"><Clock className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold leading-tight text-slate-900 dark:text-white">{count}</span>
        <span className="block text-xs font-semibold leading-tight text-amber-800 dark:text-amber-200">{label}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" />
    </button>
  );
}

export default function AdminDashboard({ orders, deposits, profiles, visits, onGo }) {
  const [periodId, setPeriodId] = useState("7d");
  const [showTable, setShowTable] = useState(false);
  const period = PERIODS.find((p) => p.id === periodId);

  const stats = useMemo(() => {
    const keys = lastDays(period.days * (period.previous ? 2 : 1));
    const days = keys.slice(-period.days);
    const before = new Set(period.previous ? keys.slice(0, period.days) : []);
    const inDays = new Set(days);
    const valid = orders.filter(sold);
    const current = valid.filter((o) => inDays.has(dayKey(o.created_at)));
    const previous = valid.filter((o) => before.has(dayKey(o.created_at)));
    const users = Object.values(profiles);

    const byDay = Object.fromEntries(days.map((d) => [d, { orders: 0, revenue: 0 }]));
    current.forEach((o) => {
      const d = byDay[dayKey(o.created_at)];
      d.orders += 1;
      d.revenue += Number(o.price);
    });

    const products = new Map();
    current.forEach((o) => {
      const p = products.get(o.product_name) || { name: o.product_name, revenue: 0, count: 0 };
      p.revenue += Number(o.price);
      p.count += 1;
      products.set(o.product_name, p);
    });

    const revenue = sum(current, (o) => o.price);
    const visitors = sum(days, (d) => visits[d]);
    return {
      days,
      byDay,
      current,
      revenue,
      revenueBefore: sum(previous, (o) => o.price),
      count: current.length,
      visitors,
      newCustomers: users.filter((u) => inDays.has(dayKey(u.created_at))).length,
      deposited: sum(deposits.filter((d) => d.status === "completed" && inDays.has(dayKey(d.updated_at))), (d) => d.amount),
      average: current.length ? Math.round(revenue / current.length) : 0,
      conversion: visitors ? (current.length / visitors) * 100 : null,
      top: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      customers: users.length,
      walletTotal: sum(users, (u) => u.balance),
    };
  }, [orders, deposits, profiles, visits, period]);

  // Jodi a: lavant pa lè. Plizyè jou: lavant ak vizitè pa jou.
  const salesChart = periodId === "today"
    ? Array.from({ length: 24 }, (_, h) => ({
        key: h,
        short: `${h}h`,
        full: `Jodi a, ${h}h–${h + 1}h`,
        value: sum(stats.current.filter((o) => Number(HOUR.format(new Date(o.created_at))) === h), (o) => o.price),
      }))
    : stats.days.map((d) => ({
        key: d,
        short: period.days <= 7 ? WEEKDAY.format(asDate(d)) : DAY_MONTH.format(asDate(d)),
        full: FULL_DAY.format(asDate(d)),
        value: stats.byDay[d].revenue,
      }));
  const visitsChart = stats.days.map((d) => ({
    key: d,
    short: period.days <= 7 ? WEEKDAY.format(asDate(d)) : DAY_MONTH.format(asDate(d)),
    full: FULL_DAY.format(asDate(d)),
    value: visits[d] || 0,
  }));
  const labelEvery = periodId === "today" ? 6 : period.days <= 7 ? 1 : 7;

  const openOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const topMax = stats.top[0]?.revenue || 1;

  return (
    <div className="space-y-4">
      <Chips options={PERIODS} value={periodId} onChange={setPeriodId} label="Peryòd" />

      {/* Chif prensipal la */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b2547] to-sky-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/25 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[.16em] text-sky-200/80">Lavant · {period.label}</p>
        <p className="relative mt-2 text-[44px] font-extrabold leading-none">
          {number.format(stats.revenue)} <span className="text-lg font-semibold text-sky-200">HTG</span>
        </p>
        <div className="relative"><Delta now={stats.revenue} before={stats.revenueBefore} previous={period.previous} /></div>
      </section>

      {(openOrders > 0 || pendingDeposits > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {openOrders > 0 && <Alert count={openOrders} label="kòmand pou trete" onClick={() => onGo("orders")} />}
          {pendingDeposits > 0 && <Alert count={pendingDeposits} label="depo pou verifye" onClick={() => onGo("deposits")} />}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={ShoppingBag} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" label="Kòmand" value={number.format(stats.count)} sub="san sa ki refize yo" />
        <Stat icon={Users} tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" label="Vizitè" value={number.format(stats.visitors)} sub="1 pa telefòn pa jou" />
        <Stat icon={UserPlus} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" label="Nouvo kliyan" value={number.format(stats.newCustomers)} sub={`${number.format(stats.customers)} kliyan an tout`} />
        <Stat icon={ArrowDownLeft} tone="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" label="Depo konfime" value={formatPrice(stats.deposited)} />
        <Stat icon={ReceiptText} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" label="Panye mwayen" value={stats.count ? formatPrice(stats.average) : "—"} sub="pa kòmand" />
        <Stat icon={Percent} tone="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" label="Konvèsyon" value={stats.conversion == null ? "—" : `${stats.conversion.toFixed(1)}%`} sub="kòmand / vizitè" />
      </div>

      <Card title={periodId === "today" ? "Lavant pa lè (HTG)" : "Lavant pa jou (HTG)"}>
        <ColumnChart data={salesChart} format={formatPrice} labelEvery={labelEvery} label="Lavant" />
      </Card>

      {periodId !== "today" && (
        <Card title="Vizitè pa jou">
          <ColumnChart data={visitsChart} format={(v) => `${number.format(v)} vizitè`} labelEvery={labelEvery} label="Vizitè" />
        </Card>
      )}

      <Card
        title="Chif pa jou"
        action={
          <button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400">
            <Table2 className="h-4 w-4" /> {showTable ? "Kache" : "Montre"}
          </button>
        }
      >
        {showTable ? (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                  <th className="px-1 py-2 font-semibold">Jou</th>
                  <th className="px-1 py-2 text-right font-semibold">Kòmand</th>
                  <th className="px-1 py-2 text-right font-semibold">Lavant</th>
                  <th className="px-1 py-2 text-right font-semibold">Vizitè</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums dark:divide-slate-800">
                {[...stats.days].reverse().map((d) => (
                  <tr key={d}>
                    <td className="whitespace-nowrap px-1 py-2 text-slate-700 dark:text-slate-300">{DAY_MONTH.format(asDate(d))}</td>
                    <td className="px-1 py-2 text-right">{stats.byDay[d].orders}</td>
                    <td className="whitespace-nowrap px-1 py-2 text-right font-semibold text-slate-900 dark:text-white">{number.format(stats.byDay[d].revenue)}</td>
                    <td className="px-1 py-2 text-right">{visits[d] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Kòmand, lavant ak vizitè chak jou nan yon tablo.</p>
        )}
      </Card>

      <Card title="Pwodwi ki vann plis">
        {stats.top.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Pa gen vant nan peryòd sa a.</p>
        ) : (
          <ul className="space-y-3">
            {stats.top.map((p) => (
              <li key={p.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold text-slate-900 dark:text-white">{p.name}</span>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400"><b className="text-slate-900 dark:text-white">{formatPrice(p.revenue)}</b> · {p.count}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-sky-600 dark:bg-sky-400" style={{ width: `${(p.revenue / topMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Wallet kliyan yo">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"><Wallet className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatPrice(stats.walletTotal)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Kòb kliyan yo genyen nan Wallet yo kounye a (ou dwe ba yo sèvis pou li)</p>
          </div>
        </div>
      </Card>

      <p className="px-1 text-xs text-slate-400">Estatistik yo kalkile sou 31 dènye jou yo, ak lè Ayiti.</p>
    </div>
  );
}
