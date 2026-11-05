import React, { useEffect, useState } from "react";
import { Timer, Copy, ArrowRight, Save, Flame } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote, copyText } from "./ui.jsx";
import { Card, Field, AdminButton, Toggle, inputClass } from "./adminUi.jsx";
import { t } from "./i18n.js";

// Pwomo ak kontè sou paj akèy la (settings/flash), an dirèk
export function useFlash() {
  const [flash, setFlash] = useState(null);
  useEffect(() => (backend ? backend.subscribeFlash(setFlash) : undefined), []);
  return flash;
}

function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const pad = (n) => String(n).padStart(2, "0");

// Bann pwomo a: li parèt sèlman pandan pwomo a aktif e kontè a poko fini
export function FlashBanner({ onOpenProduct, onToast }) {
  const flash = useFlash();
  const end = flash?.ends_at ? Date.parse(flash.ends_at) : 0;
  const live = Boolean(flash?.active) && end > Date.now();
  const now = useNow(live);
  if (!live || end <= now) return null;

  const left = Math.max(0, Math.floor((end - now) / 1000));
  const days = Math.floor(left / 86400);
  const parts = [Math.floor((left % 86400) / 3600), Math.floor((left % 3600) / 60), left % 60];

  return (
    <section className="relative mt-5 overflow-hidden rounded-[24px] bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-600 p-4 text-white shadow-lg shadow-rose-500/25">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20"><Flame className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-white/80">{t("Pwomo flash", "Promo flash")}</p>
          <p className="text-lg font-extrabold leading-tight">{flash.title}</p>
          {flash.text && <p className="mt-0.5 text-sm text-white/90">{flash.text}</p>}
        </div>
      </div>
      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/25 px-3 py-2 font-mono text-base font-extrabold tabular-nums" aria-live="off">
          <Timer className="h-4 w-4" />
          {days > 0 && `${days}${t("j", "j")} `}{parts.map(pad).join(":")}
        </span>
        {flash.code && (
          <button type="button" onClick={() => copyText(flash.code, onToast)} className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold ring-1 ring-white/30 transition active:scale-95">
            {t("Kòd", "Code")} <span className="font-mono tracking-wider">{flash.code}</span> <Copy className="h-4 w-4" />
          </button>
        )}
        {flash.product_id && (
          <button type="button" onClick={() => onOpenProduct(flash.product_id)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-rose-600 shadow transition active:scale-95">
            {t("Achte kounye a", "J'en profite")} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}

// "2026-11-05T20:00" pou chan dat/lè a (lè lokal telefòn nan)
const toLocalInput = (iso) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 6 * 3600000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// Panneau admin → Pwodwi: kreye oswa etenn pwomo flash la
export function FlashPromoCard({ catalog = [], onToast }) {
  const flash = useFlash();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (form) return;
    if (flash === null || flash) {
      setForm({
        active: Boolean(flash?.active), title: flash?.title || "", text: flash?.text || "",
        endsAt: toLocalInput(flash?.ends_at), productId: flash?.product_id || "", code: flash?.code || "",
      });
    }
  }, [flash, form]);
  if (!form) return null;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetFlash({ ...form, endsAt: new Date(form.endsAt).toISOString() });
      onToast(form.active ? "Pwomo flash la sou paj akèy la." : "Pwomo flash la etenn.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><Timer className="h-5 w-5 text-rose-500" /> Pwomo flash (ak kontè)</span>}
      subtitle="Yon bann koulè ak yon kontè sou paj akèy la. Pou yon rabè, kreye yon kòd pwomo anba a epi mete l isit la."
      action={<Toggle on={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label={form.active ? "Limen" : "Etenn"} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tit"><input value={form.title} onChange={set("title")} maxLength={80} placeholder="-10% sou dyaman Free Fire" className={inputClass} /></Field>
        <Field label="Fini nan (dat ak lè)"><input type="datetime-local" value={form.endsAt} onChange={set("endsAt")} className={inputClass} /></Field>
        <Field label="Tèks (opsyonèl)"><input value={form.text} onChange={set("text")} maxLength={160} placeholder="Jodi a sèlman, jiska 8è diswa" className={inputClass} /></Field>
        <Field label="Kòd pwomo (opsyonèl)"><input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} maxLength={20} placeholder="FLASH10" className={inputClass} /></Field>
        <Field label="Bouton « Achte » mennen sou (opsyonèl)">
          <select value={form.productId} onChange={set("productId")} className={inputClass}>
            <option value="">— Pa gen bouton —</option>
            {catalog.filter((p) => !p.hidden).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div className="mt-3 flex justify-end">
        <AdminButton tone="primary" icon={Save} busy={busy} disabled={busy} onClick={save}>Sove</AdminButton>
      </div>
    </Card>
  );
}
