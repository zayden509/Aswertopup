import React, { useEffect, useState } from "react";
import { Share2, Copy, Loader2, ArrowDownLeft, Send, ShoppingCart, RotateCcw, ShieldCheck } from "lucide-react";
import { SITE_URL } from "./data.js";
import { Logo, copyText } from "./ui.jsx";
import { t } from "./i18n.js";

// Lyen kòd QR la: lè yon moun eskane l ak kamera li, sit la louvri ak "Envoyer de l'argent" pare
export const payLink = (code) => `${SITE_URL}/?pay=${code}`;

export function QrCard({ profile, onToast }) {
  const [src, setSrc] = useState("");
  const link = payLink(profile.wallet_code);

  useEffect(() => {
    let stale = false;
    import("qrcode")
      .then((QR) => QR.toDataURL(link, { errorCorrectionLevel: "H", margin: 1, width: 560, color: { dark: "#0b1a3a", light: "#ffffff" } }))
      .then((url) => !stale && setSrc(url))
      .catch(() => !stale && onToast("Nou pa rive kreye kòd QR la."));
    return () => { stale = true; };
  }, [link]);

  const share = async () => {
    const data = { title: "Awens Topup", text: t(`Voye kòb ban mwen sou Awens Topup. AWENS-ID mwen: ${profile.wallet_code}`, `Envoyez-moi de l'argent sur Awens Topup. Mon AWENS-ID : ${profile.wallet_code}`), url: link };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {}
    } else {
      copyText(link, onToast);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("Resevwa kòb", "Recevoir de l'argent")}</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{t("Yon lòt kliyan eskane kòd sa a ak kamera telefòn li pou l voye kòb nan Wallet ou.", "Un autre client scanne ce code avec l'appareil photo de son téléphone pour envoyer de l'argent dans votre Wallet.")}</p>
      <div className="relative mx-auto mt-5 aspect-square w-full max-w-[260px] rounded-3xl bg-white p-3 shadow-lg shadow-sky-900/10 ring-1 ring-slate-200">
        {src ? (
          <img src={src} alt={`${t("Kòd QR pou AWENS-ID", "Code QR de l'AWENS-ID")} ${profile.wallet_code}`} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>
        )}
        {src && (
          <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white shadow-md ring-4 ring-white">
            <Logo className="h-10 w-10" />
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-slate-400">AWENS-ID</p>
      <p className="font-mono text-2xl font-extrabold tracking-[.25em] text-slate-900 dark:text-white">{profile.wallet_code}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => copyText(profile.wallet_code, onToast)} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Copy className="h-5 w-5" /> {t("Kopye ID a", "Copier l'ID")}
        </button>
        <button type="button" onClick={share} className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 font-bold text-white shadow-lg shadow-sky-500/25">
          <Share2 className="h-5 w-5" /> {t("Pataje", "Partager")}
        </button>
      </div>
    </section>
  );
}

const FEES = [
  {
    icon: ArrowDownLeft,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    title: t("Depo MonCash / NatCash", "Dépôt MonCash / NatCash"),
    rows: [[t("Minimòm", "Minimum"), "50 HTG"], [t("Maksimòm", "Maximum"), t("100 000 HTG pa depo", "100 000 HTG par dépôt")], [t("Frè Awens Topup", "Frais Awens Topup"), "0 HTG"]],
    note: t("Mete kòd tranzaksyon an sèlman: sit la jwenn montan an epi kòb la antre otomatikman. Yon kòd sèvi yon sèl fwa, nan 24 è.", "Entrez seulement le code de transaction : le site trouve le montant et l'argent arrive automatiquement. Un code ne sert qu'une fois, sous 24 h."),
  },
  {
    icon: Send,
    tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    title: t("Transfè ant kliyan", "Transfert entre clients"),
    rows: [[t("Minimòm", "Minimum"), "10 HTG"], [t("Frè", "Frais"), "0 HTG"], [t("Delè", "Délai"), t("Touswit", "Immédiat")]],
  },
  {
    icon: ShoppingCart,
    tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    title: t("Acha", "Achats"),
    rows: [[t("Pri", "Prix"), t("Pri ki afiche a, san frè anplis", "Le prix affiché, sans frais supplémentaires")], [t("Peman", "Paiement"), t("Solde Wallet ou", "Solde de votre Wallet")]],
  },
  {
    icon: RotateCcw,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    title: t("Ranbousman", "Remboursement"),
    rows: [[t("Kòmand refize", "Commande refusée"), t("Kòb la retounen nan Wallet ou otomatikman", "L'argent revient automatiquement dans votre Wallet")]],
  },
];

export function FeesCard() {
  return (
    <div className="space-y-3">
      {FEES.map((f) => (
        <section key={f.title} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${f.tone}`}><f.icon className="h-5 w-5" /></span>
            {f.title}
          </h2>
          <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {f.rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-right font-semibold text-slate-900 dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
          {f.note && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{f.note}</p>}
        </section>
      ))}
      <p className="flex items-start gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" /> MonCash ak NatCash ka pran pwòp frè pa yo lè w voye kòb la.
      </p>
    </div>
  );
}
