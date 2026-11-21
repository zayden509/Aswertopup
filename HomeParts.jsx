import React, { useEffect, useState } from "react";
import { Gamepad2, Crown, Gift, Banknote, ArrowRight, Zap, ShieldCheck, MessageCircle, MousePointerClick, Wallet, PackageCheck, Sparkles } from "lucide-react";
import { backend } from "./backend.js";
import { ProductArt } from "./ui.jsx";
import { t } from "./i18n.js";

// Paj akèy la: tèm "gaming" (vyolèt, limyè ki klere), menm stil ak paj pwodwi yo

// Gwo kat anlè a: tit, bouton yo, ak ikòn jwèt yo k ap flote
export function HomeHero({ catalog, onShop, onDeposit, onOpen }) {
  const [stats, setStats] = useState({});
  useEffect(() => (backend ? backend.subscribePublicStats(setStats) : undefined), []);
  const delivered = Number(stats.delivered || 0);
  const icons = ["free-fire", "pubg", "roblox", "mlbb"].map((id) => catalog.find((p) => p.id === id)).filter(Boolean);
  const spots = [
    "right-3 top-5 h-20 w-20 rotate-[10deg]",
    "right-24 top-16 h-14 w-14 -rotate-[8deg]",
    "right-5 top-[108px] h-14 w-14 -rotate-[12deg]",
    "right-[92px] top-[130px] h-12 w-12 rotate-[6deg]",
  ];

  return (
    <section className="relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1a0b3d] via-[#120a2e] to-[#06122b] p-5 pb-6 text-white shadow-xl shadow-violet-900/20">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:28px_28px]" />

      {icons.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onOpen(p)}
          aria-label={p.name}
          className={`absolute ${spots[i]} overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(168,85,247,.45)] ring-2 ring-white/20 transition hover:scale-105 max-[359px]:hidden`}
        >
          <ProductArt product={p} className="absolute inset-0" />
        </button>
      ))}

      <div className="relative max-w-[62%] min-[460px]:max-w-[58%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-violet-200 ring-1 ring-white/15">
          <Sparkles className="h-3.5 w-3.5" /> {t("Top-up an Ayiti", "Top-up en Haïti")}
        </span>
        <h1 className="mt-3 text-[30px] font-black leading-[1.05] tracking-tight min-[400px]:text-[34px]">
          {t("Rechaje jwèt ou", "Rechargez vos jeux")}{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-300 bg-clip-text text-transparent">{t("an kèk minit", "en quelques minutes")}</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">{t("Dyaman, abònman ak kat kado. Peye an goud.", "Diamants, abonnements et cartes cadeaux. Payez en gourdes.")}</p>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2.5">
        <button type="button" onClick={onShop} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 font-bold shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 active:scale-[.98]">
          <Gamepad2 className="h-5 w-5" /> {t("Wè jwèt yo", "Voir les jeux")}
        </button>
        <button type="button" onClick={onDeposit} className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-bold ring-1 ring-white/20 transition hover:bg-white/15 active:scale-[.98]">
          <Wallet className="h-5 w-5" /> {t("Rechaje Wallet", "Recharger mon Wallet")}
        </button>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
        {delivered > 0 && (
          <span className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">
            <PackageCheck className="h-4 w-4 text-emerald-400" /> {new Intl.NumberFormat("fr-FR").format(delivered)} {t("kòmand livre", "commandes livrées")}
          </span>
        )}
        <span className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10"><ShieldCheck className="h-4 w-4 text-sky-400" /> MonCash · NatCash</span>
        <span className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10"><MessageCircle className="h-4 w-4 text-fuchsia-400" /> {t("Sipò 7/7", "Support 7j/7")}</span>
      </div>
    </section>
  );
}

// Rakousi kategori yo: kat ak ikòn koulè
const CATS = [
  { id: "Jwèt", Icon: Gamepad2, tone: "from-violet-500 to-fuchsia-500", fr: "Jeux", kr: "Jwèt" },
  { id: "Abònman", Icon: Crown, tone: "from-amber-400 to-orange-500", fr: "Abonnements", kr: "Abònman" },
  { id: "Gift Card", Icon: Gift, tone: "from-sky-400 to-indigo-500", fr: "Cadeaux", kr: "Kat kado" },
  { id: "Finans", Icon: Banknote, tone: "from-emerald-400 to-teal-500", fr: "Finances", kr: "Finans" },
];

export function CategoryShortcuts({ onPick }) {
  return (
    <div className="mt-5 grid grid-cols-4 gap-2.5">
      {CATS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onPick(c.id)}
          className="flex flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 active:scale-95 dark:bg-slate-900 dark:ring-slate-800"
        >
          <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${c.tone} text-white shadow-md`}>
            <c.Icon className="h-5 w-5" />
          </span>
          <span className="w-full whitespace-nowrap text-center text-[10.5px] font-bold leading-tight tracking-tight text-slate-700 dark:text-slate-200">{t(c.kr, c.fr)}</span>
        </button>
      ))}
    </div>
  );
}

// Tit yon seksyon: ikòn, tit, liy koulè, ak "Voir tout"
export function SectionTitle({ category, title, onSeeAll }) {
  const cat = CATS.find((c) => c.id === category) || CATS[0];
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${cat.tone} text-white shadow-md`}>
          <cat.Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <span className={`mt-1 block h-1 w-10 rounded-full bg-gradient-to-r ${cat.tone}`} />
        </div>
      </div>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-600 ring-1 ring-violet-200 transition hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30">
          {t("Wè tout", "Voir tout")} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// "Kijan sa mache": 3 etap
export function HowItWorks({ onTutorial }) {
  const steps = [
    [MousePointerClick, "from-violet-500 to-fuchsia-500", t("Chwazi", "Choisissez"), t("Jwèt la ak pake a, epi mete ID jwè w.", "Le jeu, le forfait, et votre ID joueur.")],
    [Wallet, "from-sky-400 to-indigo-500", t("Peye", "Payez"), t("Ak Wallet ou (MonCash oswa NatCash).", "Avec votre Wallet (MonCash ou NatCash).")],
    [Zap, "from-amber-400 to-orange-500", t("Resevwa", "Recevez"), t("Livrezon an kèk minit, notifikasyon + imèl.", "Livraison en quelques minutes, notification + e-mail.")],
  ];
  return (
    <section className="mt-10">
      <h2 className="text-center text-2xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">{t("Kijan sa mache?", "Comment ça marche ?")}</span>
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map(([Icon, tone, title, text], i) => (
          <div key={title} className="relative flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:flex-col sm:text-center">
            <span className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}>
              <Icon className="h-7 w-7" />
              <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-xs font-black text-white ring-2 ring-white dark:bg-white dark:text-slate-900 dark:ring-slate-900">{i + 1}</span>
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-extrabold text-slate-900 dark:text-white">{title}</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{text}</span>
            </span>
          </div>
        ))}
      </div>
      <button type="button" onClick={onTutorial} className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-600 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30">
        ▶ {t("Gade videyo tutoriel la", "Voir le tutoriel vidéo")}
      </button>
    </section>
  );
}
