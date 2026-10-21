import React, { useEffect, useRef, useState } from "react";
import { Moon, Sun, Bell, Settings, Search, Home, ShoppingCart, Tag, History, Wallet, X, Gem } from "lucide-react";
import { PRODUCTS, CATEGORIES, SLIDES, NOTIFICATIONS, WHATSAPP_NUMBER, VIDEO_TUTORIAL_URL } from "./data.js";

/* ============ UTIL ============ */
function waLink(text) {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

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

/* ============ IKÒN ============ */
function Logo({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="aswer-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M18 8h28l14 16-28 34L4 24z" fill="url(#aswer-gem)" />
      <path d="M4 24h56M18 8l14 50M46 8 32 58M18 8l-4 16M46 8l4 16" stroke="#fff" strokeOpacity=".55" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.04.72C5.79.72.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.08 11.34-11.33 0-3.03-1.18-5.87-3.32-8.01" />
    </svg>
  );
}

/* ============ KOMPOZAN ============ */
function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative grid h-11 w-11 place-items-center rounded-full text-slate-600 transition hover:bg-slate-200/70 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function Sheet({ open, onClose, title, footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <IconButton label="Fèmen" onClick={onClose}><X className="h-5 w-5" /></IconButton>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 ${footer ? "pb-4" : "pb-8 sm:pb-5"}`}>{children}</div>
        {/* Footer la rete anba fenèt la menm lè lis la long */}
        {footer && <div className="border-t border-slate-100 px-5 pb-8 pt-3 dark:border-slate-800 sm:pb-5">{footer}</div>}
      </div>
    </div>
  );
}

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
          {SLIDES.map((s, i) => (
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
        <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
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

function ProductCard({ product: p, onOpen }) {
  const Tag = onOpen ? "button" : "div";
  return (
    <Tag
      {...(onOpen && { type: "button", onClick: () => onOpen(p) })}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-black/5 transition active:scale-[.98] dark:ring-white/10"
    >
      {p.image ? (
        <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.25),transparent_55%)]" />
          <p.Icon className="absolute left-1/2 top-[44%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow-lg transition duration-300 group-hover:scale-110" strokeWidth={1.5} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" />
      {p.isNew && (
        <span className="absolute left-3 top-3 rounded-full bg-emerald-300 px-3 py-1 text-[11px] font-extrabold tracking-[.15em] text-emerald-950 shadow">
          NOUVEAU
        </span>
      )}
      <span className="absolute inset-x-3 bottom-3 text-[15px] font-bold leading-tight text-white drop-shadow">{p.name}</span>
    </Tag>
  );
}

function ProductGrid({ products, onOpen }) {
  if (products.length === 0) {
    return <p className="rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">Pa gen jwèt ki koresponn ak rechèch ou a.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} onOpen={onOpen} />)}
    </div>
  );
}

function ProductSheet({ product, onClose }) {
  const packages = product.packages || [];
  const [selected, setSelected] = useState(null);
  const pkg = packages[selected];
  const mustChoose = packages.length > 0 && !pkg;
  const message = pkg
    ? `Bonjou Aswer Top Up, mwen vle achte ${product.name}${pkg.group ? ` (${pkg.group})` : ""}: ${pkg.label} (${pkg.price} gdes).`
    : `Bonjou Aswer Top Up, mwen vle achte ${product.name}.`;

  // Mete pake ki gen menm `group` yo ansanm anba yon menm tit
  const sections = [];
  packages.forEach((p, i) => {
    const last = sections[sections.length - 1];
    if (!last || last.title !== p.group) sections.push({ title: p.group, items: [] });
    sections[sections.length - 1].items.push({ ...p, index: i });
  });

  const footer = mustChoose ? (
    <button type="button" disabled className="w-full rounded-xl bg-slate-200 py-3.5 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      Chwazi yon pake
    </button>
  ) : (
    <a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 font-semibold text-white hover:brightness-95"
    >
      <WhatsAppIcon className="h-5 w-5" /> Kòmande sou WhatsApp{pkg && ` · ${pkg.price} gdes`}
    </a>
  );

  return (
    <Sheet open onClose={onClose} title={product.name} footer={footer}>
      <div className="flex items-center gap-4">
        <div className="w-24 shrink-0"><ProductCard product={{ ...product, name: "", isNew: false }} /></div>
        <div>
          <p className="text-sm font-semibold text-sky-500">{product.category}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {packages.length > 0
              ? "Chwazi pake ou vle a, epi kòmande l sou WhatsApp."
              : "Voye yon mesaj ban nou sou WhatsApp, n ap ba w pri yo ak tout opsyon ki disponib yo."}
          </p>
        </div>
      </div>

      {packages.length > 0 && (
        <div className="mt-5 space-y-5" role="radiogroup" aria-label="Pake">
          {sections.map((s) => (
            <section key={s.title || "pake"}>
              {s.title && (
                <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{s.title}</h4>
              )}
              <ul className="space-y-2">
                {s.items.map((p) => {
                  const active = p.index === selected;
                  return (
                    <li key={p.label}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelected(p.index)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left ring-2 transition ${
                          active ? "bg-sky-50 ring-sky-500 dark:bg-sky-500/10" : "bg-slate-50 ring-transparent hover:ring-slate-200 dark:bg-slate-800/60 dark:hover:ring-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                          <Gem className="h-4 w-4 shrink-0 text-sky-500" /> {p.label}
                        </span>
                        <span className="shrink-0 font-bold text-sky-600 dark:text-sky-400">{p.price} gdes</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
      <Search className="h-5 w-5 shrink-0 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un jeu..."
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
  const [product, setProduct] = useState(null);
  const [panel, setPanel] = useState(null); // "notifications" | "settings"
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const q = query.trim().toLowerCase();
  const filtered = PRODUCTS.filter((p) =>
    (!q || p.name.toLowerCase().includes(q)) && (tab !== "shop" || category === "Tout" || p.category === category)
  );

  const handleSlideAction = (action) => {
    if (action === "video") {
      if (VIDEO_TUTORIAL_URL) openExternal(VIDEO_TUTORIAL_URL);
      else setToast("Videyo a poko disponib, li ap vini byento.");
    } else if (action === "whatsapp") {
      openExternal(waLink("Bonjou Aswer Top Up, mwen bezwen èd."));
    } else if (action.startsWith("product:")) {
      const p = PRODUCTS.find((x) => x.id === action.slice(8));
      if (p) setProduct(p);
    }
  };

  const openNotifications = () => { setPanel("notifications"); setUnread(0); };
  const currentTab = TABS.find((t) => t.id === tab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-30 bg-slate-100/85 backdrop-blur-md dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => setTab("home")} className="flex items-center gap-3" aria-label="Aswer Top Up, lakay">
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
            <IconButton label="Paramèt" onClick={() => setPanel("settings")}>
              <Settings className="h-6 w-6" />
            </IconButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-36 pt-2">
        {tab === "home" && (
          <>
            <SearchBar value={query} onChange={setQuery} />
            {!q && <div className="mt-5"><Carousel onAction={handleSlideAction} /></div>}
            <h2 className="mb-4 mt-7 text-2xl font-extrabold tracking-tight">Produits Disponibles</h2>
            <ProductGrid products={filtered} onOpen={setProduct} />
          </>
        )}

        {tab === "shop" && (
          <>
            <SearchBar value={query} onChange={setQuery} />
            <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
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
            <h2 className="mb-4 mt-6 text-2xl font-extrabold tracking-tight">Boutique</h2>
            <ProductGrid products={filtered} onOpen={setProduct} />
          </>
        )}

        {tab !== "home" && tab !== "shop" && <ComingSoon tab={currentTab} onHome={() => setTab("home")} />}
      </main>

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

      {product && <ProductSheet key={product.id} product={product} onClose={() => setProduct(null)} />}

      <Sheet open={panel === "notifications"} onClose={() => setPanel(null)} title="Notifikasyon">
        <ul className="space-y-2">
          {NOTIFICATIONS.map((n, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">{n.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">{n.time}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={panel === "settings"} onClose={() => setPanel(null)} title="Paramèt">
        <div className="space-y-2">
          <button type="button" onClick={toggleTheme} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 font-medium dark:bg-slate-800/60">
            <span className="flex items-center gap-3">{dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} Tèm</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{dark ? "Fonse" : "Klè"}</span>
          </button>
          <a href={waLink("Bonjou Aswer Top Up, mwen bezwen èd.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-medium dark:bg-slate-800/60">
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> Kontakte sipò a
          </a>
        </div>
      </Sheet>

      {toast && (
        <div className="fixed inset-x-4 top-20 z-[60] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-xl dark:bg-white dark:text-slate-900" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
