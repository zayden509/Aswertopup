import React, { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowUpDown, ReceiptText, Info, Layers, User, AtSign, Wallet, Plus, LogIn, ShoppingCart, Loader2,
  CheckCircle2, AlertTriangle, ShieldCheck, Package, CreditCard, Hash, MessageCircle,
} from "lucide-react";
import { PAYMENT_METHODS } from "./data.js";
import { backend, errorText } from "./backend.js";
import { Sheet, StepCard, ProductArt, WhatsAppIcon, ErrorNote, formatPrice, waLink } from "./ui.jsx";
import { quote, amountForBudget, tierRanges } from "./exchange.js";
import { newOrderId, orderMessage } from "./orders.js";

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const digits = (v) => v.replace(/\D/g, "").slice(0, 9);

// Bouyon fòm nan (kont ak non) rete sou telefòn nan pou chak pwodwi
function useDraft(productId) {
  const key = `aswer-exchange-${productId}`;
  const [draft, setDraft] = useState(() => {
    try {
      return { account: "", name: "", ...JSON.parse(localStorage.getItem(key) || "{}") };
    } catch {
      return { account: "", name: "" };
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(draft)); } catch {}
  }, [key, draft]);
  return [draft, (field, value) => setDraft((d) => ({ ...d, [field]: value }))];
}

