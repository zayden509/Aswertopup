import React, { useEffect, useState } from "react";
import { Crown, Save, Lock } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { RANKS } from "./ranks.js";
import { LOYALTY_KEYS, LOYALTY_MAX, LOYALTY_OFF, loyaltyPercent } from "./pricing.js";
import { ErrorNote, formatPrice } from "./ui.jsx";
import { Card, AdminButton, inputClass } from "./adminUi.jsx";

// Pousantaj rabè chak rang (settings/loyalty), an dirèk
export function useLoyalty() {
  const [settings, setSettings] = useState(LOYALTY_OFF);
  useEffect(() => (backend ? backend.subscribeLoyalty(setSettings) : undefined), []);
  return settings;
}

// Rabè kliyan sa a ap jwenn kounye a (0 si pa gen rabè)
export function useMyLoyalty(profile) {
  const settings = useLoyalty();
  return profile ? loyaltyPercent(profile.total_spent, settings) : 0;
}

// Panneau admin → Paramèt: pwopriyetè a chwazi rabè chak rang
export function LoyaltySettingsCard({ owner, onToast }) {
  const settings = useLoyalty();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setForm(Object.fromEntries(LOYALTY_KEYS.map((k) => [k, String(settings[k] ?? 0)]))), [settings]);
  if (!form) return null;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetLoyalty(form);
      onToast(LOYALTY_KEYS.some((k) => Number(form[k]) > 0) ? "Rabè fidelite yo anrejistre." : "Rabè fidelite yo etenn.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><Crown className="h-5 w-5 text-violet-500" /> Rabè fidelite</span>}
      subtitle={`Kliyan ki depanse plis jwenn yon rabè sou chak achte ak Wallet (0 a ${LOYALTY_MAX}%). Yon kòd pwomo ranplase rabè a. Mete 0 pou etenn yon rang.`}
    >
      <fieldset disabled={!owner} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RANKS.map((r, i) => (
          <label key={r.name} className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{r.emoji} {r.name}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">depi {formatPrice(r.min)}</span>
            <span className="mt-2 flex items-center gap-1.5">
              <input
                inputMode="numeric"
                value={form[LOYALTY_KEYS[i]]}
                onChange={(e) => setForm((f) => ({ ...f, [LOYALTY_KEYS[i]]: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                className={`${inputClass} text-center`}
                aria-label={`Rabè ${r.name}`}
              />
              <span className="font-bold text-slate-500">%</span>
            </span>
          </label>
        ))}
      </fieldset>
      <ErrorNote>{error}</ErrorNote>
      {owner ? (
        <div className="mt-3 flex justify-end">
          <AdminButton tone="primary" icon={Save} busy={busy} disabled={busy} onClick={save}>Sove</AdminButton>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Lock className="h-4 w-4" /> Se pwopriyetè a sèlman ki ka chanje rabè yo.</p>
      )}
    </Card>
  );
}
