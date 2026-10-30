import React, { useEffect, useState } from "react";
import { BookOpen, UserRound, Copy, Smartphone, MessageSquareText, CheckCircle2, Gamepad2, ArrowLeft, ArrowRight } from "lucide-react";
import { PAYMENT_METHODS, VIDEO_TUTORIAL_URL } from "./data.js";
import { Sheet, openExternal } from "./ui.jsx";

// Tutoryèl la: videyo a si genyen youn (config.js), sinon gid etap pa etap sa a.
// Nenpòt paj ka louvri l ak openTutorial(); App.jsx koute evènman an.
const EVENT = "awens:tutorial";
export function openTutorial() {
  if (VIDEO_TUTORIAL_URL) openExternal(VIDEO_TUTORIAL_URL);
  else window.dispatchEvent(new Event(EVENT));
}
export function useTutorialRequests(onOpen) {
  useEffect(() => {
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, [onOpen]);
}

const STEPS = [
  { icon: UserRound, title: "Kreye kont ou", text: "Peze ikòn pwofil la anlè, epi kreye yon kont ak imèl ou oswa ak Google. Kont ou gen yon Wallet an goud." },
  { icon: Copy, title: "Chwazi MonCash oswa NatCash", text: "Nan Wallet ou, peze Depoze. Chwazi mòd peman an, epi kopye nimewo kont boutik la." },
  { icon: Smartphone, title: "Voye kòb la", text: "Nan aplikasyon MonCash oswa NatCash ou, voye kantite kòb ou vle a sou nimewo ou fèk kopye a." },
  { icon: MessageSquareText, title: "Jwenn kòd tranzaksyon an", text: "Ou resevwa yon SMS. Kopye TransCode (NatCash) oswa Transaction ID (MonCash) ki ladan l.", guide: true },
  { icon: CheckCircle2, title: "Kole kòd la sou sit la", text: "Mete kòd la sèlman, epi peze Valider mon dépôt. Sit la jwenn montan an poukont li, epi kòb la antre nan Wallet ou touswit." },
  { icon: Gamepad2, title: "Achte", text: "Chwazi jwèt ou, mete ID jwè ou (sit la montre non w pou w verifye), epi peye ak Wallet ou. Livrezon an otomatik, an kèk minit." },
];

export function TutorialSheet({ onClose }) {
  const [step, setStep] = useState(0);
  const [guide, setGuide] = useState(PAYMENT_METHODS[1]?.guide ? 1 : 0);
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <Sheet open onClose={onClose} title="Kijan sa mache" icon={<BookOpen className="h-6 w-6" />}>
      <div className="space-y-5" data-testid="tutorial">
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.title} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-sky-500" : i < step ? "w-3 bg-sky-300 dark:bg-sky-700" : "w-3 bg-slate-200 dark:bg-slate-700"}`} />
          ))}
        </div>
        <div key={step} className="animate-fade-in space-y-3 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">
            <Icon className="h-8 w-8" />
          </span>
          <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">Etap {step + 1} sou {STEPS.length}</p>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">{current.title}</h4>
          <p className="mx-auto max-w-sm text-slate-600 dark:text-slate-300">{current.text}</p>
          {current.guide && (
            <div className="space-y-3 text-left">
              <div className="flex justify-center gap-2" role="tablist">
                {PAYMENT_METHODS.map((m, i) => m.guide && (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={guide === i}
                    onClick={() => setGuide(i)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${guide === i ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <img src={PAYMENT_METHODS[guide].guide} alt={`Kote kòd tranzaksyon ${PAYMENT_METHODS[guide].name} la ye nan SMS la`} width="853" height="1280" className="w-full rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800" />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-5 w-5" /> Retounen
          </button>
          <button
            type="button"
            onClick={() => (last ? onClose() : setStep((s) => s + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 font-bold text-white hover:bg-sky-600"
          >
            {last ? "Mwen konprann" : <>Swivan <ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
