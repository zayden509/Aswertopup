import React, { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun, Bell, Settings, Search, Home, ShoppingCart, Tag, History, Wallet, ArrowRight } from "lucide-react";
import { PRODUCTS, CATEGORIES, HOME_SECTIONS, SLIDES, NOTIFICATIONS, VIDEO_TUTORIAL_URL } from "./data.js";
import { waLink, openExternal, Logo, WhatsAppIcon, IconButton, ProductCard, ProductTile } from "./ui.jsx";
import { loadOrders, saveOrder } from "./orders.js";
import { useAccount } from "./account.js";
import ProductPage from "./ProductPage.jsx";
import PaymentPage from "./PaymentPage.jsx";
import HistoryPage, { OrderSheet } from "./HistoryPage.jsx";
import WalletPage from "./WalletPage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import AdminPage from "./AdminPage.jsx";
import AuthSheet, { NewPasswordSheet } from "./AuthSheet.jsx";
import { DepositSheet, TransferSheet } from "./WalletSheets.jsx";
import { NotificationsSheet, LiveToast } from "./Notifications.jsx";

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
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
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
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-700">
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

// Yon seksyon paj akèy: tit nan mitan, "Voir tout", ak yon ranje ki defile sou kote
function ProductRail({ section, prices, onOpen, onSeeAll }) {
  const products = PRODUCTS.filter((p) => p.category === section.category);
  if (products.length === 0) return null;
  return (
    <section className="mt-9" aria-label={section.title}>
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
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
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
      className="fixed inset-x-3 z-40 mx-auto max-w-xl rounded-[28px] bg-white/90 p-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/90 dark:ring-slate-800"
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
  const [product, setProduct] = useState(() => PRODUCTS.find((p) => p.id === window.history.state?.product) || null);
  const [localOrders, setLocalOrders] = useState(loadOrders);
  const [panel, setPanel] = useState(null); // "notifications" | "deposit" | "transfer"
  const [auth, setAuth] = useState(null); // "login" | "signup"
  const [openOrderId, setOpenOrderId] = useState(null);
  const [staticUnread, setStaticUnread] = useState(NOTIFICATIONS.length);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState(null); // notifikasyon k ap monte a
  const [installPrompt, setInstallPrompt] = useState(null);

  const account = useAccount(useCallback((n) => setLive(n), []));
  const closeLive = useCallback(() => setLive(null), []);
  const signedIn = account.enabled && Boolean(account.user);
  const openOrder = account.orders.find((o) => o.id === openOrderId) || null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onPop = (e) => setProduct(PRODUCTS.find((p) => p.id === e.state?.product) || null);
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

  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab, product]);

  // Lè kliyan an konekte, nou fèmen fenèt koneksyon an
  useEffect(() => { if (signedIn) setAuth(null); }, [signedIn]);

  const q = query.trim().toLowerCase();
  const filtered = PRODUCTS.filter((p) =>
    (!q || p.name.toLowerCase().includes(q)) && (tab !== "shop" || category === "Tout" || p.category === category)
  );

  const openProduct = (p) => {
    try { window.history.pushState({ product: p.id }, ""); } catch {}
    setProduct(p);
  };
  const closeProduct = () => {
    if (window.history.state?.product) window.history.back();
    else setProduct(null);
  };
  const goToTab = (id) => {
    if (product) closeProduct();
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
  const startDeposit = () => (signedIn ? setPanel("deposit") : needLogin("login"));

  // Ouvri sa yon notifikasyon pale de li: kòmand lan, oswa Wallet la
  const openNotification = (n) => {
    setLive(null);
    setPanel(null);
    if (n.kind === "order") {
      const order = account.orders.find((o) => o.code === n.ref);
      goToTab("history");
      if (order) setOpenOrderId(order.id);
    } else if (n.kind === "deposit" || n.kind === "transfer") {
      goToTab("wallet");
    }
  };

  const handleSlideAction = (action) => {
    if (action === "video") {
      if (VIDEO_TUTORIAL_URL) openExternal(VIDEO_TUTORIAL_URL);
      else setToast("Videyo a poko disponib, li ap vini byento.");
    } else if (action === "whatsapp") {
      openExternal(waLink("Bonjou Aswer Top Up, mwen bezwen èd."));
    } else if (action === "payment") {
      setTab("wallet");
    } else if (action.startsWith("product:")) {
      const p = PRODUCTS.find((x) => x.id === action.slice(8));
      if (p) openProduct(p);
    }
  };

  const unread = signedIn ? account.unread : staticUnread;
  const openNotifications = () => {
    setPanel("notifications");
    if (!signedIn) setStaticUnread(0);
  };
  const currentTab = TABS.find((t) => t.id === tab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-30 bg-slate-100/85 backdrop-blur-md dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => goToTab("home")} className="flex items-center gap-3" aria-label="Aswer Top Up, lakay">
            <Logo className="h-11 w-11 drop-shadow" />
            <span className="flex items-baseline gap-1">
              <span className="text-[28px] font-black leading-none tracking-tight">ASWER</span>
              <span className="text-[11px] font-extrabold tracking-wide text-slate-700 dark:text-slate-300">TOPUP HT</span>
            </span>
          </button>
          <div className="flex items-center">
            <IconButton label={dark ? "Mòd klè" : "Mòd fonse"} onClick={toggleTheme}>
              {dark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </IconButton>
            <IconButton label="Notifikasyon" onClick={openNotifications}>
              <Bell className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 min-w-[22px] rounded-full bg-red-500 px-1.5 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-slate-100 dark:ring-slate-950">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </IconButton>
            <IconButton label="Paramèt" onClick={() => goToTab("settings")}>
              <Settings className="h-6 w-6" />
            </IconButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-36 pt-2">
        {product && (
          <ProductPage
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
                {HOME_SECTIONS.map((s) => (
                  <ProductRail key={s.category} section={s} prices={account.prices} onOpen={openProduct} onSeeAll={seeAll} />
                ))}
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
          />
        )}
        {!product && tab === "admin" && account.profile?.is_admin && <AdminPage onBack={() => setTab("settings")} onToast={setToast} />}
      </main>

      {!product && (
        <>
          <a
            href={waLink("Bonjou Aswer Top Up!")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ekri nou sou WhatsApp"
            className="fixed right-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white/60 transition hover:scale-105 dark:ring-slate-950/60"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 108px)" }}
          >
            <WhatsAppIcon className="h-9 w-9" />
          </a>

          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}

      {panel === "notifications" && (
        <NotificationsSheet account={account} onClose={() => setPanel(null)} onLogin={(m) => { setPanel(null); needLogin(m); }} onOpen={openNotification} />
      )}
      {panel === "deposit" && signedIn && <DepositSheet onClose={() => setPanel(null)} onToast={setToast} />}
      {panel === "transfer" && signedIn && <TransferSheet profile={account.profile} onClose={() => setPanel(null)} />}
      {openOrder && <OrderSheet order={openOrder} onClose={() => setOpenOrderId(null)} onToast={setToast} />}
      {auth && account.enabled && !signedIn && <AuthSheet initialMode={auth} onClose={() => setAuth(null)} />}
      {account.recovery && <NewPasswordSheet onClose={account.endRecovery} />}

      {live && <LiveToast notification={live} onOpen={() => openNotification(live)} onClose={closeLive} />}
      {toast && (
        <div className="fixed inset-x-4 top-20 z-[60] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-xl dark:bg-white dark:text-slate-900" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
