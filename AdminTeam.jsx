import React, { useState } from "react";
import { Crown, ShieldCheck, UserPlus, Loader2, Trash2, Info } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote } from "./ui.jsx";
import { Avatar, Card, Field, inputClass } from "./adminUi.jsx";

// Pwopriyetè a = admin ou te mete alamen nan Firebase (san admin_by)
export const isOwner = (profile) => Boolean(profile?.is_admin && !profile.admin_by);
// Admin pwopriyetè a bay wòl "kòmand sèlman": li trete kòmand yo, li pa touche depo, pwodwi, paramèt
export const isOrdersOnly = (profile) => Boolean(profile?.is_admin && profile.admin_by && profile.admin_role === "orders");

const ROLES = [
  { id: "orders", label: "Kòmand sèlman", text: "Livrer oswa refize kòmand yo, wè kliyan yo. Li pa touche depo, pwodwi, pri ni paramèt." },
  { id: "full", label: "Admin konplè", text: "Kòmand, depo, pwodwi, pri, kòd pwomo, mesaj ak livrezon otomatik." },
];
const roleOf = (profile) => (profile.admin_role === "orders" ? ROLES[0] : ROLES[1]);

function RolePicker({ value, onChange, name }) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Wòl">
      {ROLES.map((r) => (
        <label key={r.id} className={`flex cursor-pointer gap-3 rounded-xl p-3 ring-1 ${value === r.id ? "bg-sky-50 ring-sky-300 dark:bg-sky-500/10 dark:ring-sky-500/40" : "ring-slate-200 dark:ring-slate-700"}`}>
          <input type="radio" name={name} value={r.id} checked={value === r.id} onChange={() => onChange(r.id)} className="mt-1 accent-sky-500" />
          <span>
            <span className="block font-semibold text-slate-900 dark:text-white">{r.label}</span>
            <span className="block text-sm text-slate-500 dark:text-slate-400">{r.text}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function AdminRow({ profile, me, inviter, canManage, onToast }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const owner = isOwner(profile);
  const role = roleOf(profile);

  const changeRole = async (next) => {
    setBusy(true);
    try {
      await backend.adminSetAdminRole(profile.id, next);
      onToast(`${profile.full_name || profile.email}: ${ROLES.find((r) => r.id === next).label}.`);
    } catch (error) {
      onToast(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await backend.adminSetAdmin(profile.id, false);
      onToast(`${profile.full_name || profile.email} pa admin ankò.`);
    } catch (error) {
      onToast(errorText(error));
      setBusy(false);
    }
  };

  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900 dark:text-white">{profile.full_name || profile.email}{profile.id === me.id ? " (ou)" : ""}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${owner ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
          {owner ? <Crown className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
          {owner ? "Pwopriyetè" : `${role.label}${inviter ? ` · ajoute pa ${inviter.full_name || inviter.email}` : ""}`}
        </span>
        {canManage && !owner && profile.id !== me.id && (
          <select
            value={role.id}
            disabled={busy}
            onChange={(e) => changeRole(e.target.value)}
            aria-label={`Wòl ${profile.email}`}
            className="mt-2 block rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
          >
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        )}
      </div>
      {canManage && profile.id !== me.id && (
        confirm ? (
          <button type="button" disabled={busy} onClick={remove} className="shrink-0 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retire"}
          </button>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} aria-label={`Retire ${profile.email}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        )
      )}
    </li>
  );
}

function AddAdminForm({ profiles, onToast }) {
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(null);
  const [role, setRole] = useState("orders");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const find = (e) => {
    e.preventDefault();
    setError("");
    const wanted = email.trim().toLowerCase();
    const p = Object.values(profiles).find((x) => String(x.email).toLowerCase() === wanted);
    if (!p) setError("Pa gen kont ak imèl sa a. Mande moun nan kreye yon kont sou sit la anvan, ak menm imèl la.");
    else if (p.is_admin) setError(`${p.full_name || p.email} se admin deja.`);
    else setFound(p);
  };

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetAdmin(found.id, true, role);
      onToast(`${found.full_name || found.email} se admin kounye a (${ROLES.find((r) => r.id === role).label}).`);
      setFound(null);
      setEmail("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (found) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <Avatar profile={found} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{found.full_name || "San non"}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{found.email} · {found.wallet_code}</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kisa moun sa a ap ka fè?</p>
        <RolePicker value={role} onChange={setRole} name="new-admin-role" />
        <ErrorNote>{error}</ErrorNote>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setFound(null)} className="rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Anile</button>
          <button type="button" disabled={busy} onClick={confirm} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Fè l admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={find} className="space-y-3">
      <Field label="Imèl moun nan" hint="Li dwe gen yon kont sou sit la deja.">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="non@gmail.com" autoComplete="off" className={inputClass} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={!email.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white disabled:opacity-50">
        <UserPlus className="h-5 w-5" /> Chèche kont lan
      </button>
    </form>
  );
}

export default function AdminTeam({ me, profiles, onToast }) {
  const canManage = isOwner(me);
  const admins = Object.values(profiles)
    .filter((p) => p.is_admin)
    .sort((a, b) => Number(isOwner(b)) - Number(isOwner(a)) || String(a.email).localeCompare(String(b.email)));

  return (
    <div className="space-y-4">
      {canManage ? (
        <Card title={<span className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-sky-500" /> Ajoute yon admin</span>}>
          <AddAdminForm profiles={profiles} onToast={onToast} />
        </Card>
      ) : (
        <p className="flex gap-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
          <Info className="h-5 w-5 shrink-0" /> Se sèlman pwopriyetè a ki ka ajoute oswa retire admin.
        </p>
      )}

      <Card title={`Ekip la (${admins.length})`}>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {admins.map((p) => (
            <AdminRow key={p.id} profile={p} me={me} inviter={profiles[p.admin_by]} canManage={canManage} onToast={onToast} />
          ))}
        </ul>
      </Card>

      <Card title="Kisa admin yo ka fè">
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {ROLES.map((r) => (
            <li key={r.id}><b className="text-slate-900 dark:text-white">{r.label}:</b> {r.text}</li>
          ))}
          <li className="font-semibold text-slate-900 dark:text-white"><Crown className="mr-1 inline h-4 w-4 text-amber-500" />Sèlman pwopriyetè a ka ajoute, retire admin oswa chanje wòl yo.</li>
          <li>Kont bot sèvè a (depo otomatik, FazerCards) dwe <b>Admin konplè</b>.</li>
        </ul>
      </Card>
    </div>
  );
}
