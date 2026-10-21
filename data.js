import {
  Flame, Satellite, Target, Shield, Music, Play, Coins,
  PlayCircle, CreditCard, MessageCircle, CalendarDays, CalendarRange, Ticket, TrendingUp,
} from "lucide-react";
import freeFireImg from "./img/free-fire.jpg";
import pubgImg from "./img/pubg.jpg";
import robloxImg from "./img/roblox.jpg";
import bloodStrikeImg from "./img/blood-strike.jpg";
import netflixImg from "./img/netflix.jpg";
import appStoreImg from "./img/app-store.jpg";
import moncashImg from "./img/moncash.jpg";
import natcashImg from "./img/natcash.jpg";

/* ============ KONFIGIRASYON ============ */
// Mete nimewo WhatsApp la ak kòd peyi a, san "+" ni espas (egzanp: "50937000000").
export const WHATSAPP_NUMBER = "";
// Lyen videyo tutoriel la (YouTube, TikTok…). Kite l vid si l poko pare.
export const VIDEO_TUTORIAL_URL = "";

/* ============ PEMAN ============ */
// `number` se nimewo kote kliyan yo voye kòb la. Si l vid, sit la di kliyan an
// mande nimewo a sou WhatsApp.
export const PAYMENT_METHODS = [
  { id: "moncash", name: "MonCash", logo: moncashImg, number: "", recommended: true, note: "Peye ak kont MonCash ou" },
  { id: "natcash", name: "NatCash", logo: natcashImg, number: "", note: "Peye ak kont NatCash ou" },
];

/* ============ PWODWI ============ */
// Pou mete yon foto sou yon pwodwi: mete foto a nan dosye img/, enpòte l anlè fichye sa a
// epi ajoute `image: nonImaj` sou pwodwi a.
//
// `groups` se seksyon pake yo (pri an goud):
//   - style "gem": kat dyaman (label = kantite, bonus = dyaman an plis)
//   - style "deal": kat abònman / pas, ak yon ikòn
// `playerId: true` mande kliyan an Player ID (UID) li; `needsId: true` sou yon pake
// fè ID a obligatwa pou pake sa a.
export const CATEGORIES = ["Tout", "Jwèt", "Abònman", "Gift Card"];

const FREE_FIRE_ID_HELP = "Louvri Free Fire epi peze foto pwofil ou anwo agoch. UID ou se nimewo ki anba non ou a.";

const FREE_FIRE_DIAMANTS = {
  title: "Diamants",
  style: "gem",
  items: [
    { label: "100", bonus: 10, price: 155 },
    { label: "310", bonus: 31, price: 460 },
    { label: "1060", bonus: 106, price: 1550 },
    { label: "2180", bonus: 218, price: 3100 },
    { label: "5600", bonus: 560, price: 7500 },
  ],
};

const FREE_FIRE_ABONNEMENT = {
  title: "Abonnement",
  style: "deal",
  items: [
    { label: "SEMAINE", price: 350, needsId: true, Icon: CalendarDays },
    { label: "MOIS", price: 1800, needsId: true, Icon: CalendarRange },
    { label: "BOOYAH PASS PAR ID", price: 600, needsId: true, Icon: Ticket },
    { label: "LEVEL UP PASS 1355💎", price: 900, needsId: true, Icon: TrendingUp },
  ],
};

export const PRODUCTS = [
  {
    id: "free-fire",
    name: "Free Fire Pin USA/LATAM",
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
  { id: "starlink", name: "STARLINK", category: "Abònman", isNew: true, Icon: Satellite, gradient: "from-slate-800 via-indigo-950 to-black" },
  { id: "pubg", name: "PUBG Mobile", category: "Jwèt", image: pubgImg },
  { id: "codm", name: "Call of Duty Mobile", category: "Jwèt", Icon: Target, gradient: "from-zinc-600 via-zinc-800 to-black" },
  { id: "blood-strike", name: "Blood Strike", category: "Jwèt", image: bloodStrikeImg },
  { id: "mlbb", name: "Mobile Legends", category: "Jwèt", Icon: Shield, gradient: "from-sky-500 via-indigo-600 to-violet-800" },
  { id: "roblox", name: "Roblox", category: "Jwèt", image: robloxImg },
  { id: "netflix", name: "Netflix", category: "Abònman", image: netflixImg },
  { id: "spotify", name: "Spotify", category: "Abònman", Icon: Music, gradient: "from-green-400 via-emerald-600 to-slate-900" },
  { id: "google-play", name: "Google Play", category: "Gift Card", Icon: Play, gradient: "from-emerald-400 via-sky-500 to-indigo-600" },
  { id: "app-store", name: "App Store & iTunes", category: "Gift Card", image: appStoreImg },
  { id: "tiktok", name: "TikTok Coins", category: "Gift Card", Icon: Coins, gradient: "from-cyan-400 via-slate-900 to-pink-500" },
];

/* ============ BANYE (KAROUSÈL) ============ */
// action: "video" | "whatsapp" | "payment" | "product:<id>"
export const SLIDES = [
  {
    emoji: "🔔",
    title: "Tutoriel kijan pou w top up?",
    text: "Videyo sa a se pou nenpòt rechaj ak lòt jwèt sou sit la.",
    button: "Video Tutoriel",
    action: "video",
    Art: PlayCircle,
  },
  {
    emoji: "🔥",
    title: "Dyaman Free Fire",
    text: "Rechaje dyaman ou yo, livrezon an kèk minit sèlman.",
    button: "Achte kounye a",
    action: "product:free-fire",
    Art: Flame,
  },
  {
    emoji: "💳",
    title: "Peye an goud",
    text: "Peye ak MonCash oswa NatCash, san kat bank, 24h/24.",
    button: "Kijan pou m peye?",
    action: "payment",
    Art: CreditCard,
  },
  {
    emoji: "💬",
    title: "Ou bezwen èd?",
    text: "Ekip Aswer Top Up la la pou reponn ou sou WhatsApp.",
    button: "Kontakte nou",
    action: "whatsapp",
    Art: MessageCircle,
  },
];

/* ============ NOTIFIKASYON ============ */
export const NOTIFICATIONS = [
  { emoji: "🎉", title: "Byenvini sou Aswer Top Up", text: "Rechaje jwèt ou yo rapid e an sekirite.", time: "Kounye a" },
  { emoji: "🛰️", title: "Nouvo: Starlink", text: "Ou ka peye abònman Starlink ou sou sit la.", time: "Jodi a" },
  { emoji: "🔥", title: "Free Fire disponib", text: "Dyaman Free Fire yo disponib, livrezon rapid.", time: "Jodi a" },
];
