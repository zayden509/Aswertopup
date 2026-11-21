import React, { useEffect } from "react";
import { X, Home, ShoppingCart, Wallet, History, Bell, UserRound, PlayCircle, HelpCircle, ShieldCheck, Moon, Sun, Download, LogOut, LogIn, ChevronRight, Languages } from "lucide-react";
import { WhatsAppIcon, waLink, supportMessage, formatPrice, LangSwitch } from "./ui.jsx";
import { UserAvatar } from "./Avatar.jsx";
import { BrandLogo } from "./Brand.jsx";
import { openFaq } from "./Faq.jsx";
import { t } from "./i18n.js";

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
    { id: "home", label: t("Lakay", "Accueil"), icon: Home, tone: "from-violet-500 to-fuchsia-500 text-neutral-950" },
    { id: "shop", label: t("Boutik", "Boutique"), icon: ShoppingCart, tone: "from-sky-400 to-indigo-500 text-neutral-950" },
    { id: "wallet", label: t("Wallet mwen", "Portefeuille"), icon: Wallet, tone: "from-emerald-400 to-teal-500 text-neutral-950" },
    { id: "history", label: t("Kòmand mwen", "Mes commandes"), icon: History, tone: "from-amber-400 to-orange-500 text-neutral-950" },
    { id: "notifications", label: "Notifications", icon: Bell, tone: "from-rose-500 to-pink-500 text-neutral-950", badge: account.unread, run: () => { onClose(); onNotifications(); } },
    { id: "settings", label: t("Pwofil mwen", "Mon profil"), icon: UserRound, tone: "from-indigo-500 to-violet-600 text-neutral-950" },
    { id: "faq", label: t("Kesyon souvan (FAQ)", "Questions fréquentes"), icon: HelpCircle, tone: "from-cyan-400 to-sky-500 text-neutral-950", run: () => { onClose(); openFaq(); } },
    { id: "tutorial", label: t("Èd & tutoriel", "Aide & tutoriel"), icon: PlayCircle, tone: "from-yellow-400 to-yellow-500", run: () => { onClose(); onTutorial(); } },
    ...(profile?.is_admin ? [{ id: "admin", label: "Panneau admin", icon: ShieldCheck, tone: "from-slate-600 to-slate-800" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 !mt-0" role="dialog" aria-modal="true" aria-label={t("Meni", "Menu")}>
      <div className="absolute inset-0 animate-fade-in bg-slate-950/60" onClick={onClose} />
      <aside
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] animate-slide-in-left flex-col overflow-y-auto bg-gradient-to-b from-white via-white to-violet-50 shadow-2xl dark:from-[#111111] dark:via-[#0a0a0a] dark:to-[#0d0b05]"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <BrandLogo className="h-11 w-auto" />
          <button type="button" onClick={onClose} aria-label={t("Fèmen meni an", "Fermer le menu")} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 transition active:scale-95 dark:bg-white/10 dark:text-slate-200 dark:ring-1 dark:ring-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kat kont lan */}
        <div className="px-4 pb-2">
          {profile ? (
            <button
              type="button"
              onClick={() => go("settings")}
              className="relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1c1606] p-4 text-left text-white shadow-xl shadow-violet-900/30 ring-1 ring-white/10 transition active:scale-[.98]"
            >
              <span className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-500/40 blur-2xl" />
              <span className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-sky-500/30 blur-2xl" />
              <UserAvatar profile={profile} photo={account.photo} className="relative h-12 w-12 text-base ring-2 ring-fuchsia-400/60" />
              <span className="relative min-w-0 flex-1">
                <span className="block truncate font-bold">{profile.full_name || profile.email}</span>
                <span className="block truncate text-xs text-violet-200/80">{profile.email}</span>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-0.5 text-xs font-extrabold shadow-md shadow-fuchsia-500/30 text-neutral-950"><Wallet className="h-3 w-3" /> {formatPrice(Number(profile.balance))}</span>
              </span>
              <ChevronRight className="relative h-5 w-5 shrink-0 text-violet-200" />
            </button>
          ) : account.enabled ? (
            <div className="rounded-3xl bg-violet-50 p-4 ring-1 ring-violet-100 dark:bg-white/5 dark:ring-white/10">
              <p className="font-bold text-slate-900 dark:text-white">{t("Byenvini 👋", "Bienvenue 👋")}</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{t("Konekte pou w achte ak Wallet ou epi swiv kòmand ou yo.", "Connectez-vous pour acheter avec votre Wallet et suivre vos commandes.")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { onClose(); onLogin("login"); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-bold text-neutral-950 shadow-md shadow-fuchsia-500/30">
                  <LogIn className="h-4 w-4" /> {t("Konekte", "Connexion")}
                </button>
                <button type="button" onClick={() => { onClose(); onLogin("signup"); }} className="rounded-xl bg-white py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
                  {t("Kreye kont", "Créer un compte")}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1.5">
            {items.map((it) => {
              const active = it.id === tab;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={it.run || (() => go(it.id))}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left font-bold transition active:scale-[.98] ${
                      active
                        ? "bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent text-violet-700 ring-1 ring-violet-300/60 dark:text-white dark:ring-fuchsia-400/30"
                        : "text-slate-700 hover:bg-violet-50 dark:text-slate-200 dark:hover:bg-white/5"
                    }`}
                  >
                    {active && <span className="absolute -left-3 top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />}
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${it.tone} text-neutral-950 shadow-md ${active ? "shadow-fuchsia-500/40" : ""}`}>
                      <it.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">{it.label}</span>
                    {!it.badge && <ChevronRight className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${active ? "text-fuchsia-700" : "text-slate-300 dark:text-slate-600"}`} />}
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
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-2.5 py-2.5 text-left font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-amber-300 shadow-md">
              {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </span>
            <span className="flex-1">{t("Mòd fonse", "Mode sombre")}</span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${dark ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-neutral-950" : "bg-slate-300"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${dark ? "left-6" : "left-1"}`} />
            </span>
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white px-2.5 py-2.5 font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-neutral-950 shadow-md">
              <Languages className="h-5 w-5" />
            </span>
            <span className="flex-1">{t("Lang", "Langue")}</span>
            <LangSwitch />
          </div>
        </nav>

        <div className="space-y-2 border-t border-violet-100 p-4 dark:border-white/10">
          <button type="button" onClick={() => { onClose(); onInstall(); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 py-3.5 font-extrabold text-neutral-950 shadow-lg shadow-fuchsia-500/30 transition active:scale-[.98]">
            <Download className="h-5 w-5" /> {t("Enstale aplikasyon an", "Installer l'app")}
          </button>
          <a href={waLink(supportMessage(t("Bonjou Awens Topup, mwen bezwen èd.", "Bonjour Awens Topup, j'ai besoin d'aide."), profile))} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 py-3 font-bold text-[#128C7E] dark:text-[#25D366]">
            <WhatsAppIcon className="h-5 w-5" /> {t("Sipò WhatsApp", "Support WhatsApp")}
          </a>
          {account.user && (
            <button type="button" onClick={() => { onClose(); account.signOut(); }} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-red-500 ring-1 ring-red-200 hover:bg-red-50 dark:ring-red-500/30 dark:hover:bg-red-500/10">
              <LogOut className="h-5 w-5" /> {t("Dekonekte", "Se déconnecter")}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
