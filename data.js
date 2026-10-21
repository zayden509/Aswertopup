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
import moncashImg from "./img/moncash.jpg";
import natcashImg from "./img/natcash.jpg";
import bannerTutoriel from "./img/banners/tutoriel.jpg";
import bannerFreeFire from "./img/banners/free-fire.jpg";
import bannerPeman from "./img/banners/peman.jpg";
import bannerSipo from "./img/banners/sipo.jpg";

/* ============ KONFIGIRASYON ============ */
// Mete nimewo WhatsApp la ak kòd peyi a, san "+" ni espas (egzanp: "50937000000").
export const WHATSAPP_NUMBER = "";
// Lyen videyo tutoriel la (YouTube, TikTok…). Kite l vid si l poko pare.
export const VIDEO_TUTORIAL_URL = "";

// Baz done Supabase (Project Settings → API). Si yo vid, sit la mache an mòd
// WhatsApp sèlman: pa gen kont, pa gen Wallet.
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
// Mete true lè w fin aktive Google nan Supabase (Authentication → Providers → Google)
export const GOOGLE_LOGIN = false;

// Rang kliyan yo selon kantite kòb yo depanse (an goud)
export const RANKS = [
  { name: "Bronze", min: 5000, emoji: "🥉" },
  { name: "Argent", min: 20000, emoji: "🥈" },
  { name: "Or", min: 50000, emoji: "🥇" },
  { name: "Diamant", min: 100000, emoji: "💎" },
];

/* ============ PEMAN ============ */
// `number` se nimewo kote kliyan yo voye kòb la. Si l vid, sit la di kliyan an
// mande nimewo a sou WhatsApp.
export const PAYMENT_METHODS = [
  { id: "moncash", name: "MonCash", logo: moncashImg, number: "", recommended: true, note: "Peye ak kont MonCash ou" },
  { id: "natcash", name: "NatCash", logo: natcashImg, number: "", note: "Peye ak kont NatCash ou" },
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
// `id` yon pake dwe menm ak `id` li nan tab `packages` Supabase la (supabase/schema.sql):
// lè baz done a konekte, se pri ki nan baz done a ki konte.
export const CATEGORIES = ["Tout", "Jwèt", "Abònman", "Gift Card", "Finans"];

const FREE_FIRE_ID_HELP = "Louvri Free Fire epi peze foto pwofil ou anwo agoch. UID ou se nimewo ki anba non ou a.";

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
  { id: "netflix", name: "Netflix", category: "Abònman", image: netflixImg, bg: "#000000" },
  { id: "spotify", name: "Spotify", category: "Abònman", Icon: Music, gradient: "from-green-400 via-emerald-600 to-slate-900" },
  { id: "google-play", name: "Google Play", category: "Gift Card", Icon: Play, gradient: "from-emerald-400 via-sky-500 to-indigo-600" },
  { id: "app-store", name: "App Store & iTunes", category: "Gift Card", image: appStoreImg, bg: "#ffffff" },
  { id: "tiktok", name: "TikTok Coins", category: "Gift Card", Icon: Coins, gradient: "from-cyan-400 via-slate-900 to-pink-500" },
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
  { id: "cash-app", name: "Cash App", category: "Finans", image: cashAppImg, bg: "#ffffff" },
  { id: "binance", name: "Binance Pay", category: "Finans", image: binanceImg, bg: "#151a1d" },
  { id: "wise", name: "Wise", category: "Finans", image: wiseImg, bg: "#9ee86f" },
  { id: "meru", name: "Meru", category: "Finans", image: meruImg, bg: "#ffffff" },
];

/* ============ BANYE (KAROUSÈL) ============ */
// action: "video" | "whatsapp" | "payment" | "product:<id>"
// `image`: foto banye a (1200 × 600). San `image`, banye a parèt ak tèks yo.
export const SLIDES = [
  {
    emoji: "🔔",
    title: "Tutoriel kijan pou w top up?",
    image: bannerTutoriel,
    text: "Videyo sa a se pou nenpòt rechaj ak lòt jwèt sou sit la.",
    button: "Video Tutoriel",
    action: "video",
    Art: PlayCircle,
  },
  {
    emoji: "🔥",
    title: "Dyaman Free Fire",
    image: bannerFreeFire,
    text: "Rechaje dyaman ou yo, livrezon an kèk minit sèlman.",
    button: "Achte kounye a",
    action: "product:free-fire",
    Art: Flame,
  },
  {
    emoji: "💳",
    title: "Peye an goud",
    image: bannerPeman,
    text: "Peye ak MonCash oswa NatCash, san kat bank, 24h/24.",
    button: "Kijan pou m peye?",
    action: "payment",
    Art: CreditCard,
  },
  {
    emoji: "💬",
    title: "Ou bezwen èd?",
    image: bannerSipo,
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
