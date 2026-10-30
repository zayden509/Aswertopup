import React, { useEffect, useState } from "react";
import { Gift, Copy, Share2, Users, Save, Lock } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { SITE_URL } from "./data.js";
import { ErrorNote, copyText, formatPrice } from "./ui.jsx";
import { Card, Field, AdminButton, inputClass } from "./adminUi.jsx";

// Parennaj: yon kliyan pataje lyen li (?ref=AWENS-ID). Lè zanmi an fè premye depo li (omwen
// min_deposit), yo chak jwenn bonis pwopriyetè a chwazi a (sèvè a oswa admin nan bay li).

const STORE = "awens.ref";

// Lyen ?ref= nan adrès la: nou sonje l jiskaske vizitè a kreye kont li
export function rememberReferral() {
  try {
    const code = new URLSearchParams(window.location.search).get("ref")?.toUpperCase();
    if (code && /^[A-HJ-NP-Z2-9]{8}$/.test(code)) localStorage.setItem(STORE, code);
  } catch {
    // navigatè a pa kenbe anyen: pa gen parennaj, sa pa bloke anyen
  }
}

// Apre koneksyon: si kont lan fèk kreye e gen yon lyen parennaj, nou anrejistre l yon sèl fwa
export async function claimStoredReferral(profile) {
  let code = null;
  try {
    code = localStorage.getItem(STORE);
  } catch {
    return;
  }
  if (!code || !profile) return;
  const fresh = profile.created_at && Date.now() - new Date(profile.created_at).getTime() < 20 * 3600000;
  if (fresh && code !== profile.wallet_code) await backend.claimReferral(code).catch(() => {});
  try {
    localStorage.removeItem(STORE);
  } catch {
    // anyen
  }
}

export function InviteCard({ profile, onToast }) {
  const [settings, setSettings] = useState(null);
  const [friends, setFriends] = useState([]);
  useEffect(() => backend.subscribeReferralSettings(setSettings), []);
  useEffect(() => backend.subscribeMyReferrals(setFriends), []);
  if (!settings || !(settings.bonus > 0) || !profile) return null;
  const link = `${SITE_URL}/?ref=${profile.wallet_code}`;
  const message = `Mwen achte dyaman Free Fire ak lòt bagay sou Awens Topup, peye ak MonCash oswa NatCash. Kreye kont ou ak lyen mwen an: ${link}`;
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Awens Topup", text: message });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    copyText(link, onToast);
  };
  const rewarded = friends.filter((f) => f.rewarded).length;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-sky-500 p-5 text-white shadow-lg" data-testid="invite">
      <p className="flex items-center gap-2 text-lg font-extrabold"><Gift className="h-6 w-6" /> Envite zanmi w yo</p>
      <p className="mt-1 text-sm text-white/90">
        Lè yon zanmi kreye kont li ak lyen ou a epi l fè premye depo li (omwen {formatPrice(settings.min_deposit)}),
        nou ba nou chak <b>{formatPrice(settings.bonus)}</b> nan Wallet.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/15 p-2 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-sm">{link}</span>
        <button type="button" onClick={() => copyText(link, onToast)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20" aria-label="Kopye lyen an"><Copy className="h-4 w-4" /></button>
        <button type="button" onClick={share} className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-bold text-fuchsia-600"><Share2 className="h-4 w-4" /> Pataje</button>
      </div>
      {friends.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" /> {friends.length} zanmi envite · {rewarded} bonis resevwa
        </p>
      )}
    </section>
  );
}

// Panneau admin → Paramèt: kantite bonis la ak premye depo minimòm lan
export function ReferralSettingsCard({ owner, onToast }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => backend.subscribeReferralSettings((s) => setForm({ bonus: String(s.bonus ?? 0), minDeposit: String(s.min_deposit ?? 500) })), []);
  if (!form) return null;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetReferralSettings({ bonus: Number(form.bonus), minDeposit: Number(form.minDeposit) });
      onToast(Number(form.bonus) > 0 ? "Parennaj la limen." : "Parennaj la etenn.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><Gift className="h-5 w-5 text-fuchsia-500" /> Parennaj (envite zanmi)</span>}
      subtitle="Chak kliyan gen yon lyen pou envite zanmi. Lè yon zanmi fè premye depo li, yo chak jwenn bonis la. Mete 0 pou etenn li."
    >
      <fieldset disabled={!owner} className="grid gap-3 sm:grid-cols-2">
        <Field label="Bonis pou chak moun (HTG)">
          <input inputMode="numeric" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value.replace(/\D/g, "") }))} className={inputClass} aria-label="Bonis" />
        </Field>
        <Field label="Premye depo minimòm (HTG)">
          <input inputMode="numeric" value={form.minDeposit} onChange={(e) => setForm((f) => ({ ...f, minDeposit: e.target.value.replace(/\D/g, "") }))} className={inputClass} aria-label="Premye depo minimòm" />
        </Field>
      </fieldset>
      <ErrorNote>{error}</ErrorNote>
      {owner ? (
        <div className="mt-3 flex justify-end">
          <AdminButton tone="primary" icon={Save} busy={busy} disabled={busy} onClick={save}>Sove</AdminButton>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Lock className="h-4 w-4" /> Se pwopriyetè a sèlman ki ka chanje parennaj la.</p>
      )}
    </Card>
  );
}
