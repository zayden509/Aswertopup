import {
  Flame, PlayCircle, CreditCard, MessageCircle, CalendarDays, CalendarRange, Ticket, TrendingUp,
} from "lucide-react";
import { DEFAULT_TIERS } from "./exchange.js";
import { DEFAULT_ACCOUNTS } from "./paymentAccounts.js";
import freeFireImg from "./img/free-fire.jpg";
import pubgImg from "./img/pubg.jpg";
import robloxImg from "./img/roblox.jpg";
import bloodStrikeImg from "./img/blood-strike.jpg";
import netflixImg from "./img/netflix.jpg";
import appStoreImg from "./img/app-store.jpg";
import efootballImg from "./img/efootball.jpg";
import fcMobileImg from "./img/fc-mobile.jpg";
import dlsImg from "./img/dls.jpg";
import flexCityImg from "./img/flex-city.jpg";
import disneyPlusImg from "./img/disney-plus.jpg";
import claudeImg from "./img/claude.jpg";
import geminiImg from "./img/gemini.jpg";
import nintendoImg from "./img/nintendo.jpg";
import playstationImg from "./img/playstation.jpg";
import xboxImg from "./img/xbox.jpg";
import cashAppImg from "./img/cash-app.jpg";
import binanceImg from "./img/binance.jpg";
import wiseImg from "./img/wise.jpg";
import meruImg from "./img/meru.jpg";
import starlinkImg from "./img/starlink.jpg";
import codmImg from "./img/codm.jpg";
import mlbbImg from "./img/mlbb.jpg";
import spotifyImg from "./img/spotify.jpg";
import googlePlayImg from "./img/google-play.jpg";
import tiktokImg from "./img/tiktok.jpg";
import paypalImg from "./img/paypal.jpg";
import moncashImg from "./img/moncash.jpg";
import natcashImg from "./img/natcash.jpg";
import moncashGuide from "./img/guide-moncash.jpg";
import natcashGuide from "./img/guide-natcash.jpg";
import bannerTutoriel from "./img/banners/tutoriel.jpg";
import bannerFreeFire from "./img/banners/free-fire.jpg";
import bannerPeman from "./img/banners/peman.jpg";
import bannerSipo from "./img/banners/sipo.jpg";
import { t } from "./i18n.js";

/* ============ KONFIGIRASYON ============ */
// Nimewo WhatsApp, videyo tutoriel ak kle Firebase yo nan config.js
export { WHATSAPP_NUMBER, VIDEO_TUTORIAL_URL, GOOGLE_LOGIN, SITE_URL, SOCIAL_LINKS, DIRECT_PAYMENT } from "./config.js";

// Rang kliyan yo selon kantite kòb yo depanse (an goud)
export const RANKS = [
  { name: "Bronze", min: 5000, emoji: "🥉" },
  { name: "Argent", min: 20000, emoji: "🥈" },
  { name: "Or", min: 50000, emoji: "🥇" },
  { name: "Diamant", min: 100000, emoji: "💎" },
];

/* ============ PEMAN ============ */
// `number` se nimewo kote kliyan yo voye kòb la. Si l vid, sit la di kliyan an
// mande nimewo a sou WhatsApp. `guide`: foto ki montre kote kòd tranzaksyon an ye nan SMS la.
export const PAYMENT_METHODS = [
  { id: "moncash", name: "MonCash", logo: moncashImg, number: DEFAULT_ACCOUNTS.moncash.number, holder: DEFAULT_ACCOUNTS.moncash.name, recommended: true, note: t("Peye ak kont MonCash ou", "Payez avec votre compte MonCash"), guide: moncashGuide },
  { id: "natcash", name: "NatCash", logo: natcashImg, number: DEFAULT_ACCOUNTS.natcash.number, holder: DEFAULT_ACCOUNTS.natcash.name, note: t("Peye ak kont NatCash ou", "Payez avec votre compte NatCash"), guide: natcashGuide },
];

/* ============ PWODWI ============ */
// Pou mete yon foto sou yon pwodwi: mete foto a nan dosye img/, enpòte l anlè fichye sa a
// epi ajoute `image: nonImaj` sou pwodwi a. Pou yon logo kare (Cash App, Xbox…), ajoute
// `bg` ak koulè fon logo a: logo a parèt antye olye l koupe sou kote yo.
//
// `groups` se seksyon pake yo (pri an goud):
//   - style "gem": kat dyaman (label = kantite, bonus = dyaman an plis)
//   - style "deal": kat abònman / pas, ak yon ikòn
// `playerId: true` mande kliyan an Player ID (UID) li; `needsId: true` sou yon pake
// fè ID a obligatwa pou pake sa a.
// `id` yon pake dwe menm ak `id` li nan koleksyon `packages` Firebase la: lè baz done a
// konekte, se pri ki nan baz done a ki konte (Panneau admin → Pri pou ajoute/chanje yo).
export const CATEGORIES = ["Tout", "Jwèt", "Abònman", "Gift Card", "Finans"];
// Non kategori yo jan kliyan an wè yo (kle yo rete an kreyòl nan baz done a)
const CATEGORY_LABELS = { Tout: t("Tout", "Tout"), "Jwèt": t("Jwèt", "Jeux"), "Abònman": t("Abònman", "Abonnements"), "Gift Card": t("Gift Card", "Cartes cadeaux"), Finans: t("Finans", "Finance") };
export const categoryLabel = (category) => CATEGORY_LABELS[category] || category;

