import React, { useEffect, useState } from "react";
import { Plus, Send, ChevronRight, BookOpen, Copy, CheckCircle2, Loader2, Hash, Banknote, UserRound, AlertTriangle, ShieldCheck } from "lucide-react";
import { PAYMENT_METHODS, VIDEO_TUTORIAL_URL } from "./data.js";
import { backend, errorText } from "./backend.js";
import { UserError } from "./errors.js";
import { usePaymentMethods } from "./payments.js";
import { Sheet, ErrorNote, waLink, supportMessage, openExternal, formatPrice, copyText } from "./ui.jsx";

export function Input({ id, label, icon: Icon, hint, ...props }) {
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

// Nimewo Ayiti yo ekri an gwoup pou kliyan an li yo fasil: 43 69 9262
export function formatAccountNumber(number) {
  const d = String(number || "").replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4)}` : d;
}

// Chwa MonCash / NatCash (kat ak bouton radyo). Yon mòd peman san nimewo pa ka chwazi.
export function MethodPicker({ methods, value, onChange }) {
  return (
    <div className="space-y-2.5" role="radiogroup" aria-label="Canal de paiement">
      {methods.map((m) => {
        const active = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!m.number}
            onClick={() => onChange(m.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition disabled:opacity-50 ${
              active ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 bg-white hover:border-sky-200 dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${active ? "border-sky-500" : "border-slate-300 dark:border-slate-600"}`}>
              {active && <span className="h-3 w-3 rounded-full bg-sky-500" />}
            </span>
            <img src={m.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
            <span className="min-w-0 flex-1">
              <span className={`block font-bold ${active ? "text-sky-700 dark:text-sky-300" : "text-slate-900 dark:text-white"}`}>{m.name}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{m.number ? "Canal de paiement" : "Bientôt disponible"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Kont pou kliyan an voye kòb la: non, nimewo (gwo, ak bouton Copier)
export function AccountCard({ method, onToast }) {
  if (!method.number) {
    return (
      <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>
          Nimewo {method.name} nou an poko sou sit la.{" "}
          <a href={waLink(`Bonjou Awens Topup, ki nimewo ${method.name} pou m peye a?`)} target="_blank" rel="noopener noreferrer" className="font-bold underline">
            Mande l sou WhatsApp
          </a>
          .
        </span>
      </p>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-50 py-4 pl-5 pr-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-sky-500" aria-hidden="true" />
      {method.holder && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Nom du compte</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{method.holder}</p>
          <div className="my-3 h-px bg-slate-200 dark:bg-slate-700" />
        </>
      )}
      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Numéro du compte</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="select-all text-2xl font-extrabold tabular-nums tracking-wide text-sky-600 dark:text-sky-400">{formatAccountNumber(method.number)}</span>
        <button
          type="button"
          onClick={() => copyText(method.number, onToast)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-600 ring-1 ring-sky-200 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30"
        >
          <Copy className="h-4 w-4" /> Copier
        </button>
      </div>
    </div>
  );
}

// Etap 1 yon peman dirèk pou yon kòmand: kont pou kliyan an voye kòb la
export function PayTo({ method: picked, amount, onToast }) {
  // Nimewo an dirèk (pwopriyetè a ka chanje l nan Panneau admin → Paramèt)
  const method = usePaymentMethods().find((m) => m.id === picked.id) || picked;
  return (
    <div className="space-y-2">
      <p className="font-bold text-slate-900 dark:text-white">1. Voye {amount ? formatPrice(amount) : "kòb la"} sou {method.name}</p>
      <AccountCard method={method} onToast={onToast} />
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
        href={waLink("Bonjou Awens Topup, mwen gen yon pwoblèm ak depo mwen.")}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-2 text-center text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Mwen gen yon pwoblèm ak depo mwen
      </a>
    </div>
  );
}

// Depo: chwazi MonCash oswa NatCash, voye kòb la sou kont lan, epi valide l ak kòd tranzaksyon an
// Sa kliyan an wè lè sit la pa jwenn peman kòd li a (verifikasyon otomatik)
const CODE_PROBLEMS = {
  "not-found": "Okenn peman nou resevwa pa koresponn ak kòd sa a. Verifye kòd la. Si w fèk voye kòb la, tann 1 minit epi eseye ankò.",
  invalid: "Kòd sa a pa bon. Kopye TransCode a jan li ye nan SMS NatCash/MonCash ou a.",
  phone: "Sa se yon nimewo telefòn. Mete ID tranzaksyon ki nan SMS MonCash/NatCash la.",
  used: "Kòd sa a deja itilize. Yon kòd tranzaksyon sèvi yon sèl fwa.",
  expired: "Peman sa a twò ansyen (plis pase 24 è). Ekri nou sou WhatsApp ak prèv peman an.",
  blocked: "Twòp kòd ki pa bon. Tann 1 è, oswa ekri nou sou WhatsApp.",
};

function CodeProblem({ text }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-2xl bg-red-50 p-3.5 ring-1 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/30">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-lg font-extrabold text-red-600 dark:bg-red-500/20 dark:text-red-300">!</span>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 dark:text-white">Vérification impossible</p>
        <p className="text-sm text-red-700 dark:text-red-300">{text}</p>
      </div>
    </div>
  );
}

// Ki mòd peman sit la verifye otomatikman (SMS)? { natcash: true, moncash: false }. Lòt yo:
// kliyan an mete montan an ak kòd la, epi admin nan konfime. Nou sonje repons lan pou pwochen fwa a.
let depositModes = null;

export function DepositSheet({ initialAmount = "", profile, onClose, onToast }) {
  const methods = usePaymentMethods();
  const [methodId, setMethodId] = useState(() => (methods.find((m) => m.number && m.recommended) || methods.find((m) => m.number) || methods[0]).id);
  const method = methods.find((m) => m.id === methodId) || methods[0];
  const [amount, setAmount] = useState(initialAmount);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);
  const [modes, setModes] = useState(depositModes);
  const [problem, setProblem] = useState("");
  const auto = Boolean(modes?.[method.id]);

  useEffect(() => {
    let stale = false;
    backend.checkDepositCode().then((r) => {
      depositModes = r?.methods || { natcash: Boolean(r?.auto), moncash: Boolean(r?.auto) };
      if (!stale) setModes(depositModes);
    });
    return () => { stale = true; };
  }, []);

  const openTutorial = () => {
    if (VIDEO_TUTORIAL_URL) openExternal(VIDEO_TUTORIAL_URL);
    else onToast("Videyo a poko disponib, li ap vini byento.");
  };

  // Mesaj WhatsApp "Yon pwoblèm?" la ak tout enfòmasyon depo a, pou ekip la jwenn li vit
  const problemLines = ["Bonjou Awens Topup, mwen gen yon pwoblèm ak depo mwen.", "", `Mòd: ${method.name}`];
  if (amount) problemLines.push(`Montan: ${amount} HTG`);
  if (reference.trim()) problemLines.push(`TransCode: ${reference.trim()}`);
  const problemText = problemLines.join("\n");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setProblem("");
    try {
      let order = { amount, method: method.id };
      if (auto) {
        // Sit la tcheke kòd la ak SMS telefòn boutik la: montan an soti nan SMS la
        const found = await backend.checkDepositCode(method.id, reference);
        if (!found) throw new UserError("Nou pa ka verifye kòd la kounye a. Tcheke entènèt ou epi eseye ankò.");
        if (found.auto === false) {
          depositModes = { ...depositModes, [method.id]: false };
          setModes(depositModes);
          throw new UserError("Mete montan ou voye a, epi peze Valider ankò.");
        }
        if (found.status !== "ok") {
          setProblem(CODE_PROBLEMS[found.status] || CODE_PROBLEMS["not-found"]);
          return;
        }
        order = { amount: found.amount, method: found.method };
      }
      const deposit = await backend.requestDeposit({ ...order, reference, senderPhone: null });
      // Si SMS NatCash/MonCash la deja rive sou telefòn boutik la, depo a konfime touswit
      const check = await backend.requestDepositCheck(deposit.id);
      setSent({ ...deposit, confirmed: Boolean(check?.confirmed) });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Faire un dépôt" icon={<Plus className="h-6 w-6" />}>
      {sent ? (
        <Success
          title={sent.confirmed ? `Depo ${formatPrice(Number(sent.amount))} konfime ✅` : `Depo ${formatPrice(Number(sent.amount))} voye!`}
          text={sent.confirmed ? "Kòb la nan Wallet ou kounye a. Ou ka achte touswit." : "N ap verifye peman an. W ap resevwa yon notifikasyon lè kòb la antre nan Wallet ou."}
          onClose={onClose}
        />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <MethodPicker methods={methods} value={method.id} onChange={setMethodId} />
          <AccountCard method={method} onToast={onToast} />

          <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Validation du paiement</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {auto ? `Voye kòb la sou kont anlè a, epi mete kòd tranzaksyon ${method.name} ba ou a. Montan an detekte otomatikman grasa kòd la.` : `Voye kòb la sou kont anlè a, epi mete montan an ak kòd tranzaksyon ${method.name} ba ou a.`}
                </p>
              </div>
            </div>
            {auto && Number(initialAmount) > 0 && (
              <p className="rounded-xl bg-sky-50 px-3.5 py-2.5 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">
                Montan pou voye: <span className="font-bold tabular-nums">{formatPrice(Number(initialAmount))}</span>
              </p>
            )}
            {!auto && <Input id="deposit-amount" label="Montant envoyé (HTG)" icon={Banknote} inputMode="numeric" type="number" min="50" max="100000" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex. 1000" />}
            {problem && <CodeProblem text={problem} />}
            <Input
              id="deposit-reference"
              label="TransCode ou Txn ID"
              icon={Hash}
              required
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
                setProblem("");
              }}
              placeholder="Ex. 26072853633942"
              autoComplete="off"
            />
            <ErrorNote>{error}</ErrorNote>
            <button type="submit" disabled={busy || !method.number} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-60">
              {busy && <Loader2 className="h-5 w-5 animate-spin" />} Valider mon dépôt
            </button>
          </section>

          <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            <button type="button" onClick={openTutorial} className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200">
              <BookOpen className="h-4 w-4" /> Tutoriel de dépôt
            </button>
            <a
              href={waLink(supportMessage(problemText, profile))}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Yon pwoblèm?
            </a>
          </div>
        </form>
      )}
    </Sheet>
  );
}

