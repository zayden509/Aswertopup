import React, { useState } from "react";
import { ShieldCheck, Zap, MessageCircle, ChevronRight, FileText, Lock, UserX, Instagram, Facebook } from "lucide-react";
import { PAYMENT_METHODS, SOCIAL_LINKS } from "./data.js";
import { Logo, Sheet, WhatsAppIcon, waLink, supportMessage, formatWhatsApp } from "./ui.jsx";
import { t } from "./i18n.js";

function TikTokIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.37-2.48V9.66a5.7 5.7 0 0 0-.77-.05 5.73 5.73 0 0 0-5.73 5.73A5.73 5.73 0 0 0 9.86 21a5.73 5.73 0 0 0 5.73-5.73V9.01a7.3 7.3 0 0 0 4.28 1.37V7.3a4.28 4.28 0 0 1-3.27-1.48z" />
    </svg>
  );
}

const SOCIALS = [
  { id: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "facebook", label: "Facebook", Icon: Facebook },
];

const FEATURES = [
  { Icon: ShieldCheck, title: t("Peman an sekirite", "Paiement sécurisé"), text: "MonCash · NatCash" },
  { Icon: Zap, title: t("Livrezon rapid", "Livraison rapide"), text: t("Dirèk sou kont ou", "Directement sur votre compte") },
  { Icon: MessageCircle, title: t("Sipò WhatsApp", "Support WhatsApp"), text: t("Yon moun reponn ou", "Une vraie personne vous répond") },
];

