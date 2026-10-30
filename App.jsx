import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Menu, UserRound, Search, Home, ShoppingCart, Tag, History, Wallet, ArrowRight, Loader2, Share, MoreVertical } from "lucide-react";
import { CATEGORIES, HOME_SECTIONS, SLIDES, NOTIFICATIONS } from "./data.js";
import { waLink, supportMessage, openExternal, Logo, WhatsAppIcon, IconButton, ProductCard, ProductTile, Sheet } from "./ui.jsx";
import { loadOrders, saveOrder } from "./orders.js";
import { useAccount } from "./account.js";
import { buildCatalog } from "./catalog.js";
import { backend } from "./backend.js";
import ProductPage from "./ProductPage.jsx";
import HistoryPage, { OrderSheet } from "./HistoryPage.jsx";
import WalletPage from "./WalletPage.jsx";
import { UserAvatar } from "./ProfileWallet.jsx";
import SideMenu from "./SideMenu.jsx";
import Footer from "./Footer.jsx";
import AuthSheet from "./AuthSheet.jsx";
import { DepositSheet, TransferSheet } from "./WalletSheets.jsx";
import { NotificationsSheet, LiveToast } from "./Notifications.jsx";
import { newVersionAvailable } from "./updateCheck.js";
import { TutorialSheet, openTutorial, useTutorialRequests } from "./Tutorial.jsx";

// Si yon nouvo vèsyon sit la soti pandan paj la louvri, ansyen fichye yo pa egziste ankò:
// nou rechaje paj la (yon fwa pa minit) olye nou kite l kase
function lazyPage(load) {
  return lazy(() => load().catch((error) => {
    try {
      const last = Number(sessionStorage.getItem("awens-reload") || 0);
      if (Date.now() - last > 60000) {
        sessionStorage.setItem("awens-reload", String(Date.now()));
        window.location.reload();
        return new Promise(() => {});
      }
    } catch {}
    throw error;
  }));
}

// Panneau admin lan chaje sèlman pou admin yo
const AdminPage = lazyPage(() => import("./AdminPage.jsx"));

// Paj sa yo pa sou paj akèy la: yo chaje apre boutik la parèt, pou premye afichaj la pi vit
const LATER_PAGES = [() => import("./ExchangePage.jsx"), () => import("./SettingsPage.jsx"), () => import("./PaymentPage.jsx")];
const ExchangePage = lazyPage(LATER_PAGES[0]);
const SettingsPage = lazyPage(LATER_PAGES[1]);
const PaymentPage = lazyPage(LATER_PAGES[2]);
const pageSpinner = <Loader2 className="mx-auto mt-16 h-8 w-8 animate-spin text-sky-500" />;

/* ============ UTIL ============ */
function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#020617" : "#f1f5f9");
  }, [dark]);
  const toggle = () => {
    setDark((d) => {
      try { localStorage.setItem("aswer-theme", d ? "light" : "dark"); } catch {}
      return !d;
    });
  };
  return [dark, toggle];
}