// `initialCode`: AWENS-ID ki soti nan yon kòd QR (lyen ?pay=)
export function TransferSheet({ profile, initialCode = "", onClose }) {
  const [code, setCode] = useState(initialCode);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(null); // { name } | { missing: true }
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);
  const balance = Number(profile?.balance || 0);
  const value = Number(amount);

  // Chèche non moun nan lè AWENS-ID a konplè
  useEffect(() => {
    setRecipient(null);
    if (code.length !== 8) return;
    let stale = false;
    backend.lookupWallet(code).then(
      (name) => !stale && setRecipient(name ? { name } : { missing: true }),
      () => !stale && setRecipient({ missing: true }),
    );
    return () => { stale = true; };
  }, [code]);

  const canSend = recipient?.name && code !== profile?.wallet_code && Number.isInteger(value) && value >= 10 && value <= balance;

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      setSent(await backend.transferFunds(code, value));
    } catch (err) {
      setError(errorText(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
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
            bay <span className="font-bold text-slate-900 dark:text-white">{recipient.name}</span> (AWENS-ID {code})
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
            label="AWENS-ID moun k ap resevwa a"
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
            <p className="text-sm font-medium text-red-500">Sa se pwòp AWENS-ID ou.</p>
          ) : recipient?.name ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> {recipient.name}</p>
          ) : recipient?.missing ? (
            <p className="text-sm font-medium text-red-500">Nou pa jwenn AWENS-ID sa a.</p>
          ) : null}
          <Input
            id="transfer-amount"
            label="Montan (HTG)"
            icon={Banknote}
            inputMode="numeric"
            type="number"
            min="10"
            step="1"
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
