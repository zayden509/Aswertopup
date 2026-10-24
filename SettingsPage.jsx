import React, { useRef, useState } from "react";
import {
  Award, Mail, Copy, Smartphone, Moon, Sun, ShieldCheck, LogOut, ChevronRight, Settings, Share, MoreVertical, Camera, Pencil,
  Wallet, ShoppingBag, Plus, Send, Bell, PlayCircle, Loader2, Trash2, User, CalendarDays,
} from "lucide-react";
import { RANKS } from "./data.js";
import { backend, errorText } from "./backend.js";
import { Sheet, ErrorNote, WhatsAppIcon, waLink, supportMessage, formatPrice, formatDate, copyText } from "./ui.jsx";
import { LoginPrompt } from "./WalletPage.jsx";
import ProfileWallet, { UserAvatar } from "./ProfileWallet.jsx";
import { QrCard, FeesCard } from "./ProfileTabs.jsx";
import { squarePhoto } from "./image.js";

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
      <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
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
      onToast("Foto pwofil ou chanje.");
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
      onToast("Pwofil ou ajou.");
      onClose();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    try {
      await backend.saveProfile({ photo: null });
      onToast("Foto a retire.");
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
          {busy && <Loader2 className="h-5 w-5 animate-spin" />} Sove
        </button>
      }
    >
      <form id="profile-form" onSubmit={save} className="space-y-5">
        <div className="flex items-center gap-4">
          <UserAvatar profile={profile} photo={account.photo} className="h-20 w-20 text-2xl" />
          <div className="space-y-2">
            <button type="button" onClick={photo.pick} disabled={photo.busy} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">
              {photo.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Chanje foto a
            </button>
            {profile.photo && (
              <button type="button" onClick={removePhoto} className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
                <Trash2 className="h-4 w-4" /> Retire foto a
              </button>
            )}
          </div>
          {photo.input}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Non ou</span>
          <span className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
            <User className="h-5 w-5 shrink-0 text-slate-400" />
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" placeholder="Jean Baptiste" className="w-full bg-transparent py-3.5 focus:outline-none" />
          </span>
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400">Imèl: <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.email}</span></p>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Sheet>
  );
}

function RankCard({ spent }) {
  const rank = rankInfo(spent);
  return (
    <section id="rank" className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-50 text-3xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {rank.current ? rank.current.emoji : <Award className="h-8 w-8 text-slate-400" strokeWidth={1.5} />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pwogram fidelite</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{rank.current ? rank.current.name : "Pas encore de rang"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatPrice(spent)} dépensés</p>
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
        </>
      ) : (
        <p className="mt-4 text-sm font-semibold text-violet-500">Ou rive nan pi gwo rang lan. Mèsi!</p>
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
    { label: "Pòtfèy", icon: Wallet, onClick: onSeeWallet },
    { label: "Kòmand", icon: ShoppingBag, onClick: () => onGo("history") },
    { label: "Depoze", icon: Plus, onClick: onDeposit },
    { label: "Voye", icon: Send, onClick: onTransfer },
    { label: "Notifikasyon", icon: Bell, onClick: onNotifications, badge: account.unread },
    { label: "Tutoriel", icon: PlayCircle, onClick: onTutorial },
    { label: "Sipò", icon: WhatsAppIcon, href: waLink(supportMessage("Bonjou Awens Topup, mwen bezwen èd.", profile)) },
    profile.is_admin
      ? { label: "Admin", icon: ShieldCheck, onClick: onAdmin }
      : { label: "Rang", icon: Award, onClick: () => { setTab("profile"); setTimeout(() => document.getElementById("rank")?.scrollIntoView({ behavior: "smooth" }), 50); } },
  ];

  const appSection = (
    <Section title="Application">
      <Row icon={Smartphone} label="Installer l'application" onClick={install} />
      {showInstall && (
        <div className="mx-3 mb-3 space-y-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
          <p className="flex items-center gap-2"><Share className="h-4 w-4 shrink-0" /> <span><b>iPhone:</b> peze bouton pataje a nan Safari, epi <b>Sur l'écran d'accueil</b>.</span></p>
          <p className="flex items-center gap-2"><MoreVertical className="h-4 w-4 shrink-0" /> <span><b>Android:</b> peze ⋮ nan Chrome, epi <b>Installer l'application</b>.</span></p>
        </div>
      )}
      <Row icon={dark ? Moon : Sun} label="Thème" value={dark ? "Sombre" : "Clair"} onClick={onToggleTheme} />
      <Row icon={WhatsAppIcon} label="Kontakte sipò a" href={waLink(supportMessage("Bonjou Awens Topup, mwen bezwen èd.", account.profile))} />
    </Section>
  );

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight"><Settings className="h-7 w-7 text-slate-400" /> Profil</h1>
        {account.enabled && !account.user && (
          <LoginPrompt title="Kont ou" text="Konekte pou w wè rang ou, solde ou ak tout kòmand ou yo." onLogin={onLogin} />
        )}
        {appSection}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Mon profil</h1>
        <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10">
          <Pencil className="h-4 w-4" /> Modifier
        </button>
      </div>

      {/* Kat pwofil la: foto (ak bouton pou chanje l), non, rang */}
      <section className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/15 via-indigo-500/5 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <UserAvatar profile={profile} photo={account.photo} className="h-20 w-20 text-2xl ring-4 ring-white dark:ring-slate-900" />
            <button
              type="button"
              onClick={photo.pick}
              aria-label="Chanje foto pwofil la"
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white shadow-lg ring-4 ring-white dark:ring-slate-900"
            >
              {photo.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            {photo.input}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold text-slate-900 dark:text-white">{profile.full_name || "San non"}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                {rank ? `${rank.emoji} ${rank.name}` : "Nouveau membre"}
              </span>
              {profile.created_at && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <CalendarDays className="h-3 w-3" /> depi {formatDate(profile.created_at)}
                </span>
              )}
            </div>
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
              className="relative flex flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3.5 text-center shadow-sm ring-1 ring-slate-200 transition active:scale-95 dark:bg-slate-900 dark:ring-slate-800"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="w-full truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">{s.label}</span>
              {s.badge > 0 && <span className="absolute right-2 top-2 min-w-[20px] rounded-full bg-red-500 px-1 text-[11px] font-bold leading-5 text-white">{s.badge > 9 ? "9+" : s.badge}</span>}
            </Tag>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-1 py-2.5 text-sm font-bold transition ${tab === t.id ? "bg-sky-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
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
          <RankCard spent={spent} />
          <Section title="Mon compte">
            <Row icon={Mail} label="Adresse email" value={profile.email} />
            <Row icon={Copy} label="AWENS-ID" value={<span className="font-mono tracking-wider">{profile.wallet_code}</span>} onClick={() => copyText(profile.wallet_code, onToast)} />
            <Row icon={Award} label="Manm depi" value={profile.created_at ? formatDate(profile.created_at) : "—"} />
          </Section>
          {appSection}
          {profile.is_admin && (
            <button type="button" onClick={onAdmin} className="flex w-full items-center gap-3 rounded-3xl bg-slate-900 p-5 text-left text-white shadow-lg dark:bg-slate-800">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">Panneau admin</span>
                <span className="block text-sm text-slate-300">Estatistik, kòmand, kliyan, pwodwi</span>
              </span>
              <ChevronRight className="h-6 w-6 text-slate-400" />
            </button>
          )}
          <div className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <Row icon={LogOut} label="Déconnexion" onClick={account.signOut} danger />
          </div>
        </>
      )}

      {editing && <EditProfileSheet account={account} onClose={() => setEditing(false)} onToast={onToast} />}
    </div>
  );
}