/* ============ KOMPOZAN ============ */
function Carousel({ onAction }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const total = SLIDES.length;

  // Avanse otomatikman; chak fwa index la chanje (menm alamen) revèy la rekòmanse
  useEffect(() => {
    const t = setTimeout(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearTimeout(t);
  }, [index, total]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) setIndex((i) => (i + (dx < 0 ? 1 : -1) + total) % total);
    touchX.current = null;
  };

  return (
    <section aria-label="Anons">
      <div
        className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        // Bloke navigatè a pou l pa woule kad la poukont li (focus, rechèch nan paj la)
        onScroll={(e) => { e.currentTarget.scrollLeft = 0; }}
      >
        <div className="flex transition-transform duration-500 ease-out will-change-transform" style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}>
          {SLIDES.map((s, i) => s.image ? (
            // Banye ak foto: tout imaj la se yon bouton
            <button
              key={i}
              type="button"
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i !== index}
              aria-label={s.title}
              onClick={() => onAction(s.action)}
              className="block w-full shrink-0"
            >
              <img src={s.image} alt={s.title} loading={i === 0 ? "eager" : "lazy"} className="block aspect-[2/1] w-full object-cover" />
            </button>
          ) : (
            <div key={i} className="relative min-h-[190px] w-full shrink-0 overflow-hidden p-5 sm:p-6" aria-hidden={i !== index}>
              <s.Art className="pointer-events-none absolute -bottom-8 -right-6 h-48 w-48 text-sky-500/10 dark:text-sky-400/10" strokeWidth={1.25} />
              <div className="flex items-center gap-3 pr-16">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-xl ring-1 ring-sky-100 dark:bg-sky-500/10 dark:ring-sky-500/20">{s.emoji}</span>
                <h2 className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white sm:text-xl">{s.title}</h2>
              </div>
              <p className="relative mt-3 max-w-md text-[15px] text-slate-600 dark:text-slate-400">{s.text}</p>
              <button
                type="button"
                tabIndex={i === index ? 0 : -1}
                onClick={() => onAction(s.action)}
                className="relative mt-4 rounded-xl bg-sky-500 px-6 py-3 text-[15px] font-semibold text-white shadow-md shadow-sky-500/25 transition hover:bg-sky-600 active:scale-[.98]"
              >
                {s.button}
              </button>
            </div>
          ))}
        </div>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/90 dark:text-slate-300 dark:ring-slate-700">
          <span className="text-sky-500">{index + 1}</span> / {total}
        </span>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Anons ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-10 bg-sky-500" : "w-2 bg-slate-300 dark:bg-slate-700"}`}
          />
        ))}
      </div>
    </section>
  );
}

function ProductGrid({ products, prices, onOpen }) {
  if (products.length === 0) {
    return <p className="rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">Pa gen pwodwi ki koresponn ak rechèch ou a.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} prices={prices} onOpen={onOpen} />)}
    </div>
  );
}

// Fè yon ranje defile poukont li, yon kat chak 3 segonn, epi tounen nan kòmansman
// an rive nan bout la. Li kanpe lè kliyan an touche ranje a, epi l rekòmanse 6 s apre.
function useAutoScroll(ref, startDelay) {
  useEffect(() => {
    const row = ref.current;
    if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let pausedUntil = 0;
    let visible = true;
    let interval;

    const pause = () => { pausedUntil = Date.now() + 6000; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(row);

    const tick = () => {
      if (!visible || document.hidden || Date.now() < pausedUntil) return;
      const card = row.firstElementChild;
      if (!card || row.scrollWidth <= row.clientWidth) return;
      const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || "0");
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      row.scrollTo({ left: atEnd ? 0 : row.scrollLeft + step, behavior: "smooth" });
    };
    // Chak seksyon kòmanse yon ti jan apre lòt la pou yo pa deplase ansanm
    const start = setTimeout(() => { interval = setInterval(tick, 3000); }, startDelay);

    const events = ["touchstart", "pointerdown", "wheel", "mouseenter", "focusin"];
    events.forEach((e) => row.addEventListener(e, pause, { passive: true }));
    return () => {
      clearTimeout(start);
      clearInterval(interval);
      observer.disconnect();
      events.forEach((e) => row.removeEventListener(e, pause));
    };
  }, [ref, startDelay]);
}

