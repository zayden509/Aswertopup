import React, { useEffect, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { Sheet, WhatsAppIcon, waLink } from "./ui.jsx";
import { t } from "./i18n.js";

// Kesyon kliyan yo poze pi souvan. Nenpòt paj ka louvri l ak openFaq().
const QUESTIONS = [
  {
    q: t("Konbyen tan livrezon an pran?", "Combien de temps prend la livraison ?"),
    a: t(
      "Pifò kòmand (dyaman Free Fire, PUBG…) livre otomatikman nan kèk segonn rive kèk minit. Gift card ak abònman yo livre pa ekip la, anjeneral nan mwens pase 30 minit, 7 jou sou 7.",
      "La plupart des commandes (diamants Free Fire, PUBG…) sont livrées automatiquement en quelques secondes à quelques minutes. Les cartes cadeaux et abonnements sont livrés par l'équipe, généralement en moins de 30 minutes, 7j/7.",
    ),
  },
  {
    q: t("Kijan pou m peye?", "Comment payer ?"),
    a: t(
      "Ajoute kòb nan Wallet ou ak MonCash oswa NatCash (Portefeuille → Déposer), mete ID tranzaksyon an, epi achte ak solde a. Pa bezwen kat bank.",
      "Ajoutez de l'argent à votre Wallet avec MonCash ou NatCash (Portefeuille → Déposer), entrez l'ID de transaction, puis achetez avec votre solde. Aucune carte bancaire n'est nécessaire.",
    ),
  },
  {
    q: t("Depo m nan poko konfime, kisa pou m fè?", "Mon dépôt n'est pas encore confirmé, que faire ?"),
    a: t(
      "Pifò depo konfime poukont yo nan kèk minit. Verifye ID tranzaksyon ou mete a se menm ak sa ki nan SMS MonCash/NatCash ou a. Si l pran plis pase 30 minit, ekri nou sou WhatsApp ak foto SMS la.",
      "La plupart des dépôts sont confirmés automatiquement en quelques minutes. Vérifiez que l'ID de transaction saisi correspond à votre SMS MonCash/NatCash. Au-delà de 30 minutes, écrivez-nous sur WhatsApp avec une capture du SMS.",
    ),
  },
  {
    q: t("Kote m jwenn Player ID mwen?", "Où trouver mon Player ID ?"),
    a: t(
      "Nan jwèt la, peze foto pwofil ou: ID a anba non ou (pa egzanp 1247665343 pou Free Fire). Lè w tape l sou sit la, nou montre non jwè a pou w verifye se bon kont lan anvan w peye.",
      "Dans le jeu, touchez votre photo de profil : l'ID est sous votre nom (par exemple 1247665343 pour Free Fire). Quand vous le saisissez sur le site, nous affichons le nom du joueur pour vérifier le compte avant de payer.",
    ),
  },
  {
    q: t("M mete move Player ID, kisa k ap pase?", "J'ai entré un mauvais Player ID, que se passe-t-il ?"),
    a: t(
      "Si kòmand lan poko livre, ekri nou touswit sou WhatsApp. Si livrezon an echwe paske ID a pa egziste, kòb la retounen nan Wallet ou otomatikman. Yon livrezon ki deja fèt sou yon lòt kont pa ka anile.",
      "Si la commande n'est pas encore livrée, écrivez-nous immédiatement sur WhatsApp. Si la livraison échoue parce que l'ID n'existe pas, le montant revient automatiquement dans votre Wallet. Une livraison déjà effectuée sur un autre compte ne peut pas être annulée.",
    ),
  },
  {
    q: t("Kijan ranbousman yo mache?", "Comment fonctionnent les remboursements ?"),
    a: t(
      "Lè yon kòmand refize, kòb la retounen touswit nan Wallet ou, epi ou resevwa yon notifikasyon ak yon imèl. Ou ka sèvi ak li pou yon lòt achte.",
      "Quand une commande est refusée, le montant revient immédiatement dans votre Wallet, et vous recevez une notification et un e-mail. Vous pouvez l'utiliser pour un autre achat.",
    ),
  },
  {
    q: t("Kisa rang yo (Bronze, Argent…) ye?", "Que sont les rangs (Bronze, Argent…) ?"),
    a: t(
      "Plis ou achte, plis rang ou monte: Bronze (5 000 HTG), Argent (20 000), Or (50 000), Diamant (100 000). Rang yo ka ba w yon rabè otomatik sou chak achte: gade Profil → kat fidelite a.",
      "Plus vous achetez, plus votre rang monte : Bronze (5 000 HTG), Argent (20 000), Or (50 000), Diamant (100 000). Les rangs peuvent donner une remise automatique sur chaque achat : voir Profil → carte fidélité.",
    ),
  },
  {
    q: t("Kijan pou m voye kòb bay yon zanmi?", "Comment envoyer de l'argent à un ami ?"),
    a: t(
      "Nan Portefeuille, peze Envoyer epi mete AWENS-ID zanmi w lan (8 lèt/chif, li nan Profil li), oswa eskane kòd QR li. Transfè a fèt touswit, gratis.",
      "Dans Portefeuille, touchez Envoyer et saisissez l'AWENS-ID de votre ami (8 caractères, visible dans son profil), ou scannez son code QR. Le transfert est instantané et gratuit.",
    ),
  },
  {
    q: t("Èske sit la an sekirite?", "Le site est-il sécurisé ?"),
    a: t(
      "Wi. Kont ou pwoteje pa Google Firebase, kòb Wallet ou kontwole pa règ sekirite sèvè a, e nou pa janm mande w modpas MonCash/NatCash ou. Pa janm bay pèsonn kòd PIN ou.",
      "Oui. Votre compte est protégé par Google Firebase, votre Wallet est contrôlé par les règles de sécurité du serveur, et nous ne vous demanderons jamais votre code MonCash/NatCash. Ne partagez jamais vos codes PIN.",
    ),
  },
];

const EVENT = "awens:faq";
export const openFaq = () => window.dispatchEvent(new Event(EVENT));

function Item({ q, a, open, onToggle }) {
  return (
    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="min-w-0 flex-1 font-semibold text-slate-900 dark:text-white">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="animate-fade-in px-4 pb-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{a}</p>}
    </div>
  );
}

// Monte yon sèl fwa nan App: li louvri fenèt FAQ a lè yon paj rele openFaq()
export function FaqHost() {
  const [show, setShow] = useState(false);
  const [openIndex, setOpenIndex] = useState(0);
  useEffect(() => {
    const onOpen = () => setShow(true);
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);
  if (!show) return null;
  return (
    <Sheet
      open
      onClose={() => setShow(false)}
      title={t("Kesyon yo poze souvan", "Questions fréquentes")}
      icon={<HelpCircle className="h-6 w-6" />}
      footer={
        <a
          href={waLink(t("Bonjou Awens Topup! Mwen gen yon kesyon.", "Bonjour Awens Topup ! J'ai une question."))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 font-bold text-white"
        >
          <WhatsAppIcon className="h-5 w-5" /> {t("Ou pa jwenn repons ou? Ekri nou", "Pas de réponse ? Écrivez-nous")}
        </a>
      }
    >
      <div className="space-y-2.5">
        {QUESTIONS.map((item, i) => (
          <Item key={item.q} {...item} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
        ))}
      </div>
    </Sheet>
  );
}
