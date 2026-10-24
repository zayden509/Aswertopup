import React, { useState } from "react";
import {
  ArrowLeft, Info, CheckCircle2, Flame, ShoppingCart, User, CreditCard, Package, Hash, MessageCircle,
  ShieldCheck, Wallet, Plus, Loader2, AlertTriangle, LogIn,
} from "lucide-react";
import { PAYMENT_METHODS } from "./data.js";
import { backend, errorText } from "./backend.js";
import { Sheet, StepCard, ProductArt, GemIcon, WhatsAppIcon, ErrorNote, formatPrice, packageName, waLink } from "./ui.jsx";
import { loadPlayerId, savePlayerId, newOrderId, orderMessage } from "./orders.js";

const ID_PATTERN = /^\d{6,15}$/;

function GroupTitle({ group }) {
  if (group.style === "deal") {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-50 to-transparent px-4 py-3 ring-1 ring-orange-100 dark:from-orange-500/10 dark:ring-orange-500/20">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-bold text-orange-500">{group.title}</h3>
      </div>
    );
  }
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {group.style === "offer" ? <Package className="h-4 w-4 text-sky-500" /> : <GemIcon className="h-4 w-4" />} {group.title}
    </h3>
  );
}

function GemOption({ item, active, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition active:scale-[.98] ${
        active ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 bg-white hover:border-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500/40"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <GemIcon className="h-8 w-8 shrink-0" />
        <span>
          <span className="block text-xl font-bold tabular-nums leading-none text-slate-900 dark:text-white">{item.label}</span>
          {item.bonus ? <span className="mt-1 block text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{item.bonus} bonus</span> : null}
        </span>
      </span>
      <span className="rounded-lg bg-sky-50 py-1.5 text-center text-sm font-bold tracking-wide text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20">
        {formatPrice(item.price)}
      </span>
      {active && <CheckCircle2 className="absolute right-2.5 top-2.5 h-5 w-5 text-sky-500" />}
    </button>
  );
}

// Pake admin nan ajoute nan Panneau admin: non an ak pri a
function OfferOption({ item, active, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`relative flex min-h-[104px] flex-col justify-between gap-3 rounded-2xl border-2 p-4 text-left transition active:scale-[.98] ${
        active ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 bg-white hover:border-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500/40"
      }`}
    >
      <span className="pr-6 font-bold leading-tight text-slate-900 [overflow-wrap:anywhere] dark:text-white">{item.label}</span>
      <span className="rounded-lg bg-sky-50 py-1.5 text-center text-sm font-bold tracking-wide text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20">
        {formatPrice(item.price)}
      </span>
      {active && <CheckCircle2 className="absolute right-2.5 top-2.5 h-5 w-5 text-sky-500" />}
    </button>
  );
}

const OPTIONS = { gem: GemOption, deal: DealOption, offer: OfferOption };

function DealOption({ item, active, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-slate-900 to-[#1f1209] p-4 text-center text-white transition active:scale-[.98] ${
        active ? "border-orange-400 shadow-lg shadow-orange-500/20" : "border-orange-950 hover:border-orange-500/60"
      }`}
    >
      <span className="mt-1 grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-400/30">
        <item.Icon className="h-7 w-7 text-orange-300" strokeWidth={1.75} />
      </span>
      <span className="flex min-h-[2.5rem] items-center text-sm font-bold leading-tight">{item.label}</span>
      <span className="text-base font-bold tabular-nums text-orange-300">{formatPrice(item.price)}</span>
      {active && <CheckCircle2 className="absolute right-2.5 top-2.5 h-5 w-5 text-orange-400" />}
    </button>
  );
}

function SummaryRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <Icon className="h-5 w-5" strokeWidth={1.75} /> {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-medium text-slate-900 dark:text-white">{children}</dd>
    </div>
  );
}

// Pri ak disponiblite ki nan baz done a ranplase sa ki nan data.js
function withLivePrices(groups, prices) {
  return groups
    .map((g) => ({
      ...g,
      items: g.items
        .map((it) => ({ ...it, price: prices[it.id]?.price ?? it.price, available: prices[it.id]?.available ?? true }))
        .filter((it) => it.available),
    }))
    .filter((g) => g.items.length > 0);
}

export default function ProductPage({ product, account, onBack, onOrder, onLogin, onDeposit, onViewOrders }) {
  const walletMode = account.enabled; // kont + Wallet (Firebase) olye WhatsApp
  const groups = withLivePrices(product.groups || [], account.prices);
  const [playerId, setPlayerId] = useState(() => (product.playerId ? loadPlayerId() : ""));
  const [showIdHelp, setShowIdHelp] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [paymentId, setPaymentId] = useState(() => (PAYMENT_METHODS.find((m) => m.recommended) || PAYMENT_METHODS[0]).id);
  const [confirming, setConfirming] = useState(false);
  const [orderId, setOrderId] = useState(null); // nimewo kòmand mòd WhatsApp la
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);

  const group = groups.find((g) => g.items.some((it) => it.id === selectedId)) || null;
  const item = group?.items.find((it) => it.id === selectedId) || null;
  const payment = PAYMENT_METHODS.find((m) => m.id === paymentId);
  const id = playerId.trim();
  const idValid = ID_PATTERN.test(id);
  const idError = id !== "" && !idValid;
  const idMissing = Boolean(item?.needsId) && id === "";
  const someNeedId = groups.some((g) => g.items.some((i) => i.needsId));
  const allNeedId = groups.every((g) => g.items.every((i) => i.needsId));
  const loggedIn = Boolean(account.user);
  const balance = Number(account.profile?.balance ?? 0);
  const missing = item ? Math.max(0, item.price - balance) : 0;

  // Bouton anba a: li di kliyan an egzakteman sa k manke
  let action = { text: "Acheter", run: () => { setError(""); setOrderId(newOrderId()); setConfirming(true); } };
  if (!item) action = { text: "Chwazi yon pake", run: null };
  else if (idMissing) action = { text: "Mete Player ID ou", run: null };
  else if (idError) action = { text: "Korije Player ID a", run: null };
  else if (walletMode && !loggedIn) action = { text: "Konekte pou achte", icon: LogIn, run: () => onLogin("login") };
  else if (walletMode && missing > 0) action = { text: "Ajouter de l'argent", icon: Plus, run: onDeposit };

  // Mòd WhatsApp (pa gen baz done)
  const waOrder = !walletMode && item && orderId && {
    id: orderId,
    productId: product.id,
    product: product.name,
    package: `${packageName(item)} (${group.title})`,
    price: item.price,
    priceText: formatPrice(item.price),
    playerId: id,
    payment: payment.name,
    date: Date.now(),
  };

  const confirmWhatsApp = () => {
    if (id) savePlayerId(id);
    onOrder(waOrder);
    setConfirming(false);
  };

  // Mòd Wallet: sèvè a tcheke pri a ak solde a, epi li retire kòb la
  const placeOrder = async () => {
    setBusy(true);
    setError("");
    try {
      const order = await backend.placeOrder(item.id, id || null);
      if (id) savePlayerId(id);
      setPlaced(order);
      // Si pake a otomatik (FazerCards), sèvè a voye l touswit; sinon admin nan trete l
      backend.requestAutoDelivery(order.id);
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

  const confirmFooter = walletMode ? (
    placed ? null : (
      <button
        type="button"
        onClick={placeOrder}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />} Confirmer l'achat
      </button>
    )
  ) : (
    waOrder && (
      <a
        href={waLink(orderMessage(waOrder))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={confirmWhatsApp}
        className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
      >
        <ShoppingCart className="h-5 w-5" /> Confirmer l'achat
      </a>
    )
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 rounded-xl py-1 font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" /> Retounen
      </button>

      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-lg">
        <ProductArt product={product} className="absolute inset-0 scale-125 opacity-60 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/70 to-slate-950/20" />
        <div className="relative flex items-center gap-4">
          <ProductArt product={product} className="relative h-24 w-24 shrink-0 rounded-2xl shadow-xl ring-2 ring-white/20" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-300">{product.category}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight [text-wrap:balance]">{product.name}</h1>
            <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> MonCash · NatCash
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-300" /> Sipò WhatsApp
              </span>
            </div>
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pri yo poko sou sit la</h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-500 dark:text-slate-400">
            Ekri nou sou WhatsApp, n ap ba w pri yo ak tout opsyon ki disponib pou {product.name}.
          </p>
          <a
            href={waLink(`Bonjou Awens Topup, mwen vle achte ${product.name}. Ki pri yo ye?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-bold text-white hover:brightness-95"
          >
            <WhatsAppIcon className="h-5 w-5" /> Mande pri yo
          </a>
        </section>
      ) : (
        <>
          {product.playerId && (
            <StepCard step={1} title="Vos informations">
              <div className="mb-2 flex items-center gap-1.5">
                <label htmlFor="player-id" className="font-semibold text-slate-800 dark:text-slate-200">Player ID (UID)</label>
                <button
                  type="button"
                  onClick={() => setShowIdHelp((v) => !v)}
                  aria-expanded={showIdHelp}
                  aria-label="Kijan pou m jwenn UID mwen?"
                  className="grid h-7 w-7 place-items-center rounded-full text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
              {showIdHelp && (
                <p className="mb-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-900 dark:bg-violet-500/10 dark:text-violet-200">{product.playerIdHelp}</p>
              )}
              <div
                className={`flex items-center gap-2 rounded-2xl border-2 bg-white px-4 transition focus-within:border-sky-400 dark:bg-slate-950 ${
                  idError ? "border-red-400" : idValid ? "border-emerald-400" : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <input
                  id="player-id"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ex: 1247665343"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ""))}
                  aria-invalid={idError || idMissing}
                  aria-describedby="player-id-hint"
                  className="w-full bg-transparent py-3.5 text-lg tabular-nums tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                />
                {idValid && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
              </div>
              <p id="player-id-hint" className={`mt-2 text-sm ${idError || idMissing ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                {idError
                  ? "UID a dwe gen ant 6 ak 15 chif."
                  : idMissing
                    ? `Mete Player ID ou: li obligatwa pou ${item.label}.`
                    : allNeedId
                      ? "Obligatwa: nou voye kòmand lan sou kont sa a."
                      : someNeedId
                        ? "Obligatwa pou abònman ak pas yo."
                        : "Nou sèvi ak li pou n voye kòmand lan sou bon kont lan."}
              </p>
            </StepCard>
          )}

          <StepCard step={product.playerId ? 2 : 1} title="Choisir votre produit">
            <div className="space-y-6" role="radiogroup" aria-label="Pake">
              {groups.map((g) => (
                <div key={`${g.style}-${g.title}`}>
                  <GroupTitle group={g} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {g.items.map((it) => {
                      const Option = OPTIONS[g.style] || GemOption;
                      return <Option key={it.id} item={it} active={it.id === selectedId} onSelect={() => setSelectedId(it.id)} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </StepCard>

          <StepCard step={product.playerId ? 3 : 2} title={walletMode ? "Paiement" : "Mode de paiement"}>
            {walletMode ? (
              loggedIn ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-sky-500 bg-sky-50 p-3 dark:bg-sky-500/10">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white">
                      <Wallet className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900 dark:text-white">Solde du compte</span>
                      <span className="block text-sm tabular-nums text-slate-500 dark:text-slate-400">{formatPrice(balance)} disponib</span>
                    </span>
                    <button type="button" onClick={onDeposit} className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-bold text-sky-600 ring-1 ring-sky-200 dark:bg-slate-900 dark:text-sky-300 dark:ring-sky-500/30">
                      <Plus className="h-4 w-4" /> Ajouter
                    </button>
                  </div>
                  {item && missing > 0 && (
                    <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      Ou bezwen {formatPrice(missing)} ankò pou pake sa a. Ajoute kòb ak MonCash oswa NatCash.
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
              <div className="space-y-2.5" role="radiogroup" aria-label="Mode de paiement">
                {PAYMENT_METHODS.map((m) => {
                  const active = m.id === paymentId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPaymentId(m.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                        active ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 hover:border-sky-200 dark:border-slate-700"
                      }`}
                    >
                      <img src={m.logo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-bold text-slate-900 dark:text-white">
                          {m.name}
                          {m.recommended && (
                            <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-950">RECOMMANDÉ</span>
                          )}
                        </span>
                        <span className="block text-sm text-slate-500 dark:text-slate-400">{m.note}</span>
                      </span>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${active ? "border-sky-500" : "border-slate-300 dark:border-slate-600"}`}>
                        {active && <span className="h-3 w-3 rounded-full bg-sky-500" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </StepCard>

          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/[.97] dark:border-slate-800 dark:bg-slate-900/[.97]"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 pt-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{item ? packageName(item) : "Total"}</p>
                <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{item ? formatPrice(item.price) : "—"}</p>
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

          <Sheet open={confirming && Boolean(item)} onClose={closeConfirm} title={placed ? "Kòmand pase" : "Confirmer l'achat"} footer={confirmFooter}>
            {item && placed ? (
              <div className="py-4 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </span>
                <h4 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Kòmand {placed.code} pase!</h4>
                <p className="mx-auto mt-2 max-w-sm text-slate-500 dark:text-slate-400">
                  {formatPrice(Number(placed.price))} soti nan Wallet ou. W ap resevwa yon notifikasyon depi kòmand lan livre.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" onClick={closeConfirm} className="rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Kontinye achte</button>
                  <button type="button" onClick={onViewOrders} className="rounded-2xl bg-sky-500 py-3.5 font-bold text-white hover:bg-sky-600">Wè kòmand mwen</button>
                </div>
              </div>
            ) : item ? (
              <>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
                  {group.style === "deal" ? (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-400/30">
                      <item.Icon className="h-7 w-7 text-orange-500" strokeWidth={1.75} />
                    </span>
                  ) : group.style === "offer" ? (
                    <ProductArt product={product} className="relative h-14 w-14 shrink-0 rounded-2xl" />
                  ) : (
                    <GemIcon className="h-14 w-14 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{packageName(item)}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-sky-500">{formatPrice(item.price)}</p>
                  </div>
                </div>
                <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <SummaryRow icon={Package} label="Produit">{product.name}</SummaryRow>
                  {id && <SummaryRow icon={User} label="Player ID"><span className="tabular-nums">{id}</span></SummaryRow>}
                  {walletMode ? (
                    <>
                      <SummaryRow icon={CreditCard} label="Paiement">Solde</SummaryRow>
                      <SummaryRow icon={Wallet} label="Solde apre acha">
                        <span className="tabular-nums">{formatPrice(balance - item.price)}</span>
                      </SummaryRow>
                    </>
                  ) : (
                    <>
                      <SummaryRow icon={CreditCard} label="Paiement">
                        <span className="inline-flex items-center gap-2">
                          <img src={payment.logo} alt="" className="h-6 w-6 rounded-md object-cover" /> {payment.name}
                        </span>
                      </SummaryRow>
                      <SummaryRow icon={Hash} label="Kòmand"><span className="tabular-nums">{orderId}</span></SummaryRow>
                    </>
                  )}
                </dl>
                {walletMode ? (
                  <ErrorNote>{error}</ErrorNote>
                ) : (
                  <p className="mt-2 flex gap-3 rounded-2xl bg-sky-50 p-3.5 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
                    <MessageCircle className="h-5 w-5 shrink-0 text-sky-500" />
                    <span>
                      Lè w peze "Confirmer l'achat", WhatsApp ap louvri ak kòmand ou deja ekri. Voye mesaj la, epi ekip la ap ba w enstriksyon pou peye ak {payment.name}.
                    </span>
                  </p>
                )}
              </>
            ) : null}
          </Sheet>
        </>
      )}
    </div>
  );
}
