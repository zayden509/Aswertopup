import React, { useRef, useState } from "react";
import {
  Award, Mail, Copy, Smartphone, Moon, Sun, ShieldCheck, LogOut, ChevronRight, Settings, Share, MoreVertical, Camera, Pencil,
  Wallet, ShoppingBag, Plus, Send, Bell, PlayCircle, Loader2, Trash2, User, CalendarDays, Languages,
} from "lucide-react";
import { RANKS } from "./data.js";
import { backend, errorText } from "./backend.js";
import { Sheet, ErrorNote, WhatsAppIcon, waLink, supportMessage, formatPrice, formatDate, copyText, LangSwitch } from "./ui.jsx";
import ProfileWallet, { UserAvatar } from "./ProfileWallet.jsx";
import { InviteCard } from "./Referral.jsx";
import { QrCard, FeesCard } from "./ProfileTabs.jsx";
import { squarePhoto } from "./image.js";
import { t } from "./i18n.js";
import { useLoyalty } from "./Loyalty.jsx";
import { LOYALTY_KEYS, loyaltyPercent } from "./pricing.js";

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
      <h2 className="mb-2.5 px-1 text-[13px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</h2>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">{children}</div>
    </section>
  );
}

const TONES = {
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

function Row({ icon: Icon, label, value, onClick, href, danger, tone = "sky" }) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  return (
    <Tag
      {...(href && { href, target: "_blank", rel: "noopener noreferrer" })}
      {...(onClick && { type: "button", onClick })}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${onClick || href ? "transition hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60" : ""}`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONES[danger ? "red" : tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className={`min-w-0 flex-1 text-[15px] ${danger ? "font-bold text-red-500" : "font-medium text-slate-700 dark:text-slate-200"}`}>{label}</span>
      {value != null && <span className="min-w-0 truncate text-right text-sm font-semibold text-slate-500 dark:text-slate-400">{value}</span>}
      {(onClick || href) && !danger && <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />}
    </Tag>
  );
}

// Chanje foto pwofil la: telefòn nan louvri galri a, nou fè foto a yon ti kare 192 px
function usePhotoPicker(onToast) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = () => inputRef.current?.click();
  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await backend.saveProfile({ photo: await squarePhoto(file, 192) });
      onToast(t("Foto pwofil ou chanje.", "Photo de profil modifiée."));
    } catch (error) {
      onToast(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const input = <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />;
  return { pick, busy, input };
}

function EditProfileSheet({ account, onClose, onToast }) {
  const profile = account.profile;
  const [name, setName] = useState(profile.full_name || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photo = usePhotoPicker(onToast);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await backend.saveProfile({ fullName: name });
      onToast(t("Pwofil ou ajou.", "Profil mis à jour."));
      onClose();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    try {
      await backend.saveProfile({ photo: null });
      onToast(t("Foto a retire.", "Photo supprimée."));
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Modifier le profil"
      footer={
        <button type="submit" form="profile-form" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 text-lg font-bold text-white disabled:opacity-60">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />} {t("Sove", "Enregistrer")}
        </button>
      }
    >
      <form id="profile-form" onSubmit={save} className="space-y-5">
        <div className="flex items-center gap-4">
          <UserAvatar profile={profile} photo={account.photo} className="h-20 w-20 text-2xl" />
          <div className="space-y-2">
            <button type="button" onClick={photo.pick} disabled={photo.busy} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">
              {photo.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {t("Chanje foto a", "Changer la photo")}
            </button>
            {profile.photo && (
              <button type="button" onClick={removePhoto} className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
                <Trash2 className="h-4 w-4" /> {t("Retire foto a", "Retirer la photo")}
              </button>
            )}
          </div>
          {photo.input}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Non ou", "Votre nom")}</span>
          <span className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
            <User className="h-5 w-5 shrink-0 text-slate-400" />
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" placeholder="Jean Baptiste" className="w-full bg-transparent py-3.5 focus:outline-none" />
          </span>
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Imèl", "E-mail")}: <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.email}</span></p>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Sheet>
  );
}

function RankCard({ spent }) {
  const rank = rankInfo(spent);
  const loyalty = useLoyalty();
  const myDiscount = loyaltyPercent(spent, loyalty);
  return (
    <section id="rank" className="relative scroll-mt-24 overflow-hidden rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-3xl shadow-inner dark:from-violet-500/20 dark:to-sky-500/20">
          {rank.current ? rank.current.emoji : <Award className="h-8 w-8 text-violet-400" strokeWidth={1.5} />}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">{t("Pwogram fidelite", "Programme de fidélité")}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{rank.current ? rank.current.name : t("Poko gen rang", "Pas encore de rang")}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatPrice(spent)} {t("depanse", "dépensés")}</p>
          {myDiscount > 0 && (
            <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {t(`−${myDiscount}% sou tout achte ou yo`, `−${myDiscount} % sur tous vos achats`)}
            </p>
          )}
        </div>
      </div>
      {/* Tout rang yo: sa w genyen deja yo limen */}
      <div className="relative mt-5 grid grid-cols-4 gap-2">
        {RANKS.map((r, i) => {
          const reached = spent >= r.min;
          const pct = Number(loyalty[LOYALTY_KEYS[i]]) || 0;
          return (
            <div key={r.name} className={`rounded-2xl px-1 py-2.5 text-center ring-1 transition ${reached ? "bg-violet-50 ring-violet-200 dark:bg-violet-500/10 dark:ring-violet-500/30" : "bg-slate-50 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700"}`}>
              <span className={`block text-xl ${reached ? "" : "opacity-40 grayscale"}`}>{r.emoji}</span>
              <span className={`mt-0.5 block truncate text-[11px] font-bold ${reached ? "text-violet-700 dark:text-violet-300" : "text-slate-400"}`}>{r.name}</span>
              {pct > 0 && <span className={`mt-0.5 block text-[11px] font-extrabold ${reached ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>−{pct}%</span>}
            </div>
          );
        })}
      </div>
      {rank.next ? (
        <>
          <div className="relative mt-4 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t("Pwochen", "Prochain")} : <span className="font-bold text-violet-500">{rank.next.emoji} {rank.next.name}</span></span>
            <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-300">{t(`${formatPrice(rank.remaining)} ki rete`, `${formatPrice(rank.remaining)} restants`)}</span>
          </div>
          <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={rank.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500 transition-[width] duration-700" style={{ width: `${Math.max(rank.pct, 3)}%` }} />
          </div>
        </>
      ) : (
        <p className="relative mt-4 text-sm font-semibold text-violet-500">{t("Ou rive nan pi gwo rang lan. Mèsi!", "Vous avez atteint le rang le plus élevé. Merci !")}</p>
      )}
    </section>
  );
}

