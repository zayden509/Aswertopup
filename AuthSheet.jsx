import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mail, Lock, User, Loader2, CheckCircle2, X, Eye, EyeOff, Zap, ShieldCheck, Wallet, ArrowLeft, KeyRound } from "lucide-react";
import { GOOGLE_LOGIN } from "./data.js";
import { backend, errorText } from "./backend.js";
import { BrandLogo } from "./Brand.jsx";
import { t } from "./i18n.js";

const HEAD = {
  login: { title: t("Bon retou! 👋", "Bon retour ! 👋"), sub: t("Konekte pou w jwenn Wallet ou ak kòmand ou yo.", "Connectez-vous pour retrouver votre Wallet et vos commandes.") },
  signup: { title: t("Kreye kont ou ✨", "Créez votre compte ✨"), sub: t("Kont gratis, an 30 segonn. Achte pi vit chak fwa.", "Compte gratuit, en 30 secondes. Achetez plus vite à chaque fois.") },
  reset: { title: t("Modpas bliye?", "Mot de passe oublié ?"), sub: t("Mete imèl ou, n ap voye yon lyen pou w chanje l.", "Entrez votre e-mail, nous vous enverrons un lien pour le changer.") },
};

const PERKS = [
  { icon: Zap, label: t("Livrezon rapid", "Livraison rapide") },
  { icon: Wallet, label: t("Wallet MonCash", "Wallet MonCash") },
  { icon: ShieldCheck, label: t("100% an sekirite", "100% sécurisé") },
];

function Field({ id, label, icon: Icon, trailing, ...props }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <span className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-400/15 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-900">
        <Icon className="h-5 w-5 shrink-0 text-slate-400 transition group-focus-within:text-sky-500" />
        <input id={id} className="w-full bg-transparent py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white" {...props} />
        {trailing}
      </span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function AuthSheet({ initialMode = "login", onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setDone("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await backend.signIn(email, password);
        onClose();
      } else if (mode === "signup") {
        await backend.signUp(name, email, password);
        onClose();
      } else {
        await backend.resetPassword(email);
        setDone(t(
          "Si gen yon kont ak imèl sa a, nou voye yon LYEN (pa yon kòd) pou chanje modpas ou. Li soti nan noreply@aswer-topup.firebaseapp.com epi li ka pran kèk minit. Gade nan Spam, Promosyon ak Tout imèl yo. Si w te kreye kont lan ak Google, pa gen modpas: peze \"Kontinye ak Google\".",
          "Si un compte existe avec cet e-mail, nous avons envoyé un LIEN (pas un code) pour changer votre mot de passe. Il vient de noreply@aswer-topup.firebaseapp.com et peut prendre quelques minutes. Vérifiez les Spams, Promotions et Tous les messages. Si vous avez créé le compte avec Google, il n'y a pas de mot de passe : utilisez « Continuer avec Google »."
        ));
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    setGoogleBusy(true);
    try {
      await backend.googleSignIn();
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setGoogleBusy(false);
    }
  };

  const head = HEAD[mode];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={head.title}>
      <div className="absolute inset-0 animate-fade-in bg-slate-950/70" onClick={onClose} />
      <div className="relative flex max-h-[94vh] w-full max-w-md animate-sheet-up flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900 sm:rounded-[28px]">
        {/* Anlè: koulè mak la ak avantaj yo */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-700 px-6 pb-6 pt-5 text-white">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="relative flex items-center justify-between">
            {mode === "reset" ? (
              <button type="button" onClick={() => switchMode("login")} className="-ml-1 flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> {t("Retounen", "Retour")}
              </button>
            ) : (
              <BrandLogo tone="dark" className="h-9 w-auto" />
            )}
            <button type="button" aria-label={t("Fèmen", "Fermer")} onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/90 transition hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="relative mt-5 text-[26px] font-extrabold leading-tight tracking-tight">{head.title}</h2>
          <p className="relative mt-1.5 text-[15px] leading-snug text-sky-100/85">{head.sub}</p>
          {mode === "signup" && (
            <div className="relative mt-4 flex flex-wrap gap-2">
              {PERKS.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15">
                  <Icon className="h-3.5 w-3.5 text-sky-300" /> {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-5 sm:pb-6">
          {done ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50 dark:bg-emerald-500/10 dark:ring-emerald-500/5">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </span>
              <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{done}</p>
              <button type="button" onClick={() => switchMode("login")} className="mt-6 w-full rounded-2xl bg-sky-500 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 active:scale-[.98]">
                {t("Retounen pou konekte", "Retour à la connexion")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {mode !== "reset" && (
                <div className="relative grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-transform duration-300 ease-out dark:bg-slate-950 ${mode === "signup" ? "translate-x-full" : ""}`}
                  />
                  {["login", "signup"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      aria-pressed={mode === m}
                      className={`relative z-10 rounded-xl py-2.5 text-sm font-bold transition-colors ${mode === m ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {m === "login" ? t("Konekte", "Connexion") : t("Kreye kont", "Créer un compte")}
                    </button>
                  ))}
                </div>
              )}

              {GOOGLE_LOGIN && mode !== "reset" && (
                <>
                  <button
                    type="button"
                    onClick={google}
                    disabled={googleBusy}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow active:scale-[.98] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {googleBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                    {t("Kontinye ak Google", "Continuer avec Google")}
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{t("oswa ak imèl", "ou par e-mail")}</span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                </>
              )}

              {mode === "signup" && (
                <Field id="auth-name" label={t("Non ou", "Votre nom")} icon={User} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jean Baptiste" />
              )}
              <Field id="auth-email" label={t("Imèl", "E-mail")} icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="ou@gmail.com" />
              {mode !== "reset" && (
                <Field
                  id="auth-password"
                  label={t("Modpas", "Mot de passe")}
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={t("Omwen 6 karaktè", "Au moins 6 caractères")}
                  trailing={(
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? t("Kache modpas la", "Masquer le mot de passe") : t("Montre modpas la", "Afficher le mot de passe")}
                      className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  )}
                />
              )}

              {mode === "login" && (
                <div className="-mt-1 flex justify-end">
                  <button type="button" onClick={() => switchMode("reset")} className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
                    <KeyRound className="h-4 w-4" /> {t("Ou bliye modpas ou?", "Mot de passe oublié ?")}
                  </button>
                </div>
              )}

              {error && <p className="animate-fade-in rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/30 transition hover:brightness-110 active:scale-[.98] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-5 w-5 animate-spin" />}
                {mode === "login" ? t("Konekte", "Connexion") : mode === "signup" ? t("Kreye kont mwen", "Créer mon compte") : t("Voye lyen an", "Envoyer le lien")}
              </button>

              {mode !== "reset" && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  {mode === "login" ? t("Ou poko gen kont?", "Pas encore de compte ?") : t("Ou deja gen kont?", "Déjà un compte ?")}{" "}
                  <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="font-bold text-sky-600 dark:text-sky-400">
                    {mode === "login" ? t("Kreye youn", "Créez-en un") : t("Konekte", "Connectez-vous")}
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("Nou pa janm pataje imèl ou.", "Nous ne partageons jamais votre e-mail.")}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