// Yon seksyon paj akèy: tit nan mitan, "Voir tout", ak yon ranje ki defile sou kote
function ProductRail({ section, index, catalog, prices, onOpen, onSeeAll }) {
  const rowRef = useRef(null);
  useAutoScroll(rowRef, 1500 + index * 750);
  const products = catalog.filter((p) => p.category === section.category);
  if (products.length === 0) return null;
  return (
    <section className="mt-9 [contain-intrinsic-size:auto_330px] [content-visibility:auto]" aria-label={section.title}>
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span />
        <div className="text-center">
          <h2 className="text-[22px] font-extrabold tracking-tight text-sky-500 [text-wrap:balance]">{section.title}</h2>
          <span className="mx-auto mt-2 block h-1 w-12 rounded-full bg-sky-500/60" />
        </div>
        <button
          type="button"
          onClick={() => onSeeAll(section.category)}
          className="flex items-center gap-1 justify-self-end whitespace-nowrap text-sm font-semibold text-sky-500 hover:text-sky-600"
        >
          Voir tout <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div ref={rowRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
        {products.map((p) => <ProductTile key={p.id} product={p} prices={prices} tagline={section.tagline} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
      <Search className="h-5 w-5 shrink-0 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
      />
    </label>
  );
}

function ComingSoon({ tab, onHome }) {
  return (
    <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <tab.Icon className="mx-auto h-12 w-12 text-sky-500" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">{tab.label}</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Paj sa a ap vini byento.</p>
      <button type="button" onClick={onHome} className="mt-5 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-600">
        Retounen lakay
      </button>
    </div>
  );
}

const TABS = [
  { id: "home", label: "Accueil", Icon: Home },
  { id: "shop", label: "Boutique", Icon: ShoppingCart },
  { id: "promos", label: "Promos", Icon: Tag },
  { id: "history", label: "Historique", Icon: History },
  { id: "wallet", label: "Wallet", Icon: Wallet },
];

function BottomNav({ tab, onChange }) {
  return (
    <nav
      className="fixed inset-x-3 z-40 mx-auto max-w-xl rounded-[28px] bg-white/[.97] p-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 dark:bg-slate-900/[.97] dark:ring-slate-800"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <ul className="grid grid-cols-5 gap-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-[12px] font-medium transition ${
                  active ? "bg-sky-50 text-sky-500 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-500/30" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                <t.Icon className="h-6 w-6" strokeWidth={1.75} />
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


/* ============ APP ============ */
export default function App() {
  const [dark, toggleTheme] = useTheme();
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tout");
  // Paj pwodwi a anrejistre nan istorik navigatè a pou bouton "retounen" telefòn nan mache
  const [productId, setProductId] = useState(() => window.history.state?.product || null);
  const [localOrders, setLocalOrders] = useState(loadOrders);
  const [panel, setPanel] = useState(null); // "notifications" | "deposit" | "transfer" | "install"
  const [menuOpen, setMenuOpen] = useState(false);
  // Vercel pibliye yon nouvo vèsyon pandan paj la louvri: nou mande moun nan rechaje
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible") newVersionAvailable().then((yes) => yes && setUpdateReady(true));
    };
    const timer = setInterval(check, 10 * 60000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  // AWENS-ID ki soti nan yon kòd QR (?pay=XXXXXXXX): nou louvri "Envoyer" ak ID a deja ekri
  const [payCode, setPayCode] = useState(() => {
    const code = new URLSearchParams(window.location.search).get("pay")?.toUpperCase() || "";
    return /^[A-HJ-NP-Z2-9]{8}$/.test(code) ? code : null;
  });
  const [auth, setAuth] = useState(null); // "login" | "signup"
  const [openOrderId, setOpenOrderId] = useState(null);
  const [staticUnread, setStaticUnread] = useState(NOTIFICATIONS.length);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState(null); // notifikasyon k ap monte a
  const [installPrompt, setInstallPrompt] = useState(null);

  const account = useAccount(useCallback((n) => setLive(n), []));
  const closeLive = useCallback(() => setLive(null), []);
  const catalog = useMemo(() => buildCatalog(account.prices, account.catalog), [account.prices, account.catalog]);
  const product = (productId && catalog.find((p) => p.id === productId)) || null;
  const signedIn = account.enabled && Boolean(account.user);
  const openOrder = account.orders.find((o) => o.id === openOrderId) || null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Chaje lòt paj yo davans lè boutik la fin parèt, pou yo louvri touswit lè kliyan an peze
  useEffect(() => {
    const t = setTimeout(() => LATER_PAGES.forEach((load) => load().catch(() => {})), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onPop = (e) => setProductId(e.state?.product || null);
    window.addEventListener("popstate", onPop);
    // Android Chrome: nou kenbe envitasyon "Installer l'application" an pou bouton nan Paramètres
    const onInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab, productId]);

  // Kontè vizitè yo (yon fwa pa jou pou chak telefòn), pou estatistik admin nan
  useEffect(() => { backend?.trackVisit().catch(() => {}); }, []);

  // Lè kliyan an konekte, nou fèmen fenèt koneksyon an
  useEffect(() => { if (signedIn) setAuth(null); }, [signedIn]);

  // Lyen kòd QR la: retire ?pay= nan adrès la, epi louvri transfè a (oswa koneksyon an anvan)
  useEffect(() => {
    if (!payCode || !account.ready) return;
    if (window.location.search) {
      try { window.history.replaceState(window.history.state, "", window.location.pathname); } catch {}
    }
    if (!account.enabled) setPayCode(null);
    else if (!signedIn) setAuth("login");
    else if (account.profile) setPanel("transfer");
  }, [payCode, account.ready, account.enabled, signedIn, account.profile]);

  const q = query.trim().toLowerCase();
  const filtered = catalog.filter((p) =>
    (!q || p.name.toLowerCase().includes(q)) && (tab !== "shop" || category === "Tout" || p.category === category)
  );

  const openProduct = (p) => {
    try { window.history.pushState({ product: p.id }, ""); } catch {}
    setProductId(p.id);
  };
  const closeProduct = () => {
    if (window.history.state?.product) window.history.back();
    else setProductId(null);
  };
  const goToTab = (id) => {
    if (productId) closeProduct();
    setTab(id);
  };
  const handleLocalOrder = (order) => {
    setLocalOrders(saveOrder(order));
    setToast(`Kòmand ${order.id} anrejistre nan Historique.`);
  };
  const needLogin = (mode = "login") => setAuth(mode);
  const seeAll = (cat) => {
    setCategory(cat);
    setTab("shop");
  };
  // `amount`: sa ki manke pou yon acha (paj pwodwi a), pou depo a deja ranpli
  const [depositAmount, setDepositAmount] = useState("");
  const startDeposit = (amount) => {
    if (!signedIn) return needLogin("login");
    setDepositAmount(typeof amount === "number" ? String(amount) : "");
    setPanel("deposit");
  };

  // Ouvri sa yon notifikasyon pale de li: kòmand lan, oswa Wallet la
  const openNotification = (n) => {
    setLive(null);
    // Mesaj admin yo: louvri lis la pou kliyan an li tout tèks la
    if (n.kind === "message" || n.kind === "announcement") {
      setPanel("notifications");
      return;
    }
    setPanel(null);
    if (n.kind === "order") {
      const order = account.orders.find((o) => o.code === n.ref);
      goToTab("history");
      if (order) setOpenOrderId(order.id);
    } else if (n.kind === "deposit" || n.kind === "transfer") {
      goToTab("wallet");
    }
  };

  // Gid etap pa etap la (oswa videyo a): nenpòt paj ka mande l ak openTutorial()
  useTutorialRequests(useCallback(() => setPanel("tutorial"), []));
  const install = () => (installPrompt ? installPrompt.prompt() : setPanel("install"));
  // Ale nan rang lan (Pwogram fidelite) sou paj pwofil la
  const showRank = () => {
    goToTab("settings");
    setTimeout(() => document.getElementById("rank")?.scrollIntoView({ behavior: "smooth" }), 120);
  };

  const handleSlideAction = (action) => {
    if (action === "video") {
      openTutorial();
    } else if (action === "whatsapp") {
      openExternal(waLink(supportMessage("Bonjou Awens Topup, mwen bezwen èd.", account.profile)));
    } else if (action === "payment") {
      setTab("wallet");
    } else if (action.startsWith("product:")) {
      const p = catalog.find((x) => x.id === action.slice(8));
      if (p) openProduct(p);
    }
  };

  const unread = account.enabled ? account.unread : staticUnread;
  const openNotifications = () => {
    setPanel("notifications");
    if (!account.enabled) setStaticUnread(0);
  };
  const currentTab = TABS.find((t) => t.id === tab);
  // Panneau admin lan gen pwòp ba anlè pa l: meni sit la (anlè ak anba) pa parèt
  const adminView = !product && tab === "admin" && Boolean(account.profile?.is_admin);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      {updateReady && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="fixed inset-x-0 top-2 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Nouvo vèsyon sit la disponib · <span className="underline underline-offset-2">Rechaje</span>
        </button>
      )}
      {/* Pa gen flou (backdrop-blur) sou ba ki rete fiks yo: sa fè paj la woule pi lis sou telefòn */}
      {!adminView && (
        <header className="sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-3">
            <div className="flex min-w-0 items-center gap-1">
              <IconButton label="Meni" onClick={() => setMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </IconButton>
              <button type="button" onClick={() => goToTab("home")} className="flex min-w-0 items-center gap-2" aria-label="Awens Topup, lakay">
                <Logo className="h-10 w-10 shrink-0 drop-shadow" />
                <span className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-[26px] font-black tracking-tight">AWENS</span>
                  <span className="text-[12px] font-extrabold tracking-[.2em] text-sky-500">TOPUP</span>
                </span>
              </button>
            </div>
            <div className="flex shrink-0 items-center">
              <IconButton label="Notifikasyon" onClick={openNotifications}>
                <Bell className="h-6 w-6" />
                {unread > 0 && (
                  <span className="absolute right-0.5 top-0.5 min-w-[22px] rounded-full bg-red-500 px-1.5 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-slate-100 dark:ring-slate-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </IconButton>
              {account.profile ? (
                <button type="button" onClick={() => goToTab("settings")} aria-label="Mon profil" className="ml-1 rounded-full transition active:scale-95">
                  <UserAvatar profile={account.profile} photo={account.photo} className="h-10 w-10 text-sm ring-2 ring-white dark:ring-slate-800" />
                </button>
              ) : (
                <IconButton label="Profil" onClick={() => goToTab("settings")}>
                  <UserRound className="h-6 w-6" />
                </IconButton>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`mx-auto max-w-3xl px-4 pt-2 ${adminView ? "pb-16" : "pb-36"}`}>
        <Suspense fallback={pageSpinner}>
        {product?.exchange && (
          <ExchangePage
            key={product.id}
            product={product}
            account={account}
            onBack={closeProduct}
            onOrder={handleLocalOrder}
            onLogin={needLogin}
            onDeposit={startDeposit}
            onViewOrders={() => goToTab("history")}
          />
        )}
        {product && !product.exchange && (
          <ProductPage
            key={product.id}
            product={product}
            account={account}
            onBack={closeProduct}
            onOrder={handleLocalOrder}
            onLogin={needLogin}
            onDeposit={startDeposit}
            onViewOrders={() => goToTab("history")}
            onToast={setToast}
          />
        )}

        {!product && tab === "home" && (
          <>
            <SearchBar value={query} onChange={setQuery} placeholder="Rechercher un jeu..." />
            {q ? (
              <>
                <h2 className="mb-4 mt-7 text-2xl font-extrabold tracking-tight">Résultats</h2>
                <ProductGrid products={filtered} prices={account.prices} onOpen={openProduct} />
              </>
            ) : (
              <>
                <div className="mt-5"><Carousel onAction={handleSlideAction} /></div>
                {HOME_SECTIONS.map((s, i) => (
                  <ProductRail key={s.category} section={s} index={i} catalog={catalog} prices={account.prices} onOpen={openProduct} onSeeAll={seeAll} />
                ))}
                <Footer email={account.profile?.email} onGo={goToTab} onTutorial={openTutorial} onRank={showRank} />
              </>
            )}
          </>
        )}

        {!product && tab === "shop" && (
          <>
            <SearchBar value={query} onChange={setQuery} placeholder="Rechercher un produit..." />
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Tous les produits</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Top-up ak rechaj an Ayiti: Free Fire, PUBG, Roblox, Mobile Legends. Peye ak MonCash ak NatCash.
            </p>
            <div className="no-scrollbar -mx-4 mb-4 mt-4 flex gap-2 overflow-x-auto px-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    c === category ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <ProductGrid products={filtered} prices={account.prices} onOpen={openProduct} />
          </>
        )}

        {!product && tab === "history" && (
          <HistoryPage account={account} localOrders={localOrders} onShop={() => setTab("shop")} onLogin={needLogin} onOpenOrder={(o) => setOpenOrderId(o.id)} />
        )}
        {!product && tab === "wallet" && (
          account.enabled ? (
            <WalletPage
              account={account}
              onLogin={needLogin}
              onDeposit={startDeposit}
              onTransfer={() => setPanel("transfer")}
              onOpenOrder={(o) => setOpenOrderId(o.id)}
              onToast={setToast}
            />
          ) : (
            <PaymentPage onToast={setToast} />
          )
        )}
        {!product && tab === "promos" && <ComingSoon tab={currentTab} onHome={() => setTab("home")} />}
        {!product && tab === "settings" && (
          <SettingsPage
            account={account}
            dark={dark}
            onToggleTheme={toggleTheme}
            onLogin={needLogin}
            onAdmin={() => setTab("admin")}
            onToast={setToast}
            installPrompt={installPrompt}
            onDeposit={startDeposit}
            onTransfer={() => setPanel("transfer")}
            onOpenOrder={(o) => setOpenOrderId(o.id)}
            onSeeWallet={() => setTab("wallet")}
            onGo={goToTab}
            onNotifications={openNotifications}
            onTutorial={openTutorial}
          />
        )}
        {adminView && (
          <AdminPage account={account} catalog={catalog} onBack={() => setTab("settings")} onToast={setToast} />
        )}
        </Suspense>
      </main>

      {!product && !adminView && (
        <>
          {/* Bouton WhatsApp la pa kouvri Pwofil la (li gen pwòp bouton Sipò) ni Panneau admin lan */}
          {tab !== "admin" && tab !== "settings" && (
            <a
              href={waLink(supportMessage("Bonjou Awens Topup! Mwen gen yon kesyon.", account.profile))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ekri nou sou WhatsApp"
              className="fixed right-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white/60 transition hover:scale-105 dark:ring-slate-950/60"
              style={{ bottom: "calc(env(safe-area-inset-bottom) + 108px)" }}
            >
              <WhatsAppIcon className="h-9 w-9" />
            </a>
          )}

          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}

      {panel === "notifications" && (
        <NotificationsSheet account={account} onClose={() => setPanel(null)} onLogin={(m) => { setPanel(null); needLogin(m); }} onOpen={openNotification} />
      )}
      {panel === "tutorial" && <TutorialSheet onClose={() => setPanel(null)} />}
      {panel === "deposit" && signedIn && <DepositSheet initialAmount={depositAmount} profile={account.profile} onClose={() => setPanel(null)} onToast={setToast} />}
      {panel === "transfer" && signedIn && (
        <TransferSheet profile={account.profile} initialCode={payCode || ""} onClose={() => { setPanel(null); setPayCode(null); }} />
      )}
      {panel === "install" && (
        <Sheet open onClose={() => setPanel(null)} title="Installer l'app">
          <div className="space-y-3 text-[15px] text-slate-700 dark:text-slate-200">
            <p className="flex gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><Share className="h-5 w-5 shrink-0 text-sky-500" /> <span><b>iPhone:</b> nan Safari, peze bouton pataje a anba ekran an, epi <b>Sur l'écran d'accueil</b>.</span></p>
            <p className="flex gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><MoreVertical className="h-5 w-5 shrink-0 text-sky-500" /> <span><b>Android:</b> nan Chrome, peze ⋮ anlè adwat, epi <b>Installer l'application</b>.</span></p>
          </div>
        </Sheet>
      )}
      {menuOpen && (
        <SideMenu
          account={account}
          tab={tab}
          dark={dark}
          onToggleTheme={toggleTheme}
          onClose={() => setMenuOpen(false)}
          onGo={goToTab}
          onNotifications={openNotifications}
          onTutorial={openTutorial}
          onLogin={needLogin}
          onInstall={install}
        />
      )}
      {openOrder && <OrderSheet order={openOrder} catalog={catalog} onClose={() => setOpenOrderId(null)} onToast={setToast} />}
      {auth && account.enabled && !signedIn && <AuthSheet initialMode={auth} onClose={() => setAuth(null)} />}

      {live && <LiveToast notification={live} onOpen={() => openNotification(live)} onClose={closeLive} />}
      {toast && (
        <div className="fixed inset-x-4 top-20 z-[60] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-xl dark:bg-white dark:text-slate-900" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
