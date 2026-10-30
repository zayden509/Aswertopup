import React, { useState } from "react";
import { UserRound, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";
import { GOOGLE_LOGIN } from "./data.js";
import { backend, errorText } from "./backend.js";
import { Sheet } from "./ui.jsx";
import { t } from "./i18n.js";

const TITLES = { login: t("Konekte", "Connexion"), signup: t("Kreye yon kont", "Créer un compte"), reset: t("Modpas bliye", "Mot de passe oublié") };

function Field({ id, label, icon: Icon, ...props }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 transition focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
        <Icon className="h-5 w-5 shrink-0 text-slate-400" />
        <input id={id} className="w-full bg-transparent py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white" {...props} />
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

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
        setDone(t("Si gen yon kont ak imèl sa a, ou pral resevwa yon imèl pou chanje modpas ou. Gade nan Spam tou.", "Si un compte existe avec cet e-mail, vous recevrez un e-mail pour changer votre mot de passe. Vérifiez aussi les spams."));
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    try {
      await backend.googleSignIn();
      onClose();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Sheet open onClose={onClose} title={TITLES[mode]} icon={<UserRound className="h-6 w-6" />}>
      {done ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="mx-auto mt-3 max-w-sm text-slate-600 dark:text-slate-300">{done}</p>
          <button type="button" onClick={() => switchMode("login")} className="mt-5 rounded-2xl bg-sky-500 px-6 py-3 font-bold text-white hover:bg-sky-600">
            {t("Konekte", "Connexion")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {mode !== "reset" && (
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${mode === m ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500"}`}
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
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <GoogleIcon /> {t("Kontinye ak Google", "Continuer avec Google")}
              </button>
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">{t("oswa ak imèl", "ou par e-mail")}</p>
            </>
          )}

          {mode === "signup" && (
            <Field id="auth-name" label={t("Non ou", "Votre nom")} icon={User} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jean Baptiste" />
          )}
          <Field id="auth-email" label={t("Imèl", "E-mail")} icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="ou@gmail.com" />
          {mode !== "reset" && (
            <Field
              id="auth-password"
              label={t("Modpas", "Mot de passe")}
              icon={Lock}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={t("Omwen 6 karaktè", "Au moins 6 caractères")}
            />
          )}

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {mode === "login" ? t("Konekte", "Connexion") : mode === "signup" ? t("Kreye kont mwen", "Créer mon compte") : t("Voye lyen an", "Envoyer le lien")}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === "reset" ? (
              <button type="button" onClick={() => switchMode("login")} className="font-semibold text-sky-600 dark:text-sky-400">{t("Retounen pou konekte", "Retour à la connexion")}</button>
            ) : (
              <button type="button" onClick={() => switchMode("reset")} className="font-semibold text-sky-600 dark:text-sky-400">{t("Ou bliye modpas ou?", "Mot de passe oublié ?")}</button>
            )}
          </p>
        </form>
      )}
    </Sheet>
  );
}
