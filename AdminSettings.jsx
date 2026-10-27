import React, { useEffect, useState } from "react";
import { Save, Lock, Eye, MessageSquareText, X, Copy } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote, copyText, formatDateTime } from "./ui.jsx";
import { smsConnected } from "./depositCheck.js";
import { usePaymentMethods } from "./payments.js";
import { Card, Field, Toggle, AdminButton, inputClass } from "./adminUi.jsx";

// Nimewo MonCash/NatCash kliyan yo voye kòb la (depo ak peman dirèk).
// Se pwopriyetè a sèlman ki ka chanje yo: yon lòt admin pa ka voye peman yo sou nimewo pa l.
function PaymentNumbers({ owner, onToast }) {
  const methods = usePaymentMethods();
  const toForm = () => Object.fromEntries(methods.map((m) => [m.id, { number: m.number || "", name: m.holder || "" }]));
  const [form, setForm] = useState(toForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Lè nimewo yo chanje sou yon lòt aparèy, fòm lan swiv
  useEffect(() => setForm(toForm()), [methods]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (id, key, value) => setForm((f) => ({ ...f, [id]: { ...f[id], [key]: value } }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await backend.adminSetPayments(form);
      onToast("Nimewo peman yo anrejistre.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Nimewo pou resevwa peman"
      subtitle="Kliyan yo wè nimewo sa yo lè yo fè yon depo oswa lè yo peye yon kòmand dirèkteman."
    >
      <form onSubmit={save} className="space-y-4">
        {methods.map((m) => (
          <fieldset key={m.id} disabled={!owner} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <img src={m.logo} alt="" className="h-7 w-7 rounded-lg object-cover" /> {m.name}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nimewo">
                <input
                  id={`pay-${m.id}-number`}
                  inputMode="numeric"
                  value={form[m.id]?.number || ""}
                  onChange={(e) => set(m.id, "number", e.target.value.replace(/[^\d ]/g, ""))}
                  placeholder="Ex: 43699262"
                  className={`${inputClass} tabular-nums disabled:opacity-70`}
                />
              </Field>
              <Field label="Non ki sou kont lan">
                <input
                  id={`pay-${m.id}-name`}
                  value={form[m.id]?.name || ""}
                  onChange={(e) => set(m.id, "name", e.target.value)}
                  placeholder="Ex: Awens Kelly Alexandre"
                  maxLength={60}
                  className={`${inputClass} disabled:opacity-70`}
                />
              </Field>
            </div>
          </fieldset>
        ))}
        <ErrorNote>{error}</ErrorNote>
        {owner ? (
          <div className="flex justify-end">
            <AdminButton type="submit" tone="primary" icon={Save} busy={busy} disabled={busy}>Sove nimewo yo</AdminButton>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Lock className="h-4 w-4" /> Se pwopriyetè a sèlman ki ka chanje nimewo peman yo.
          </p>
        )}
      </form>
    </Card>
  );
}

// Kijan kliyan an wè nimewo yo
function Preview() {
  const methods = usePaymentMethods();
  return (
    <Card title={<span className="flex items-center gap-2"><Eye className="h-4 w-4 text-slate-400" /> Sa kliyan yo wè</span>}>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {methods.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5">
            <img src={m.logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</p>
              <p className="truncate text-sm tabular-nums text-slate-500 dark:text-slate-400">
                {m.number ? `${m.number}${m.holder ? ` · ${m.holder}` : ""}` : "Poko gen nimewo"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// Depo otomatik ak SMS (httpSMS): limen/etenn, nimewo ofisyèl ki voye SMS yo, limit la
function SmsAutomation({ owner, onToast }) {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState({ smsAuto: false, senders: [], maxAuto: "5000" });
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const webhook = `${window.location.origin}/api/sms-webhook`;
  const [seen, setSeen] = useState({});
  useEffect(() => backend.subscribeSmsSeen(setSeen), []);

  useEffect(() => backend.subscribeAutomation((a) => {
    setSaved(a);
    setForm({ smsAuto: Boolean(a.sms_auto), senders: a.senders || [], maxAuto: String(a.max_auto ?? 5000) });
  }), []);

  const save = async (next = form) => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetAutomation({ smsAuto: next.smsAuto, senders: next.senders, maxAuto: Number(next.maxAuto) });
      onToast("Paramèt SMS yo anrejistre.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const addSender = () => {
    const value = sender.trim();
    if (!value) return;
    setForm((f) => ({ ...f, senders: [...new Set([...f.senders, value])] }));
    setSender("");
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-sky-500" /> Depo otomatik ak SMS</span>}
      subtitle="Ak httpSMS sou telefòn Android ki gen SIM NatCash/MonCash la, sit la li SMS peman yo epi li konfime depo yo poukont li."
    >
      <div className="space-y-4">
        <ul className="grid gap-2 sm:grid-cols-2" data-testid="sms-connected">
          {[["natcash", "NatCash"], ["moncash", "MonCash"]].map(([id, name]) => {
            const on = smsConnected(seen[id]);
            return (
              <li key={id} className={`rounded-xl px-3 py-2 text-sm ring-1 ${on ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" : "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:ring-slate-800"}`}>
                <span className="font-semibold">{on ? "✅" : "⏸️"} {name}</span>
                <span className="block text-xs">{on ? `Otomatik · dènye SMS ${formatDateTime(seen[id])}` : "Sit la poko resevwa SMS li: depo yo ale kote ou"}</span>
              </li>
            );
          })}
        </ul>
        <div className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
          <p className="font-medium text-slate-700 dark:text-slate-200">Adrès webhook la (pou httpSMS)</p>
          <button type="button" onClick={() => copyText(webhook, onToast)} className="mt-1 flex max-w-full items-center gap-2 font-mono text-sky-600 dark:text-sky-400">
            <span className="truncate">{webhook}</span> <Copy className="h-4 w-4 shrink-0" />
          </button>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Sou httpsms.com, webhook la dwe gen <b>2 nimewo yo</b> (NatCash ak MonCash) nan "Phone numbers".</p>
        </div>

        <fieldset disabled={!owner} className="space-y-4">
          <Toggle
            on={form.smsAuto}
            onChange={(on) => setForm((f) => ({ ...f, smsAuto: on }))}
            label={form.smsAuto ? "Konfime depo yo otomatikman" : "Otomatik etenn: ou konfime depo yo alamen"}
          />
          <Field label="Nimewo ofisyèl ki voye SMS NatCash/MonCash yo" hint="Se sèlman SMS ki soti nan nimewo sa yo ki ka konfime yon depo. Ou ka ajoute yo dirèkteman nan lis SMS yo (Depo).">
            <div className="flex flex-wrap gap-2">
              {form.senders.map((x) => (
                <span key={x} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                  {x}
                  {owner && (
                    <button type="button" aria-label={`Retire ${x}`} onClick={() => setForm((f) => ({ ...f, senders: f.senders.filter((y) => y !== x) }))}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
              {form.senders.length === 0 && <span className="text-sm text-slate-400">Poko gen nimewo ofisyèl.</span>}
            </div>
            {owner && (
              <div className="mt-2 flex gap-2">
                <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Ex: NatCash oswa 4949" className={inputClass} />
                <AdminButton onClick={addSender} className="h-10 shrink-0">Ajoute</AdminButton>
              </div>
            )}
          </Field>
          <Field label="Limit otomatik (HTG)" hint="Yon depo ki pi gwo pase sa a rete pou ou konfime l alamen.">
            <input inputMode="numeric" value={form.maxAuto} onChange={(e) => setForm((f) => ({ ...f, maxAuto: e.target.value.replace(/\D/g, "") }))} className={`${inputClass} w-40 tabular-nums`} />
          </Field>
        </fieldset>
        <ErrorNote>{error}</ErrorNote>
        {owner ? (
          <div className="flex justify-end">
            <AdminButton tone="primary" icon={Save} busy={busy} disabled={busy || saved === null} onClick={() => save()}>Sove</AdminButton>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Lock className="h-4 w-4" /> Se pwopriyetè a sèlman ki ka chanje paramèt sa yo.</p>
        )}
      </div>
    </Card>
  );
}

export default function AdminSettings({ owner, onToast }) {
  return (
    <div className="space-y-4">
      <PaymentNumbers owner={owner} onToast={onToast} />
      <Preview />
      <SmsAutomation owner={owner} onToast={onToast} />
    </div>
  );
}