// Tèks legal yo (kout e klè). Mèt sit la dwe li yo epi adapte yo si sa nesesè.
const LEGAL = {
  terms: {
    title: t("Kondisyon itilizasyon", "Conditions d'utilisation"),
    Icon: FileText,
    sections: [
      [t("Sèvis la", "Le service"), t("Awens Topup vann rechaj jwèt, abònman, gift card ak lòt sèvis dijital, epi ou peye an goud ak MonCash oswa NatCash.", "Awens Topup vend des recharges de jeux, des abonnements, des cartes cadeaux et d'autres services numériques, payables en gourdes avec MonCash ou NatCash.")],
      [t("Kont ou", "Votre compte"), t("Ou responsab enfòmasyon kont ou ak modpas ou. Pa bay lòt moun modpas ou.", "Vous êtes responsable des informations de votre compte et de votre mot de passe. Ne le communiquez à personne.")],
      ["Wallet", t("Kòb ou mete nan Wallet ou sèvi pou achte sou sit la oswa voye bay yon lòt kliyan. Yon depo antre otomatikman lè sit la verifye kòd tranzaksyon an.", "L'argent de votre Wallet sert à acheter sur le site ou à l'envoyer à un autre client. Un dépôt arrive automatiquement dès que le site vérifie le code de transaction.")],
      [t("Kòmand yo", "Les commandes"), t("Verifye Player ID ou ak pake a anvan ou konfime. Nou pa ka anile yon kòmand ki voye sou yon ID ou te bay mal.", "Vérifiez votre Player ID et le forfait avant de confirmer. Une commande envoyée sur un ID erroné ne peut pas être annulée.")],
      [t("Ranbousman", "Remboursement"), t("Si nou pa ka livre yon kòmand, nou refize l epi kòb la retounen nan Wallet ou otomatikman.", "Si une commande ne peut pas être livrée, elle est refusée et l'argent revient automatiquement dans votre Wallet.")],
      [t("Fwod", "Fraude"), t("Nou ka bloke yon kont ki sèvi ak fo peman, nimewo tranzaksyon yon lòt moun, oswa ki eseye twonpe sistèm nan.", "Nous pouvons bloquer un compte qui utilise de faux paiements, le numéro de transaction d'une autre personne, ou qui tente de tromper le système.")],
      [t("Chanjman", "Modifications"), t("Kondisyon sa yo ka chanje. Vèsyon ki sou sit la jodi a se sa ki konte.", "Ces conditions peuvent changer. La version en ligne aujourd'hui fait foi.")],
    ],
  },
  privacy: {
    title: t("Konfidansyalite", "Confidentialité"),
    Icon: Lock,
    sections: [
      [t("Sa nou kenbe", "Ce que nous conservons"), t("Non ou, imèl ou, foto pwofil ou (si w mete youn), Player ID ou bay, kòmand ou yo, depo ou yo (ak nimewo telefòn ou mete) ak transfè ou yo.", "Votre nom, votre e-mail, votre photo de profil (si vous en ajoutez une), les Player ID fournis, vos commandes, vos dépôts (et le numéro de téléphone indiqué) et vos transferts.")],
      [t("Poukisa", "Pourquoi"), t("Pou kreye kont ou, trete kòmand ak depo ou yo, ba ou sipò, epi anpeche fwod.", "Pour créer votre compte, traiter vos commandes et dépôts, vous assister et prévenir la fraude.")],
      [t("Kote", "Où"), t("Done yo estoke an sekirite sou Google Firebase.", "Les données sont stockées en sécurité sur Google Firebase.")],
      [t("Ki moun ki wè yo", "Qui les voit"), t("Sèlman ou menm ak ekip Awens Topup la. Nou pa vann done ou bay pèsonn.", "Seulement vous et l'équipe Awens Topup. Nous ne vendons vos données à personne.")],
      [t("Vizit yo", "Les visites"), t("Nou konte konbyen moun ki vizite sit la chak jou, san nou pa konnen ki moun yo ye.", "Nous comptons le nombre de visiteurs par jour, sans savoir qui ils sont.")],
      [t("Dwa ou", "Vos droits"), t("Ou ka mande wè, korije oswa efase done ou: ekri nou sou WhatsApp.", "Vous pouvez demander à voir, corriger ou supprimer vos données : écrivez-nous sur WhatsApp.")],
    ],
  },
  delete: {
    title: t("Efase kont mwen", "Supprimer mon compte"),
    Icon: UserX,
    sections: [
      [t("Kijan sa mache", "Comment ça marche"), t("Voye demann lan sou WhatsApp ak imèl kont ou. N ap verifye se ou menm, epi n ap efase kont ou ak done ou yo.", "Envoyez la demande sur WhatsApp avec l'e-mail de votre compte. Nous vérifions qu'il s'agit bien de vous, puis supprimons votre compte et vos données.")],
      [t("Kòb nan Wallet", "Argent dans le Wallet"), t("Si gen kòb nan Wallet ou, sèvi avè l anvan, oswa pale ak nou nan menm mesaj la.", "S'il reste de l'argent dans votre Wallet, utilisez-le d'abord, ou parlez-nous-en dans le même message.")],
      [t("Apre sa", "Ensuite"), t("Ou p ap ka konekte ak kont sa a ankò, ni wè istorik kòmand ou yo.", "Vous ne pourrez plus vous connecter à ce compte ni voir l'historique de vos commandes.")],
    ],
  },
};

