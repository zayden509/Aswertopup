import React, { useEffect, useState } from "react";
import { Save, Lock, Eye } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote } from "./ui.jsx";
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
            {!form[m.id]?.number && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">San nimewo, kliyan yo ap wè yon bouton pou mande l sou WhatsApp.</p>}
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

export default function AdminSettings({ owner, onToast }) {
  return (
    <div className="space-y-4">
      <PaymentNumbers owner={owner} onToast={onToast} />
      <Preview />
    </div>
  );
}
