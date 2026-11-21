import React, { useEffect, useState } from "react";
import { Timer, Save } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote } from "./ui.jsx";
import { Card, Field, AdminButton, Toggle, inputClass } from "./adminUi.jsx";
import { useFlash } from "./Flash.jsx";

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
