import React, { useState } from "react";
import { Wallet, ChevronRight, BookOpen, Copy } from "lucide-react";
import { PAYMENT_METHODS, VIDEO_TUTORIAL_URL } from "./data.js";
import { Sheet, WhatsAppIcon, waLink, openExternal } from "./ui.jsx";

function MethodSheet({ method, onClose, onToast }) {
  const copy = () => {
    navigator.clipboard?.writeText(method.number)
      .then(() => onToast("Nimewo a kopye."))
      .catch(() => onToast("Kopye nimewo a alamen."));
  };

  const steps = [
    "Pase kòmand ou sou sit la, epi voye l sou WhatsApp.",
    method.number
      ? `Voye kòb la sou nimewo ${method.name} nou an.`
      : `N ap ba w nimewo ${method.name} nou an sou WhatsApp. Voye kòb la sou li.`,
    "Voye yon screenshot resi a sou WhatsApp, ak nimewo kòmand ou (AS-…).",
  ];

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Peye ak ${method.name}`}
      icon={<img src={method.logo} alt="" className="h-11 w-11 rounded-2xl object-cover" />}
      footer={
        <a
          href={waLink(`Bonjou Aswer Top Up, men resi peman ${method.name} mwen an. Nimewo kòmand mwen: `)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 font-bold text-white hover:brightness-95"
        >
          <WhatsAppIcon className="h-5 w-5" /> Voye resi a sou WhatsApp
        </a>
      }
    >
      <ol className="space-y-4">
        {steps.map((text, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-500 text-sm font-bold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-slate-700 dark:text-slate-200">{text}</p>
              {i === 1 && method.number && (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
                  <span className="select-all text-lg font-bold tabular-nums tracking-wide text-slate-900 dark:text-white">{method.number}</span>
                  <button type="button" onClick={copy} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-sky-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-sky-300 dark:ring-slate-700">
                    <Copy className="h-4 w-4" /> Kopye
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

export default function PaymentPage({ onToast }) {
  const [method, setMethod] = useState(null);

  const openTutorial = () => {
    if (VIDEO_TUTORIAL_URL) openExternal(VIDEO_TUTORIAL_URL);
    else onToast("Videyo a poko disponib, li ap vini byento.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">
          <Wallet className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Moyens de paiement</h1>
          <p className="text-slate-500 dark:text-slate-400">Peye an goud, apre w fin pase kòmand ou.</p>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <p className="px-1 text-sm text-slate-500 dark:text-slate-400">Choisissez votre moyen de paiement :</p>
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m)}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition hover:brightness-[.98] ${
              m.recommended ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
            }`}
          >
            <img src={m.logo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-slate-900 dark:text-white">{m.name}</span>
              {m.recommended && (
                <span className="mt-1 inline-block rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-emerald-950">RECOMMANDÉ</span>
              )}
              <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{m.note}</span>
            </span>
            <ChevronRight className={`h-6 w-6 shrink-0 ${m.recommended ? "text-emerald-500" : "text-slate-400"}`} />
          </button>
        ))}

        <button
          type="button"
          onClick={openTutorial}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-sky-100 bg-sky-50/70 p-4 text-left dark:border-sky-500/20 dark:bg-sky-500/10"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-500 dark:bg-sky-500/20">
            <BookOpen className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-sky-600 dark:text-sky-300">Tutoriel de paiement</span>
            <span className="block text-sm text-slate-500 dark:text-slate-400">Kijan pou peye ak MonCash oswa NatCash</span>
          </span>
          <ChevronRight className="h-6 w-6 shrink-0 text-sky-500" />
        </button>

        <a
          href={waLink("Bonjou Aswer Top Up, mwen gen yon pwoblèm ak peman mwen.")}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-2 text-center text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Mwen gen yon pwoblèm ak peman mwen
        </a>
      </section>

      {method && <MethodSheet method={method} onClose={() => setMethod(null)} onToast={onToast} />}
    </div>
  );
}
