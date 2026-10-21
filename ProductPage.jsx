import React, { useState } from "react";
import { ArrowLeft, Info, CheckCircle2, Flame, ShoppingCart, User, CreditCard, Package, Hash, MessageCircle, ShieldCheck } from "lucide-react";
import { PAYMENT_METHODS } from "./data.js";
import { Sheet, StepCard, ProductArt, GemIcon, WhatsAppIcon, formatPrice, packageName, waLink } from "./ui.jsx";
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
      <GemIcon className="h-4 w-4" /> {group.title}
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

export default function ProductPage({ product, onBack, onOrder }) {
  const groups = product.groups || [];
  const [playerId, setPlayerId] = useState(() => (product.playerId ? loadPlayerId() : ""));
  const [showIdHelp, setShowIdHelp] = useState(false);
  const [selected, setSelected] = useState(null); // { g, i }
  const [paymentId, setPaymentId] = useState(() => (PAYMENT_METHODS.find((m) => m.recommended) || PAYMENT_METHODS[0]).id);
  const [orderId, setOrderId] = useState(null); // mete lè fenèt konfimasyon an louvri

  const group = selected ? groups[selected.g] : null;
  const item = selected ? group.items[selected.i] : null;
  const payment = PAYMENT_METHODS.find((m) => m.id === paymentId);
  const id = playerId.trim();
  const idValid = ID_PATTERN.test(id);
  const idError = id !== "" && !idValid;
  const idMissing = Boolean(item?.needsId) && id === "";
  const ready = Boolean(item) && !idError && !idMissing;
  const someNeedId = groups.some((g) => g.items.some((i) => i.needsId));

  let buttonText = "Acheter";
  if (!item) buttonText = "Chwazi yon pake";
  else if (idMissing) buttonText = "Mete Player ID ou";
  else if (idError) buttonText = "Korije Player ID a";

  const order = item && orderId && {
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

  const confirmOrder = () => {
    if (id) savePlayerId(id);
    onOrder(order);
    setOrderId(null);
  };

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
            href={waLink(`Bonjou Aswer Top Up, mwen vle achte ${product.name}. Ki pri yo ye?`)}
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
                    : someNeedId
                      ? "Obligatwa pou abònman ak pas yo."
                      : "Nou sèvi ak li pou n voye kòmand lan sou bon kont lan."}
              </p>
            </StepCard>
          )}

          <StepCard step={product.playerId ? 2 : 1} title="Choisir votre produit">
            <div className="space-y-6" role="radiogroup" aria-label="Pake">
              {groups.map((g, gi) => (
                <div key={g.title}>
                  <GroupTitle group={g} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {g.items.map((it, ii) => {
                      const active = selected?.g === gi && selected?.i === ii;
                      const Option = g.style === "deal" ? DealOption : GemOption;
                      return <Option key={it.label} item={it} active={active} onSelect={() => setSelected({ g: gi, i: ii })} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </StepCard>

          <StepCard step={product.playerId ? 3 : 2} title="Mode de paiement">
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
          </StepCard>

          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 pt-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{item ? packageName(item) : "Total"}</p>
                <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{item ? formatPrice(item.price) : "—"}</p>
              </div>
              <button
                type="button"
                disabled={!ready}
                onClick={() => setOrderId(newOrderId())}
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
              >
                <ShoppingCart className="h-5 w-5" /> {buttonText}
              </button>
            </div>
          </div>

          <Sheet
            open={Boolean(order)}
            onClose={() => setOrderId(null)}
            title="Confirmer l'achat"
            footer={
              order && (
                <a
                  href={waLink(orderMessage(order))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={confirmOrder}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
                >
                  <ShoppingCart className="h-5 w-5" /> Confirmer l'achat
                </a>
              )
            }
          >
            {order && (
              <>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
                  {group.style === "deal" ? (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-400/30">
                      <item.Icon className="h-7 w-7 text-orange-500" strokeWidth={1.75} />
                    </span>
                  ) : (
                    <GemIcon className="h-14 w-14 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{packageName(item)}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-sky-500">{order.priceText}</p>
                  </div>
                </div>
                <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <SummaryRow icon={Package} label="Produit">{product.name}</SummaryRow>
                  <SummaryRow icon={CreditCard} label="Paiement">
                    <span className="inline-flex items-center gap-2">
                      <img src={payment.logo} alt="" className="h-6 w-6 rounded-md object-cover" /> {payment.name}
                    </span>
                  </SummaryRow>
                  {order.playerId && <SummaryRow icon={User} label="Player ID"><span className="tabular-nums">{order.playerId}</span></SummaryRow>}
                  <SummaryRow icon={Hash} label="Kòmand"><span className="tabular-nums">{order.id}</span></SummaryRow>
                </dl>
                <p className="mt-2 flex gap-3 rounded-2xl bg-sky-50 p-3.5 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
                  <MessageCircle className="h-5 w-5 shrink-0 text-sky-500" />
                  <span>
                    Lè w peze "Confirmer l'achat", WhatsApp ap louvri ak kòmand ou deja ekri. Voye mesaj la, epi ekip la ap ba w enstriksyon pou peye ak {payment.name}.
                  </span>
                </p>
              </>
            )}
          </Sheet>
        </>
      )}
    </div>
  );
}
