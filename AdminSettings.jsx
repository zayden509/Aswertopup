import React, { useEffect, useState } from "react";
import { Save, Lock, Eye, MessageSquareText, X, Copy } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote, copyText, formatDateTime } from "./ui.jsx";
import { smsConnected } from "./depositCheck.js";
import { isOperatorSender, methodForReceiver, parsePaymentSms, senderKey } from "./smsParse.js";
import { usePaymentMethods } from "./payments.js";
import { Card, Field, AdminButton, inputClass } from "./adminUi.jsx";

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
// Poukisa yon SIM poko otomatik: sa sit la wè nan dènye SMS ki rive sou SIM sa a
// Dènye SMS ki rive sou SIM yon mòd peman (SMS sit la pa t konprann yo li yo ankò)
function smsOnSim(recent, id, accounts) {
  return recent
    .map((s) => (s.id.startsWith("msg_") && s.status === "new" ? { ...s, ...parsePaymentSms(s.content, s.sender, methodForReceiver(s.phone, accounts)) } : s))
    .filter((s) => s.method === id || methodForReceiver(s.phone, accounts) === id);
}

const isTrusted = (sender, official) => isOperatorSender(sender) || official.includes(senderKey(sender));

function SimDiagnosis({ name, number, onSim, official, owner, onTrust, id }) {
  const untrusted = onSim.find((s) => s.incoming && s.amount && s.reference && !isTrusted(s.sender, official));
  if (untrusted) {
    return (
      <div className="mt-2 space-y-1.5 text-xs">
        <p>Sit la resevwa SMS {name} soti nan <b>{untrusted.sender || "?"}</b> ({formatDateTime(untrusted.received_at)}), men nimewo sa a poko ofisyèl:</p>
        <p className="rounded-lg bg-white/70 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{untrusted.content}</p>
        {owner && <AdminButton tone="success" onClick={() => onTrust(untrusted.sender, id)} className="h-8 text-xs">Wi, se {name} · fè l otomatik</AdminButton>}
      </div>
    );
  }
  if (onSim.length) {
    const last = onSim[0];
    return (
      <div className="mt-2 space-y-1.5 text-xs">
        <p>Dènye SMS sou SIM {name} la ({formatDateTime(last.received_at)}, soti nan {last.sender || "?"}): sit la pa konprann li kòm yon peman. Voye foto SMS sa a bay moun ki fè sit la.</p>
        <p className="rounded-lg bg-white/70 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{last.content}</p>
      </div>
    );
  }
  return (
    <p className="mt-2 text-xs">
      Okenn SMS poko rive sou SIM {name} la ({number}). Nan aplikasyon httpSMS la, nimewo SIM sa a dwe anrejistre (SIM1 oswa
      SIM2), ak "incoming messages" ak "outgoing messages" limen pou SIM sa a; sou httpsms.com, chwazi 2 nimewo yo nan webhook la.
    </p>
  );
}

// Èske webhook httpSMS la rive sou sit la? Ak rekiperasyon dirèk la (HTTPSMS_API_KEY), si l aktive.
const newer = (a, b) => Boolean(a) && (!b || Date.parse(a) > Date.parse(b));
function WebhookHealth() {
  const [hook, setHook] = useState({});
  const [pull, setPull] = useState(null);
  useEffect(() => backend.subscribeHookStatus(setHook), []);
  useEffect(() => {
    backend.checkDepositCode().then((r) => setPull(Boolean(r?.pull)), () => setPull(null));
  }, []);
  const bad = hook.result === "bad-signature" && newer(hook.last_at, hook.last_ok_at);
  const lines = [];
  if (bad) {
    lines.push(["bad", `❌ ${formatDateTime(hook.last_at)}: httpSMS voye yon SMS, men kle siyati a pa menm. Sou httpsms.com, "Signing key" webhook la dwe egzakteman menm ak HTTPSMS_SIGNING_KEY nan Vercel (apre sa, Redeploy).`]);
  } else if (hook.last_ok_at) {
    lines.push(["ok", `✅ Webhook la mache · dènye SMS ${formatDateTime(hook.last_ok_at)}`]);
  } else {
    lines.push(["wait", "Poko gen SMS ki rive pa webhook la depi mizajou sa a."]);
  }
  if (newer(hook.missed_at, hook.last_ok_at)) {
    lines.push(["warn", `⚠️ ${formatDateTime(hook.missed_at)}: yon SMS peman pa t rive pa webhook la. Sit la al chèche l dirèkteman sou httpSMS. Tcheke adrès webhook la, "Signing key" a ak 2 nimewo yo sou httpsms.com.`]);
  }
  if (pull === false) {
    lines.push(["warn", "Rekiperasyon dirèk la poko aktive: sou httpsms.com → Settings, kopye \"API Key\" a epi mete l nan Vercel kòm HTTPSMS_API_KEY (apre sa, Redeploy). Konsa sit la jwenn SMS yo menm lè webhook la pa mache."]);
  } else if (pull) {
    lines.push(["ok", "🔁 Rekiperasyon dirèk aktive: si webhook la rate yon SMS, sit la al chèche l sou httpSMS."]);
  }
  if (hook.pull_error && newer(hook.pull_error_at, hook.missed_at)) {
    lines.push(["bad", `❌ ${formatDateTime(hook.pull_error_at)}: rekiperasyon an pa mache (${hook.pull_error}). Si se 401, kle API a pa bon.`]);
  }
  const tone = { ok: "text-emerald-700 dark:text-emerald-300", wait: "text-slate-500 dark:text-slate-400", warn: "text-amber-700 dark:text-amber-300", bad: "text-red-600 dark:text-red-400" };
  return (
    <ul className="mt-2 space-y-1 text-xs" data-testid="webhook-health">
      {lines.map(([kind, text]) => <li key={text} className={tone[kind]}>{text}</li>)}
    </ul>
  );
}

