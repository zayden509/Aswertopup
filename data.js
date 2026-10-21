import {
  Flame, Satellite, Crosshair, Target, Swords, Shield, Tv, Music, Blocks, Play, Gift, Coins,
  PlayCircle, CreditCard, MessageCircle,
} from "lucide-react";
import freeFireImg from "./free-fire.jpg";

/* ============ KONFIGIRASYON ============ */
// Mete nimewo WhatsApp la ak kòd peyi a, san "+" ni espas (egzanp: "50937000000").
export const WHATSAPP_NUMBER = "";
// Lyen videyo tutoriel la (YouTube, TikTok…). Kite l vid si l poko pare.
export const VIDEO_TUTORIAL_URL = "";

/* ============ PWODWI ============ */
// Pou mete yon foto sou yon pwodwi: mete foto a nan menm dosye a, enpòte l anlè fichye sa a
// (egzanp `import pubgImg from "./pubg.jpg";`) epi ajoute `image: pubgImg` sou pwodwi a.
// `packages` se lis pake yo ak pri yo an goud; kliyan an chwazi youn anvan l kòmande.
export const CATEGORIES = ["Tout", "Jwèt", "Abònman", "Gift Card"];

export const PRODUCTS = [
  {
    id: "free-fire",
    name: "Free Fire Pin USA/LATAM",
    category: "Jwèt",
    isNew: true,
    image: freeFireImg,
    packages: [
      { label: "100 + BONUS 10", price: 155 },
      { label: "310 + BONUS 31", price: 460 },
      { label: "1060 + BONUS 106", price: 1550 },
      { label: "2180 + BONUS 218", price: 3100 },
      { label: "5600 + BONUS 560", price: 7500 },
    ],
  },
  {
    id: "free-fire-abonnement",
    name: "Abonnement Free Fire",
    category: "Abònman",
    isNew: true,
    image: freeFireImg,
    packages: [
      { label: "SEMAINE", price: 350 },
      { label: "MOIS", price: 1800 },
      { label: "BOOYAH PASS PAR ID", price: 600 },
      { label: "LEVEL UP PASS 1355💎", price: 900 },
    ],
  },
  { id: "starlink", name: "STARLINK", category: "Abònman", isNew: true, Icon: Satellite, gradient: "from-slate-800 via-indigo-950 to-black" },
  { id: "pubg", name: "PUBG Mobile", category: "Jwèt", Icon: Crosshair, gradient: "from-yellow-500 via-amber-600 to-stone-800" },
  { id: "codm", name: "Call of Duty Mobile", category: "Jwèt", Icon: Target, gradient: "from-zinc-600 via-zinc-800 to-black" },
  { id: "blood-strike", name: "Blood Strike", category: "Jwèt", Icon: Swords, gradient: "from-rose-600 via-red-700 to-slate-900" },
  { id: "mlbb", name: "Mobile Legends", category: "Jwèt", Icon: Shield, gradient: "from-sky-500 via-indigo-600 to-violet-800" },
  { id: "roblox", name: "Roblox", category: "Jwèt", Icon: Blocks, gradient: "from-slate-500 via-slate-700 to-slate-900" },
  { id: "netflix", name: "Netflix", category: "Abònman", Icon: Tv, gradient: "from-red-600 via-red-800 to-black" },
  { id: "spotify", name: "Spotify", category: "Abònman", Icon: Music, gradient: "from-green-400 via-emerald-600 to-slate-900" },
  { id: "google-play", name: "Google Play", category: "Gift Card", Icon: Play, gradient: "from-emerald-400 via-sky-500 to-indigo-600" },
  { id: "app-store", name: "App Store & iTunes", category: "Gift Card", Icon: Gift, gradient: "from-pink-500 via-fuchsia-600 to-indigo-700" },
  { id: "tiktok", name: "TikTok Coins", category: "Gift Card", Icon: Coins, gradient: "from-cyan-400 via-slate-900 to-pink-500" },
];

/* ============ BANYE (KAROUSÈL) ============ */
// action: "video" | "whatsapp" | "product:<id>"
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
    action: "whatsapp",
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
