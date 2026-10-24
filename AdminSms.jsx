import React, { useEffect, useState } from "react";
import { MessageSquareText, ShieldCheck, Check, CircleSlash, Clock } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { formatPrice, formatDateTime } from "./ui.jsx";
import { Card, AdminButton, Empty } from "./adminUi.jsx";

const key = (sender) => String(sender || "").replace(/[\s+()-]/g, "").toLowerCase();

// Sa sit la konprann nan yon SMS, ak sa l fè avè l
function smsState(sms) {
  if (sms.status === "used") return ["Depo konfime otomatikman", "text-emerald-600 dark:text-emerald-400", Check];
  if (!sms.incoming || !sms.reference || !sms.amount || !sms.method) return ["Pa yon peman sit la konprann", "text-slate-400", CircleSlash];
  return ["Ap tann kliyan an mete kòd sa a", "text-amber-600 dark:text-amber-400", Clock];
}

// Dènye SMS NatCash/MonCash telefòn boutik la resevwa (httpSMS)
export default function AdminSms({ owner, onToast }) {
  const [list, setList] = useState(null);
  const [automation, setAutomation] = useState({});
  useEffect(() => backend.subscribeSms(setList), []);
  useEffect(() => backend.subscribeAutomation(setAutomation), []);
  const official = (automation.senders || []).map(key);

  const trust = async (sender) => {
    try {
      await backend.adminSetAutomation({
        smsAuto: automation.sms_auto, maxAuto: automation.max_auto ?? 5000, senders: [...(automation.senders || []), sender],
      });
      onToast(`${sender} se nimewo ofisyèl kounye a.`);
    } catch (error) {
      onToast(errorText(error));
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-sky-500" /> SMS peman (httpSMS)</span>}
      subtitle={automation.sms_auto ? "Konfimasyon otomatik limen: yon depo konfime poukont li lè SMS li a rive." : "Konfimasyon otomatik etenn (Paramèt). SMS yo anrejistre pou w verifye yo."}
    >
      {list === null ? null : list.length === 0 ? (
        <Empty>Poko gen SMS. Lè httpSMS konekte, SMS NatCash/MonCash yo ap parèt isit la.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((sms) => {
            const [label, tone, Icon] = smsState(sms);
            const trusted = official.includes(key(sms.sender));
            return (
              <li key={sms.id} className="space-y-1.5 py-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {trusted && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Ofisyèl" />} {sms.sender || "?"}
                  </span>
                  <span className="shrink-0">{formatDateTime(sms.received_at)}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{sms.content}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {sms.method && <span className="font-semibold uppercase text-slate-500">{sms.method}</span>}
                  {sms.amount && <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatPrice(sms.amount)}</span>}
                  {sms.reference && <span className="font-mono text-slate-600 dark:text-slate-300">{sms.reference}</span>}
                  <span className={`flex items-center gap-1 font-semibold ${tone}`}><Icon className="h-3.5 w-3.5" /> {label}</span>
                </div>
                {owner && !trusted && sms.incoming && sms.sender && (
                  <AdminButton icon={ShieldCheck} onClick={() => trust(sms.sender)} className="h-8 text-xs">Se nimewo ofisyèl {sms.method === "moncash" ? "MonCash" : "NatCash"}</AdminButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