function SmsAutomation({ owner, onToast, onTrusted }) {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState({ senders: [], maxAuto: "5000" });
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const webhook = `${window.location.origin}/api/sms-webhook`;
  const [seen, setSeen] = useState({});
  useEffect(() => backend.subscribeSmsSeen(setSeen), []);
  const [recent, setRecent] = useState([]);
  useEffect(() => backend.subscribeSms(setRecent), []);
  const methods = usePaymentMethods();
  const accounts = Object.fromEntries(methods.map((m) => [m.id, m.number]));

  // Pwopriyetè a di "se MonCash sa a": nimewo a vin ofisyèl, SIM nan konekte, e depo ki t ap tann
  // SMS li yo konfime poukont yo
  const trustSender = async (sender, method) => {
    try {
      await backend.adminSetAutomation({
        maxAuto: saved?.max_auto ?? 5000, senders: [...(saved?.senders || []), sender],
      });
      await backend.adminMarkSmsSeen(method);
      onToast(`${sender} se nimewo ofisyèl kounye a.`);
      onTrusted?.();
    } catch (err) {
      onToast(errorText(err));
    }
  };

  useEffect(() => backend.subscribeAutomation((a) => {
    setSaved(a);
    setForm({ senders: a.senders || [], maxAuto: String(a.max_auto ?? 5000) });
  }), []);

  const save = async (next = form) => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetAutomation({ senders: next.senders, maxAuto: Number(next.maxAuto) });
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
      subtitle="Kliyan an mete TransCode a sèlman. Ak httpSMS sou telefòn Android ki gen SIM NatCash/MonCash yo, sit la jwenn montan an nan SMS la epi li konfime depo a poukont li. 5 kòd ki pa bon: kliyan an tann 30 minit."
    >
      <div className="space-y-4">
        <ul className="grid gap-2 sm:grid-cols-2" data-testid="sms-connected">
          {[["natcash", "NatCash"], ["moncash", "MonCash"]].map(([id, name]) => {
            const official = (saved?.senders || []).map(senderKey);
            const onSim = smsOnSim(recent, id, accounts);
            // Dènye SMS ofisyèl: make sit la mete a, oswa yon SMS ofisyèl ki nan lis la
            const last = [seen[id], onSim.find((x) => isTrusted(x.sender, official))?.received_at].filter(Boolean).sort().pop();
            const on = smsConnected(last);
            return (
              <li key={id} className={`rounded-xl px-3 py-2 text-sm ring-1 ${on ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" : "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30"}`}>
                <span className="font-semibold">{on ? "✅" : "⏸️"} {name}</span>
                <span className="block text-xs">{on ? `Otomatik · dènye SMS ${formatDateTime(last)}` : "Sit la poko resevwa yon SMS ofisyèl sou SIM sa a: kòd kliyan yo p ap jwenn."}</span>
                {!on && (
                  <SimDiagnosis id={id} name={name} number={accounts[id]} onSim={onSim} official={official} owner={owner} onTrust={trustSender} />
                )}
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
          <WebhookHealth />
        </div>

        <fieldset disabled={!owner} className="space-y-4">
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

export default function AdminSettings({ owner, onToast, onTrusted }) {
  return (
    <div className="space-y-4">
      <PaymentNumbers owner={owner} onToast={onToast} />
      <Preview />
      <SmsAutomation owner={owner} onToast={onToast} onTrusted={onTrusted} />
    </div>
  );
}
