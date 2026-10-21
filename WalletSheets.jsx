import React, { useEffect, useState } from "react";
import { Plus, Send, ChevronRight, ChevronLeft, BookOpen, Copy, CheckCircle2, Loader2, Hash, Phone, Banknote, UserRound, AlertTriangle } from "lucide-react";
import { PAYMENT_METHODS, VIDEO_TUTORIAL_URL } from "./data.js";
import { supabase, errorText } from "./supabase.js";
import { Sheet, ErrorNote, waLink, openExternal, formatPrice, copyText } from "./ui.jsx";

function Input({ id, label, icon: Icon, hint, ...props }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 transition focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
        <Icon className="h-5 w-5 shrink-0 text-slate-400" />
        <input id={id} className="w-full bg-transparent py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white" {...props} />
      </span>
      {hint && <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}

function Success({ title, text, onClose }) {
  return (
    <div className="py-6 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      </span>
      <h4 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h4>
      <p className="mx-auto mt-2 max-w-sm text-slate-500 dark:text-slate-400">{text}</p>
      <button type="button" onClick={onClose} className="mt-6 rounded-2xl bg-sky-500 px-8 py-3 font-bold text-white hover:bg-sky-600">Fini</button>
    </div>
  );
}

export function MethodList({ onPick, onToast }) {
  const openTutorial = () => {
    if (VIDEO_TUTORIAL_URL) openExternal(VIDEO_TUTORIAL_URL);
    else onToast("Videyo a poko disponib, li ap vini byento.");
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">Choisissez votre moyen de paiement :</p>
      {PAYMENT_METHODS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPick(m)}
          className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition hover:brightness-[.98] ${
            m.recommended ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
          }`}
        >
          <img src={m.logo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold text-slate-900 dark:text-white">{m.name}</span>
            {m.recommended && <span className="mt-1 inline-block rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-emerald-950">RECOMMANDÉ</span>}
            <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{m.note}</span>
          </span>
          <ChevronRight className={`h-6 w-6 shrink-0 ${m.recommended ? "text-emerald-500" : "text-slate-400"}`} />
        </button>
      ))}
      <button type="button" onClick={openTutorial} className="flex w-full items-center gap-4 rounded-2xl border-2 border-sky-100 bg-sky-50/70 p-4 text-left dark:border-sky-500/20 dark:bg-sky-500/10">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-500 dark:bg-sky-500/20"><BookOpen className="h-6 w-6" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-sky-600 dark:text-sky-300">Tutoriel de dépôt</span>
          <span className="block text-sm text-slate-500 dark:text-slate-400">Kijan pou fè yon depo MonCash oswa NatCash</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-sky-500" />
      </button>
      <a
        href={waLink("Bonjou Aswer Top Up, mwen gen yon pwoblèm ak depo mwen.")}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-2 text-center text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Mwen gen yon pwoblèm ak depo mwen
      </a>
    </div>
  );
}

export function DepositSheet({ onClose, onToast }) {
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase.rpc("request_deposit", {
      p_amount: Number(amount),
      p_method: method.id,
      p_reference: reference,
      p_sender_phone: phone || null,
    });
    setBusy(false);
    if (err) setError(errorText(err));
    else setSent(data);
  };

  return (
    <Sheet open onClose={onClose} title="Faire un dépôt" icon={<Plus className="h-6 w-6" />}>
      {sent ? (
        <Success
          title={`Depo ${formatPrice(Number(sent.amount))} voye!`}
          text="N ap verifye peman an. W ap resevwa yon notifikasyon lè kòb la antre nan Wallet ou."
          onClose={onClose}
        />
      ) : !method ? (
        <MethodList onPick={setMethod} onToast={onToast} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <button type="button" onClick={() => setMethod(null)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <ChevronLeft className="h-4 w-4" /> Lòt mòd peman
          </button>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
            <div className="flex items-center gap-3">
              <img src={method.logo} alt="" className="h-11 w-11 rounded-xl object-cover" />
              <p className="font-bold text-slate-900 dark:text-white">1. Voye kòb la sou {method.name}</p>
            </div>
            {method.number ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <span className="select-all text-xl font-bold tabular-nums tracking-wide text-slate-900 dark:text-white">{method.number}</span>
                <button type="button" onClick={() => copyText(method.number, onToast)} className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                  <Copy className="h-4 w-4" /> Kopye
                </button>
              </div>
            ) : (
              <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  Nimewo {method.name} nou an poko sou sit la.{" "}
                  <a href={waLink(`Bonjou Aswer Top Up, ki nimewo ${method.name} pou m fè depo a?`)} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                    Mande l sou WhatsApp
                  </a>
                  .
                </span>
              </p>
            )}
          </div>

          <p className="font-bold text-slate-900 dark:text-white">2. Mete enfòmasyon tranzaksyon an</p>
          <Input id="deposit-amount" label="Montan ou voye a (HTG)" icon={Banknote} inputMode="decimal" type="number" min="50" max="100000" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 1000" />
          <Input
            id="deposit-reference"
            label="ID tranzaksyon an"
            icon={Hash}
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ex: 1234567890"
            autoComplete="off"
            hint={`Nimewo tranzaksyon ki nan mesaj ${method.name} voye ba ou a.`}
          />
          <Input id="deposit-phone" label="Nimewo ou voye kòb la (si w vle)" icon={Phone} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 37000000" autoComplete="tel" />
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-60">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />} Voye depo a
          </button>
        </form>
      )}
    </Sheet>
  );
}

export function TransferSheet({ profile, onClose }) {
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(null); // { name } | { missing: true }
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);
  const balance = Number(profile?.balance || 0);
  const value = Number(amount);

  // Chèche non moun nan lè ASWER-ID a konplè
  useEffect(() => {
    setRecipient(null);
    if (code.length !== 8) return;
    let stale = false;
    supabase.rpc("lookup_wallet", { p_code: code }).then(({ data }) => {
      if (!stale) setRecipient(data ? { name: data } : { missing: true });
    });
    return () => { stale = true; };
  }, [code]);

  const canSend = recipient?.name && code !== profile?.wallet_code && value >= 10 && value <= balance;

  const send = async () => {
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase.rpc("transfer_funds", { p_to_code: code, p_amount: value });
    setBusy(false);
    if (err) {
      setError(errorText(err));
      setConfirming(false);
    } else setSent(data);
  };

  return (
    <Sheet open onClose={onClose} title="Envoyer de l'argent" icon={<Send className="h-6 w-6" />}>
      {sent ? (
        <Success title={`${formatPrice(Number(sent.amount))} voye!`} text={`${recipient.name} resevwa kòb la nan Wallet li kounye a.`} onClose={onClose} />
      ) : confirming ? (
        <div className="space-y-4 py-2 text-center">
          <p className="text-slate-500 dark:text-slate-400">Ou pral voye</p>
          <p className="text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">{formatPrice(value)}</p>
          <p className="text-slate-500 dark:text-slate-400">
            bay <span className="font-bold text-slate-900 dark:text-white">{recipient.name}</span> (ASWER-ID {code})
          </p>
          <ErrorNote>{error}</ErrorNote>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={() => setConfirming(false)} className="rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Anile</button>
            <button type="button" onClick={send} disabled={busy} className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 font-bold text-white hover:bg-sky-600 disabled:opacity-60">
              {busy && <Loader2 className="h-5 w-5 animate-spin" />} Konfime
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (canSend) setConfirming(true); }} className="space-y-4">
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            Solde disponib: <span className="font-bold text-slate-900 dark:text-white">{formatPrice(balance)}</span>
          </p>
          <Input
            id="transfer-code"
            label="ASWER-ID moun k ap resevwa a"
            icon={UserRound}
            required
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="Ex: K7M2QX9P"
          />
          {code === profile?.wallet_code ? (
            <p className="text-sm font-medium text-red-500">Sa se pwòp ASWER-ID ou.</p>
          ) : recipient?.name ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> {recipient.name}</p>
          ) : recipient?.missing ? (
            <p className="text-sm font-medium text-red-500">Nou pa jwenn ASWER-ID sa a.</p>
          ) : null}
          <Input
            id="transfer-amount"
            label="Montan (HTG)"
            icon={Banknote}
            inputMode="decimal"
            type="number"
            min="10"
            step="any"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex: 500"
            hint={value > balance ? "Montan sa a pi gwo pase solde ou." : "Minimòm 10 HTG."}
          />
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" disabled={!canSend} className="w-full rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-400">
            Kontinye
          </button>
        </form>
      )}
    </Sheet>
  );
}
