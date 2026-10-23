import React, { useEffect } from "react";
import { X, Home, ShoppingCart, Wallet, History, Bell, UserRound, PlayCircle, ShieldCheck, Moon, Sun, Download, LogOut, LogIn, ChevronRight } from "lucide-react";
import { Logo, WhatsAppIcon, waLink, formatPrice } from "./ui.jsx";
import { UserAvatar } from "./ProfileWallet.jsx";

// Meni sou kote a (bouton ☰ anlè agoch)
export default function SideMenu({ account, tab, dark, onToggleTheme, onClose, onGo, onNotifications, onTutorial, onLogin, onInstall }) {
  const profile = account.profile;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const go = (id) => {
    onClose();
    onGo(id);
  };

  const items = [
    { id: "home", label: "Accueil", icon: Home },
    { id: "shop", label: "Boutique", icon: ShoppingCart },
    { id: "wallet", label: "Portefeuille", icon: Wallet },
    { id: "history", label: "Mes commandes", icon: History },
    { id: "notifications", label: "Notifications", icon: Bell, badge: account.unread, run: () => { onClose(); onNotifications(); } },
    { id: "settings", label: "Mon profil", icon: UserRound },
    { id: "tutorial", label: "Aide & tutoriel", icon: PlayCircle, run: () => { onClose(); onTutorial(); } },
    ...(profile?.is_admin ? [{ id: "admin", label: "Panneau admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 !mt-0" role="dialog" aria-modal="true" aria-label="Meni">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/60" onClick={onClose} />
      <aside
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] animate-slide-in-left flex-col overflow-y-auto bg-white shadow-2xl dark:bg-slate-950"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <span className="flex items-center gap-2.5">
            <Logo className="h-10 w-10" />
            <span className="leading-none">
              <span className="block text-xl font-black tracking-tight text-slate-900 dark:text-white">AWENS</span>
              <span className="block text-[11px] font-extrabold tracking-[.3em] text-sky-500">TOPUP</span>
            </span>
          </span>
          <button type="button" onClick={onClose} aria-label="Fèmen meni an" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kat kont lan */}
        <div className="px-4 pb-2">
          {profile ? (
            <button
              type="button"
              onClick={() => go("settings")}
              className="relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b2547] to-sky-700 p-4 text-left text-white shadow-lg shadow-sky-900/20"
            >
              <UserAvatar profile={profile} photo={account.photo} className="h-12 w-12 text-base ring-2 ring-white/30" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{profile.full_name || profile.email}</span>
                <span className="block truncate text-xs text-sky-100/80">{profile.email}</span>
                <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">{formatPrice(Number(profile.balance))}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-sky-200" />
            </button>
          ) : account.enabled ? (
            <div className="rounded-3xl bg-sky-50 p-4 dark:bg-sky-500/10">
              <p className="font-bold text-slate-900 dark:text-white">Byenvini 👋</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">Konekte pou w achte ak Wallet ou epi swiv kòmand ou yo.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { onClose(); onLogin("login"); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white">
                  <LogIn className="h-4 w-4" /> Konekte
                </button>
                <button type="button" onClick={() => { onClose(); onLogin("signup"); }} className="rounded-xl bg-white py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
                  Kreye kont
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {items.map((it) => {
              const active = it.id === tab;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={it.run || (() => go(it.id))}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold transition ${
                      active ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                      <it.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">{it.label}</span>
                    {it.badge > 0 && <span className="min-w-[22px] rounded-full bg-red-500 px-1.5 text-center text-[11px] font-bold leading-5 text-white">{it.badge > 9 ? "9+" : it.badge}</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={onToggleTheme}
            role="switch"
            aria-checked={dark}
            className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </span>
            <span className="flex-1">Mòd fonse</span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${dark ? "bg-sky-500" : "bg-slate-300"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${dark ? "left-6" : "left-1"}`} />
            </span>
          </button>
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <button type="button" onClick={() => { onClose(); onInstall(); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25">
            <Download className="h-5 w-5" /> Installer l'app
          </button>
          <a href={waLink("Bonjou Awens Topup, mwen bezwen èd.")} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 py-3 font-bold text-[#128C7E] dark:text-[#25D366]">
            <WhatsAppIcon className="h-5 w-5" /> Sipò WhatsApp
          </a>
          {account.user && (
            <button type="button" onClick={() => { onClose(); account.signOut(); }} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-red-500 ring-1 ring-red-200 hover:bg-red-50 dark:ring-red-500/30 dark:hover:bg-red-500/10">
              <LogOut className="h-5 w-5" /> Se déconnecter
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