function LegalSheet({ id, email, onClose }) {
  const doc = LEGAL[id];
  return (
    <Sheet open onClose={onClose} title={doc.title} icon={<doc.Icon className="h-6 w-6" />}>
      <div className="space-y-4">
        {doc.sections.map(([title, text]) => (
          <section key={title}>
            <h4 className="font-bold text-slate-900 dark:text-white">{title}</h4>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
          </section>
        ))}
        {id === "delete" ? (
          <a
            href={waLink(`${t("Bonjou Awens Topup, mwen vle efase kont mwen.", "Bonjour Awens Topup, je souhaite supprimer mon compte.")}${email ? ` ${t("Imèl kont lan", "E-mail du compte")}: ${email}` : ""}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 py-3.5 font-bold text-white"
          >
            <WhatsAppIcon className="h-5 w-5" /> {t("Voye demann lan", "Envoyer la demande")}
          </a>
        ) : (
          <a href={waLink(supportMessage(t("Bonjou Awens Topup, mwen gen yon kesyon.", "Bonjour Awens Topup, j'ai une question."), email && { email }))} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <WhatsAppIcon className="h-5 w-5" /> {t("Poze nou yon kesyon", "Posez-nous une question")}
          </a>
        )}
      </div>
    </Sheet>
  );
}

function LinkRow({ children, onClick }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-2 py-2 text-left text-[15px] text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400">
        {children} <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
      </button>
    </li>
  );
}

export default function Footer({ email, onGo, onTutorial, onRank }) {
  const [legal, setLegal] = useState(null);
  const socials = SOCIALS.filter((s) => SOCIAL_LINKS[s.id]);

  return (
    <footer className="mt-12 space-y-5 [contain-intrinsic-size:auto_900px] [content-visibility:auto]">
      <div className="grid grid-cols-3 gap-2.5">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl bg-white px-2 py-4 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <f.Icon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-[13px] font-bold leading-tight text-slate-900 dark:text-white">{f.title}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">{f.text}</p>
          </div>
        ))}
      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0b1d3f] to-[#0b2547] p-5 text-white shadow-xl shadow-slate-900/10">
        <Logo className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 opacity-10" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Logo className="h-9 w-9" />
          </span>
          <div>
            <p className="text-xl font-black tracking-tight">Awens Topup</p>
            <p className="text-sm text-sky-200/80">{t("Gaming & Recharges · Ayiti 🇭🇹", "Gaming & Recharges · Haïti 🇭🇹")}</p>
          </div>
        </div>
        <p className="relative mt-4 text-[15px] leading-relaxed text-slate-300">
          {t("Rechaje jwèt ou yo, peye abònman ak gift card an goud. Rapid, an sekirite, e senp, depi telefòn ou.", "Rechargez vos jeux, payez abonnements et cartes cadeaux en gourdes. Rapide, sécurisé et simple, depuis votre téléphone.")}
        </p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <a href={waLink(supportMessage("Bonjou Awens Topup! Mwen gen yon kesyon.", email && { email }))} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30">
            <WhatsAppIcon className="h-5 w-5" /> {formatWhatsApp() || "WhatsApp"}
          </a>
          {socials.map((s) => (
            <a key={s.id} href={SOCIAL_LINKS[s.id]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900">
              <s.Icon className="h-5 w-5" /> {s.label}
            </a>
          ))}
        </div>
        <div className="relative mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("Nou aksepte", "Nous acceptons")}</span>
          {PAYMENT_METHODS.map((m) => (
            <img key={m.id} src={m.logo} alt={m.name} loading="lazy" decoding="async" className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/20" />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6 px-1">
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-slate-400">{t("Sipò", "Support")}</h3>
          <ul>
            <LinkRow onClick={() => window.open(waLink(supportMessage(t("Bonjou Awens Topup, mwen bezwen èd.", "Bonjour Awens Topup, j'ai besoin d'aide."), email && { email })), "_blank", "noopener,noreferrer")}>{t("Sant èd", "Centre d'aide")}</LinkRow>
            <LinkRow onClick={onTutorial}>Tutoriel</LinkRow>
            <LinkRow onClick={() => onGo("wallet")}>{t("Kijan pou peye", "Comment payer")}</LinkRow>
            <LinkRow onClick={onRank}>{t("Pwogram fidelite", "Programme de fidélité")}</LinkRow>
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-slate-400">{t("Legal", "Mentions légales")}</h3>
          <ul>
            <LinkRow onClick={() => setLegal("terms")}>{t("Kondisyon", "Conditions")}</LinkRow>
            <LinkRow onClick={() => setLegal("privacy")}>{t("Konfidansyalite", "Confidentialité")}</LinkRow>
            <LinkRow onClick={() => setLegal("delete")}>{t("Efase kont", "Supprimer le compte")}</LinkRow>
          </ul>
        </div>
      </div>

      <p className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} Awens Topup · {t("Tout dwa rezève", "Tous droits réservés")}
      </p>

      {legal && <LegalSheet id={legal} email={email} onClose={() => setLegal(null)} />}
    </footer>
  );
}