// Seksyon paj akèy la, nan lòd sa a. `tagline` parèt anba non pwodwi ki poko gen pri
// (yon pwodwi ka gen pwòp `tagline` pa l).
export const HOME_SECTIONS = [
  { category: "Jwèt", title: "Recharge de Jeux", tagline: "Recharge" },
  { category: "Abònman", title: "Abonnements", tagline: "Premium" },
  { category: "Gift Card", title: "Cartes Cadeaux", tagline: "Carte cadeau" },
  { category: "Finans", title: "Services Financiers", tagline: "Transfert" },
];

const FREE_FIRE_ID_HELP = t("Louvri Free Fire epi peze foto pwofil ou anwo agoch. UID ou se nimewo ki anba non ou a.", "Ouvrez Free Fire et touchez votre photo de profil en haut à gauche. Votre UID est le numéro sous votre nom.");

const FREE_FIRE_DIAMANTS = {
  title: "Diamants",
  style: "gem",
  items: [
    { id: "ff-100", label: "100", bonus: 10, price: 155 },
    { id: "ff-310", label: "310", bonus: 31, price: 460 },
    { id: "ff-1060", label: "1060", bonus: 106, price: 1550 },
    { id: "ff-2180", label: "2180", bonus: 218, price: 3100 },
    { id: "ff-5600", label: "5600", bonus: 560, price: 7500 },
  ],
};

const FREE_FIRE_ABONNEMENT = {
  title: "Abonnement",
  style: "deal",
  items: [
    { id: "ff-semaine", label: "SEMAINE", price: 350, needsId: true, Icon: CalendarDays },
    { id: "ff-mois", label: "MOIS", price: 1800, needsId: true, Icon: CalendarRange },
    { id: "ff-booyah", label: "BOOYAH PASS PAR ID", price: 600, needsId: true, Icon: Ticket },
    { id: "ff-levelup", label: "LEVEL UP PASS 1355💎", price: 900, needsId: true, Icon: TrendingUp },
  ],
};

// Pwodwi Finans yo mache ak yon konvèsyon (to du jou + frè pa palye) olye pake.
// `account` se sa nou mande kliyan an pou n voye kòb la. To a ak frè yo sa a se valè pa
// defo: admin nan chanje yo epi aktive yo nan Panneau admin → Pwodwi.
function exchangeConfig(currency, account, rate = 145) {
  return { currency, account, rate, min: 1, max: 1000, tiers: DEFAULT_TIERS };
}

export const PRODUCTS = [
  {
    id: "free-fire",
    name: "Free Fire USA/LATAM",
    category: "Jwèt",
    isNew: true,
    image: freeFireImg,
    playerId: true,
    playerIdHelp: FREE_FIRE_ID_HELP,
    groups: [FREE_FIRE_DIAMANTS, FREE_FIRE_ABONNEMENT],
  },
  {
    id: "free-fire-abonnement",
    name: "Abonnement Free Fire",
    category: "Abònman",
    isNew: true,
    image: freeFireImg,
    playerId: true,
    playerIdHelp: FREE_FIRE_ID_HELP,
    groups: [FREE_FIRE_ABONNEMENT],
  },
  { id: "starlink", name: "STARLINK", category: "Abònman", tagline: "Abonnement", isNew: true, image: starlinkImg },
  { id: "pubg", name: "PUBG Mobile", category: "Jwèt", image: pubgImg },
  { id: "codm", name: "Call of Duty Mobile", category: "Jwèt", image: codmImg },
  { id: "blood-strike", name: "Blood Strike", category: "Jwèt", image: bloodStrikeImg },
  { id: "mlbb", name: "Mobile Legends", category: "Jwèt", image: mlbbImg },
  { id: "roblox", name: "Roblox", category: "Jwèt", image: robloxImg },
  { id: "netflix", name: "Netflix", category: "Abònman", image: netflixImg, bg: "#000000" },
  { id: "spotify", name: "Spotify", category: "Abònman", image: spotifyImg },
  { id: "google-play", name: "Google Play", category: "Gift Card", image: googlePlayImg },
  { id: "app-store", name: "App Store & iTunes", category: "Gift Card", image: appStoreImg, bg: "#ffffff" },
  { id: "tiktok", name: "TikTok Coins", category: "Gift Card", tagline: "Coins", image: tiktokImg },
  { id: "efootball", name: "eFootball", category: "Jwèt", image: efootballImg },
  { id: "fc-mobile", name: "EA FC Mobile", category: "Jwèt", image: fcMobileImg },
  { id: "dls", name: "Dream League Soccer", category: "Jwèt", image: dlsImg },
  { id: "flex-city", name: "Flex City", category: "Jwèt", image: flexCityImg, bg: "#000000" },
  { id: "disney-plus", name: "Disney+", category: "Abònman", image: disneyPlusImg, bg: "#021b3e" },
  { id: "claude", name: "Claude AI", category: "Abònman", image: claudeImg, bg: "#ffffff" },
  { id: "gemini", name: "Google Gemini", category: "Abònman", image: geminiImg, bg: "#ffffff" },
  { id: "nintendo", name: "Nintendo Gift Card", category: "Gift Card", image: nintendoImg, bg: "#e70012" },
  { id: "playstation", name: "PlayStation Gift Card", category: "Gift Card", image: playstationImg, bg: "#094591" },
  { id: "xbox", name: "Xbox Gift Card", category: "Gift Card", image: xboxImg, bg: "#107b10" },
  {
    id: "meru", name: "Meru", category: "Finans", tagline: "Transfert", image: meruImg, bg: "#ffffff", isNew: true,
    exchange: exchangeConfig("MERU", { label: t("Imèl oswa telefòn kont Meru ou", "E-mail ou téléphone de votre compte Meru"), placeholder: "ou@gmail.com" }),
  },
  {
    id: "paypal", name: "PayPal", category: "Finans", tagline: "Transfert", isNew: true,
    image: paypalImg,
    exchange: exchangeConfig("USD", { label: t("Imèl kont PayPal ou", "E-mail de votre compte PayPal"), placeholder: "ou@gmail.com" }),
  },
  {
    id: "cash-app", name: "Cash App", category: "Finans", tagline: "Recharge", image: cashAppImg, bg: "#ffffff",
    exchange: exchangeConfig("USD", { label: t("$Cashtag ou", "Votre $Cashtag"), placeholder: "$jeanbaptiste" }),
  },
  {
    id: "binance", name: "Binance Pay", category: "Finans", tagline: "Recharge", image: binanceImg, bg: "#151a1d",
    exchange: exchangeConfig("USDT", { label: t("Binance Pay ID oswa imèl ou", "Votre Binance Pay ID ou e-mail"), placeholder: "123456789" }),
  },
  {
    id: "wise", name: "Wise", category: "Finans", tagline: "Transfert", image: wiseImg, bg: "#9ee86f",
    exchange: exchangeConfig("USD", { label: t("Imèl kont Wise ou", "E-mail de votre compte Wise"), placeholder: "ou@gmail.com" }),
  },
];

