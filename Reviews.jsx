import React, { useEffect, useState } from "react";
import { Star, MessageSquareQuote, Check, Trash2, EyeOff, Loader2, BadgeCheck } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote, formatDate } from "./ui.jsx";
import { t } from "./i18n.js";

// Avi kliyan yo: yon kliyan ki resevwa kòmand li bay nòt; admin nan apwouve sa ki parèt sou sit la.

export function Stars({ value, size = "h-4 w-4", onPick }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={t(`${value} etwal sou 5`, `${value} étoiles sur 5`)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />;
        return onPick ? (
          <button key={n} type="button" onClick={() => onPick(n)} aria-label={t(`${n} etwal`, `${n} étoile(s)`)} className="p-0.5">{icon}</button>
        ) : <span key={n}>{icon}</span>;
      })}
    </span>
  );
}

// "Jean Baptiste Pierre" → "Jean B."
export function shortName(profile) {
  const words = String(profile?.full_name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return t("Kliyan", "Client");
  return words.length > 1 ? `${words[0]} ${words[1][0].toUpperCase()}.` : words[0];
}

// Seksyon paj akèy la: kantite kòmand livre ak avi admin yo apwouve
export function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  useEffect(() => backend?.subscribeReviews(setReviews), []);
  useEffect(() => backend?.subscribePublicStats(setStats), []);
  const delivered = Number(stats.delivered || 0);
  if (!reviews.length && delivered < 1) return null;
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-9" data-testid="reviews">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">{t("Sa kliyan yo di", "Avis clients")}</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {average.toFixed(1)} · {reviews.length} {t("avi", "avis")}
          </span>
        )}
      </div>
      {delivered > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
          <BadgeCheck className="h-5 w-5 shrink-0" /> {new Intl.NumberFormat("fr-FR").format(delivered)} {t("kòmand livre deja", "commandes déjà livrées")}
        </p>
      )}
      {reviews.length > 0 && (
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {reviews.map((r) => (
            <li key={r.id} className="w-72 shrink-0 snap-start rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <Stars value={r.rating} />
              {r.text && <p className="mt-2 line-clamp-4 text-slate-700 dark:text-slate-200">“{r.text}”</p>}
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.product_name} · {formatDate(r.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Nan detay yon kòmand ki livre: kliyan an bay nòt li (yon sèl fwa)
export function ReviewBox({ order, profile, onToast }) {
  const [mine, setMine] = useState(undefined);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let stale = false;
    backend.getMyReview(order.id).then((r) => !stale && setMine(r));
    return () => { stale = true; };
  }, [order.id]);

  if (mine === undefined) return null;
  if (mine) {
    return (
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
        <Stars value={mine.rating} />
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {t("Mèsi pou avi w!", "Merci pour votre avis !")} {mine.approved ? t("Li parèt sou sit la.", "Il est publié sur le site.") : t("L ap parèt sou sit la lè ekip la fin li l.", "Il sera publié après relecture par l'équipe.")}
        </p>
      </div>
    );
  }

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.createReview(order, rating, text, shortName(profile));
      setMine({ rating, approved: false });
      onToast?.(t("Mèsi pou avi w! ⭐", "Merci pour votre avis ! ⭐"));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30" data-testid="review-box">
      <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><MessageSquareQuote className="h-5 w-5 text-amber-500" /> {t("Kijan sa te pase?", "Comment ça s'est passé ?")}</p>
      <Stars value={rating} size="h-8 w-8" onPick={setRating} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder={t("Di lòt kliyan yo sa w panse (si w vle)", "Dites aux autres clients ce que vous en pensez (facultatif)")}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
      />
      <ErrorNote>{error}</ErrorNote>
      <button type="button" onClick={send} disabled={busy || !rating} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50">
        {busy && <Loader2 className="h-5 w-5 animate-spin" />} {t("Voye avi a", "Envoyer l'avis")}
      </button>
    </div>
  );
}

// Panneau admin: apwouve oswa retire avi yo
export function AdminReviews({ onToast }) {
  const [list, setList] = useState(null);
  useEffect(() => backend.adminSubscribeReviews(setList), []);
  const act = async (fn, message) => {
    try {
      await fn();
      onToast(message);
    } catch (err) {
      onToast(errorText(err));
    }
  };
  if (list === null) return null;
  const waiting = list.filter((r) => !r.approved).length;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800 sm:p-5" data-testid="admin-reviews">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> Avi kliyan yo {waiting > 0 && <span className="rounded-full bg-red-500 px-2 text-xs leading-5 text-white">{waiting}</span>}
      </h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Yon avi parèt sou paj akèy la sèlman lè w apwouve l.</p>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Poko gen avi. Kliyan yo bay nòt lè yo louvri yon kòmand ki livre.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((r) => (
            <li key={r.id} className="space-y-1.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <Stars value={r.rating} />
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.approved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                  {r.approved ? "Sou sit la" : "Ap tann"}
                </span>
              </div>
              {r.text && <p className="text-sm text-slate-700 dark:text-slate-200">“{r.text}”</p>}
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.name} · {r.product_name} · {formatDate(r.created_at)}</p>
              <div className="flex gap-2">
                {r.approved ? (
                  <button type="button" onClick={() => act(() => backend.adminSetReviewApproved(r.id, false), "Avi a retire sou sit la.")} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><EyeOff className="h-3.5 w-3.5" /> Retire sou sit la</button>
                ) : (
                  <button type="button" onClick={() => act(() => backend.adminSetReviewApproved(r.id, true), "Avi a parèt sou sit la.")} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Apwouve</button>
                )}
                <button type="button" onClick={() => act(() => backend.adminDeleteReview(r.id), "Avi a efase.")} className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" /> Efase</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