function TextField({ id, label, icon: Icon, value, onChange, placeholder, autoComplete, valid }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block font-semibold text-slate-800 dark:text-slate-200">{label}</span>
      <span className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-4 transition focus-within:border-sky-400 dark:bg-slate-950 ${valid ? "border-emerald-400" : "border-slate-200 dark:border-slate-700"}`}>
        <Icon className="h-5 w-5 shrink-0 text-slate-400" />
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} maxLength={120} className="w-full bg-transparent py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white" />
        {valid && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
      </span>
    </label>
  );
}

// Yon bwat montan: "Ou resevwa" oswa "Ou peye", ak chip lajan an
function AmountBox({ id, label, value, onChange, chip }) {
  return (
    <label htmlFor={id} className="block rounded-2xl bg-slate-900/[.04] p-4 ring-1 ring-slate-200 transition focus-within:ring-2 focus-within:ring-sky-400 dark:bg-white/[.04] dark:ring-slate-700">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="mt-1 flex items-center gap-3">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(digits(e.target.value))}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-3xl font-extrabold tabular-nums text-slate-900 placeholder:text-slate-300 focus:outline-none dark:text-white dark:placeholder:text-slate-600"
        />
        {chip}
      </span>
    </label>
  );
}

function FeeSheet({ config, onClose }) {
  return (
    <Sheet open onClose={onClose} title="Frè yo" icon={<ReceiptText className="h-6 w-6" />}>
      <p className="text-sm text-slate-500 dark:text-slate-400">Frè a ajoute sou montan ou resevwa a. Li deja kalkile nan total ou peye a.</p>
      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="flex items-center justify-between bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"><Layers className="h-4 w-4 text-violet-500" /> Frè {config.currency}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{config.tiers.length} palye</span>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {tierRanges(config).map((t) => (
            <li key={t.to} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{number.format(t.from)} – {number.format(t.to)} {config.currency}</span>
              <span className="h-px flex-1 border-t border-dotted border-slate-300 dark:border-slate-700" />
              <span className="text-right">
                <span className="block font-bold tabular-nums text-slate-900 dark:text-white">{number.format(t.fee)} {config.currency}</span>
                <span className="block text-xs tabular-nums text-slate-400">≈ {formatPrice(Math.ceil(t.fee * config.rate))}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Pi wo pase dènye palye a, dènye frè a aplike.</p>
    </Sheet>
  );
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="flex items-center gap-3 text-slate-500 dark:text-slate-400"><Icon className="h-5 w-5" strokeWidth={1.75} /> {label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-slate-900 dark:text-white">{children}</dd>
    </div>
  );
}

export default function ExchangePage({ product, account, onBack, onOrder, onLogin, onDeposit, onViewOrders }) {
  const walletMode = account.enabled;
  const live = account.catalog.exchange?.[product.id];
  // San baz done (mòd WhatsApp), nou sèvi ak to ki nan data.js. Avèk baz done, admin nan dwe aktive l.
  const config = walletMode ? { ...product.exchange, ...live, available: Boolean(live?.available) } : { ...product.exchange, available: true };
  const [draft, setField] = useDraft(product.id);
  const [receive, setReceive] = useState("");
  const [pay, setPay] = useState("");
  const [edited, setEdited] = useState("receive");
  const [flipped, setFlipped] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);
  const [waId, setWaId] = useState(null);

  // Montan an soti nan bwat kliyan an ekri a; lòt bwat la kalkile
  const typed = Number(edited === "receive" ? receive : pay) || 0;
  const amount = edited === "receive" ? typed : amountForBudget(config, typed);
  const inRange = amount >= config.min && amount <= config.max;
  const q = inRange ? quote(config, amount) : null;
  const receiveValue = edited === "receive" ? receive : amount ? String(amount) : "";
  const payValue = edited === "pay" ? pay : q ? String(q.price) : "";

  const accountOk = draft.account.trim().length >= 3;
  const nameOk = draft.name.trim().length >= 2;
  const loggedIn = Boolean(account.user);
  const balance = Number(account.profile?.balance ?? 0);
  const missing = q ? Math.max(0, q.price - balance) : 0;

  let hint = null;
  if (typed && edited === "receive" && amount > config.max) hint = `Maksimòm ${number.format(config.max)} ${config.currency} pa kòmand.`;
  else if (typed && !q) hint = edited === "pay" ? `Montan sa a pa ase pou minimòm lan (${number.format(config.min)} ${config.currency} + frè).` : `Minimòm ${number.format(config.min)} ${config.currency}.`;

  let action = { text: "Acheter", run: () => { setError(""); setWaId(newOrderId()); setConfirming(true); } };
  if (!config.available) action = { text: "Pa disponib", run: null };
  else if (!accountOk || !nameOk) action = { text: "Ranpli fòm nan", run: null };
  else if (!q) action = { text: "Chwazi montan an", run: null };
  else if (walletMode && !loggedIn) action = { text: "Konekte pou achte", icon: LogIn, run: () => onLogin("login") };
  else if (walletMode && missing > 0) action = { text: "Ajouter de l'argent", icon: Plus, run: onDeposit };

  const recipient = { account: draft.account.trim(), name: draft.name.trim() };
  const waOrder = !walletMode && q && waId && {
    id: waId,
    productId: product.id,
    product: product.name,
    package: `${q.amount} ${config.currency} (frè ${q.fee} ${config.currency})`,
    price: q.price,
    priceText: formatPrice(q.price),
    account: recipient.account,
    accountName: recipient.name,
    payment: (PAYMENT_METHODS.find((m) => m.recommended) || PAYMENT_METHODS[0]).name,
    date: Date.now(),
  };

  const placeOrder = async () => {
    setBusy(true);
    setError("");
    try {
      setPlaced(await backend.placeExchangeOrder(product.id, q.amount, recipient));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const closeConfirm = () => {
    setConfirming(false);
    setPlaced(null);
    setError("");
  };

  const swap = () => {
    setFlipped((f) => !f);
    setTimeout(() => document.getElementById(flipped ? "ex-receive" : "ex-pay")?.focus(), 0);
  };

  const receiveBox = (
    <AmountBox
      id="ex-receive"
      label="Ou resevwa"
      value={receiveValue}
      onChange={(v) => { setEdited("receive"); setReceive(v); }}
      chip={
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700">
          <ProductArt product={product} className="relative h-8 w-8 rounded-full" /> {config.currency}
        </span>
      }
    />
  );
  const payBox = (
    <AmountBox
      id="ex-pay"
      label="Ou peye"
      value={payValue}
      onChange={(v) => { setEdited("pay"); setPay(v); }}
      chip={
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-500 text-[10px] font-black text-white">HTG</span> HTG
        </span>
      }
    />
  );

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-xl py-1 font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Retounen
      </button>

      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-lg">
        <ProductArt product={product} className="absolute inset-0 scale-125 opacity-50 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/75 to-slate-950/30" />
        <div className="relative flex items-center gap-4">
          <ProductArt product={product} className="relative h-24 w-24 shrink-0 rounded-2xl shadow-xl ring-2 ring-white/20" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-300">{product.category}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight [text-wrap:balance]">{product.name}</h1>
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/15">
              1 {config.currency} = <span className="text-sky-300">{number.format(config.rate)}</span> HTG
            </p>
          </div>
        </div>
      </section>

      {!config.available && (
        <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            {product.name} pa disponib sou sit la kounye a.{" "}
            <a href={waLink(`Bonjou Awens Topup, mwen bezwen ${product.name}.`)} target="_blank" rel="noopener noreferrer" className="font-bold underline">Ekri nou sou WhatsApp</a>.
          </span>
        </p>
      )}

      <StepCard step={1} title="Enfòmasyon kont ou">
        <div className="space-y-4">
          <TextField id="ex-account" label={config.account.label} icon={AtSign} value={draft.account} onChange={(v) => setField("account", v)} placeholder={config.account.placeholder} autoComplete="off" valid={accountOk} />
          <TextField id="ex-name" label="Non ki sou kont lan" icon={User} value={draft.name} onChange={(v) => setField("name", v)} placeholder="Jean Baptiste" autoComplete="name" valid={nameOk} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Verifye enfòmasyon yo byen: se sou kont sa a n ap voye kòb la. Bouyon ou rete sove menm si ou kite paj la.</p>
        </div>
      </StepCard>

      <StepCard step={2} title="Chwazi montan an">
        <div className="rounded-3xl bg-gradient-to-b from-sky-50 to-white p-4 ring-1 ring-sky-100 dark:from-sky-500/[.08] dark:to-slate-900 dark:ring-sky-500/20">
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            To du jou <Info className="h-4 w-4" aria-hidden="true" />
          </p>
          <p className="mt-0.5 text-center text-lg font-extrabold text-slate-900 dark:text-white">
            1 {config.currency} = <span className="text-sky-500">{number.format(config.rate)}</span> HTG
          </p>

          <div className="relative mt-4 space-y-2">
            {flipped ? payBox : receiveBox}
            <button
              type="button"
              onClick={swap}
              aria-label="Chanje lòd bwat yo"
              className="absolute left-1/2 top-1/2 z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30 ring-4 ring-white transition active:scale-90 dark:ring-slate-900"
            >
              <ArrowUpDown className="h-5 w-5" />
            </button>
            {flipped ? receiveBox : payBox}
          </div>

          {hint && <p className="mt-3 text-center text-sm font-medium text-red-500">{hint}</p>}

          {q && (
            <dl className="mt-4 space-y-1.5 rounded-2xl bg-white p-3.5 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Montan</dt><dd className="font-semibold tabular-nums">{number.format(q.amount)} {config.currency}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Frè</dt><dd className="font-semibold tabular-nums">+ {number.format(q.fee)} {config.currency}</dd></div>
              <div className="flex justify-between gap-3 border-t border-slate-100 pt-1.5 dark:border-slate-800"><dt className="font-semibold text-slate-700 dark:text-slate-200">Total pou peye</dt><dd className="font-extrabold tabular-nums text-sky-600 dark:text-sky-400">{formatPrice(q.price)}</dd></div>
            </dl>
          )}

          <button type="button" onClick={() => setShowFees(true)} className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-sky-300 dark:bg-slate-800">
            <ReceiptText className="h-4 w-4" /> Wè frè yo
          </button>
        </div>
      </StepCard>

      <StepCard step={3} title="Paiement">
        {walletMode ? (
          loggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border-2 border-sky-500 bg-sky-50 p-3 dark:bg-sky-500/10">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white"><Wallet className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">Solde du compte</span>
                  <span className="block text-sm tabular-nums text-slate-500 dark:text-slate-400">{formatPrice(balance)} disponib</span>
                </span>
                <button type="button" onClick={onDeposit} className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-bold text-sky-600 ring-1 ring-sky-200 dark:bg-slate-900 dark:text-sky-300 dark:ring-sky-500/30">
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
              </div>
              {q && missing > 0 && (
                <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5 shrink-0" /> Ou bezwen {formatPrice(missing)} ankò. Ajoute kòb ak MonCash oswa NatCash.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
              <p className="text-slate-600 dark:text-slate-300">Konekte pou w peye ak Solde Wallet ou.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onLogin("login")} className="rounded-xl bg-sky-500 py-2.5 font-bold text-white">Konekte</button>
                <button type="button" onClick={() => onLogin("signup")} className="rounded-xl bg-white py-2.5 font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">Kreye kont</button>
              </div>
            </div>
          )
        ) : (
          <p className="flex gap-3 rounded-2xl bg-sky-50 p-3.5 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
            <MessageCircle className="h-5 w-5 shrink-0 text-sky-500" /> Kòmand lan ale sou WhatsApp: ekip la ap ba w enstriksyon pou peye ak MonCash oswa NatCash.
          </p>
        )}
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Si nou pa ka voye kòb la, li retounen nan Wallet ou.</p>
      </StepCard>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/[.97] dark:border-slate-800 dark:bg-slate-900/[.97]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 pt-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{q ? `${number.format(q.amount)} ${config.currency} + frè` : "Total"}</p>
            <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{q ? formatPrice(q.price) : "—"}</p>
          </div>
          <button
            type="button"
            disabled={!action.run}
            onClick={action.run || undefined}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
          >
            {React.createElement(action.icon || ShoppingCart, { className: "h-5 w-5" })} {action.text}
          </button>
        </div>
      </div>

      {showFees && <FeeSheet config={config} onClose={() => setShowFees(false)} />}

      <Sheet
        open={confirming && Boolean(q)}
        onClose={closeConfirm}
        title={placed ? "Kòmand pase" : "Confirmer l'achat"}
        footer={
          placed ? null : walletMode ? (
            <button type="button" onClick={placeOrder} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />} Confirmer l'achat
            </button>
          ) : (
            waOrder && (
              <a href={waLink(orderMessage(waOrder))} target="_blank" rel="noopener noreferrer" onClick={() => { onOrder(waOrder); setConfirming(false); }} className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white">
                <WhatsAppIcon className="h-5 w-5" /> Konfime sou WhatsApp
              </a>
            )
          )
        }
      >
        {q && placed ? (
          <div className="py-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15"><CheckCircle2 className="h-9 w-9 text-emerald-500" /></span>
            <h4 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Kòmand {placed.code} pase!</h4>
            <p className="mx-auto mt-2 max-w-sm text-slate-500 dark:text-slate-400">
              {formatPrice(placed.price)} soti nan Wallet ou. N ap voye {placed.package_label} sou {placed.recipient.account} epi w ap resevwa yon notifikasyon.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={closeConfirm} className="rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Fèmen</button>
              <button type="button" onClick={onViewOrders} className="rounded-2xl bg-sky-500 py-3.5 font-bold text-white hover:bg-sky-600">Wè kòmand mwen</button>
            </div>
          </div>
        ) : q ? (
          <>
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
              <ProductArt product={product} className="relative h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">Ou resevwa {number.format(q.amount)} {config.currency}</p>
                <p className="text-2xl font-extrabold tabular-nums text-sky-500">{formatPrice(q.price)}</p>
              </div>
            </div>
            <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              <Row icon={Package} label="Pwodwi">{product.name}</Row>
              <Row icon={AtSign} label="Kont">{recipient.account}</Row>
              <Row icon={User} label="Non">{recipient.name}</Row>
              <Row icon={Layers} label="Frè">{number.format(q.fee)} {config.currency}</Row>
              <Row icon={ArrowUpDown} label="To">1 {config.currency} = {number.format(config.rate)} HTG</Row>
              {walletMode ? (
                <Row icon={Wallet} label="Solde apre acha"><span className="tabular-nums">{formatPrice(balance - q.price)}</span></Row>
              ) : (
                <>
                  <Row icon={CreditCard} label="Paiement">MonCash · NatCash</Row>
                  <Row icon={Hash} label="Kòmand"><span className="tabular-nums">{waId}</span></Row>
                </>
              )}
            </dl>
            <ErrorNote>{error}</ErrorNote>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
