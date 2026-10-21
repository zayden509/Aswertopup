import React, { useState } from "react";
import { Award, Mail, Wallet, Copy, Smartphone, Moon, Sun, ShieldCheck, LogOut, ChevronRight, Settings, Share, MoreVertical } from "lucide-react";
import { RANKS } from "./data.js";
import { WhatsAppIcon, waLink, formatPrice, formatDate, copyText } from "./ui.jsx";
import { LoginPrompt } from "./WalletPage.jsx";

export function rankInfo(spent) {
  const current = [...RANKS].reverse().find((r) => spent >= r.min) || null;
  const next = RANKS.find((r) => spent < r.min) || null;
  const base = current?.min ?? 0;
  const pct = next ? Math.min(100, Math.round(((spent - base) / (next.min - base)) * 100)) : 100;
  return { current, next, remaining: next ? next.min - spent : 0, pct };
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold text-sky-500">{title}</h2>
      <div className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, value, onClick, href, danger }) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  return (
    <Tag
      {...(href && { href, target: "_blank", rel: "noopener noreferrer" })}
      {...(onClick && { type: "button", onClick })}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left ${onClick || href ? "transition hover:bg-slate-50 dark:hover:bg-slate-800/60" : ""}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${danger ? "text-red-500" : "text-sky-500"}`} />
      <span className={`min-w-0 flex-1 ${danger ? "font-semibold text-red-500" : "text-slate-500 dark:text-slate-400"}`}>{label}</span>
      {value != null && <span className="min-w-0 truncate text-right font-semibold text-slate-900 dark:text-white">{value}</span>}
      {(onClick || href) && !danger && <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
    </Tag>
  );
}

export default function SettingsPage({ account, dark, onToggleTheme, onLogin, onAdmin, onToast, installPrompt }) {
  const [showInstall, setShowInstall] = useState(false);
  const profile = account.profile;
  const spent = Number(profile?.total_spent || 0);
  const rank = rankInfo(spent);

  const install = () => {
    if (installPrompt) installPrompt.prompt();
    else setShowInstall((v) => !v);
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight"><Settings className="h-7 w-7 text-slate-400" /> Paramètres</h1>

      {account.enabled && !account.user && (
        <LoginPrompt title="Kont ou" text="Konekte pou w wè rang ou, solde ou ak tout kòmand ou yo." onLogin={onLogin} />
      )}

      {profile && (
        <>
          <section className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-3xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {rank.current ? rank.current.emoji : <Award className="h-8 w-8 text-slate-400" strokeWidth={1.5} />}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Mon rang</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{rank.current ? rank.current.name : "Pas encore de rang"}</p>
                <p className="text-sm tabular-nums text-slate-500 dark:text-slate-400">{formatPrice(spent)} dépensés</p>
              </div>
            </div>
            {rank.next ? (
              <>
                <div className="mt-4 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Prochain : <span className="font-bold text-violet-500">{rank.next.emoji} {rank.next.name}</span></span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">{formatPrice(rank.remaining)} restants</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={rank.pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500" style={{ width: `${rank.pct}%` }} />
                </div>
                <p className="mt-1 text-right text-xs tabular-nums text-slate-400">{rank.pct}%</p>
              </>
            ) : (
              <p className="mt-4 text-sm font-semibold text-violet-500">Ou rive nan pi gwo rang lan. Mèsi!</p>
            )}
          </section>

          <Section title="Mon compte">
            <Row icon={Mail} label="Adresse email" value={profile.email} />
            <Row icon={Wallet} label="Solde du compte" value={<span className="text-sky-500">{formatPrice(Number(profile.balance))}</span>} />
            <Row icon={Copy} label="ASWER-ID" value={<span className="font-mono tracking-wider">{profile.wallet_code}</span>} onClick={() => copyText(profile.wallet_code, onToast)} />
            <Row icon={Award} label="Manm depi" value={formatDate(profile.created_at)} />
          </Section>
        </>
      )}

      <Section title="Application">
        <Row icon={Smartphone} label="Installer l'application" onClick={install} />
        {showInstall && (
          <div className="mx-3 mb-3 space-y-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
            <p className="flex items-center gap-2"><Share className="h-4 w-4 shrink-0" /> <span><b>iPhone:</b> peze bouton pataje a nan Safari, epi <b>Sur l'écran d'accueil</b>.</span></p>
            <p className="flex items-center gap-2"><MoreVertical className="h-4 w-4 shrink-0" /> <span><b>Android:</b> peze ⋮ nan Chrome, epi <b>Installer l'application</b>.</span></p>
          </div>
        )}
        <Row icon={dark ? Moon : Sun} label="Thème" value={dark ? "Sombre" : "Clair"} onClick={onToggleTheme} />
        <Row icon={WhatsAppIcon} label="Kontakte sipò a" href={waLink("Bonjou Aswer Top Up, mwen bezwen èd.")} />
      </Section>

      {profile?.is_admin && (
        <button
          type="button"
          onClick={onAdmin}
          className="flex w-full items-center gap-3 rounded-3xl bg-slate-900 p-5 text-left text-white shadow-lg dark:bg-slate-800"
        >
          <ShieldCheck className="h-7 w-7 text-emerald-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold">Panneau admin</span>
            <span className="block text-sm text-slate-300">Kòmand, depo ak pri yo</span>
          </span>
          <ChevronRight className="h-6 w-6 text-slate-400" />
        </button>
      )}

      {account.user && (
        <div className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Row icon={LogOut} label="Déconnexion" onClick={account.signOut} danger />
        </div>
      )}
    </div>
  );
}