const TABS = [
  { id: "profile", label: "Profil" },
  { id: "qr", label: "QR Code" },
  { id: "fees", label: "Frais & limites" },
];

export default function SettingsPage({
  account, dark, onToggleTheme, onLogin, onAdmin, onToast, installPrompt, onDeposit, onTransfer, onOpenOrder, onSeeWallet,
  onGo, onNotifications, onTutorial,
}) {
  const [showInstall, setShowInstall] = useState(false);
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const photo = usePhotoPicker(onToast);
  const profile = account.profile;
  const spent = Number(profile?.total_spent || 0);
  const rank = rankInfo(spent).current;

  const install = () => {
    if (installPrompt) installPrompt.prompt();
    else setShowInstall((v) => !v);
  };

  const shortcuts = profile && [
    { label: t("Pòtfèy", "Portefeuille"), icon: Wallet, onClick: onSeeWallet, tone: "sky" },
    { label: t("Kòmand", "Commandes"), icon: ShoppingBag, onClick: () => onGo("history"), tone: "violet" },
    { label: t("Depoze", "Déposer"), icon: Plus, onClick: onDeposit, tone: "emerald" },
    { label: t("Voye", "Envoyer"), icon: Send, onClick: onTransfer, tone: "indigo" },
    { label: t("Notifikasyon", "Notifications"), icon: Bell, onClick: onNotifications, badge: account.unread, tone: "amber" },
    { label: "Tutoriel", icon: PlayCircle, onClick: onTutorial, tone: "rose" },
    { label: t("Sipò", "Support"), icon: WhatsAppIcon, href: waLink(supportMessage(t("Bonjou Awens Topup, mwen bezwen èd.", "Bonjour Awens Topup, j'ai besoin d'aide."), profile)), tone: "emerald" },
    profile.is_admin
      ? { label: "Admin", icon: ShieldCheck, onClick: onAdmin, tone: "slate" }
      : { label: t("Rang", "Rang"), icon: Award, onClick: () => { setTab("profile"); setTimeout(() => document.getElementById("rank")?.scrollIntoView({ behavior: "smooth" }), 50); }, tone: "violet" },
  ];

  const appSection = (
    <Section title="Application">
      <Row icon={Smartphone} label="Installer l'application" onClick={install} tone="indigo" />
      {showInstall && (
        <div className="mx-3 mb-3 space-y-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
          <p className="flex items-center gap-2"><Share className="h-4 w-4 shrink-0" /> <span><b>iPhone:</b> {t("peze bouton pataje a nan Safari, epi", "touchez le bouton de partage dans Safari, puis")} <b>Sur l'écran d'accueil</b>.</span></p>
          <p className="flex items-center gap-2"><MoreVertical className="h-4 w-4 shrink-0" /> <span><b>Android:</b> {t("peze ⋮ nan Chrome, epi", "touchez ⋮ dans Chrome, puis")} <b>Installer l'application</b>.</span></p>
        </div>
      )}
      <Row icon={dark ? Moon : Sun} label="Thème" value={dark ? "Sombre" : "Clair"} onClick={onToggleTheme} tone="amber" />
      <Row icon={Languages} label={t("Lang", "Langue")} value={<LangSwitch className="ml-auto w-fit" />} tone="violet" />
      <Row icon={WhatsAppIcon} tone="emerald" label={t("Kontakte sipò a", "Contacter le support")} href={waLink(supportMessage(t("Bonjou Awens Topup, mwen bezwen èd.", "Bonjour Awens Topup, j'ai besoin d'aide."), account.profile))} />
    </Section>
  );

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight"><Settings className="h-7 w-7 text-slate-400" /> Profil</h1>
        {account.enabled && !account.user && (
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-700 p-6 text-white shadow-xl shadow-indigo-900/20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-sky-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <User className="h-7 w-7" />
            </span>
            <h2 className="relative mt-4 text-2xl font-extrabold">{t("Byenvini sou Awens Topup", "Bienvenue sur Awens Topup")}</h2>
            <p className="relative mt-1.5 text-[15px] text-sky-100/85">{t("Kreye kont ou gratis pou w jwenn Wallet, rang fidelite ak tout kòmand ou yo yon sèl kote.", "Créez votre compte gratuitement : Wallet, rang de fidélité et toutes vos commandes au même endroit.")}</p>
            <ul className="relative mt-4 grid grid-cols-2 gap-2 text-[13px] font-semibold">
              {[[Wallet, "Wallet MonCash/NatCash"], [Award, t("Rang ak avantaj", "Rangs & avantages")], [ShoppingBag, t("Istorik kòmand", "Historique")], [ShieldCheck, t("100% an sekirite", "100% sécurisé")]].map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10"><Icon className="h-4 w-4 shrink-0 text-sky-300" /> <span className="truncate">{label}</span></li>
              ))}
            </ul>
            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => onLogin("signup")} className="rounded-2xl bg-white py-3.5 font-bold text-slate-900 shadow-lg transition active:scale-[.98]">
                {t("Kreye kont", "Créer un compte")}
              </button>
              <button type="button" onClick={() => onLogin("login")} className="rounded-2xl bg-white/10 py-3.5 font-bold text-white ring-1 ring-white/25 transition hover:bg-white/15 active:scale-[.98]">
                {t("Konekte", "Connexion")}
              </button>
            </div>
          </section>
        )}
        {appSection}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Kat pwofil la: kouvèti, foto (ak bouton pou chanje l), non, rang ak AWENS-ID */}
      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
        <div className="relative h-28 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1.5px)] [background-size:18px_18px]" />
          <div className="pointer-events-none absolute -bottom-10 right-6 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <button type="button" onClick={() => setEditing(true)} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/20 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-black/30 active:scale-95">
            <Pencil className="h-4 w-4" /> {t("Modifye", "Modifier")}
          </button>
        </div>
        <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
          <div className="relative">
            <UserAvatar profile={profile} photo={account.photo} className="h-24 w-24 text-3xl shadow-xl ring-4 ring-white dark:ring-slate-900" />
            <button
              type="button"
              onClick={photo.pick}
              aria-label={t("Chanje foto pwofil la", "Changer la photo de profil")}
              className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white shadow-lg ring-4 ring-white transition active:scale-90 dark:ring-slate-900"
            >
              {photo.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            {photo.input}
          </div>
          <p className="mt-3 max-w-full truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{profile.full_name || t("San non", "Sans nom")}</p>
          <p className="max-w-full truncate text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            <span className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              {rank ? `${rank.emoji} ${rank.name}` : t("✨ Nouvo manm", "✨ Nouveau membre")}
            </span>
            {profile.is_admin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
            {profile.created_at && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <CalendarDays className="h-3 w-3" /> {t("depi", "depuis")} {formatDate(profile.created_at)}
              </span>
            )}
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("Depanse", "Dépensé")}</p>
              <p className="mt-0.5 truncate text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{formatPrice(spent)}</p>
            </div>
            <button type="button" onClick={() => copyText(profile.wallet_code, onToast)} className="rounded-2xl bg-slate-50 px-3 py-3 text-left transition active:scale-[.98] dark:bg-slate-800/60">
              <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">AWENS-ID <Copy className="h-3 w-3" /></p>
              <p className="mt-0.5 truncate font-mono text-lg font-extrabold tracking-wider text-sky-600 dark:text-sky-400">{profile.wallet_code}</p>
            </button>
          </div>
        </div>
      </section>

      {/* Rakousi yo */}
      <div className="grid grid-cols-4 gap-2.5">
        {shortcuts.map((s) => {
          const Tag = s.href ? "a" : "button";
          return (
            <Tag
              key={s.label}
              {...(s.href ? { href: s.href, target: "_blank", rel: "noopener noreferrer" } : { type: "button", onClick: s.onClick })}
              className="relative flex flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3.5 text-center shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:bg-slate-900 dark:ring-slate-800"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${TONES[s.tone]}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <span className="w-full truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">{s.label}</span>
              {s.badge > 0 && <span className="absolute right-2 top-2 min-w-[20px] rounded-full bg-red-500 px-1 text-[11px] font-bold leading-5 text-white">{s.badge > 9 ? "9+" : s.badge}</span>}
            </Tag>
          );
        })}
      </div>

      <div className="relative grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800" role="tablist">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 shadow-md shadow-sky-500/25 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${TABS.findIndex((x) => x.id === tab) * 100}%)` }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative z-10 rounded-xl px-1 py-2.5 text-sm font-bold transition-colors ${tab === t.id ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "qr" && <QrCard profile={profile} onToast={onToast} />}
      {tab === "fees" && <FeesCard />}
      {tab === "profile" && (
        <>
          <ProfileWallet
            account={account}
            onDeposit={onDeposit}
            onTransfer={onTransfer}
            onOpenOrder={onOpenOrder}
            onSeeAll={onSeeWallet}
            onToast={onToast}
          />
          <InviteCard profile={profile} onToast={onToast} />
          <RankCard spent={spent} />
          <Section title={t("Kont mwen", "Mon compte")}>
            <Row icon={Mail} label={t("Imèl", "Adresse e-mail")} value={profile.email} />
            <Row icon={Copy} tone="indigo" label="AWENS-ID" value={<span className="font-mono tracking-wider">{profile.wallet_code}</span>} onClick={() => copyText(profile.wallet_code, onToast)} />
            <Row icon={CalendarDays} tone="violet" label={t("Manm depi", "Membre depuis")} value={profile.created_at ? formatDate(profile.created_at) : "—"} />
          </Section>
          {appSection}
          {profile.is_admin && (
            <button type="button" onClick={onAdmin} className="relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-left text-white shadow-lg transition active:scale-[.99] dark:from-slate-800 dark:to-slate-900">
              <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl" />
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/15"><ShieldCheck className="h-7 w-7 text-emerald-400" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">Panneau admin</span>
                <span className="block text-sm text-slate-300">{t("Estatistik, kòmand, kliyan, pwodwi", "Statistiques, commandes, clients, produits")}</span>
              </span>
              <ChevronRight className="h-6 w-6 text-slate-400" />
            </button>
          )}
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
            <Row icon={LogOut} label={t("Dekonekte", "Déconnexion")} onClick={account.signOut} danger />
          </div>
        </>
      )}

      {editing && <EditProfileSheet account={account} onClose={() => setEditing(false)} onToast={onToast} />}
    </div>
  );
}
