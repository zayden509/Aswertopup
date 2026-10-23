import React, { useState } from "react";
import { Megaphone, User, Send, Loader2, Trash2, Search, X } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote, timeAgo } from "./ui.jsx";
import { MessageForm } from "./AdminCustomers.jsx";
import { Avatar, Card, Chips, Field, inputClass, normalize } from "./adminUi.jsx";

const TARGETS = [
  { id: "all", label: "Tout kliyan yo" },
  { id: "one", label: "Yon sèl kliyan" },
];

function BroadcastForm({ onToast }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await backend.adminBroadcast(title, body);
      setTitle("");
      setBody("");
      onToast("Mesaj la voye bay tout moun.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-3">
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
        Tout moun ki louvri sit la ap wè l nan 🔔 Notifications, menm sa ki poko gen kont. Sa ki sou sit la nan moman an wè l touswit.
      </p>
      <Field label="Tit">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Egzanp: Promo Free Fire 🔥" className={inputClass} />
      </Field>
      <Field label="Mesaj">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} placeholder="Ekri mesaj la isit la…" className={`${inputClass} resize-none`} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={busy || !title.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white disabled:opacity-50">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Megaphone className="h-5 w-5" />} Voye bay tout moun
      </button>
    </form>
  );
}

function OneCustomer({ profiles, onToast }) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const q = normalize(search.trim());
  const results = q
    ? Object.values(profiles).filter((p) => normalize(`${p.full_name} ${p.email} ${p.wallet_code}`).includes(q)).slice(0, 5)
    : [];

  if (picked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <Avatar profile={picked} size="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{picked.full_name || picked.email}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{picked.email} · {picked.wallet_code}</p>
          </div>
          <button type="button" onClick={() => setPicked(null)} aria-label="Chwazi yon lòt kliyan" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <MessageForm profile={picked} onToast={onToast} onSent={() => setPicked(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chèche non, imèl oswa ASWER-ID" className="w-full bg-transparent focus:outline-none" />
      </label>
      {q && results.length === 0 && <p className="px-1 text-sm text-slate-500 dark:text-slate-400">Pa gen kliyan ki koresponn.</p>}
      <ul className="space-y-1">
        {results.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setPicked(p)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <Avatar profile={p} size="h-9 w-9 text-xs" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-900 dark:text-white">{p.full_name || p.email}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.email} · {p.wallet_code}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnnouncementRow({ a, author, onToast }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    try {
      await backend.adminDeleteAnnouncement(a.id);
      onToast("Mesaj la efase.");
    } catch (error) {
      onToast(errorText(error));
      setBusy(false);
    }
  };
  return (
    <li className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
          {a.body && <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">{a.body}</p>}
          <p className="mt-1 text-xs text-slate-400">{timeAgo(a.created_at)}{author ? ` · ${author.full_name || author.email}` : ""}</p>
        </div>
        {confirm ? (
          <button type="button" disabled={busy} onClick={remove} className="shrink-0 rounded-xl bg-red-500 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60">Efase</button>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} aria-label="Efase mesaj la" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export default function AdminMessages({ profiles, announcements, onToast }) {
  const [target, setTarget] = useState("all");
  return (
    <div className="space-y-4">
      <Card title={<span className="flex items-center gap-2"><Send className="h-5 w-5 text-sky-500" /> Nouvo mesaj</span>}>
        <div className="mb-4"><Chips options={TARGETS} value={target} onChange={setTarget} label="Voye bay" /></div>
        {target === "all" ? <BroadcastForm onToast={onToast} /> : <OneCustomer profiles={profiles} onToast={onToast} />}
      </Card>

      <Card title={<span className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-amber-500" /> Mesaj pou tout moun</span>}>
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Ou poko voye mesaj bay tout moun.</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => <AnnouncementRow key={a.id} a={a} author={profiles[a.by]} onToast={onToast} />)}
          </ul>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><User className="h-3.5 w-3.5" /> Mesaj pou yon sèl kliyan yo rete nan notifikasyon kliyan sa a.</p>
      </Card>
    </div>
  );
}