/* ============ BANYE (KAROUSÈL) ============ */
// action: "video" | "whatsapp" | "payment" | "product:<id>"
// `image`: foto banye a (1200 × 600). San `image`, banye a parèt ak tèks yo.
export const SLIDES = [
  {
    emoji: "🔔",
    title: t("Tutoriel kijan pou w top up?", "Tutoriel : comment recharger ?"),
    image: bannerTutoriel,
    text: t("Videyo sa a se pou nenpòt rechaj ak lòt jwèt sou sit la.", "Cette vidéo vaut pour toutes les recharges et tous les jeux du site."),
    button: "Video Tutoriel",
    action: "video",
    Art: PlayCircle,
  },
  {
    emoji: "🔥",
    title: t("Dyaman Free Fire", "Diamants Free Fire"),
    image: bannerFreeFire,
    text: t("Rechaje dyaman ou yo, livrezon an kèk minit sèlman.", "Rechargez vos diamants, livraison en quelques minutes."),
    button: t("Achte kounye a", "Acheter maintenant"),
    action: "product:free-fire",
    Art: Flame,
  },
  {
    emoji: "💳",
    title: t("Peye an goud", "Payez en gourdes"),
    image: bannerPeman,
    text: t("Peye ak MonCash oswa NatCash, san kat bank, 24h/24.", "Payez avec MonCash ou NatCash, sans carte bancaire, 24h/24."),
    button: t("Kijan pou m peye?", "Comment payer ?"),
    action: "payment",
    Art: CreditCard,
  },
  {
    emoji: "💬",
    title: t("Ou bezwen èd?", "Besoin d'aide ?"),
    image: bannerSipo,
    text: t("Ekip Awens Topup la la pou reponn ou sou WhatsApp.", "L'équipe Awens Topup vous répond sur WhatsApp."),
    button: t("Kontakte nou", "Nous contacter"),
    action: "whatsapp",
    Art: MessageCircle,
  },
];

/* ============ NOTIFIKASYON ============ */
export const NOTIFICATIONS = [
  { emoji: "🎉", title: t("Byenvini sou Awens Topup", "Bienvenue sur Awens Topup"), text: t("Rechaje jwèt ou yo rapid e an sekirite.", "Rechargez vos jeux rapidement et en toute sécurité."), time: t("Kounye a", "Maintenant") },
  { emoji: "🛰️", title: t("Nouvo: Starlink", "Nouveau : Starlink"), text: t("Ou ka peye abònman Starlink ou sou sit la.", "Payez votre abonnement Starlink sur le site."), time: t("Jodi a", "Aujourd'hui") },
  { emoji: "🔥", title: t("Free Fire disponib", "Free Fire disponible"), text: t("Dyaman Free Fire yo disponib, livrezon rapid.", "Les diamants Free Fire sont disponibles, livraison rapide."), time: t("Jodi a", "Aujourd'hui") },
];
